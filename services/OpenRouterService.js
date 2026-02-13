/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ OPENROUTER SERVICE
 * منصة مشرق - خدمة OpenRouter للذكاء الاصطناعي
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * نقطة وصول موحدة لجميع نماذج AI عبر OpenRouter
 * النماذج المستخدمة (الأرخص):
 * - google/gemini-2.0-flash-exp (مجاني/رخيص جداً)
 * - deepseek/deepseek-r1-0528:free (مجاني)
 * - meta-llama/llama-3.3-70b-instruct:free (مجاني)
 * - openai/gpt-4o-mini (رخيص: $0.15/M input)
 */

const axios = require('axios');

class OpenRouterService {
    constructor() {
        this.baseURL = 'https://openrouter.ai/api/v1';
        this.apiKey = process.env.OPENROUTER_API_KEY;
        
        // النماذج المتاحة (GPT-4o-mini رخيص جداً والأكثر استقراراً)
        this.models = {
            // الافتراضي - رخيص وسريع ومستقر ($0.15/M input)
            free: 'openai/gpt-4o-mini',
            
            // للتفكير والتحليل
            reasoning: 'openai/gpt-4o-mini',
            
            // للمحادثات العامة
            chat: 'openai/gpt-4o-mini',
            
            // للبحث الذكي السريع
            flash: 'openai/gpt-4o-mini',
            
            // للمهام المعقدة
            smart: 'openai/gpt-4o-mini',
            
            // متميز - للمهام الحرجة فقط
            premium: 'openai/gpt-4o'
        };
        
        // الإعدادات الافتراضية
        this.defaultConfig = {
            temperature: 0.7,
            max_tokens: 1000,
            top_p: 0.9
        };
    }
    
    /**
     * التحقق من إعداد API Key
     */
    isConfigured() {
        return !!this.apiKey;
    }
    
