/* ========================================
   Mashriq (مشرق) - AI Routes
   ========================================
   
   PURPOSE:
   API endpoints for AI-powered features.
   
   ENDPOINTS:
   - POST /api/ai/smart-search        - Natural language search
   - POST /api/ai/generate-description - Generate service description
   - POST /api/ai/suggest-titles      - Suggest service titles
   - POST /api/ai/improve-profile     - Improve seller profile
   - POST /api/ai/order-tips          - Get tips for ordering
   - POST /api/ai/generate-faqs       - Generate FAQs for service
   - POST /api/ai/analyze-pricing     - Analyze and suggest pricing
   - GET  /api/ai/status              - Check if AI is enabled
   
   ======================================== */

const express = require('express');
const router = express.Router();
const aiservice = require('../services/aiService');
const { success, error } = require('../utils/apiResponse');
const { authenticateToken } = require('../middlewares/authMiddleware');
const Service = require('../models/Service');

// Rate limiting storage (simple in-memory, use Redis in production)
const rateLimitStore = new Map();
const RATE_LIMIT = {
    requests: 10,      // requests per window
    windowMs: 60000    // 1 minute window
};

/**
 * Simple rate limiter middleware for AI endpoints
 */
function aiRateLimiter(req, res, next) {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - RATE_LIMIT.windowMs;
    
    // Get or create user's request history
    let userRequests = rateLimitStore.get(userId) || [];
    
    // Filter to only requests within the window
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    if (userRequests.length >= RATE_LIMIT.requests) {
        return error(res, 'لقد تجاوزت الحد المسموح. يرجى الانتظار دقيقة.', 'RATE_LIMIT_EXCEEDED', 429);
    }
    
    // Add current request
    userRequests.push(now);
    rateLimitStore.set(userId, userRequests);
    
    next();
}

// ================================================================
// STATUS ENDPOINT
// ================================================================

/**
 * GET /api/ai/status
 * Check if AI features are enabled
 */
router.get('/status', (req, res) => {
    const enabled = aiservice.isEnabled();
    return success(res, 'AI status', { 
        enabled,
        features: enabled ? [
            'smart-search',
            'generate-description',
            'suggest-titles',
            'improve-profile',
            'order-tips',
            'generate-faqs',
            'analyze-pricing'
        ] : []
    });
});

// ================================================================
// BUYER FEATURES
// ================================================================

/**
 * POST /api/ai/smart-search
 * Convert natural language to search query
 */
router.post('/smart-search', aiRateLimiter, async (req, res) => {
    try {
        const { query, categories } = req.body;
        
        if (!query || query.trim().length < 3) {
            return error(res, 'يرجى كتابة وصف أطول للبحث', 'INVALID_QUERY', 400);
        }
        
        const result = await aiservice.smartSearch(query, categories || []);
        
        return success(res, 'تم تحليل البحث', result);
        
    } catch (err) {
        console.error('Smart search error:', err);
        return error(res, 'حدث خطأ في البحث الذكي', 'AI_ERROR', 500);
    }
});

/**
 * POST /api/ai/order-tips
 * Get tips for writing clear order requirements
 */
router.post('/order-tips', authenticateToken, aiRateLimiter, async (req, res) => {
    try {
        const { serviceId } = req.body;
        
        if (!serviceId) {
            return error(res, 'معرف الخدمة مطلوب', 'MISSING_SERVICE_ID', 400);
        }
        
        const service = await Service.findById(serviceId);
        if (!service) {
            return error(res, 'الخدمة غير موجودة', 'SERVICE_NOT_FOUND', 404);
        }
        
        const tips = await aiService.getOrderTips(service);
        
        return success(res, 'نصائح للطلب', { tips });
        
    } catch (err) {
        console.error('Order tips error:', err);
        return error(res, 'حدث خطأ في جلب النصائح', 'AI_ERROR', 500);
    }
});

