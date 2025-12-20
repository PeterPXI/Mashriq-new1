/* ========================================
   Mashriq (مشرق) - Dispute Controller
   ========================================
   
   PURPOSE:
   HTTP interface layer for dispute operations.
   Handles authentication, validation, and permission enforcement.
   Delegates ALL business logic to DisputeService.
   
   ARCHITECTURE:
   Controller → Service → Model
   
   RULES:
   - NO direct model access
   - NO business logic
   - NO state transitions
   - ONLY call DisputeService methods
   
   ======================================== */

const DisputeService = require('../services/DisputeService');
const OrderService = require('../services/OrderService');
const { DISPUTE_STATUSES, DISPUTE_RESOLUTIONS, DISPUTE_REASONS } = require('../models/Dispute');
const { USER_ROLES } = require('../models/User');
const { success, error } = require('../utils/apiResponse');

/**
 * DisputeController
 * 
 * HTTP interface for dispute operations.
 * All methods are async Express route handlers.
 */
class DisputeController {
    
    /**
     * Open a new dispute on an order.
     * 
     * @route POST /api/disputes
     * @access Private (Buyer)
     */
    async openDispute(req, res) {
        try {
            const { orderId, reason, description } = req.body;
            
            if (!orderId) {
                return error(res, 'رقم الطلب مطلوب', 'MISSING_ORDER_ID', 400);
            }
            
            if (!reason) {
                return error(res, 'سبب النزاع مطلوب', 'MISSING_REASON', 400);
            }
            
            if (!description) {
                return error(res, 'وصف النزاع مطلوب', 'MISSING_DESCRIPTION', 400);
            }
            
            if (typeof orderId !== 'string' || orderId.length !== 24) {
                return error(res, 'معرّف الطلب غير صالح', 'INVALID_ID_FORMAT', 400);
            }
            
            if (!Object.values(DISPUTE_REASONS).includes(reason)) {
                return error(res, 'سبب النزاع غير صالح', 'INVALID_REASON', 400);
            }
            
            const dispute = await DisputeService.openDispute(
                orderId,
                req.user._id,
                reason,
                description
            );
            
            return success(res, 'تم فتح النزاع بنجاح. سيتم مراجعته من قبل الإدارة.', { dispute }, 201);
            
        } catch (err) {
            console.error('Open dispute error:', err);
            
            const message = err.message;
            let statusCode = 400;
            let code = 'OPEN_DISPUTE_ERROR';
            
            if (message.includes('فقط المشتري')) {
                statusCode = 403;
                code = 'FORBIDDEN';
            } else if (message.includes('غير موجود')) {
                statusCode = 404;
                code = 'NOT_FOUND';
            }
            
            return error(res, message || 'حدث خطأ في فتح النزاع', code, statusCode);
        }
    }
    
