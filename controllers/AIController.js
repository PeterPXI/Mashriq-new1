/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ AI CONTROLLER
 * منصة مشرق - متحكم الذكاء الاصطناعي
 * ═══════════════════════════════════════════════════════════════════════════
 */

const OpenRouterService = require('../services/OpenRouterService');

const AIController = {
    /**
     * البحث الذكي
     * POST /api/ai/search
     */
    async smartSearch(req, res) {
        try {
            const { query } = req.body;
            
            if (!query || query.trim().length < 3) {
                return res.status(400).json({
                    success: false,
                    message: 'الرجاء إدخال استفسار صالح (3 أحرف على الأقل)'
                });
            }
            
            // تحقق من إعداد API
            if (!OpenRouterService.isConfigured()) {
                // Fallback: بحث عادي بدون AI
                return res.json({
                    success: true,
                    aiEnabled: false,
                    data: {
                        keywords: query.split(' ').filter(w => w.length > 2),
                        category: null,
                        priceRange: null,
                        intent: query
                    }
                });
            }
            
            const result = await OpenRouterService.smartSearch(query);
            
            if (!result.success) {
                // Fallback
                return res.json({
                    success: true,
                    aiEnabled: false,
                    data: {
                        keywords: query.split(' ').filter(w => w.length > 2),
                        category: null,
                        priceRange: null,
                        intent: query
                    }
                });
            }
            
            res.json({
                success: true,
                aiEnabled: true,
                data: result.data
            });
            
        } catch (error) {
            console.error('AI Search Error:', error);
            res.status(500).json({
                success: false,
                message: 'حدث خطأ في البحث الذكي'
            });
        }
    },
    
    /**
     * كتابة عرض ذكي
     * POST /api/ai/write-proposal
     */
    async writeProposal(req, res) {
        try {
            const { jobDescription, sellerProfile } = req.body;
            
            if (!jobDescription) {
                return res.status(400).json({
                    success: false,
                    message: 'الرجاء إدخال وصف المشروع'
                });
            }
            
            if (!OpenRouterService.isConfigured()) {
                return res.status(503).json({
                    success: false,
                    message: 'خدمة AI غير متاحة حالياً'
                });
            }
            
            const profile = sellerProfile || {
                name: req.user?.fullName || 'البائع',
                skills: req.user?.skills || []
            };
            
            const result = await OpenRouterService.writeProposal(jobDescription, profile);
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: result.error
                });
            }
            
            res.json({
                success: true,
                proposal: result.content
            });
            
        } catch (error) {
            console.error('Write Proposal Error:', error);
            res.status(500).json({
                success: false,
                message: 'حدث خطأ في كتابة العرض'
            });
        }
    },
    
    /**
     * تحسين البروفايل
     * POST /api/ai/improve-profile
     */
    async improveProfile(req, res) {
        try {
            const { profile } = req.body;
            
            if (!profile) {
                return res.status(400).json({
                    success: false,
                    message: 'الرجاء إرسال بيانات الملف الشخصي'
                });
            }
            
            if (!OpenRouterService.isConfigured()) {
                return res.status(503).json({
                    success: false,
                    message: 'خدمة AI غير متاحة حالياً'
                });
            }
            
            const result = await OpenRouterService.improveProfile(profile);
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: result.error
                });
            }
            
            res.json({
                success: true,
                improvements: result.data
            });
            
        } catch (error) {
            console.error('Improve Profile Error:', error);
            res.status(500).json({
                success: false,
                message: 'حدث خطأ في تحسين الملف الشخصي'
            });
        }
    },
    
    /**
     * اقتراح ردود سريعة
     * POST /api/ai/suggest-reply
     */
    async suggestReply(req, res) {
        try {
            const { context, lastMessage } = req.body;
            
            if (!lastMessage) {
                return res.status(400).json({
                    success: false,
                    message: 'الرجاء إرسال الرسالة الأخيرة'
                });
            }
            
            if (!OpenRouterService.isConfigured()) {
                // Fallback: ردود افتراضية
                return res.json({
                    success: true,
                    aiEnabled: false,
                    replies: [
                        'شكراً لتواصلك! سأرد عليك قريباً.',
                        'تم الاستلام، جاري المراجعة.',
                        'هل يمكنك توضيح المزيد من التفاصيل؟'
                    ]
                });
            }
            
            const result = await OpenRouterService.suggestReply(context || '', lastMessage);
            
            if (!result.success) {
                return res.json({
                    success: true,
                    aiEnabled: false,
                    replies: ['شكراً لتواصلك!', 'سأرد عليك قريباً.']
                });
            }
            
            res.json({
                success: true,
                aiEnabled: true,
                replies: result.data.replies
            });
            
        } catch (error) {
            console.error('Suggest Reply Error:', error);
            res.status(500).json({
                success: false,
                message: 'حدث خطأ'
            });
        }
    },
    
    /**
     * التحقق من حالة AI
     * GET /api/ai/status
     */
    async getStatus(req, res) {
        res.json({
            success: true,
            configured: OpenRouterService.isConfigured(),
            models: OpenRouterService.isConfigured() ? Object.keys(OpenRouterService.models) : []
        });
    },

    /**
     * توليد وصف الخدمة
     * POST /api/ai/generate-description
     */
    async generateDescription(req, res) {
        try {
            const { title, category, points } = req.body;
            
            if (!title) {
                return res.status(400).json({
                    success: false,
                    message: 'الرجاء إدخال عنوان الخدمة'
                });
            }
            
            if (!points || !Array.isArray(points) || points.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'الرجاء إدخال نقاط عن الخدمة'
                });
            }
            
            if (!OpenRouterService.isConfigured()) {
                // Fallback: وصف تلقائي بدون AI
                const fallbackDescription = `${title}

أقدم لكم خدمة احترافية في مجال ${category || 'الخدمات المميزة'}.

✨ ما ستحصل عليه:
${points.map(p => `✓ ${p}`).join('\n')}

🎯 لماذا تختارني؟
• خبرة واسعة في هذا المجال
• التزام تام بالمواعيد
• جودة عالية مضمونة
• دعم مستمر حتى رضاك التام

📩 تواصل معي الآن للبدء في مشروعك!`;

                return res.json({
                    success: true,
                    aiEnabled: false,
                    description: fallbackDescription
                });
            }
            
            const result = await OpenRouterService.generateContent(`
أنت كاتب محترف متخصص في كتابة أوصاف الخدمات المصغرة بالعربية.
اكتب وصفاً احترافياً ومقنعاً لهذه الخدمة:

العنوان: ${title}
التخصص: ${category || 'عام'}
النقاط الرئيسية:
${points.map(p => `- ${p}`).join('\n')}

اكتب وصفاً جذاباً ومقنعاً يشجع العملاء على الشراء. استخدم emojis بشكل معتدل.
`);
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: result.error || 'فشل في توليد الوصف'
                });
            }
            
            res.json({
                success: true,
                aiEnabled: true,
                description: result.content
            });
            
        } catch (error) {
            console.error('Generate Description Error:', error);
            res.status(500).json({
                success: false,
                message: 'حدث خطأ في توليد الوصف'
            });
        }
    },

    /**
     * اقتراح عناوين للخدمة
     * POST /api/ai/suggest-titles
     */
    async suggestTitles(req, res) {
        try {
            const { type, specialty, count = 5 } = req.body;
            
            if (!type && !specialty) {
                return res.status(400).json({
                    success: false,
                    message: 'الرجاء تحديد نوع الخدمة أو التخصص'
                });
            }
            
            const category = specialty || type;
            
            if (!OpenRouterService.isConfigured()) {
                // Fallback: عناوين مقترحة
                const fallbackTitles = [
                    `سأقدم لك ${category} احترافي بجودة عالية`,
                    `${category} مميز - نتائج مضمونة 100%`,
                    `خدمة ${category} سريعة واحترافية`,
                    `${category} بأعلى جودة وأفضل سعر`,
                    `سأنفذ لك ${category} يفوق توقعاتك`
                ].slice(0, count);

                return res.json({
                    success: true,
                    aiEnabled: false,
                    titles: fallbackTitles
                });
            }
            
            const result = await OpenRouterService.generateContent(`
اقترح ${count} عناوين جذابة ومختصرة لخدمة مصغرة بالعربية.
نوع الخدمة: ${type || 'غير محدد'}
التخصص: ${specialty || 'عام'}

قواعد العناوين:
- ابدأ بـ "سأقدم" أو "سأصمم" أو "سأكتب" إلخ
- اجعلها جذابة ومقنعة
- لا تزيد عن 80 حرف لكل عنوان
- أرجع العناوين كـ JSON array فقط

مثال: ["سأصمم لك شعار احترافي", "سأكتب لك محتوى تسويقي"]
`);
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: result.error || 'فشل في اقتراح العناوين'
                });
            }
            
            // محاولة parse الـ JSON
            let titles = [];
            try {
                // استخراج JSON من النص
                const jsonMatch = result.content.match(/\[.*\]/s);
                if (jsonMatch) {
                    titles = JSON.parse(jsonMatch[0]);
                } else {
                    // إذا لم يكن JSON، حاول تقسيم النص
                    titles = result.content.split('\n').filter(t => t.trim()).slice(0, count);
                }
            } catch (e) {
                titles = result.content.split('\n').filter(t => t.trim()).slice(0, count);
            }
            
            res.json({
                success: true,
                aiEnabled: true,
                titles: titles
            });
            
        } catch (error) {
            console.error('Suggest Titles Error:', error);
            res.status(500).json({
                success: false,
                message: 'حدث خطأ في اقتراح العناوين'
            });
        }
    },
    
    /**
     * تحليل الملف الشخصي
     * POST /api/ai/analyze-profile
     */
    async analyzeProfile(req, res) {
        try {
            const { profile } = req.body;
            
            if (!profile) {
                return res.status(400).json({
                    success: false,
                    message: 'بيانات الملف الشخصي مطلوبة'
                });
            }
            
            // Fallback إذا AI غير مُفعّل
            if (!OpenRouterService.isConfigured()) {
                // تحليل بسيط بدون AI
                const score = calculateBasicScore(profile);
                return res.json({
                    success: true,
                    aiEnabled: false,
                    analysis: {
                        score: score,
                        strengths: getBasicStrengths(profile),
                        improvements: getBasicImprovements(profile),
                        tips: [
                            'أضف صورة شخصية احترافية',
                            'اكتب نبذة تعريفية مفصلة',
                            'أضف مهاراتك الرئيسية',
                            'أضف خدمات لملفك الشخصي'
                        ]
                    }
                });
            }
            
            // تحليل بالذكاء الاصطناعي
            const result = await OpenRouterService.generateContent(`
أنت خبير في تحسين الملفات الشخصية للفريلانسرز.
حلل الملف الشخصي التالي وأعطِ تقييماً شاملاً:

الاسم: ${profile.name || 'غير محدد'}
النبذة: ${profile.bio || 'لا توجد نبذة'}
المهارات: ${profile.skills?.join(', ') || 'لا توجد مهارات'}
عدد الخدمات: ${profile.servicesCount || 0}
عدد الطلبات المكتملة: ${profile.completedOrders || 0}
التقييم: ${profile.rating || 'لا يوجد تقييم'}
لديه صورة: ${profile.hasAvatar ? 'نعم' : 'لا'}

أرجع التحليل كـ JSON بالتنسيق التالي:
{
    "score": رقم من 0 إلى 100,
    "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
    "improvements": ["نقطة تحسين 1", "نقطة تحسين 2"],
    "tips": ["نصيحة 1", "نصيحة 2", "نصيحة 3"]
}

احرص على أن تكون النصائح عملية وقابلة للتنفيذ.
`);
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: result.error || 'فشل في تحليل الملف الشخصي'
                });
            }
            
            // محاولة parse الـ JSON
            let analysis;
            try {
                const jsonMatch = result.content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    analysis = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON found');
                }
            } catch (e) {
                // Fallback
                analysis = {
                    score: calculateBasicScore(profile),
                    strengths: getBasicStrengths(profile),
                    improvements: getBasicImprovements(profile),
                    tips: [result.content.substring(0, 200)]
                };
            }
            
            res.json({
                success: true,
                aiEnabled: true,
                analysis: analysis
            });
            
        } catch (error) {
            console.error('Analyze Profile Error:', error);
            res.status(500).json({
                success: false,
                message: 'حدث خطأ في تحليل الملف الشخصي'
            });
        }
    },
    
    /**
     * المطابقة الذكية للخدمات
     * POST /api/ai/match-services
     */
    async matchServices(req, res) {
        try {
            const { description, budget, category } = req.body;
            
            if (!description || description.trim().length < 10) {
                return res.status(400).json({
                    success: false,
                    message: 'يرجى وصف مشروعك بشكل أفضل (10 أحرف على الأقل)'
                });
            }
            
            // تحميل الخدمات من قاعدة البيانات
            const Service = require('../models/Service');
            const User = require('../models/User');
            
            // بناء query البحث
            let query = { status: 'active' };
            if (category) {
                query.category = category;
            }
            
            // جلب الخدمات مع البائعين
            const services = await Service.find(query)
                .populate('seller', 'fullName username avatarUrl rating completedOrders')
                .limit(50)
                .lean();
            
            if (services.length === 0) {
                return res.json({
                    success: true,
                    aiEnabled: false,
                    matches: [],
                    message: 'لا توجد خدمات متاحة حالياً'
                });
            }
            
            // تحليل الطلب بالـ AI إذا متاح
            let aiAnalysis = null;
            if (OpenRouterService.isConfigured()) {
                try {
                    const result = await OpenRouterService.generateContent(`
حلل طلب المشتري التالي وأرجع معلومات للمطابقة:

الطلب: "${description}"
${budget ? `الميزانية: ${budget} دولار` : ''}

أرجع JSON بالتنسيق:
{
    "keywords": ["كلمة1", "كلمة2"],
    "category": "design|programming|marketing|writing|video|other",
    "urgency": "low|medium|high",
    "complexity": "simple|medium|complex"
}
`);
                    if (result.success && result.content) {
                        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            aiAnalysis = JSON.parse(jsonMatch[0]);
                        }
                    }
                } catch (e) {
                    console.warn('AI analysis failed, using basic matching');
                }
            }
            
            // حساب نسبة التوافق لكل خدمة
            const matches = services.map(service => {
                const score = calculateMatchScore(service, description, budget, aiAnalysis);
                const reasons = getMatchReasons(service, description, budget, score);
                
                return {
                    service: {
                        id: service._id,
                        title: service.title,
                        description: service.description?.substring(0, 150) + '...',
                        price: service.price,
                        deliveryDays: service.deliveryDays,
                        category: service.category,
                        images: service.images?.slice(0, 1) || [],
                        rating: service.rating || 0,
                        ordersCount: service.ordersCount || 0
                    },
                    seller: service.seller ? {
                        id: service.seller._id,
                        name: service.seller.fullName,
                        username: service.seller.username,
                        avatar: service.seller.avatarUrl,
                        rating: service.seller.rating || 0
                    } : null,
                    matchScore: score,
                    matchReasons: reasons
                };
            });
            
            // ترتيب حسب نسبة التوافق
            matches.sort((a, b) => b.matchScore - a.matchScore);
            
            // إرجاع أفضل 10 نتائج
            const topMatches = matches.slice(0, 10).filter(m => m.matchScore > 20);
            
            res.json({
                success: true,
                aiEnabled: !!aiAnalysis,
                totalFound: services.length,
                matches: topMatches,
                analysis: aiAnalysis
            });
            
        } catch (error) {
            console.error('Match Services Error:', error);
            res.status(500).json({
                success: false,
                message: 'حدث خطأ في البحث عن الخدمات'
            });
        }
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function calculateBasicScore(profile) {
    let score = 0;
    if (profile.name) score += 10;
    if (profile.bio && profile.bio.length > 50) score += 20;
    if (profile.skills && profile.skills.length > 0) score += 15;
    if (profile.skills && profile.skills.length >= 3) score += 10;
    if (profile.hasAvatar) score += 15;
    if (profile.servicesCount > 0) score += 15;
    if (profile.completedOrders > 0) score += 10;
    if (profile.rating && profile.rating >= 4) score += 5;
    return Math.min(score, 100);
}

