const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'new_order',
            'order_delivered',
            'order_completed',
            'order_cancelled',
            'new_message',
            'new_review',
            'dispute_opened',
            'dispute_resolved',
            'wallet_deposit',
            'wallet_withdrawal',
            'system'
        ]
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    link: {
        type: String,
        default: null
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    relatedModel: {
        type: String,
        enum: ['Order', 'Chat', 'Review', 'Dispute', 'Transaction', null],
        default: null
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

NotificationSchema.statics.createNotification = async function(data) {
    return await this.create(data);
};

NotificationSchema.statics.getUnreadCount = async function(userId) {
    return await this.countDocuments({ userId, isRead: false });
};

NotificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
    const { limit = 20, skip = 0, unreadOnly = false } = options;
    const query = { userId };
    if (unreadOnly) query.isRead = false;
    
    return await this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

NotificationSchema.statics.markAsRead = async function(notificationId, userId) {
    return await this.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true },
        { new: true }
    );
};

NotificationSchema.statics.markAllAsRead = async function(userId) {
    return await this.updateMany(
        { userId, isRead: false },
        { isRead: true }
    );
};

module.exports = mongoose.model('Notification', NotificationSchema);
