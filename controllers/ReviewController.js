/* ========================================
   Mashriq (مشرق) - Review Controller
   ========================================
   
   PURPOSE:
   HTTP interface layer for review operations.
   Handles authentication, validation, and permission enforcement.
   Delegates ALL business logic to ReviewService.
   
   ARCHITECTURE:
   Controller → Service → Model
   
   RULES:
   - NO direct model access
   - NO business logic
   - ONLY call ReviewService methods
   - Buyer only for creating reviews
   
   ======================================== */

const ReviewService = require('../services/ReviewService');
const { success, error } = require('../utils/apiResponse');

/**
 * ReviewController
 * 
 * HTTP interface for review operations.
 * All methods are async Express route handlers.
 */
class ReviewController {
    
    // ============================================================
    // CREATE REVIEW
    // POST /api/reviews
    // Permission: Buyer only (on their own completed order)
    // ============================================================
    
    /**
     * Create a review for a completed order.
     * 
     * @route POST /api/reviews
     * @access Private (Buyer)
     */
    async createReview(req, res) {
        try {
            const { orderId, rating, comment } = req.body;
            
            if (!orderId) {
                return error(res, 'رقم الطلب مطلوب', 'MISSING_ORDER_ID', 400);
            }
            
            if (typeof orderId !== 'string' || orderId.length !== 24) {
                return error(res, 'معرّف الطلب غير صالح', 'INVALID_ID_FORMAT', 400);
            }
            
            if (rating === undefined || rating === null) {
                return error(res, 'التقييم مطلوب', 'MISSING_RATING', 400);
            }
            
            const parsedRating = parseInt(rating, 10);
            if (isNaN(parsedRating)) {
                return error(res, 'التقييم يجب أن يكون رقماً', 'INVALID_RATING', 400);
            }
            
            if (parsedRating < 1 || parsedRating > 5) {
                return error(res, 'التقييم يجب أن يكون بين 1 و 5', 'INVALID_RATING_RANGE', 400);
            }
            
            if (comment !== undefined && typeof comment !== 'string') {
                return error(res, 'التعليق يجب أن يكون نصاً', 'INVALID_COMMENT', 400);
            }
            
            const review = await ReviewService.createReview(
                orderId,
                req.user._id,
                parsedRating,
                comment || ''
            );
            
            return success(res, 'تم إضافة التقييم بنجاح! شكراً لك ⭐', { review }, 201);
            
        } catch (err) {
            console.error('Create review error:', err);
            
            const message = err.message;
            let statusCode = 400;
            let code = 'CREATE_REVIEW_ERROR';
            
            if (message.includes('فقط المشتري')) {
                statusCode = 403;
                code = 'FORBIDDEN';
            } else if (message.includes('غير موجود')) {
                statusCode = 404;
                code = 'NOT_FOUND';
            } else if (message.includes('مسبقاً')) {
                statusCode = 409;  // Conflict - already reviewed
                code = 'ALREADY_EXISTS';
            }
            
            return error(res, message || 'حدث خطأ في إضافة التقييم', code, statusCode);
        }
    }
    
    // ============================================================
    // GET REVIEW FOR ORDER
    // GET /api/reviews/order/:orderId
    // Permission: Public (reviews are public)
    // ============================================================
    
    /**
     * Get the review for a specific order.
     * 
     * @route GET /api/reviews/order/:orderId
     * @access Public
     */
    async getReviewByOrderId(req, res) {
        try {
            const { orderId } = req.params;
            
            if (!orderId || orderId.length !== 24) {
                return error(res, 'معرّف الطلب غير صالح', 'INVALID_ID_FORMAT', 400);
            }
            
            const review = await ReviewService.getReviewByOrderId(orderId);
            
            if (!review) {
                return error(res, 'لا يوجد تقييم لهذا الطلب', 'REVIEW_NOT_FOUND', 404);
            }
            
            return success(res, 'تم جلب التقييم بنجاح', { review });
            
        } catch (err) {
            console.error('Get review by order ID error:', err);
            return error(res, 'حدث خطأ في جلب التقييم', 'GET_REVIEW_ERROR', 500);
        }
    }
    
