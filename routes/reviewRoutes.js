/* ========================================
   Mashriq (مشرق) - Review Routes
   ========================================
   
   PURPOSE:
   Express Router for review endpoints.
   Maps HTTP routes to ReviewController methods.
   
   RULES:
   - NO logic in routes
   - NO model or service access
   - Authentication applied per-route (not globally)
   - Permissions enforced in controller
   
   AUTH STRATEGY:
   - POST / → requires auth (buyer creates review)
   - GET /check/:orderId → requires auth
   - All other GET routes → public
   
   ROUTE ORDER:
   Static paths BEFORE dynamic params to avoid collision.
   e.g. /order/:orderId BEFORE /:id
   
   ======================================== */

const express = require('express');
const router = express.Router();

// Controller
const ReviewController = require('../controllers/ReviewController');

// ============================================================
// AUTHENTICATION MIDDLEWARE (Per-Route)
// ============================================================

/**
 * Authenticate token middleware.
 * Used only for protected routes in this router.
 */
const { authenticateToken } = require('../middlewares/authMiddleware');

// ============================================================
// REVIEW ROUTES
// ============================================================

/**
 * @route   POST /api/reviews
 * @desc    Create a review for a completed order
 * @access  Private (Buyer)
 */
router.post('/', authenticateToken, ReviewController.createReview.bind(ReviewController));

/**
 * @route   GET /api/reviews/order/:orderId
 * @desc    Get review for a specific order
 * @access  Public
 * 
 * NOTE: Must be before /:id to avoid collision
 */
router.get('/order/:orderId', ReviewController.getReviewByOrderId.bind(ReviewController));

/**
 * @route   GET /api/reviews/seller/:sellerId
 * @desc    Get all reviews for a seller
 * @access  Public
 * 
 * NOTE: Must be before /:id to avoid collision
 */
router.get('/seller/:sellerId', ReviewController.getReviewsForSeller.bind(ReviewController));

/**
 * @route   GET /api/reviews/check/:orderId
 * @desc    Check if an order has a review
 * @access  Private
 * 
 * NOTE: Must be before /:id to avoid collision
 */
router.get('/check/:orderId', authenticateToken, ReviewController.checkOrderHasReview.bind(ReviewController));

/**
 * @route   GET /api/reviews/:id
 * @desc    Get review by ID
 * @access  Public
 */
router.get('/:id', ReviewController.getReviewById.bind(ReviewController));

module.exports = router;
