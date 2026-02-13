/* ========================================
   Mashriq (مشرق) - Socket Service
   ========================================
   
   PURPOSE:
   Manages WebSocket connections for real-time features.
   Handles chat messages, notifications, and typing indicators.
   
   FEATURES:
   - Real-time chat messages
   - Typing indicators
   - Online status
   - Notification broadcasting
   
   SECURITY:
   - JWT-based authentication
   - Room-based message isolation
   - User can only access their own chats
   
   ======================================== */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');

const JWT_SECRET = process.env.JWT_SECRET || 'mashriq_simple_secret';

/**
 * SocketService
 * 
 * Singleton service that manages all WebSocket functionality.
 * Must be initialized with the HTTP server.
 */
class SocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // userId -> Set of socket ids
    }
    
    /**
     * Initialize Socket.IO with the HTTP server.
     * 
     * @param {http.Server} server - The HTTP server instance
     */
    initialize(server) {
        const { Server } = require('socket.io');
        
        this.io = new Server(server, {
            cors: {
                origin: process.env.CORS_ORIGIN || '*',
                methods: ['GET', 'POST'],
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });
        
        // Authentication middleware
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || 
                              socket.handshake.headers.authorization?.split(' ')[1];
                
                if (!token) {
                    return next(new Error('يجب تسجيل الدخول أولاً'));
                }
                
                const decoded = jwt.verify(token, JWT_SECRET);
                const user = await User.findById(decoded.id).select('_id fullName username avatarUrl role');
                
                if (!user) {
                    return next(new Error('المستخدم غير موجود'));
                }
                
                socket.userId = user._id.toString();
                socket.user = user;
                next();
                
            } catch (err) {
                console.error('Socket auth error:', err.message);
                next(new Error('فشل التحقق من الهوية'));
            }
        });
        
        // Connection handler
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
        
        console.log('🔌 Socket.IO initialized');
    }
    
    /**
     * Handle new socket connection.
     */
    handleConnection(socket) {
        const userId = socket.userId;
        console.log(`🟢 User connected: ${userId}`);
        
        // Track connected user
        if (!this.connectedUsers.has(userId)) {
            this.connectedUsers.set(userId, new Set());
        }
        this.connectedUsers.get(userId).add(socket.id);
        
        // Join user's personal room (for notifications)
        socket.join(`user:${userId}`);
        
        // ─────────────────────────────────────────────────────────────
        // CHAT EVENTS
        // ─────────────────────────────────────────────────────────────
        
        /**
         * Join a chat room to receive messages.
         */
        socket.on('chat:join', async (chatId) => {
            try {
                // Validate user has access to this chat
                const chat = await Chat.findById(chatId);
                if (!chat) {
                    socket.emit('error', { message: 'المحادثة غير موجودة' });
                    return;
                }
                
                const isBuyer = chat.buyerId.toString() === userId;
                const isSeller = chat.sellerId.toString() === userId;
                
                if (!isBuyer && !isSeller) {
                    socket.emit('error', { message: 'ليس لديك صلاحية للوصول لهذه المحادثة' });
                    return;
                }
                
                socket.join(`chat:${chatId}`);
                console.log(`📝 User ${userId} joined chat:${chatId}`);
                
                // Notify other user that this user is online in the chat
                socket.to(`chat:${chatId}`).emit('chat:user-online', {
                    userId,
                    user: {
                        id: socket.user._id,
                        fullName: socket.user.fullName,
                        avatarUrl: socket.user.avatarUrl
                    }
                });
                
            } catch (err) {
                console.error('Join chat error:', err);
                socket.emit('error', { message: 'حدث خطأ أثناء الانضمام للمحادثة' });
            }
        });
        
        /**
         * Leave a chat room.
         */
        socket.on('chat:leave', (chatId) => {
            socket.leave(`chat:${chatId}`);
            console.log(`📝 User ${userId} left chat:${chatId}`);
            
            // Notify other user
            socket.to(`chat:${chatId}`).emit('chat:user-offline', { userId });
        });
        
        /**
         * Typing indicator - user started typing.
         */
        socket.on('chat:typing-start', (chatId) => {
            socket.to(`chat:${chatId}`).emit('chat:typing', {
                userId,
                user: {
                    fullName: socket.user.fullName
                }
            });
        });
        
        /**
         * Typing indicator - user stopped typing.
         */
        socket.on('chat:typing-stop', (chatId) => {
            socket.to(`chat:${chatId}`).emit('chat:typing-stopped', { userId });
        });
        
        /**
         * Mark messages as read.
         */
        socket.on('chat:mark-read', async (chatId) => {
            try {
                const ChatService = require('./ChatService');
                await ChatService.markMessagesAsRead(chatId, userId);
                
                // Notify the other user that messages were read
                socket.to(`chat:${chatId}`).emit('chat:messages-read', {
                    chatId,
                    readBy: userId
                });
            } catch (err) {
                console.error('Mark read error:', err);
            }
        });
        
        // ─────────────────────────────────────────────────────────────
        // DISCONNECT
        // ─────────────────────────────────────────────────────────────
        
        socket.on('disconnect', () => {
            console.log(`🔴 User disconnected: ${userId}`);
            
            // Remove from tracking
            if (this.connectedUsers.has(userId)) {
                this.connectedUsers.get(userId).delete(socket.id);
                if (this.connectedUsers.get(userId).size === 0) {
                    this.connectedUsers.delete(userId);
                }
            }
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC METHODS - Called by other services
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Emit a new message to a chat room.
     * Called by ChatService after saving the message.
     * 
     * @param {string} chatId - The chat ID
     * @param {Object} message - The message object (populated with sender)
     */
    emitNewMessage(chatId, message) {
        if (!this.io) return;
        
        this.io.to(`chat:${chatId}`).emit('chat:new-message', {
            chatId,
            message: {
                _id: message._id,
                content: message.content,
                senderId: message.senderId,
                isSystemMessage: message.isSystemMessage,
                createdAt: message.createdAt,
                attachmentUrls: message.attachmentUrls || []
            }
        });
        
        console.log(`📨 Message emitted to chat:${chatId}`);
    }
    
    /**
     * Send a notification to a specific user.
     * 
     * @param {string} userId - Target user ID
     * @param {Object} notification - Notification data
     */
    sendNotification(userId, notification) {
        if (!this.io) return;
        
        this.io.to(`user:${userId}`).emit('notification', notification);
    }
    
    /**
     * Update unread count for a user.
     * Called when new message is received while user is not in chat.
     * 
     * @param {string} userId - Target user ID
     * @param {number} count - New unread count
     */
    updateUnreadCount(userId, count) {
        if (!this.io) return;
        
        this.io.to(`user:${userId}`).emit('unread-count-update', { count });
    }
    
    /**
     * Check if a user is currently online.
     * 
     * @param {string} userId - User ID to check
     * @returns {boolean}
     */
    isUserOnline(userId) {
        return this.connectedUsers.has(userId) && this.connectedUsers.get(userId).size > 0;
    }
    
    /**
     * Get all online users.
     * 
     * @returns {string[]} Array of online user IDs
     */
    getOnlineUsers() {
        return Array.from(this.connectedUsers.keys());
    }
}

// Export singleton instance
module.exports = new SocketService();
