/* ========================================
   Mashriq (مشرق) - Chat Controller
   ========================================
   
   PURPOSE:
   HTTP interface layer for chat operations.
   Handles authentication, validation, and permission enforcement.
   Delegates ALL business logic to ChatService.
   
   ARCHITECTURE:
   Controller → Service → Model
   
   RULES:
   - NO direct model access
   - NO business logic
   - ONLY call ChatService methods
   - Buyer & Seller access only (no admin)
   
   ======================================== */

const ChatService = require('../services/ChatService');
const { success, error } = require('../utils/apiResponse');

/**
 * ChatController
 * 
 * HTTP interface for chat operations.
 * All methods are async Express route handlers.
 */
class ChatController {
    
    /**
     * Get the chat for a specific order.
     * 
     * @route GET /api/chats/order/:orderId
     * @access Private (Buyer/Seller)
     */
    async getChatForOrder(req, res) {
        try {
            const { orderId } = req.params;
            
            if (!orderId || orderId.length !== 24) {
                return error(res, 'معرّف الطلب غير صالح', 'INVALID_ID_FORMAT', 400);
            }
            
            const chat = await ChatService.getChatForOrder(orderId, req.user._id);
            const canSend = await ChatService.canSendMessages(chat._id);
            
            return success(res, 'تم جلب المحادثة بنجاح', {
                chat,
                canSendMessages: canSend
            });
            
        } catch (err) {
            console.error('Get chat for order error:', err);
            
            const message = err.message;
            let statusCode = 400;
            let code = 'GET_CHAT_ERROR';
            
            if (message.includes('صلاحية')) {
                statusCode = 403;
                code = 'FORBIDDEN';
            } else if (message.includes('غير موجود')) {
                statusCode = 404;
                code = 'NOT_FOUND';
            }
            
            return error(res, message || 'حدث خطأ في جلب المحادثة', code, statusCode);
        }
    }
    
    /**
     * Get a chat by its ID.
     * 
     * @route GET /api/chats/:chatId
     * @access Private (Buyer/Seller)
     */
    async getChatById(req, res) {
        try {
            const { chatId } = req.params;
            
            if (!chatId || chatId.length !== 24) {
                return error(res, 'معرّف المحادثة غير صالح', 'INVALID_ID_FORMAT', 400);
            }
            
            const chat = await ChatService.getChatById(chatId, req.user._id);
            const canSend = await ChatService.canSendMessages(chat._id);
            
            const userId = req.user._id.toString();
            const userRole = chat.buyerId.toString() === userId ? 'buyer' : 'seller';
            
            return success(res, 'تم جلب المحادثة بنجاح', {
                chat,
                userRole,
                canSendMessages: canSend
            });
            
        } catch (err) {
            console.error('Get chat by ID error:', err);
            
            const message = err.message;
            let statusCode = 400;
            let code = 'GET_CHAT_ERROR';
            
            if (message.includes('صلاحية')) {
                statusCode = 403;
                code = 'FORBIDDEN';
            } else if (message.includes('غير موجود')) {
                statusCode = 404;
                code = 'NOT_FOUND';
            }
            
            return error(res, message || 'حدث خطأ في جلب المحادثة', code, statusCode);
        }
    }
    
    /**
     * Get messages for a chat.
     * 
     * @route GET /api/chats/:chatId/messages
     * @access Private (Buyer/Seller)
     */
    async getMessages(req, res) {
        try {
            const { chatId } = req.params;
            const { limit, before } = req.query;
            
            if (!chatId || chatId.length !== 24) {
                return error(res, 'معرّف المحادثة غير صالح', 'INVALID_ID_FORMAT', 400);
            }
            
            let parsedLimit = 100;
            if (limit) {
                parsedLimit = parseInt(limit, 10);
                if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 200) {
                    return error(res, 'الحد الأقصى يجب أن يكون بين 1 و 200', 'INVALID_LIMIT', 400);
                }
            }
            
            let beforeDate = null;
            if (before) {
                beforeDate = new Date(before);
                if (isNaN(beforeDate.getTime())) {
                    return error(res, 'تاريخ غير صالح', 'INVALID_DATE', 400);
                }
            }
            
            const messages = await ChatService.getMessages(chatId, req.user._id, {
                limit: parsedLimit,
                before: beforeDate
            });
            
            return success(res, 'تم جلب الرسائل بنجاح', {
                count: messages.length,
                messages
            });
            
        } catch (err) {
            console.error('Get messages error:', err);
            
            const message = err.message;
            let statusCode = 400;
            let code = 'GET_MESSAGES_ERROR';
            
            if (message.includes('صلاحية')) {
                statusCode = 403;
                code = 'FORBIDDEN';
            } else if (message.includes('غير موجود')) {
                statusCode = 404;
                code = 'NOT_FOUND';
            }
            
            return error(res, message || 'حدث خطأ في جلب الرسائل', code, statusCode);
        }
    }
    
    /**
     * Send a message in a chat.
     * 
     * @route POST /api/chats/:chatId/messages
     * @access Private (Buyer/Seller)
     */
    async sendMessage(req, res) {
        try {
            const { chatId } = req.params;
            const { content } = req.body;
            
            if (!chatId || chatId.length !== 24) {
                return error(res, 'معرّف المحادثة غير صالح', 'INVALID_ID_FORMAT', 400);
            }
            
            if (!content) {
                return error(res, 'محتوى الرسالة مطلوب', 'MISSING_CONTENT', 400);
            }
            
            if (typeof content !== 'string') {
                return error(res, 'محتوى الرسالة يجب أن يكون نصاً', 'INVALID_CONTENT', 400);
            }
            
            const message = await ChatService.sendMessage(chatId, req.user._id, content);
            
            return success(res, 'تم إرسال الرسالة', { 
              message: message 
            }, 201);
            
        } catch (err) {
            console.error('Send message error:', err);
            
            const errorMessage = err.message;
            let statusCode = 400;
            let code = 'SEND_MESSAGE_ERROR';
            
            if (errorMessage.includes('صلاحية')) {
                statusCode = 403;
                code = 'FORBIDDEN';
            } else if (errorMessage.includes('غير موجود')) {
                statusCode = 404;
                code = 'NOT_FOUND';
            } else if (errorMessage.includes('للقراءة فقط') || errorMessage.includes('لا يمكن إرسال')) {
                statusCode = 403;
                code = 'CHAT_LOCKED';
            }
            
            return error(res, errorMessage || 'حدث خطأ في إرسال الرسالة', code, statusCode);
        }
    }
    
    /**
     * Get all chats for the authenticated user.
     * 
     * @route GET /api/chats
     * @access Private
     */
    async getMyChats(req, res) {
        try {
            const { limit } = req.query;
            
            let parsedLimit = 50;
            if (limit) {
                parsedLimit = parseInt(limit, 10);
                if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
                    return error(res, 'الحد الأقصى يجب أن يكون بين 1 و 100', 'INVALID_LIMIT', 400);
                }
            }
            
            const chats = await ChatService.getChatsForUser(req.user._id, {
                limit: parsedLimit
            });
            
            return success(res, 'تم جلب المحادثات بنجاح', {
                count: chats.length,
                chats
            });
            
        } catch (err) {
            console.error('Get my chats error:', err);
            return error(res, 'حدث خطأ في جلب المحادثات', 'GET_CHATS_ERROR', 500);
        }
    }
}

// Export singleton instance
module.exports = new ChatController();
