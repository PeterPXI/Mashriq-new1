const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Service = require('../models/Service');
const Order = require('../models/Order');
const Dispute = require('../models/Dispute');
const { success, error } = require('../utils/apiResponse');

router.get('/stats', async (req, res) => {
    try {
        const [totalUsers, totalServices, totalOrders, openDisputes] = await Promise.all([
            User.countDocuments({ isActive: true }),
            Service.countDocuments({ isActive: true }),
            Order.countDocuments(),
            Dispute.countDocuments({ status: { $in: ['open', 'under_review'] } })
        ]);
        
        return success(res, 'تم جلب الإحصائيات', {
            totalUsers,
            totalServices,
            totalOrders,
            openDisputes
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        return error(res, 'حدث خطأ', 'ADMIN_STATS_ERROR', 500);
    }
});

router.get('/users', async (req, res) => {
    try {
        const { search, role, limit = 50, skip = 0 } = req.query;
        const query = {};
        
        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { fullName: regex },
                { username: regex },
                { email: regex }
            ];
        }
        
        if (role) {
            query.role = role;
        }
        
        const users = await User.find(query)
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));
        
        const total = await User.countDocuments(query);
        
        return success(res, 'تم جلب المستخدمين', { users, total });
    } catch (err) {
        console.error('Admin users error:', err);
        return error(res, 'حدث خطأ', 'ADMIN_USERS_ERROR', 500);
    }
});

router.put('/users/:id/status', async (req, res) => {
    try {
        const { isActive } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        ).select('-passwordHash');
        
        if (!user) {
            return error(res, 'المستخدم غير موجود', 'USER_NOT_FOUND', 404);
        }
        
        return success(res, isActive ? 'تم تفعيل الحساب' : 'تم تعطيل الحساب', { user });
    } catch (err) {
        console.error('Admin update user status error:', err);
        return error(res, 'حدث خطأ', 'ADMIN_UPDATE_USER_ERROR', 500);
    }
});

router.get('/disputes', async (req, res) => {
    try {
        const { status, limit = 50, skip = 0 } = req.query;
        const query = {};
        
        if (status) {
            query.status = status;
        }
        
        const disputes = await Dispute.find(query)
            .populate('buyerId', 'fullName username email avatarUrl')
            .populate('sellerId', 'fullName username email avatarUrl')
            .populate('orderId', 'orderNumber serviceSnapshot')
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));
        
        const total = await Dispute.countDocuments(query);
        
        return success(res, 'تم جلب النزاعات', { disputes, total });
    } catch (err) {
        console.error('Admin disputes error:', err);
        return error(res, 'حدث خطأ', 'ADMIN_DISPUTES_ERROR', 500);
    }
});

router.put('/disputes/:id/resolve', async (req, res) => {
    try {
        const { resolution, adminNotes } = req.body;
        
        if (!resolution || !['buyer_wins', 'seller_wins'].includes(resolution)) {
            return error(res, 'قرار غير صالح', 'INVALID_RESOLUTION', 400);
        }
        
        const dispute = await Dispute.findById(req.params.id);
        
        if (!dispute) {
            return error(res, 'النزاع غير موجود', 'DISPUTE_NOT_FOUND', 404);
        }
        
        if (dispute.status === 'resolved') {
            return error(res, 'النزاع محلول بالفعل', 'ALREADY_RESOLVED', 400);
        }
        
        dispute.status = 'resolved';
        dispute.resolution = resolution;
        dispute.adminNotes = adminNotes || '';
        dispute.resolvedAt = new Date();
        dispute.resolvedBy = req.user.id;
        
        await dispute.save();
        
        const NotificationService = require('../services/NotificationService');
        await NotificationService.notifyDisputeResolved(dispute.buyerId, dispute._id, dispute.orderId, resolution);
        await NotificationService.notifyDisputeResolved(dispute.sellerId, dispute._id, dispute.orderId, resolution);
        
        return success(res, 'تم حل النزاع بنجاح', { dispute });
    } catch (err) {
        console.error('Admin resolve dispute error:', err);
        return error(res, 'حدث خطأ', 'ADMIN_RESOLVE_DISPUTE_ERROR', 500);
    }
});

router.get('/services', async (req, res) => {
    try {
        const { status, search, limit = 50, skip = 0 } = req.query;
        const query = {};
        
        if (status) {
            query.status = status;
        }
        
        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { title: regex },
                { description: regex }
            ];
        }
        
        const services = await Service.find(query)
            .populate('sellerId', 'fullName username avatarUrl')
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));
        
        const total = await Service.countDocuments(query);
        
        return success(res, 'تم جلب الخدمات', { services, total });
    } catch (err) {
        console.error('Admin services error:', err);
        return error(res, 'حدث خطأ', 'ADMIN_SERVICES_ERROR', 500);
    }
});

router.put('/services/:id/status', async (req, res) => {
    try {
        const { isActive } = req.body;
        const service = await Service.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        );
        
        if (!service) {
            return error(res, 'الخدمة غير موجودة', 'SERVICE_NOT_FOUND', 404);
        }
        
        return success(res, isActive ? 'تم تفعيل الخدمة' : 'تم تعطيل الخدمة', { service });
    } catch (err) {
        console.error('Admin update service status error:', err);
        return error(res, 'حدث خطأ', 'ADMIN_UPDATE_SERVICE_ERROR', 500);
    }
});

module.exports = router;