    /**
     * إرسال طلب للنموذج
     */
    async chat(messages, options = {}) {
        if (!this.isConfigured()) {
            throw new Error('OpenRouter API key not configured');
        }
        
        const model = options.model || this.models.flash;
        const config = { ...this.defaultConfig, ...options };
        
        try {
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model,
                    messages,
                    temperature: config.temperature,
                    max_tokens: config.max_tokens,
                    top_p: config.top_p
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://mashriq.com',
                        'X-Title': 'Mashriq Platform'
                    }
                }
            );
            
            return {
                success: true,
                content: response.data.choices[0].message.content,
                model: response.data.model,
                usage: response.data.usage
            };
            
        } catch (error) {
            console.error('OpenRouter API Error:', error.response?.data || error.message);
            
            // Fallback للنموذج المجاني إذا فشل
            if (model !== this.models.free) {
                console.log('Falling back to free model...');
                return this.chat(messages, { ...options, model: this.models.free });
            }
            
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }
    
    /**
     * Alias for chat() - used by NoorController
     */
    async chatCompletion(messages, options = {}) {
        return this.chat(messages, options);
    }
    
    /**
     * البحث الذكي - تحويل استفسار المستخدم لـ query منظم
     * محسّن ليفهم العامية والفصحى ويطابق الفئات الفعلية
     */
    async smartSearch(userQuery, availableCategories = []) {
        // الفئات الافتراضية للمنصة
        const platformCategories = [
            { id: 'design', name: 'تصميم جرافيك', keywords: ['شعار', 'لوجو', 'logo', 'بانر', 'بوستر', 'كارت', 'هوية', 'تصميم'] },
            { id: 'writing', name: 'كتابة محتوى', keywords: ['مقال', 'محتوى', 'كتابة', 'نص', 'سكربت', 'وصف', 'مدونة', 'blog'] },
            { id: 'programming', name: 'برمجة', keywords: ['موقع', 'تطبيق', 'برمجة', 'website', 'app', 'كود', 'ووردبريس', 'متجر'] },
            { id: 'marketing', name: 'تسويق', keywords: ['تسويق', 'إعلان', 'سوشيال', 'ميديا', 'SEO', 'حملة', 'ترويج'] },
            { id: 'video', name: 'فيديو وأنيميشن', keywords: ['فيديو', 'موشن', 'انيميشن', 'مونتاج', 'يوتيوب', 'ريلز', 'إنترو'] },
            { id: 'translation', name: 'ترجمة', keywords: ['ترجمة', 'ترجم', 'انجليزي', 'عربي', 'فرنسي', 'translation'] },
            { id: 'voiceover', name: 'تعليق صوتي', keywords: ['صوت', 'تعليق', 'دبلجة', 'voiceover', 'بودكاست', 'اعلان صوتي'] },
            { id: 'business', name: 'أعمال', keywords: ['دراسة جدوى', 'بيزنس', 'استشارة', 'خطة', 'عمل', 'مشروع'] }
        ];

        const systemPrompt = `أنت مساعد بحث ذكي لمنصة "مشرق" للخدمات المصغرة (مثل Fiverr/Upwork للعرب).

## مهمتك:
تحليل استفسار المستخدم واستخراج معلومات البحث المنظمة.

## التخصصات المتاحة:
${platformCategories.map(c => `- ${c.id}: ${c.name} (${c.keywords.join(', ')})`).join('\n')}

## قواعد مهمة:
1. استخدم الكلمات المفتاحية الموجودة في استفسار المستخدم بالضبط (لا تترجم ولا تغير)
2. اختر category من التخصصات المتاحة فقط (استخدم الـ id بالإنجليزي)
3. إذا كان الاستفسار بالعامية، افهمه واستخرج المعنى
4. إذا لم تستطع تحديد التخصص، اترك category فارغ (null)
5. حدد نطاق سعر معقول بناءً على نوع الخدمة

## أمثلة:
- "عايز حد يصممل شعار" → keywords: ["شعار", "تصميم"], category: "design"
- "محتاج موقع ووردبريس" → keywords: ["موقع", "ووردبريس"], category: "programming"
- "ابغى ترجمة مقال" → keywords: ["ترجمة", "مقال"], category: "translation"
- "design logo" → keywords: ["design", "logo"], category: "design"

## الرد:
رد بـ JSON فقط بالشكل التالي:
{
  "keywords": ["الكلمات من استفسار المستخدم"],
  "category": "id التخصص من القائمة أو null",
  "priceRange": { "min": 5, "max": 50 },
  "intent": "ما يريده المستخدم بوضوح"
}`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `استفسار البحث: "${userQuery}"` }
        ];
        
        const result = await this.chat(messages, {
            model: this.models.flash,
            temperature: 0.2,  // أقل للدقة
            max_tokens: 400
        });
        
        if (!result.success) {
            // Fallback: استخراج بسيط من الاستفسار
            return this._fallbackSearch(userQuery, platformCategories);
        }
        
        try {
            const jsonMatch = result.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                
                // التحقق من صحة التخصص
                if (parsed.category && !platformCategories.find(c => c.id === parsed.category)) {
                    parsed.category = this._matchCategory(userQuery, platformCategories);
                }
                
                // التأكد من وجود keywords
                if (!parsed.keywords || parsed.keywords.length === 0) {
                    parsed.keywords = userQuery.split(/\s+/).filter(w => w.length > 2);
                }
                
                return { success: true, data: parsed };
            }
            return this._fallbackSearch(userQuery, platformCategories);
        } catch (e) {
            return this._fallbackSearch(userQuery, platformCategories);
        }
    }
    
    /**
     * Fallback البحث البسيط
     */
    _fallbackSearch(query, categories) {
        const keywords = query.split(/\s+/).filter(w => w.length > 2);
        const category = this._matchCategory(query, categories);
        
        return {
            success: true,
            data: {
                keywords,
                category,
                priceRange: { min: 5, max: 100 },
                intent: query
            }
        };
    }
    
    /**
     * مطابقة التخصص بناءً على الكلمات المفتاحية
     */
    _matchCategory(query, categories) {
        const lowerQuery = query.toLowerCase();
        
        for (const cat of categories) {
            for (const keyword of cat.keywords) {
                if (lowerQuery.includes(keyword.toLowerCase())) {
                    return cat.id;
                }
            }
        }
        
        return null;
    }
    
    /**
     * كتابة عرض ذكي للبائع
     */
    async writeProposal(jobDescription, sellerProfile) {
        const systemPrompt = `أنت كاتب عروض محترف على منصة فريلانس عربية.
اكتب عرضاً مقنعاً وموجزاً (150 كلمة كحد أقصى) يتضمن:
1. فهم واضح لمتطلبات العميل
2. خبرة البائع المناسبة
3. طريقة العمل المقترحة
4. سبب اختيار هذا البائع

اكتب بأسلوب احترافي ودود.`;

        const userPrompt = `وصف المشروع:
${jobDescription}

معلومات البائع:
${JSON.stringify(sellerProfile, null, 2)}

اكتب العرض:`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];
        
        return this.chat(messages, {
            model: this.models.chat,
            temperature: 0.7,
            max_tokens: 400
        });
    }
    
    /**
     * تحسين البروفايل
     */
    async improveProfile(currentProfile) {
        const systemPrompt = `أنت خبير في تحسين ملفات البائعين على منصات الفريلانس.
حلل الملف الحالي واقترح تحسينات لـ:
1. العنوان (headline) - أقل من 80 حرف
2. الوصف (bio) - أقل من 300 كلمة
3. المهارات (skills) - 5-10 مهارات

رد بـ JSON:
{
  "headline": "العنوان المحسن",
  "bio": "الوصف المحسن",
  "skills": ["مهارة1", "مهارة2"],
  "tips": ["نصيحة1", "نصيحة2"]
}`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `الملف الحالي:\n${JSON.stringify(currentProfile, null, 2)}` }
        ];
        
        const result = await this.chat(messages, {
            model: this.models.chat,
            temperature: 0.6,
            max_tokens: 600
        });
        
        if (!result.success) return result;
        
        try {
            const jsonMatch = result.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return { success: true, data: JSON.parse(jsonMatch[0]) };
            }
            return { success: false, error: 'Invalid response format' };
        } catch (e) {
            return { success: false, error: 'Failed to parse response' };
        }
    }
    
    /**
     * اقتراح رد سريع في الشات
     */
    async suggestReply(conversationContext, lastMessage) {
        const systemPrompt = `أنت مساعد محادثات على منصة فريلانس.
اقترح 3 ردود قصيرة ومناسبة للرسالة الأخيرة.
رد بـ JSON: { "replies": ["رد1", "رد2", "رد3"] }`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `السياق: ${conversationContext}\n\nالرسالة الأخيرة: ${lastMessage}` }
        ];
        
        const result = await this.chat(messages, {
            model: this.models.free,
            temperature: 0.8,
            max_tokens: 200
        });
        
        if (!result.success) return result;
        
        try {
            const jsonMatch = result.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return { success: true, data: JSON.parse(jsonMatch[0]) };
            }
            return { success: false, error: 'Invalid response format' };
        } catch (e) {
            return { success: true, data: { replies: [result.content] } };
        }
    }
    
    /**
     * توليد محتوى عام (نص حر)
     * @param {string} prompt - النص المطلوب توليده
     * @param {Object} options - إعدادات إضافية
     */
    async generateContent(prompt, options = {}) {
        if (!this.isConfigured()) {
            return { success: false, error: 'AI غير مفعّل' };
        }
        
        try {
            const result = await this.chat([
                { role: 'user', content: prompt }
            ], {
                temperature: options.temperature || 0.7,
                max_tokens: options.max_tokens || 1500
            });
            
            return result;
        } catch (error) {
            console.error('Generate Content Error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Singleton instance
const openRouterService = new OpenRouterService();

module.exports = openRouterService;
