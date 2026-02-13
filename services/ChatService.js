/* ========================================
   Mashriq (مشرق) - Chat Service
   ========================================
   
   PURPOSE:
   Provides business logic for chat operations.
   Handles message sending, retrieval, and access control.
   
   CONSTITUTION RULES ENFORCED:
   - Chat exists ONLY if an order exists
   - Only buyer and seller can access the chat
   - Messages allowed ONLY while order is ACTIVE or DELIVERED
   - Chat becomes read-only after order COMPLETED or CANCELLED
   - No admin participation in chat
   - No file uploads (text only)
   - Messages are immutable (cannot be edited/deleted)
   
   INTEGRATIONS:
   - OrderService: For order status checks (read-only)
   - Chat Model: For chat access
   - Message Model: For message storage
   
   SECURITY:
   - Validate user is buyer or seller before any operation
   - Validate order status before sending messages
   - No trust exposure
   - No money handling
   
   ======================================== */

// Models
const Chat = require('../models/Chat');
const Message = require('../models/Message');

// Services
const OrderService = require('./OrderService');
const { ORDER_STATUSES } = require('../models/Order');

/**
 * ChatService
 * 
 * Business logic layer for chat operations.
 * All chat/message operations MUST go through this service.
 */
class ChatService {
    
    // ============================================================
    // GET CHAT FOR ORDER
    // ============================================================
    
    /**
     * Get the chat for an order.
     * 
     * Business Rules Enforced:
     * 1. Order must exist
     * 2. User must be buyer or seller of the order
     * 3. Chat must exist (created with order)
     * 
     * @param {string} orderId - ID of the order
     * @param {string} userId - ID of the user requesting access
     * @returns {Promise<Object>} Chat object
     * @throws {Error} If validation fails or access denied
     */
    async getChatForOrder(orderId, userId) {
        // ============================================================
        // STEP 1: Validate orderId
        // ============================================================
        if (!orderId) {
            throw new Error('رقم الطلب مطلوب');
        }
        
        // ============================================================
        // STEP 2: Get order and validate existence
        // ============================================================
        const order = await OrderService.getOrderById(orderId);
        
        if (!order) {
            throw new Error('الطلب غير موجود');
        }
        
        // ============================================================
        // STEP 3: Validate user is buyer or seller
        // Constitution: Only buyer and seller can access chat
        // ============================================================
        const userIdStr = userId.toString();
        const isBuyer = order.buyerId.toString() === userIdStr;
        const isSeller = order.sellerId.toString() === userIdStr;
        
        if (!isBuyer && !isSeller) {
            throw new Error('ليس لديك صلاحية للوصول لهذه المحادثة');
        }
        
        // ============================================================
        // STEP 4: Get chat
        // Chat should exist (created with order)
        // ============================================================
        const chat = await Chat.findOne({ orderId });
        
        if (!chat) {
            throw new Error('المحادثة غير موجودة');
        }
        
        return chat;
    }
    
    // ============================================================
    // GET CHAT BY ID
    // ============================================================
    
    /**
     * Get chat by its ID.
     * 
     * @param {string} chatId - Chat ID
     * @param {string} userId - ID of the user requesting access
     * @returns {Promise<Object>} Chat object
     * @throws {Error} If validation fails or access denied
     */
    async getChatById(chatId, userId) {
        // ============================================================
        // STEP 1: Validate chatId
        // ============================================================
        if (!chatId) {
            throw new Error('معرّف المحادثة مطلوب');
        }
        
        // ============================================================
        // STEP 2: Get chat with populated fields
        // ============================================================
        const chat = await Chat.findById(chatId)
            .populate('buyerId', 'fullName username avatarUrl')
            .populate('sellerId', 'fullName username avatarUrl')
            .populate({
                path: 'orderId',
                select: 'snapshotTitle status serviceId',
                populate: {
                    path: 'serviceId',
                    select: 'title'
                }
            });
        
        if (!chat) {
            throw new Error('المحادثة غير موجودة');
        }
        
        // ============================================================
        // STEP 3: Validate user is buyer or seller
        // Constitution: Only buyer and seller can access chat
        // ============================================================
        const userIdStr = userId.toString();
        const buyerIdStr = chat.buyerId?._id?.toString() || chat.buyerId?.toString();
        const sellerIdStr = chat.sellerId?._id?.toString() || chat.sellerId?.toString();
        const isBuyer = buyerIdStr === userIdStr;
        const isSeller = sellerIdStr === userIdStr;
        
        if (!isBuyer && !isSeller) {
            throw new Error('ليس لديك صلاحية للوصول لهذه المحادثة');
        }
        
        return chat;
    }
    
    // ============================================================
    // GET MESSAGES
    // ============================================================
    
