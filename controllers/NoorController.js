/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NOOR AI HUB CONTROLLER
 * منصة مشرق - متحكم نور للذكاء الاصطناعي الشامل
 * ═══════════════════════════════════════════════════════════════════════════
 */

const GeminiService = require('../services/GeminiService');
const User = require('../models/User');

// ─────────────────────────────────────────────────────────────────────────────
// USAGE LIMITS BY PLAN
// ─────────────────────────────────────────────────────────────────────────────

const PLAN_LIMITS = {
    free: {
        dailyChat: 10,
        monthlyProposals: 3,
        monthlyContent: 5,
        socialMedia: false,
        analytics: false
    },
    pro: {
        dailyChat: -1, // unlimited
        monthlyProposals: -1,
        monthlyContent: -1,
        socialMedia: true,
        analytics: true
    },
    business: {
        dailyChat: -1,
        monthlyProposals: -1,
        monthlyContent: -1,
        socialMedia: true,
        analytics: true,
        apiAccess: true
    }
};

// NOOR PERSONA — System Prompt مُحسّن (ترويجي + مختصر)
const NOOR_PERSONA = `أنتِ "نور" 🌟 — مستشارة ذكاء اصطناعي متخصصة في العمل الحر والمال، وأنتِ الميزة الحصرية لمنصة "مشرق" العربية.

## شخصيتك:
- خبيرة بـ 10+ سنوات في العمل الحر الرقمي والاستشارات المالية
- تتحدثين بعربية فصحى بسيطة وودية، وتفهمين العامية (المصرية، الخليجية، المغاربية)
- تستخدمين الإيموجي بذكاء 🎯، صريحة ومباشرة — مرشدة أعمال ناجحة تتحدث لصديقها
- تقدمين نصائح عملية مع أمثلة حقيقية وخطوات واضحة

## تخصصاتك:
- بناء ملف شخصي يجذب العملاء (العنوان، النبذة، البورتفوليو)
- كتابة عروض احترافية (Proposals): فهم المشروع → الحل → لماذا أنا → الجدول الزمني → CTA
- تسعير الخدمات بذكاء (بالقيمة، بالمشروع، بالساعة) + نظام الباقات الثلاث
- التعامل مع أنواع العملاء (المتردد، طالب التخفيض، المتغير)
- إدارة الدخل (قاعدة 50/30/20) وتنويع مصادر الدخل
- كتابة محتوى تسويقي وسوشيال ميديا (صيغة AIDA)

## منصة مشرق — لماذا هي الأفضل:
مشرق هي المنصة العربية الأولى للخدمات الرقمية (تصميم، برمجة، كتابة، تسويق، ترجمة، فيديو) وتتميز بـ:
- 🔒 **نظام إسكرو آمن**: أموالك محمية حتى تستلم العمل وتوافق عليه
- ⭐ **نظام تقييمات شفاف**: من 1-5 نجوم لبناء سمعتك المهنية
- 📈 **مستويات بائع**: جديد → موثوق → متميز → خبير (كلما ارتقيت زادت فرصك)
- 🤖 **نور AI (أنا!)**: مساعدتك الذكية الحصرية — أساعدك بكتابة العروض وتحسين ملفك وتسعير خدماتك
- 🎁 **نظام الإحالة**: ادعُ أصدقاءك واكسب مكافآت على كل إحالة ناجحة
- 💬 **رسائل مباشرة**: تواصل سهل وآمن بين البائع والمشتري
- 💰 **محفظة رقمية**: شحن رصيد وسحب أرباح بسهولة

## أسلوبك في الرد:
- أعطي خطوات عملية مرقمة مع أمثلة حقيقية
- نظّمي الإجابات بعناوين وقوائم واضحة
- كوني مختصرة ومفيدة — لا حشو
- عند المناسبة، ذكّري بمميزات مشرق بشكل طبيعي (مثلاً: "استخدم نظام الباقات الثلاث على مشرق لتعظيم أرباحك")
- شجّعي المستخدم على استخدام أدوات المنصة (نظام الإحالة، البورتفوليو، التقييمات)

## حدودك:
- ❌ لا تجيبي خارج العمل الحر والمال والتسويق: "تخصصي العمل الحر والمال 😊 كيف أساعدك في مسيرتك المهنية؟"
- ❌ لا نصائح قانونية أو ضريبية محددة — وجّهي لمختص
- ❌ لا تذكري منصات منافسة بالاسم
- ✅ إذا لم تعرفي: "سؤال ممتاز! أنصحك بـ [مصدر محدد]"`;


// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

async function getUserUsage(userId) {
    const user = await User.findById(userId);
    if (!user) return null;
    
    const plan = user.aiPlan || 'free';
    const limits = PLAN_LIMITS[plan];
    
    // Check daily reset
    const today = new Date().toDateString();
    const lastReset = new Date(user.aiChatLastReset || Date.now()).toDateString();
    
    if (today !== lastReset) {
        user.aiChatUsageToday = 0;
        user.aiChatLastReset = new Date();
        await user.save();
    }
    
    // Check monthly reset
    const thisMonth = new Date().getMonth();
    const lastMonthReset = new Date(user.aiMonthlyLastReset || Date.now()).getMonth();
    
    if (thisMonth !== lastMonthReset) {
        user.aiProposalsThisMonth = 0;
        user.aiContentThisMonth = 0;
        user.aiMonthlyLastReset = new Date();
        await user.save();
    }
    
    return {
        plan,
        limits,
        usage: {
            chatToday: user.aiChatUsageToday || 0,
            proposalsThisMonth: user.aiProposalsThisMonth || 0,
            contentThisMonth: user.aiContentThisMonth || 0
        },
        remaining: {
            chat: limits.dailyChat === -1 ? -1 : Math.max(0, limits.dailyChat - (user.aiChatUsageToday || 0)),
            proposals: limits.monthlyProposals === -1 ? -1 : Math.max(0, limits.monthlyProposals - (user.aiProposalsThisMonth || 0)),
            content: limits.monthlyContent === -1 ? -1 : Math.max(0, limits.monthlyContent - (user.aiContentThisMonth || 0))
        }
    };
}

async function canUseFeature(userId, feature) {
    const usage = await getUserUsage(userId);
    if (!usage) return { allowed: false, reason: 'مستخدم غير موجود' };
    
    switch (feature) {
        case 'chat':
            if (usage.remaining.chat === 0) {
                return { allowed: false, reason: 'لقد استنفدت حد الرسائل اليومي. قم بالترقية لـ Pro!' };
            }
            return { allowed: true };
        case 'proposal':
            if (usage.remaining.proposals === 0) {
                return { allowed: false, reason: 'لقد استنفدت حد العروض الشهري. قم بالترقية لـ Pro!' };
            }
            return { allowed: true };
        case 'content':
            if (usage.remaining.content === 0) {
                return { allowed: false, reason: 'لقد استنفدت حد المحتوى الشهري. قم بالترقية لـ Pro!' };
            }
            return { allowed: true };
        case 'social':
            if (!usage.limits.socialMedia) {
                return { allowed: false, reason: 'ميزة السوشيال ميديا متاحة فقط في خطة Pro!' };
            }
            return { allowed: true };
        default:
            return { allowed: true };
    }
}

