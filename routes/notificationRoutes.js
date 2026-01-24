const express = require('express');
const router = express.Router();
const NotificationService = require('../services/NotificationService');
const { success, error } = require('../utils/apiResponse');

router.get('/', async (req, res) => {
    try {
        const { limit = 20, skip = 0, unreadOnly } = req.query;
        const notifications = await NotificationService.getNotifications(req.user.id, {
            limit: parseInt(limit),
            skip: parseInt(skip),
            unreadOnly: unreadOnly === 'true'
        });
        
        const unreadCount = await NotificationService.getUnreadCount(req.user.id);
        
        return success(res, 'تم جلب الإشعارات بنجاح', {
            notifications,
            unreadCount
        });
    } catch (err) {
        console.error('Get notifications error:', err);
        return error(res, 'حدث خطأ في جلب الإشعارات', 'NOTIFICATIONS_ERROR', 500);
    }
});

router.get('/count', async (req, res) => {
    try {
        const count = await NotificationService.getUnreadCount(req.user.id);
        return success(res, 'تم جلب عدد الإشعارات', { count });
    } catch (err) {
        console.error('Get notifications count error:', err);
        return error(res, 'حدث خطأ', 'NOTIFICATIONS_COUNT_ERROR', 500);
    }
});

router.put('/:id/read', async (req, res) => {
    try {
        const notification = await NotificationService.markAsRead(req.params.id, req.user.id);
        if (!notification) {
            return error(res, 'الإشعار غير موجود', 'NOT_FOUND', 404);
        }
        return success(res, 'تم تحديث الإشعار', { notification });
    } catch (err) {
        console.error('Mark notification read error:', err);
        return error(res, 'حدث خطأ', 'MARK_READ_ERROR', 500);
    }
});

router.put('/read-all', async (req, res) => {
    try {
        await NotificationService.markAllAsRead(req.user.id);
        return success(res, 'تم تحديث جميع الإشعارات');
    } catch (err) {
        console.error('Mark all notifications read error:', err);
        return error(res, 'حدث خطأ', 'MARK_ALL_READ_ERROR', 500);
    }
});

module.exports = router;
