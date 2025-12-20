/* ========================================
   Mashriq (مشرق) - Order Controller
   ========================================
   
   PURPOSE:
   HTTP interface layer for order operations.
   Handles authentication, validation, and permission enforcement.
   Delegates ALL business logic to OrderService.
   
   ARCHITECTURE:
   Controller → Service → Model
   
   RULES:
   - NO direct model access
   - NO business logic
   - NO state transitions
   - ONLY call OrderService methods
   
   ======================================== */

const OrderService = require('../services/OrderService');
const { ORDER_STATUSES, CANCELLED_BY } = require('../models/Order');
const { USER_ROLES } = require('../models/User');
const { success, error } = require('../utils/apiResponse');

/**
 * OrderController
 * 
 * HTTP interface for order operations.
 * All methods are async Express route handlers.
 */
class OrderController {
    
    /**
     * Create a new order.
     * 
     * @route POST /api/orders
     * @access Private (Buyer)
     */
    async createOrder(req, res) {
        try {
            const { serviceId, selectedExtraIds } = req.body;
            
            if (!serviceId) {
                return error(res, 'يجب تحديد الخدمة المطلوبة', 'MISSING_SERVICE_ID', 400);
            }
            
            if (typeof serviceId !== 'string' || serviceId.length !== 24) {
                return error(res, 'معرّف الخدمة غير صالح', 'INVALID_ID_FORMAT', 400);
            }
            
            if (selectedExtraIds !== undefined) {
                if (!Array.isArray(selectedExtraIds)) {
                    return error(res, 'الإضافات المحددة يجب أن تكون قائمة', 'INVALID_EXTRAS_FORMAT', 400);
                }
                
                for (const extraId of selectedExtraIds) {
                    if (typeof extraId !== 'string' || extraId.length !== 24) {
                        return error(res, 'معرّف إضافة غير صالح', 'INVALID_ID_FORMAT', 400);
                    }
                }
            }
            
            const order = await OrderService.createOrder({
                buyerId: req.user._id,
                serviceId,
                selectedExtraIds: selectedExtraIds || []
            });
            
            return success(res, 'تم إنشاء الطلب بنجاح! 🎉', { order }, 201);
            
        } catch (err) {
            console.error('Create order error:', err);
            return error(res, err.message || 'حدث خطأ في إنشاء الطلب', 'CREATE_ORDER_ERROR', 400);
        }
    }
    
