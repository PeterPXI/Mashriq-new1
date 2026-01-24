const Notification = require('../models/Notification');

const NotificationService = {
    async createNotification(userId, type, title, message, options = {}) {
        try {
            return await Notification.createNotification({
                userId,
                type,
                title,
                message,
                link: options.link || null,
                relatedId: options.relatedId || null,
                relatedModel: options.relatedModel || null
            });
        } catch (error) {
            console.error('Failed to create notification:', error);
            return null;
        }
    },

    async notifyNewOrder(sellerId, orderId, orderNumber, serviceTitle) {
        return this.createNotification(
            sellerId,
            'new_order',
            'طلب جديد',
            `لديك طلب جديد على خدمة "${serviceTitle}"`,
            { link: `/app/order.html?id=${orderId}`, relatedId: orderId, relatedModel: 'Order' }
        );
    },

    async notifyOrderDelivered(buyerId, orderId, orderNumber, serviceTitle) {
        return this.createNotification(
            buyerId,
            'order_delivered',
            'تم تسليم الطلب',
            `تم تسليم طلبك "${serviceTitle}" - يرجى المراجعة والقبول`,
            { link: `/app/order.html?id=${orderId}`, relatedId: orderId, relatedModel: 'Order' }
        );
    },

    async notifyOrderCompleted(sellerId, orderId, orderNumber, serviceTitle) {
        return this.createNotification(
            sellerId,
            'order_completed',
            'تم إكمال الطلب',
            `تم قبول تسليم طلب "${serviceTitle}" - تمت إضافة الأرباح لمحفظتك`,
            { link: `/app/order.html?id=${orderId}`, relatedId: orderId, relatedModel: 'Order' }
        );
    },

    async notifyOrderCancelled(userId, orderId, orderNumber, serviceTitle, isBuyer) {
        return this.createNotification(
            userId,
            'order_cancelled',
            'تم إلغاء الطلب',
            `تم إلغاء الطلب "${serviceTitle}"`,
            { link: `/app/order.html?id=${orderId}`, relatedId: orderId, relatedModel: 'Order' }
        );
    },

    async notifyNewMessage(recipientId, chatId, senderName, orderId) {
        return this.createNotification(
            recipientId,
            'new_message',
            'رسالة جديدة',
            `لديك رسالة جديدة من ${senderName}`,
            { link: `/app/order.html?id=${orderId}`, relatedId: chatId, relatedModel: 'Chat' }
        );
    },

    async notifyNewReview(sellerId, reviewId, rating, serviceTitle) {
        return this.createNotification(
            sellerId,
            'new_review',
            'تقييم جديد',
            `حصلت على تقييم ${rating} نجوم على خدمة "${serviceTitle}"`,
            { link: `/app/profile.html`, relatedId: reviewId, relatedModel: 'Review' }
        );
    },

    async notifyDisputeOpened(sellerId, disputeId, orderId, serviceTitle) {
        return this.createNotification(
            sellerId,
            'dispute_opened',
            'نزاع جديد',
            `تم فتح نزاع على طلب "${serviceTitle}"`,
            { link: `/app/order.html?id=${orderId}`, relatedId: disputeId, relatedModel: 'Dispute' }
        );
    },

    async notifyDisputeResolved(userId, disputeId, orderId, resolution) {
        const resolutionText = resolution === 'buyer_wins' ? 'لصالح المشتري' : 'لصالح البائع';
        return this.createNotification(
            userId,
            'dispute_resolved',
            'تم حل النزاع',
            `تم حل النزاع ${resolutionText}`,
            { link: `/app/order.html?id=${orderId}`, relatedId: disputeId, relatedModel: 'Dispute' }
        );
    },

    async notifyWalletDeposit(userId, amount) {
        return this.createNotification(
            userId,
            'wallet_deposit',
            'إيداع ناجح',
            `تم إيداع $${amount.toFixed(2)} في محفظتك بنجاح`,
            { link: `/app/wallet.html` }
        );
    },

    async getNotifications(userId, options = {}) {
        return Notification.getUserNotifications(userId, options);
    },

    async getUnreadCount(userId) {
        return Notification.getUnreadCount(userId);
    },

    async markAsRead(notificationId, userId) {
        return Notification.markAsRead(notificationId, userId);
    },

    async markAllAsRead(userId) {
        return Notification.markAllAsRead(userId);
    }
};

module.exports = NotificationService;
