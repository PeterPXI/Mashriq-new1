/* ========================================
   Mashriq (مشرق) - AI Service
   ========================================
   
   PURPOSE:
   AI-powered features. Currently running in mock mode.
   To enable real AI, install openai package and set OPENAI_API_KEY.
   
   ======================================== */

// Initialize OpenAI client if package exists and API key is set
let openai = null;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here') {
    try {
        const OpenAI = require('openai');
        openai = new OpenAI({ apiKey: OPENAI_API_KEY });
        console.log('✅ AI Service: OpenAI initialized');
    } catch (err) {
        console.log('ℹ️ AI Service: OpenAI package not installed, running in mock mode');
    }
} else {
    console.log('ℹ️ AI Service: Running in mock mode (no API key)');
}

/**
 * Check if AI is enabled
 */
function isEnabled() {
    return openai !== null;
}

/**
 * Smart search - convert natural language to search query
 */
async function smartSearch(query, categories = []) {
    if (!openai) {
        // Mock response
        return {
            keywords: query.split(' ').filter(w => w.length > 2),
            suggestedCategory: categories[0] || null,
            intent: 'search'
        };
    }
    
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `أنت مساعد ذكي لمنصة خدمات مصغرة عربية. حلل طلب البحث وأرجع JSON بالشكل التالي:
{
  "keywords": ["كلمة1", "كلمة2"],
  "suggestedCategory": "الفئة المناسبة",
  "intent": "search|question|request"
}`
                },
                { role: 'user', content: query }
            ],
            temperature: 0.3,
            max_tokens: 200
        });
        
        const content = response.choices[0]?.message?.content || '{}';
        return JSON.parse(content);
    } catch (err) {
        console.error('AI smartSearch error:', err);
        return {
            keywords: query.split(' ').filter(w => w.length > 2),
            suggestedCategory: null,
            intent: 'search'
        };
    }
}

/**
 * Generate professional service description
 */
async function generateServiceDescription({ title, category, points }) {
    if (!openai) {
        // Mock response
        return `${title}\n\nأقدم لكم خدمة احترافية في مجال ${category || 'الخدمات'}.\n\n${points.map(p => `✓ ${p}`).join('\n')}\n\nتواصل معي الآن للحصول على أفضل النتائج!`;
    }
    
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'أنت كاتب محترف متخصص في كتابة أوصاف الخدمات المصغرة بالعربية. اكتب وصفاً احترافياً ومقنعاً.'
                },
                {
                    role: 'user',
                    content: `اكتب وصفاً احترافياً لخدمة:\nالعنوان: ${title}\nالفئة: ${category || 'عام'}\nالنقاط الرئيسية:\n${points.map(p => `- ${p}`).join('\n')}`
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        });
        
        return response.choices[0]?.message?.content || '';
    } catch (err) {
        console.error('AI generateDescription error:', err);
        throw new Error('فشل في توليد الوصف');
    }
}

/**
 * Suggest service titles
 */
async function suggestServiceTitles({ type, specialty, notes }, count = 5) {
    if (!openai) {
        // Mock response
        return [
            `${specialty || type} احترافي`,
            `خدمة ${specialty || type} بجودة عالية`,
            `${specialty || type} - نتائج مضمونة`,
            `أفضل ${specialty || type} بأسعار منافسة`,
            `${specialty || type} سريع ومميز`
        ].slice(0, count);
    }
    
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `اقترح ${count} عناوين جذابة ومختصرة لخدمة مصغرة بالعربية. أرجع JSON array فقط.`
                },
                {
                    role: 'user',
                    content: `نوع الخدمة: ${type || 'غير محدد'}\nالتخصص: ${specialty || 'عام'}\nملاحظات: ${notes || 'لا يوجد'}`
                }
            ],
            temperature: 0.8,
            max_tokens: 300
        });
        
        const content = response.choices[0]?.message?.content || '[]';
        return JSON.parse(content);
    } catch (err) {
        console.error('AI suggestTitles error:', err);
        throw new Error('فشل في اقتراح العناوين');
    }
}

/**
 * Improve seller profile
 */