async function incrementUsage(userId, feature) {
    const update = {};
    switch (feature) {
        case 'chat': update.$inc = { aiChatUsageToday: 1 }; break;
        case 'proposal': update.$inc = { aiProposalsThisMonth: 1 }; break;
        case 'content': update.$inc = { aiContentThisMonth: 1 }; break;
    }
    if (Object.keys(update).length > 0) {
        await User.findByIdAndUpdate(userId, update);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

const NoorController = {
    
    // GET /api/noor/usage
    async getUsage(req, res) {
        try {
            if (!req.user) {
                return res.json({ success: true, isGuest: true, plan: 'free' });
            }
            const usage = await getUserUsage(req.user._id);
            res.json({ success: true, ...usage });
        } catch (error) {
            console.error('Get Usage Error:', error);
            res.status(500).json({ success: false, message: 'حدث خطأ' });
        }
    },
    
    // POST /api/noor/chat
    async chat(req, res) {
        try {
            const { message, conversationHistory = [] } = req.body;
            
            if (!message || message.trim().length < 2) {
                return res.status(400).json({ success: false, message: 'الرجاء إدخال رسالة صالحة' });
            }
            
            // Check limit
            if (req.user) {
                const check = await canUseFeature(req.user._id, 'chat');
                if (!check.allowed) {
                    return res.status(403).json({ success: false, limitReached: true, message: check.reason });
                }
            }
            
            if (!GeminiService.isConfigured()) {
                return res.json({
                    success: true,
                    aiEnabled: false,
                    response: 'مرحباً! أنا نور 🌟 مساعدتك المتخصصة في العمل الحر وعالم المال. كيف يمكنني مساعدتك اليوم؟'
                });
            }
            
            const messages = [
                { role: 'system', content: NOOR_PERSONA },
                ...conversationHistory.slice(-6).map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: message }
            ];
            
            const result = await GeminiService.chatCompletion(messages);
            
            if (!result.success) {
                return res.json({ success: true, aiEnabled: false, response: 'عذراً، حدث خطأ. حاول مرة أخرى.' });
            }
            
            if (req.user) await incrementUsage(req.user._id, 'chat');
            
            res.json({ success: true, aiEnabled: true, response: result.content });
            
        } catch (error) {
            console.error('Noor Chat Error:', error);
            res.status(500).json({ success: false, message: 'حدث خطأ في المحادثة' });
        }
    },
    
    // POST /api/noor/proposal
    async generateProposal(req, res) {
        try {
            const { projectTitle, projectDescription, price, deliveryDays, features = [], experience = '' } = req.body;
            
            if (!projectTitle || !projectDescription) {
                return res.status(400).json({ success: false, message: 'عنوان ووصف المشروع مطلوبان' });
            }
            
            if (req.user) {
                const check = await canUseFeature(req.user._id, 'proposal');
                if (!check.allowed) {
                    return res.status(403).json({ success: false, limitReached: true, message: check.reason });
                }
            }
            
            if (!GeminiService.isConfigured()) {
                return res.status(503).json({ success: false, message: 'خدمة AI غير متاحة حالياً' });
            }
            
            const prompt = `اكتب عرضاً احترافياً مقنعاً للمشروع التالي:

عنوان المشروع: ${projectTitle}
وصف المشروع: ${projectDescription}
السعر: ${price || 'غير محدد'} دولار
مدة التنفيذ: ${deliveryDays || 'غير محددة'} يوم
${features.length > 0 ? `المميزات: ${features.join('، ')}` : ''}
${experience ? `خبرتي: ${experience}` : ''}

اكتب: 1. تحية جذابة 2. فهمي للمشروع 3. لماذا أنا الأنسب 4. خطة التنفيذ 5. ما سيحصل عليه العميل 6. دعوة اتخاذ القرار`;

            const result = await GeminiService.generateContent(prompt);
            
            if (!result.success) {
                return res.status(500).json({ success: false, message: 'فشل إنشاء العرض' });
            }
            
            if (req.user) await incrementUsage(req.user._id, 'proposal');
            
            res.json({ success: true, proposal: result.content });
            
        } catch (error) {
            console.error('Generate Proposal Error:', error);
            res.status(500).json({ success: false, message: 'حدث خطأ في إنشاء العرض' });
        }
    },
    
    // POST /api/noor/content
    async generateContent(req, res) {
        try {
            const { type, topic, tone = 'professional', platform = 'general', length = 'medium' } = req.body;
            
            if (!type || !topic) {
                return res.status(400).json({ success: false, message: 'نوع المحتوى والموضوع مطلوبان' });
            }
            
            if (req.user) {
                const check = await canUseFeature(req.user._id, 'content');
                if (!check.allowed) {
                    return res.status(403).json({ success: false, limitReached: true, message: check.reason });
                }
            }
            
            if (!GeminiService.isConfigured()) {
                return res.status(503).json({ success: false, message: 'خدمة AI غير متاحة حالياً' });
            }
            
            const types = { 'social-post': 'منشور سوشيال', 'article': 'مقالة', 'email': 'بريد إلكتروني', 'ad': 'إعلان', 'bio': 'نبذة تعريفية' };
            const platforms = { 'instagram': 'إنستغرام', 'twitter': 'تويتر', 'linkedin': 'لينكد إن', 'general': 'عام' };
            const tones = { 'professional': 'احترافي', 'casual': 'ودي', 'funny': 'مرح', 'inspiring': 'ملهم' };
            
            const prompt = `اكتب ${types[type] || type} عن: ${topic}
المنصة: ${platforms[platform] || platform}
الأسلوب: ${tones[tone] || tone}
الطول: ${length === 'short' ? 'قصير' : length === 'long' ? 'طويل' : 'متوسط'}
استخدم الإيموجي المناسبة. أضف CTA في النهاية.`;

            const result = await GeminiService.generateContent(prompt);
            
            if (!result.success) {
                return res.status(500).json({ success: false, message: 'فشل إنشاء المحتوى' });
            }
            
            if (req.user) await incrementUsage(req.user._id, 'content');
            
            res.json({ success: true, content: result.content });
            
        } catch (error) {
            console.error('Generate Content Error:', error);
            res.status(500).json({ success: false, message: 'حدث خطأ في إنشاء المحتوى' });
        }
    },
    
    // GET /api/noor/features
    async getFeatures(req, res) {
        try {
            const plan = req.user?.aiPlan || 'free';
            const limits = PLAN_LIMITS[plan];
            
            const features = [
                { id: 'chat', name: '💬 الشات العام', description: 'تحدث مع نور', available: true, limit: limits.dailyChat === -1 ? 'غير محدود' : `${limits.dailyChat}/يوم` },
                { id: 'proposal', name: '✍️ كاتب العروض', description: 'إنشاء عروض احترافية', available: true, limit: limits.monthlyProposals === -1 ? 'غير محدود' : `${limits.monthlyProposals}/شهر` },
                { id: 'content', name: '📝 كاتب المحتوى', description: 'محتوى سوشيال ومقالات', available: true, limit: limits.monthlyContent === -1 ? 'غير محدود' : `${limits.monthlyContent}/شهر` },
                { id: 'social', name: '📱 إدارة السوشيال', description: 'أدوات متقدمة', available: limits.socialMedia, limit: limits.socialMedia ? 'متاح' : 'Pro فقط' },
                { id: 'analytics', name: '📊 التحليلات', description: 'تحليل أدائك', available: limits.analytics, limit: limits.analytics ? 'متاح' : 'Pro فقط' }
            ];
            
            res.json({ success: true, plan, features });
            
        } catch (error) {
            console.error('Get Features Error:', error);
            res.status(500).json({ success: false, message: 'حدث خطأ' });
        }
    },
    
    // GET /api/noor/welcome (للتوافق مع الإصدار القديم)
    welcome(req, res) {
        const userName = req.user?.fullName || 'صديقي';
        res.json({
            success: true,
            message: `مرحباً ${userName}! 🌟 أنا نور، مساعدتك الذكية. كيف يمكنني مساعدتك اليوم؟`,
            suggestions: [
                '✍️ ساعدني في كتابة عرض',
                '📝 اكتب لي محتوى سوشيال',
                '💡 نصائح للعمل الحر',
                '🎯 حلل ملفي الشخصي'
            ]
        });
    }
};

module.exports = NoorController;
module.exports.PLAN_LIMITS = PLAN_LIMITS;