    /**
     * Get messages for a chat.
     * 
     * Business Rules Enforced:
     * 1. User must have access to the chat
     * 2. Messages returned in chronological order
     * 
     * @param {string} chatId - Chat ID
     * @param {string} userId - ID of the user requesting
     * @param {Object} options - Query options
     * @param {number} options.limit - Max messages to return (default: 100)
     * @param {Date} options.before - Get messages before this date
     * @returns {Promise<Array>} Array of messages
     * @throws {Error} If validation fails
     */
    async getMessages(chatId, userId, { limit = 100, before = null } = {}) {
        // ============================================================
        // STEP 1: Validate access to chat
        // This also validates chatId and user permissions
        // ============================================================
        await this.getChatById(chatId, userId);
        
        // ============================================================
        // STEP 2: Build query
        // ============================================================
        const query = { chatId };
        
        if (before) {
            query.createdAt = { $lt: before };
        }
        
        // ============================================================
        // STEP 3: Get messages with sender info
        // ============================================================
        const messages = await Message.find(query)
            .populate('senderId', 'fullName username avatarUrl')
            .sort({ createdAt: 1 })  // Oldest first (chronological)
            .limit(Math.min(limit, 200));  // Cap at 200
        
        return messages;
    }
    
    // ============================================================
    // SEND MESSAGE
    // ============================================================
    
    /**
     * Send a message in a chat.
     * 
     * Business Rules Enforced:
     * 1. User must be buyer or seller
     * 2. Order must be in ACTIVE or DELIVERED status
     * 3. Chat must not be read-only
     * 4. Message content cannot be empty
     * 
     * @param {string} chatId - Chat ID
     * @param {string} senderId - ID of the sender
     * @param {string} content - Message content
     * @returns {Promise<Object>} Created message
     * @throws {Error} If validation fails
     */
    async sendMessage(chatId, senderId, content) {
        // ============================================================
        // STEP 1: Validate content
        // ============================================================
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            throw new Error('محتوى الرسالة مطلوب');
        }
        
        const trimmedContent = content.trim();
        
        if (trimmedContent.length > 5000) {
            throw new Error('الرسالة يجب أن تكون أقل من 5000 حرف');
        }
        
        // ============================================================
        // STEP 2: Get chat and validate access
        // ============================================================
        const chat = await this.getChatById(chatId, senderId);
        
        // ============================================================
        // STEP 3: Check if chat is read-only
        // Constitution: No messages after order closure
        // ============================================================
        if (chat.isReadOnly) {
            throw new Error('هذه المحادثة للقراءة فقط');
        }
        
        // ============================================================
        // STEP 4: Get order and validate status
        // Constitution: Messages allowed ONLY in ACTIVE or DELIVERED
        // ============================================================
        const order = await OrderService.getOrderById(chat.orderId);
        
        if (!order) {
            throw new Error('الطلب المرتبط بالمحادثة غير موجود');
        }
        
        const allowedStatuses = [ORDER_STATUSES.ACTIVE, ORDER_STATUSES.DELIVERED];
        
        if (!allowedStatuses.includes(order.status)) {
            throw new Error('لا يمكن إرسال رسائل في هذه المرحلة من الطلب');
        }
        
        // ============================================================
        // STEP 5: Create message
        // Constitution: Messages are immutable
        // ============================================================
        const message = await Message.create({
            chatId: chat._id,
            senderId,
            content: trimmedContent,
            isSystemMessage: false
        });
        
        // ============================================================
        // STEP 6: Update chat timestamp
        // ============================================================
        chat.updatedAt = new Date();
        await chat.save();
        
        // ============================================================
        // STEP 7: Populate sender info for the response
        // ============================================================
        const populatedMessage = await Message.findById(message._id)
            .populate('senderId', 'fullName username avatarUrl');
        
        // ============================================================
        // STEP 8: Emit via WebSocket for real-time delivery
        // ============================================================
        try {
            const SocketService = require('./SocketService');
            
            // Emit to chat room
            SocketService.emitNewMessage(chatId, populatedMessage);
            
            // Send notification to the other user
            const recipientId = chat.buyerId.toString() === senderId.toString() 
                ? chat.sellerId.toString() 
                : chat.buyerId.toString();
            
            // Update unread count for recipient if they're online
            if (!SocketService.isUserOnline(recipientId)) {
                // User is offline, they'll get the message on next poll/load
                console.log(`📭 Recipient ${recipientId} is offline, message saved for later`);
            }
            
        } catch (socketErr) {
            // Socket errors should not break message sending
            console.error('Socket emit error (non-critical):', socketErr.message);
        }
        
        console.log(`💬 Message sent in chat ${chatId} by ${senderId}`);
        
