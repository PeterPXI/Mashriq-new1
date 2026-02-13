/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ AI ROUTES
 * منصة مشرق - مسارات الذكاء الاصطناعي
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const AIController = require('../controllers/AIController');
const { optionalAuth, authenticateToken } = require('../middlewares/authMiddleware');

// ─────────────────────────────────────────────────────────────────────────
// Public Routes (مع مصادقة اختيارية)
// ─────────────────────────────────────────────────────────────────────────

/**
 * البحث الذكي
 * POST /api/ai/search
 * Body: { query: "عايز حد يصممل شعار" }
 */
router.post('/search', optionalAuth, AIController.smartSearch);

/**
 * التحقق من حالة AI
 * GET /api/ai/status
 */
router.get('/status', AIController.getStatus);

// ─────────────────────────────────────────────────────────────────────────
// Protected Routes (تتطلب مصادقة)
// ─────────────────────────────────────────────────────────────────────────

/**
 * كتابة عرض ذكي
 * POST /api/ai/write-proposal
 * Body: { jobDescription: "...", sellerProfile: {...} }
 */
router.post('/write-proposal', authenticateToken, AIController.writeProposal);

/**
 * تحسين البروفايل
 * POST /api/ai/improve-profile
 * Body: { profile: { headline, bio, skills } }
 */
router.post('/improve-profile', authenticateToken, AIController.improveProfile);

/**
 * اقتراح ردود سريعة
 * POST /api/ai/suggest-reply
 * Body: { context: "...", lastMessage: "..." }
 */
router.post('/suggest-reply', optionalAuth, AIController.suggestReply);

/**
 * توليد وصف الخدمة
 * POST /api/ai/generate-description
 * Body: { title: "...", category: "...", points: ["..."] }
 */
router.post('/generate-description', optionalAuth, AIController.generateDescription);

/**
 * اقتراح عناوين للخدمة
 * POST /api/ai/suggest-titles
 * Body: { type: "...", specialty: "...", count: 5 }
 */
router.post('/suggest-titles', optionalAuth, AIController.suggestTitles);

/**
 * تحليل الملف الشخصي
 * POST /api/ai/analyze-profile
 * Body: { profile: { name, bio, skills, servicesCount, ... } }
 */
router.post('/analyze-profile', optionalAuth, AIController.analyzeProfile);

/**
 * المطابقة الذكية للخدمات
 * POST /api/ai/match-services
 * Body: { description: "...", budget: 50, category: "design" }
 */
router.post('/match-services', optionalAuth, AIController.matchServices);

module.exports = router;
