/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NOOR AI HUB ROUTES
 * منصة مشرق - مسارات نور للذكاء الاصطناعي
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const NoorController = require('../controllers/NoorController');
const { authenticateToken, optionalAuth } = require('../middlewares/authMiddleware');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES (Optional Auth)
// ─────────────────────────────────────────────────────────────────────────────

// Get available features
router.get('/features', optionalAuth, NoorController.getFeatures);

// Welcome message
router.get('/welcome', optionalAuth, NoorController.welcome);

// General chat with Noor
router.post('/chat', optionalAuth, NoorController.chat);

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTES (Auth Required)
// ─────────────────────────────────────────────────────────────────────────────

// Get user's usage status
router.get('/usage', authenticateToken, NoorController.getUsage);

// Generate professional proposal
router.post('/proposal', authenticateToken, NoorController.generateProposal);

// Generate content (social posts, articles, etc.)
router.post('/content', authenticateToken, NoorController.generateContent);

module.exports = router;