    // ============================================================
    // GET REVIEW BY ID
    // GET /api/reviews/:id
    // Permission: Public (reviews are public)
    // ============================================================
    
    /**
     * Get a review by its ID.
     * 
     * @route GET /api/reviews/:id
     * @access Public
     */
    async getReviewById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || id.length !== 24) {
                return error(res, 'معرّف التقييم غير صالح', 'INVALID_ID_FORMAT', 400);
            }
            
            const review = await ReviewService.getReviewById(id);
            
            if (!review) {
                return error(res, 'التقييم غير موجود', 'REVIEW_NOT_FOUND', 404);
            }
            
            return success(res, 'تم جلب التقييم بنجاح', { review });
            
        } catch (err) {
            console.error('Get review by ID error:', err);
            if (err.kind === 'ObjectId') {
                return error(res, 'التقييم غير موجود', 'REVIEW_NOT_FOUND', 404);
            }
            return error(res, 'حدث خطأ في جلب التقييم', 'GET_REVIEW_ERROR', 500);
        }
    }
    
    // ============================================================
    // GET REVIEWS FOR SELLER
    // GET /api/reviews/seller/:sellerId
    // Permission: Public (reviews are public)
    // ============================================================
    
    /**
     * Get all reviews for a seller.
     * 
     * @route GET /api/reviews/seller/:sellerId
     * @query limit - Max reviews to return (default: 50)
     * @query skip - Number of reviews to skip (pagination)
     * @access Public
     */
    async getReviewsForSeller(req, res) {
        try {
            const { sellerId } = req.params;
            const { limit, skip } = req.query;
            
            if (!sellerId || sellerId.length !== 24) {
                return error(res, 'معرّف البائع غير صالح', 'INVALID_ID_FORMAT', 400);
            }
            
            let parsedLimit = 50;
            if (limit) {
                parsedLimit = parseInt(limit, 10);
                if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
                    return error(res, 'الحد الأقصى يجب أن يكون بين 1 و 100', 'INVALID_LIMIT', 400);
                }
            }
            
            let parsedSkip = 0;
            if (skip) {
                parsedSkip = parseInt(skip, 10);
                if (isNaN(parsedSkip) || parsedSkip < 0) {
                    return error(res, 'قيمة التخطي غير صالحة', 'INVALID_SKIP', 400);
                }
            }
            
            const reviews = await ReviewService.getReviewsForSeller(sellerId, {
                limit: parsedLimit,
                skip: parsedSkip
            });
            
            const summary = await ReviewService.getSellerRatingSummary(sellerId);
            
            return success(res, 'تم جلب التقييمات بنجاح', {
                count: reviews.length,
                averageRating: summary.averageRating,
                totalReviews: summary.totalReviews,
                reviews
            });
            
        } catch (err) {
            console.error('Get reviews for seller error:', err);
            return error(res, 'حدث خطأ في جلب التقييمات', 'GET_REVIEWS_ERROR', 500);
        }
    }
    
    // ============================================================
    // CHECK IF ORDER HAS REVIEW
    // GET /api/reviews/check/:orderId
    // Permission: Authenticated
    // ============================================================
    
    /**
     * Check if an order has a review.
     * 
     * @route GET /api/reviews/check/:orderId
     * @access Private
     */
    async checkOrderHasReview(req, res) {
        try {
            const { orderId } = req.params;
            
            if (!orderId || orderId.length !== 24) {
                return error(res, 'معرّف الطلب غير صالح', 'INVALID_ID_FORMAT', 400);
            }
            
            const hasReview = await ReviewService.hasReview(orderId);
            
            return success(res, 'التحقق مكتمل', { hasReview });
            
        } catch (err) {
            console.error('Check order has review error:', err);
            return error(res, 'حدث خطأ في التحقق من التقييم', 'CHECK_REVIEW_ERROR', 500);
        }
    }
}

// Export singleton instance
module.exports = new ReviewController();