    /**
     * Get orders for the authenticated user.
     * 
     * @route GET /api/orders
     * @access Private
     */
    async getOrders(req, res) {
        try {
            const { role, status, limit } = req.query;
            
            const validRoles = ['buyer', 'seller', 'all'];
            if (role && !validRoles.includes(role)) {
                return error(res, 'الدور المحدد غير صالح', 'INVALID_ROLE', 400);
            }
            
            if (status && !Object.values(ORDER_STATUSES).includes(status)) {
                return error(res, 'حالة الطلب غير صالحة', 'INVALID_STATUS', 400);
            }
            
            const parsedLimit = limit ? parseInt(limit, 10) : 50;
            if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
                return error(res, 'الحد الأقصى يجب أن يكون بين 1 و 100', 'INVALID_LIMIT', 400);
            }
            
            const orders = await OrderService.getOrdersForUser(req.user._id, {
                role: role || 'all',
                status: status || null,
                limit: parsedLimit
            });
            
            return success(res, 'تم جلب الطلبات بنجاح', { orders });
            
        } catch (err) {
            console.error('Get orders error:', err);
            return error(res, 'حدث خطأ في جلب الطلبات', 'GET_ORDERS_ERROR', 500);
        }
    }
    
    /**
     * Get a single order by ID.
     * 
     * @route GET /api/orders/:id
     * @access Private (buyer, seller, or admin)
     */
    async getOrderById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || id.length !== 24) {
                return error(res, 'معرّف الطلب غير صالح', 'INVALID_ID_FORMAT', 400);
            }
            
            const order = await OrderService.getOrderById(id);
            
            if (!order) {
                return error(res, 'الطلب غير موجود', 'ORDER_NOT_FOUND', 404);
            }
            
            const userId = req.user._id.toString();
            const isBuyer = order.buyerId.toString() === userId;
            const isSeller = order.sellerId.toString() === userId;
            const isAdmin = req.user.role === USER_ROLES.ADMIN;
            
            if (!isBuyer && !isSeller && !isAdmin) {
                return error(res, 'ليس لديك صلاحية لعرض هذا الطلب', 'FORBIDDEN', 403);
            }
            
            return success(res, 'تم جلب تفاصيل الطلب بنجاح', {
                order,
                userRole: isBuyer ? 'buyer' : (isSeller ? 'seller' : 'admin')
            });
            
        } catch (err) {
            console.error('Get order by ID error:', err);
            if (err.kind === 'ObjectId') {
                return error(res, 'الطلب غير موجود', 'ORDER_NOT_FOUND', 404);
            }
            return error(res, 'حدث خطأ في جلب الطلب', 'GET_ORDER_ERROR', 500);
        }
    }
    
    /**
     * Mark order as delivered.
     * 
     * @route PUT /api/orders/:id/deliver
     * @access Private (Seller only)
     */
    async deliverOrder(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || id.length !== 24) {
                return error(res, 'معرّف الطلب غير صالح', 'INVALID_ID_FORMAT', 400);
            }
            
            const order = await OrderService.markAsDelivered(id, req.user._id);
            
            return success(res, 'تم تسليم الطلب! في انتظار موافقة المشتري ✨', { order });
            
        } catch (err) {
            console.error('Deliver order error:', err);
            const statusCode = err.message.includes('لست البائع') ? 403 : 400;
            const code = statusCode === 403 ? 'FORBIDDEN' : 'DELIVER_ORDER_ERROR';
            return error(res, err.message || 'حدث خطأ في تسليم الطلب', code, statusCode);
        }
    }
    
    /**
     * Complete order (buyer accepts delivery).
     * 
     * @route PUT /api/orders/:id/complete
     * @access Private (Buyer only)
     */
    async completeOrder(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || id.length !== 24) {
                return error(res, 'معرّف الطلب غير صالح', 'INVALID_ID_FORMAT', 400);
            }
            
            const order = await OrderService.completeOrder(id, req.user._id);
            
            return success(res, 'تم إكمال الطلب بنجاح! شكراً لك 🎉', { order });
            
        } catch (err) {
            console.error('Complete order error:', err);
            const statusCode = err.message.includes('لست المشتري') ? 403 : 400;
            const code = statusCode === 403 ? 'FORBIDDEN' : 'COMPLETE_ORDER_ERROR';
            return error(res, err.message || 'حدث خطأ في إكمال الطلب', code, statusCode);
        }
    }
    
    /**
     * Cancel order.
     * 
     * @route PUT /api/orders/:id/cancel
     * @access Private (Buyer or Seller)
     */
    async cancelOrder(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            
            if (!id || id.length !== 24) {
                return error(res, 'معرّف الطلب غير صالح', 'INVALID_ID_FORMAT', 400);
            }
            
            const order = await OrderService.getOrderById(id);
            
            if (!order) {
                return error(res, 'الطلب غير موجود', 'ORDER_NOT_FOUND', 404);
            }
            
            const userId = req.user._id.toString();
            const isBuyer = order.buyerId.toString() === userId;
            const isSeller = order.sellerId.toString() === userId;
            const isAdmin = req.user.role === USER_ROLES.ADMIN;
            
            if (!isBuyer && !isSeller && !isAdmin) {
                return error(res, 'ليس لديك صلاحية لإلغاء هذا الطلب', 'FORBIDDEN', 403);
            }
            
            let cancelledBy;
            if (isAdmin) {
                cancelledBy = CANCELLED_BY.ADMIN;
            } else if (isBuyer) {
                cancelledBy = CANCELLED_BY.BUYER;
            } else {
                cancelledBy = CANCELLED_BY.SELLER;
            }
            
            const updatedOrder = await OrderService.cancelOrder(
                id,
                req.user._id,
                reason || 'تم إلغاء الطلب',
                cancelledBy
            );
            
            return success(res, 'تم إلغاء الطلب', { order: updatedOrder });
            
        } catch (err) {
            console.error('Cancel order error:', err);
            return error(res, err.message || 'حدث خطأ في إلغاء الطلب', 'CANCEL_ORDER_ERROR', 400);
        }
    }
    
    /**
     * Get all orders (admin view).
     */
    async getAllOrders(req, res) {
        if (req.user.role !== USER_ROLES.ADMIN) {
            return error(res, 'هذا الإجراء متاح للمسؤولين فقط', 'ADMIN_REQUIRED', 403);
        }
        
        return error(res, 'هذه الخدمة غير متاحة حالياً', 'NOT_IMPLEMENTED', 501);
    }
}

// Export singleton instance
module.exports = new OrderController();