async function improveProfile({ bio, skills, specialty }) {
    if (!openai) {
        // Mock response
        return {
            improvedBio: bio ? `${bio}\n\nأسعى دائماً لتقديم أفضل جودة لعملائي.` : 'مقدم خدمات محترف متخصص في تقديم حلول عالية الجودة.',
            suggestions: [
                'أضف المزيد من التفاصيل عن خبراتك',
                'اذكر الإنجازات والمشاريع السابقة',
                'حدد تخصصك بشكل أوضح'
            ]
        };
    }
    
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'أنت مستشار مهني يساعد في تحسين الملفات الشخصية للمستقلين. أرجع JSON بالشكل: {"improvedBio": "...", "suggestions": ["..."]}'
                },
                {
                    role: 'user',
                    content: `حسّن هذا الملف:\nالوصف: ${bio || 'لا يوجد'}\nالمهارات: ${skills?.join(', ') || 'لا يوجد'}\nالتخصص: ${specialty || 'عام'}`
                }
            ],
            temperature: 0.6,
            max_tokens: 400
        });
        
        const content = response.choices[0]?.message?.content || '{}';
        return JSON.parse(content);
    } catch (err) {
        console.error('AI improveProfile error:', err);
        throw new Error('فشل في تحسين الملف');
    }
}

/**
 * Get order tips
 */
async function getOrderTips(service) {
    if (!openai) {
        // Mock response
        return [
            'حدد متطلباتك بوضوح منذ البداية',
            'أرفق أمثلة إن وجدت',
            'حدد الموعد النهائي المطلوب',
            'كن متاحاً للرد على استفسارات البائع'
        ];
    }
    
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'قدم نصائح مختصرة للمشتري لطلب هذه الخدمة. أرجع JSON array من النصائح.'
                },
                {
                    role: 'user',
                    content: `الخدمة: ${service.title}\nالوصف: ${service.description?.substring(0, 200) || ''}`
                }
            ],
            temperature: 0.5,
            max_tokens: 200
        });
        
        const content = response.choices[0]?.message?.content || '[]';
        return JSON.parse(content);
    } catch (err) {
        console.error('AI getOrderTips error:', err);
        return ['حدد متطلباتك بوضوح', 'كن متاحاً للتواصل'];
    }
}

/**
 * Generate FAQs for a service
 */
async function generateFAQs({ title, description, basePrice, deliveryDays }) {
    if (!openai) {
        // Mock response
        return [
            { question: 'ما هي مدة التسليم؟', answer: `مدة التسليم ${deliveryDays || 3} أيام.` },
            { question: 'هل يمكن طلب تعديلات؟', answer: 'نعم، أقدم تعديلات مجانية حسب الاتفاق.' },
            { question: 'كيف يتم التواصل؟', answer: 'عبر الرسائل في المنصة.' }
        ];
    }
    
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'أنشئ 5 أسئلة شائعة مع إجاباتها لهذه الخدمة. أرجع JSON array: [{"question": "...", "answer": "..."}]'
                },
                {
                    role: 'user',
                    content: `الخدمة: ${title}\nالوصف: ${description || ''}\nالسعر: ${basePrice}$\nمدة التسليم: ${deliveryDays} أيام`
                }
            ],
            temperature: 0.6,
            max_tokens: 500
        });
        
        const content = response.choices[0]?.message?.content || '[]';
        return JSON.parse(content);
    } catch (err) {
        console.error('AI generateFAQs error:', err);
        return [];
    }
}

/**
 * Analyze and suggest pricing
 */
async function analyzePricing({ title, category }, similarServices = []) {
    const prices = similarServices.map(s => s.basePrice).filter(p => p > 0);
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 25;
    
    if (!openai) {
        // Mock response
        return {
            suggested: avgPrice,
            range: {
                min: Math.round(avgPrice * 0.7),
                max: Math.round(avgPrice * 1.5)
            },
            analysis: `بناءً على ${prices.length} خدمة مشابهة، السعر المقترح هو $${avgPrice}`
        };
    }
    
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'حلل الأسعار واقترح سعراً مناسباً. أرجع JSON: {"suggested": number, "range": {"min": number, "max": number}, "analysis": "..."}'
                },
                {
                    role: 'user',
                    content: `الخدمة: ${title}\nالفئة: ${category}\nأسعار المنافسين: ${prices.join(', ') || 'غير متوفرة'}$`
                }
            ],
            temperature: 0.4,
            max_tokens: 200
        });
        
        const content = response.choices[0]?.message?.content || '{}';
        return JSON.parse(content);
    } catch (err) {
        console.error('AI analyzePricing error:', err);
        return {
            suggested: avgPrice,
            range: { min: Math.round(avgPrice * 0.7), max: Math.round(avgPrice * 1.5) },
            analysis: 'تحليل تلقائي'
        };
    }
}

module.exports = {
    isEnabled,
    smartSearch,
    generateServiceDescription,
    suggestServiceTitles,
    improveProfile,
    getOrderTips,
    generateFAQs,
    analyzePricing
};
