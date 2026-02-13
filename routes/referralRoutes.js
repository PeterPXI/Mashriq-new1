/**
 * MASHRIQ REFERRAL ROUTES
 * نظام الإحالة الفيروسي
 */

const express = require('express');
const router = express.Router();
const ReferralController = require('../controllers/ReferralController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/referral/validate
 * التحقق من كود الإحالة (لا يحتاج تسجيل دخول)
 */
router.post('/validate', ReferralController.validateCode);

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/referral/code
 * الحصول على كود الإحالة الخاص بالمستخدم
 */
router.get('/code', authenticateToken, ReferralController.getCode);

/**
 * GET /api/referral/stats
 * إحصائيات الإحالات
 */
router.get('/stats', authenticateToken, ReferralController.getStats);

/**
 * POST /api/referral/claim
 * المطالبة بمكافأة
 */
router.post('/claim', authenticateToken, ReferralController.claimReward);

module.exports = router;

