/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ NOOR AI SERVICE — نموذج واحد مضمون
 * يستخدم openai/gpt-4o-mini عبر OpenRouter (نفس نموذج الصفحة الرئيسية)
 * ═══════════════════════════════════════════════════════════════════════════
 */

const axios = require('axios');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-4o-mini'; // نفس النموذج المستخدم في الصفحة الرئيسية — مضمون

class GeminiService {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY;

        if (this.apiKey) {
            console.log('✅ Noor AI initialized — openai/gpt-4o-mini via OpenRouter');
        } else {
            console.warn('⚠️ OPENROUTER_API_KEY not set — Noor AI disabled');
        }
    }

    isConfigured() {
        return !!this.apiKey;
    }

    /**
     * Main chat method — بسيط ومباشر، نموذج واحد فقط
     */
    async chat(messages, options = {}) {
        if (!this.isConfigured()) {
            return { success: false, error: 'AI غير مفعّل — OPENROUTER_API_KEY غير موجود' };
        }

        try {
            const response = await axios.post(OPENROUTER_URL, {
                model: MODEL,
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                temperature: options.temperature || 0.7,
                max_tokens: options.max_tokens || 1024,
                top_p: options.top_p || 0.9,
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://mashriq.com',
                    'X-Title': 'Mashriq Noor AI',
                },
                timeout: 15000, // 15 ثانية كحد أقصى
            });

            const text = response.data?.choices?.[0]?.message?.content;

            if (!text) {
                throw new Error('Empty response from OpenRouter');
            }

            console.log('✅ Noor AI responded successfully via OpenRouter');
            return { success: true, content: text, model: MODEL };

        } catch (error) {
            console.error('❌ Noor AI error:', error.message);
            return {
                success: false,
                error: `خطأ: ${error.message}`,
            };
        }
    }

    async chatCompletion(messages, options = {}) {
        return this.chat(messages, options);
    }

    async generateContent(prompt, options = {}) {
        if (!this.isConfigured()) {
            return { success: false, error: 'AI غير مفعّل' };
        }
        return this.chat(
            [{ role: 'user', content: prompt }],
            { temperature: options.temperature || 0.7, max_tokens: options.max_tokens || 1200 }
        );
    }
}

const geminiService = new GeminiService();
module.exports = geminiService;