function getBasicStrengths(profile) {
    const strengths = [];
    if (profile.hasAvatar) strengths.push('لديك صورة شخصية');
    if (profile.bio && profile.bio.length > 50) strengths.push('نبذة تعريفية جيدة');
    if (profile.skills && profile.skills.length >= 3) strengths.push('مهارات متعددة');
    if (profile.completedOrders > 5) strengths.push('خبرة في المنصة');
    if (profile.rating >= 4.5) strengths.push('تقييم ممتاز');
    return strengths.length > 0 ? strengths : ['ملفك الشخصي قيد البناء'];
}

function getBasicImprovements(profile) {
    const improvements = [];
    if (!profile.hasAvatar) improvements.push('أضف صورة شخصية احترافية');
    if (!profile.bio || profile.bio.length < 50) improvements.push('اكتب نبذة تعريفية أطول');
    if (!profile.skills || profile.skills.length < 3) improvements.push('أضف المزيد من المهارات');
    if (profile.servicesCount === 0) improvements.push('أضف خدمات لملفك');
    return improvements;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Matching Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function calculateMatchScore(service, description, budget, aiAnalysis) {
    let score = 0;
    const descLower = description.toLowerCase();
    const titleLower = (service.title || '').toLowerCase();
    const serviceDescLower = (service.description || '').toLowerCase();
    
    // 1. تطابق العنوان والوصف (35 نقطة)
    const keywords = descLower.split(/\s+/).filter(w => w.length > 2);
    let keywordMatches = 0;
    keywords.forEach(keyword => {
        if (titleLower.includes(keyword) || serviceDescLower.includes(keyword)) {
            keywordMatches++;
        }
    });
    const keywordScore = keywords.length > 0 ? (keywordMatches / keywords.length) * 35 : 15;
    score += keywordScore;
    
    // 2. تطابق الميزانية (25 نقطة)
    if (budget && service.price) {
        if (service.price <= budget) {
            score += 25;
        } else if (service.price <= budget * 1.2) {
            score += 15; // قريب من الميزانية
        } else if (service.price <= budget * 1.5) {
            score += 5;
        }
    } else {
        score += 12; // لا توجد ميزانية محددة
    }
    
    // 3. تقييم البائع (20 نقطة)
    const rating = service.rating || service.seller?.rating || 0;
    score += (rating / 5) * 20;
    
    // 4. عدد الطلبات المكتملة (10 نقاط)
    const orders = service.ordersCount || 0;
    if (orders >= 20) score += 10;
    else if (orders >= 10) score += 7;
    else if (orders >= 5) score += 5;
    else if (orders >= 1) score += 3;
    
    // 5. مكافأة AI keywords إذا متوفرة (10 نقاط)
    if (aiAnalysis?.keywords) {
        let aiMatches = 0;
        aiAnalysis.keywords.forEach(kw => {
            if (titleLower.includes(kw.toLowerCase()) || serviceDescLower.includes(kw.toLowerCase())) {
                aiMatches++;
            }
        });
        score += aiMatches > 0 ? Math.min(10, aiMatches * 3) : 0;
    }
    
    return Math.round(Math.min(100, Math.max(0, score)));
}

function getMatchReasons(service, description, budget, score) {
    const reasons = [];
    
    // سبب التطابق الأساسي
    if (score >= 80) {
        reasons.push('✅ توافق ممتاز مع طلبك');
    } else if (score >= 60) {
        reasons.push('👍 توافق جيد مع متطلباتك');
    }
    
    // السعر
    if (budget && service.price) {
        if (service.price <= budget) {
            reasons.push('💰 ضمن ميزانيتك');
        } else if (service.price <= budget * 1.2) {
            reasons.push('💵 قريب من ميزانيتك');
        }
    }
    
    // التقييم
    const rating = service.rating || 0;
    if (rating >= 4.8) {
        reasons.push('⭐ تقييم ممتاز');
    } else if (rating >= 4.5) {
        reasons.push('⭐ تقييم جيد جداً');
    }
    
    // الخبرة
    const orders = service.ordersCount || 0;
    if (orders >= 20) {
        reasons.push('🏆 بائع موثوق');
    } else if (orders >= 5) {
        reasons.push('✓ لديه خبرة');
    }
    
    // وقت التسليم
    if (service.deliveryDays && service.deliveryDays <= 3) {
        reasons.push('⚡ تسليم سريع');
    }
    
    return reasons.slice(0, 4); // أقصى 4 أسباب
}

module.exports = AIController;