    /**
     * Get a single dispute by ID.
     * 
     * @route GET /api/disputes/:id
     * @access Private (buyer, seller, or admin)
     */
    async getDisputeById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || id.length !== 24) {
                return error(res, 'معرّف النزاع غير صالح', 'INVALID_ID_FORMAT', 400);
            }
            
            const dispute = await DisputeService.getDisputeById(id);
            
            if (!dispute) {
                return error(res, 'النزاع غير موجود', 'DISPUTE_NOT_FOUND', 404);
            }
            
            const order = await OrderService.getOrderById(dispute.orderId);
            
            if (!order) {
                return error(res, 'الطلب المرتبط بالنزاع غير موجود', 'ORDER_NOT_FOUND', 404);
            }
            
            const userId = req.user._id.toString();
            const isBuyer = order.buyerId.toString() === userId;
            const isSeller = order.sellerId.toString() === userId;
            const isAdmin = req.user.role === USER_ROLES.ADMIN;
            
            if (!isBuyer && !isSeller && !isAdmin) {
                return error(res, 'ليس لديك صلاحية لعرض هذا النزاع', 'FORBIDDEN', 403);
            }
            
            return success(res, 'تم جلب النزاع بنجاح', {
                dispute,
                userRole: isAdmin ? 'admin' : (isBuyer ? 'buyer' : 'seller')
            });
            
        } catch (err) {
            console.error('Get dispute by ID error:', err);
            
            if (err.kind === 'ObjectId') {
                return error(res, 'النزاع غير موجود', 'DISPUTE_NOT_FOUND', 404);
            }
            
            return error(res, 'حدث خطأ في جلب النزاع', 'GET_DISPUTE_ERROR', 500);
        }
    }
    
    /**
     * Get dispute for a specific order.
     * 
     * @route GET /api/disputes/order/:orderId
     * @access Private (buyer, seller, or admin)
     */
    async getDisputeByOrderId(req, res) {
        try {
            const { orderId } = req.params;
            
            if (!orderId || orderId.length !== 24) {
                return error(res, 'معرّف الطلب غير صالح', 'INVALID_ID_FORMAT', 400);
            }
            
            const order = await OrderService.getOrderById(orderId);
            
            if (!order) {
                return error(res, 'الطلب غير موجود', 'ORDER_NOT_FOUND', 404);
            }
            
            const userId = req.user._id.toString();
            const isBuyer = order.buyerId.toString() === userId;
            const isSeller = order.sellerId.toString() === userId;
            const isAdmin = req.user.role === USER_ROLES.ADMIN;
            
            if (!isBuyer && !isSeller && !isAdmin) {
                return error(res, 'ليس لديك صلاحية لعرض نزاعات هذا الطلب', 'FORBIDDEN', 403);
            }
            
            const dispute = await DisputeService.getDisputeByOrderId(orderId);
            
            if (!dispute) {
                return error(res, 'لا يوجد نزاع على هذا الطلب', 'DISPUTE_NOT_FOUND', 404);
            }
            
            return success(res, 'تم جلب النزاع بنجاح', { dispute });
            
        } catch (err) {
            console.error('Get dispute by order ID error:', err);
            return error(res, 'حدث خطأ في جلب النزاع', 'GET_DISPUTE_ERROR', 500);
        }
    }
    
    /**
     * Move dispute to under review status.
     * 
     * @route PUT /api/disputes/:id/review
     * @access Private (Admin only)
     */
    async moveToUnderReview(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || id.length !== 24) {
                return error(res, 'معرّف النزاع غير صالح', 'INVALID_ID_FORMAT', 400);
            }
            
            if (req.user.role !== USER_ROLES.ADMIN) {
                return error(res, 'هذا الإجراء متاح للمسؤولين فقط', 'ADMIN_REQUIRED', 403);
            }
            
            const dispute = await DisputeService.moveToUnderReview(id, req.user._id);
            
            return success(res, 'تم نقل النزاع إلى قيد المراجعة', { dispute });
            
        } catch (err) {
            console.error('Move to under review error:', err);
            
            const message = err.message;
            let statusCode = 400;
            let code = 'UPDATE_DISPUTE_ERROR';
            
            if (message.includes('للمسؤولين فقط')) {
                statusCode = 403;
                code = 'ADMIN_REQUIRED';
            } else if (message.includes('غير موجود')) {
                statusCode = 404;
                code = 'NOT_FOUND';
            }
            
            return error(res, message || 'حدث خطأ في تحديث حالة النزاع', code, statusCode);
        }
    }
    
    /**
     * Resolve a dispute with a decision.
     * 
     * @route PUT /api/disputes/:id/resolve
     * @access Private (Admin only)
     */
    async resolveDispute(req, res) {
        try {
            const { id } = req.params;
            const { resolution, notes } = req.body;
            
            if (!id || id.length !== 24) {
                return error(res, 'معرّف النزاع غير صالح', 'INVALID_ID_FORMAT', 400);
            }
            
            if (!resolution) {
                return error(res, 'نتيجة النزاع مطلوبة', 'MISSING_RESOLUTION', 400);
            }
            
            if (!Object.values(DISPUTE_RESOLUTIONS).includes(resolution)) {
                return error(res, 'نتيجة النزاع غير صالحة', 'INVALID_RESOLUTION', 400);
            }
            
            if (req.user.role !== USER_ROLES.ADMIN) {
                return error(res, 'هذا الإجراء متاح للمسؤولين فقط', 'ADMIN_REQUIRED', 403);
            }
            
            const dispute = await DisputeService.resolveDispute(
                id,
                resolution,
                req.user._id,
                notes || ''
            );
            
            let resolutionMessage;
            if (resolution === DISPUTE_RESOLUTIONS.BUYER_WINS) {
                resolutionMessage = 'تم حل النزاع لصالح المشتري. سيتم استرداد المبلغ.';
            } else if (resolution === DISPUTE_RESOLUTIONS.SELLER_WINS) {
                resolutionMessage = 'تم حل النزاع لصالح البائع. تم إكمال الطلب.';
            } else {
                resolutionMessage = 'تم حل النزاع بالتسوية.';
            }
            
            return success(res, resolutionMessage, { dispute });
            
        } catch (err) {
            console.error('Resolve dispute error:', err);
            
            const message = err.message;
            let statusCode = 400;
            let code = 'RESOLVE_DISPUTE_ERROR';
            
            if (message.includes('للمسؤولين فقط')) {
                statusCode = 403;
                code = 'ADMIN_REQUIRED';
            } else if (message.includes('غير موجود')) {
                statusCode = 404;
                code = 'NOT_FOUND';
            }
            
            return error(res, message || 'حدث خطأ في حل النزاع', code, statusCode);
        }
    }
    
    /**
     * Get disputes list (admin view).
     * 
     * @route GET /api/disputes
     * @access Private (Admin only)
     */
    async getDisputes(req, res) {
        try {
            if (req.user.role !== USER_ROLES.ADMIN) {
                return error(res, 'هذا الإجراء متاح للمسؤولين فقط', 'ADMIN_REQUIRED', 403);
            }
            
            const { status, limit } = req.query;
            
            if (status && !Object.values(DISPUTE_STATUSES).includes(status)) {
                return error(res, 'حالة النزاع غير صالحة', 'INVALID_STATUS', 400);
            }
            
            const parsedLimit = limit ? parseInt(limit, 10) : 50;
            if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
                return error(res, 'الحد الأقصى يجب أن يكون بين 1 و 100', 'INVALID_LIMIT', 400);
            }
            
            const disputes = await DisputeService.getDisputesByStatus(status, {
                limit: parsedLimit
            });
            
            return success(res, 'تم جلب النزاعات بنجاح', {
                count: disputes.length,
                disputes
            });
            
        } catch (err) {
            console.error('Get disputes error:', err);
            return error(res, 'حدث خطأ في جلب النزاعات', 'GET_DISPUTES_ERROR', 500);
        }
    }
}

// Export singleton instance
module.exports = new DisputeController();