// ================================================================
// SELLER/FREELANCER FEATURES
// ================================================================

/**
 * POST /api/ai/generate-description
 * Generate professional service description
 */
router.post('/generate-description', authenticateToken, aiRateLimiter, async (req, res) => {
    try {
        const { title, category, points } = req.body;
        
        if (!title) {
            return error(res, 'عنوان الخدمة مطلوب', 'MISSING_TITLE', 400);
        }
        
        if (!points || !Array.isArray(points) || points.length === 0) {
            return error(res, 'يرجى إضافة نقاط عن خدمتك', 'MISSING_POINTS', 400);
        }
        
        const description = await aiService.generateServiceDescription({
            title,
            category,
            points
        });
        
        return success(res, 'تم توليد الوصف', { description });
        
    } catch (err) {
        console.error('Generate description error:', err);
        return error(res, err.message || 'حدث خطأ في توليد الوصف', 'AI_ERROR', 500);
    }
});

/**
 * POST /api/ai/suggest-titles
 * Suggest catchy service titles
 */
router.post('/suggest-titles', authenticateToken, aiRateLimiter, async (req, res) => {
    try {
        const { type, specialty, notes, count } = req.body;
        
        if (!type && !specialty) {
            return error(res, 'يرجى تحديد نوع الخدمة أو التخصص', 'MISSING_INFO', 400);
        }
        
        const titles = await aiService.suggestServiceTitles({
            type,
            specialty,
            notes
        }, count || 5);
        
        return success(res, 'اقتراحات العناوين', { titles });
        
    } catch (err) {
        console.error('Suggest titles error:', err);
        return error(res, err.message || 'حدث خطأ في اقتراح العناوين', 'AI_ERROR', 500);
    }
});

/**
 * POST /api/ai/improve-profile
 * Improve seller profile
 */
router.post('/improve-profile', authenticateToken, aiRateLimiter, async (req, res) => {
    try {
        const { bio, skills, specialty } = req.body;
        
        const result = await aiService.improveProfile({
            bio,
            skills,
            specialty
        });
        
        return success(res, 'تم تحسين الملف', result);
        
    } catch (err) {
        console.error('Improve profile error:', err);
        return error(res, err.message || 'حدث خطأ في تحسين الملف', 'AI_ERROR', 500);
    }
});

/**
 * POST /api/ai/generate-faqs
 * Generate FAQs for a service
 */
router.post('/generate-faqs', authenticateToken, aiRateLimiter, async (req, res) => {
    try {
        const { title, description, basePrice, deliveryDays } = req.body;
        
        if (!title) {
            return error(res, 'عنوان الخدمة مطلوب', 'MISSING_TITLE', 400);
        }
        
        const faqs = await aiService.generateFAQs({
            title,
            description,
            basePrice,
            deliveryDays
        });
        
        return success(res, 'تم توليد الأسئلة الشائعة', { faqs });
        
    } catch (err) {
        console.error('Generate FAQs error:', err);
        return error(res, 'حدث خطأ في توليد الأسئلة', 'AI_ERROR', 500);
    }
});

/**
 * POST /api/ai/analyze-pricing
 * Analyze and suggest pricing
 */
router.post('/analyze-pricing', authenticateToken, aiRateLimiter, async (req, res) => {
    try {
        const { title, category } = req.body;
        
        if (!title || !category) {
            return error(res, 'العنوان والفئة مطلوبان', 'MISSING_INFO', 400);
        }
        
        // Get similar services for context
        const similarServices = await Service.find({
            category: category,
            status: 'active'
        }).select('basePrice').limit(10);
        
        const result = await aiService.analyzePricing(
            { title, category },
            similarServices
        );
        
        return success(res, 'تحليل التسعير', result);
        
    } catch (err) {
        console.error('Analyze pricing error:', err);
        return error(res, 'حدث خطأ في تحليل التسعير', 'AI_ERROR', 500);
    }
});

module.exports = router;