        return populatedMessage;
    }
    
    // ============================================================
    // GET USER'S CHATS
    // ============================================================
    
    /**
     * Get all chats for a user (as buyer or seller).
     * 
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @param {number} options.limit - Max chats to return (default: 50)
     * @returns {Promise<Array>} Array of chats
     */
    async getChatsForUser(userId, { limit = 50 } = {}) {
        if (!userId) {
            throw new Error('معرّف المستخدم مطلوب');
        }
        
        const chats = await Chat.find({
            $or: [
                { buyerId: userId },
                { sellerId: userId }
            ]
        })
        .populate('buyerId', 'fullName username avatarUrl')
        .populate('sellerId', 'fullName username avatarUrl')
        .populate('orderId', 'snapshotTitle status')
        .sort({ updatedAt: -1 })  // Most recent first
        .limit(Math.min(limit, 100))  // Cap at 100
        .lean();  // Convert to plain objects for modification
        
        // Get last message for each chat
        const Message = require('../models/Message');
        for (const chat of chats) {
            const lastMessage = await Message.findOne({ chatId: chat._id })
                .sort({ createdAt: -1 })
                .select('content createdAt senderId isSystemMessage')
                .lean();
            chat.lastMessage = lastMessage;
            
            // Count unread messages for this user
            const unreadCount = await Message.countDocuments({
                chatId: chat._id,
                senderId: { $ne: userId },
                isRead: false
            });
            chat.unreadCount = unreadCount;
        }
        
        return chats;
    }
    
    // ============================================================
    // CHECK CHAT ACCESS (UTILITY)
    // ============================================================
    
    /**
     * Check if a user has access to a chat.
     * Returns true/false without throwing.
     * 
     * @param {string} chatId - Chat ID
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} True if user has access
     */
    async hasAccess(chatId, userId) {
        try {
            await this.getChatById(chatId, userId);
            return true;
        } catch {
            return false;
        }
    }
    
    // ============================================================
    // CHECK IF CHAT CAN RECEIVE MESSAGES (UTILITY)
    // ============================================================
    
    /**
     * Check if a chat can receive new messages.
     * 
     * @param {string} chatId - Chat ID
     * @returns {Promise<boolean>} True if messages can be sent
     */
    async canSendMessages(chatId) {
        try {
            const chat = await Chat.findById(chatId);
            
            if (!chat || chat.isReadOnly) {
                return false;
            }
            
            const order = await OrderService.getOrderById(chat.orderId);
            
            if (!order) {
                return false;
            }
            
            const allowedStatuses = [ORDER_STATUSES.ACTIVE, ORDER_STATUSES.DELIVERED];
            return allowedStatuses.includes(order.status);
            
        } catch {
            return false;
        }
    }
    
    // ============================================================
    // MARK MESSAGES AS READ
    // ============================================================
    
    /**
     * Mark all messages in a chat as read for a user.
     * Only marks messages sent by the OTHER user (not your own messages).
     * 
     * @param {string} chatId - Chat ID
     * @param {string} userId - User marking messages as read
     * @returns {Promise<number>} Number of messages marked as read
     */
    async markMessagesAsRead(chatId, userId) {
        if (!chatId || !userId) {
            throw new Error('معرّف المحادثة والمستخدم مطلوبان');
        }
        
        // Validate user has access
        const chat = await this.getChatById(chatId, userId);
        
        // Mark messages NOT sent by this user as read
        const result = await Message.updateMany(
            {
                chatId: chat._id,
                senderId: { $ne: userId },  // Not sent by this user
                isRead: false
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date()
                }
            }
        );
        
        return result.modifiedCount;
    }
    
    // ============================================================
    // GET UNREAD COUNT FOR CHAT
    // ============================================================
    
    /**
     * Get the count of unread messages in a chat for a user.
     * 
     * @param {string} chatId - Chat ID
     * @param {string} userId - User to count unread for
     * @returns {Promise<number>} Unread message count
     */
    async getUnreadCount(chatId, userId) {
        if (!chatId || !userId) {
            return 0;
        }
        
        const count = await Message.countDocuments({
            chatId,
            senderId: { $ne: userId },  // Not sent by this user
            isRead: false
        });
        
        return count;
    }
    
    // ============================================================
    // GET TOTAL UNREAD COUNT FOR USER
    // ============================================================
    
    /**
     * Get total unread messages across all chats for a user.
     * Used for notification badge in navbar.
     * 
     * @param {string} userId - User ID
     * @returns {Promise<number>} Total unread message count
     */
    async getUnreadCountForUser(userId) {
        if (!userId) {
            return 0;
        }
        
        // Get all chats for this user
        const chats = await Chat.find({
            $or: [
                { buyerId: userId },
                { sellerId: userId }
            ]
        }).select('_id');
        
        if (chats.length === 0) {
            return 0;
        }
        
        const chatIds = chats.map(c => c._id);
        
        // Count unread messages not sent by this user
        const count = await Message.countDocuments({
            chatId: { $in: chatIds },
            senderId: { $ne: userId },
            isRead: false
        });
        
        return count;
    }
}

// Export singleton instance
module.exports = new ChatService();
