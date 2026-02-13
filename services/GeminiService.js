/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ GEMINI SERVICE (مع OpenRouter Fallback)
 * منصة مشرق - خدمة AI المتخصصة لنور
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * الترتيب:
 * 1. Gemini 2.0 Flash (الأقوى مجاناً)
 * 2. Gemini 1.5 Flash (بديل)
 * 3. OpenRouter Free Models (fallback نهائي: DeepSeek, Llama, Qwen)
 */

const axios = require('axios');

// ═══════════════════════════════════════════
// ← النماذج المتاحة
// ═══════════════════════════════════════════

const GEMINI_MODELS = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
];

// نماذج OpenRouter  المجانية (fallback)
const OPENROUTER_FREE_MODELS = [
    'deepseek/deepseek-r1:free',
    'google/gemini-2.0-flash-lite-preview-02-05:free', // New fast model
    'meta-llama/llama-3.3-70b-instruct:free',
];

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';

class GeminiService {
    constructor() {
        this.geminiKey = process.env.GEMINI_API_KEY;
        this.openrouterKey = process.env.OPENROUTER_API_KEY;

        if (this.geminiKey) {
            console.log('✅ Gemini AI initialized (Noor primary)');
        }
        if (this.openrouterKey) {
            console.log('✅ OpenRouter initialized (Noor fallback)');
        }
        if (!this.geminiKey && !this.openrouterKey) {
            console.log('⚠️ No AI keys set — Noor will use static responses');
        }
    }

    isConfigured() {
        return !!(this.geminiKey || this.openrouterKey);
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ═══════════════════════════════════════════
    // ← Gemini REST API Call
    // ═══════════════════════════════════════════

    async _callGemini(modelName, messages, options = {}) {
        const systemMessage = messages.find(m => m.role === 'system');
        const chatMessages = messages.filter(m => m.role !== 'system');

        const body = {
            contents: chatMessages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            })),
            generationConfig: {
                temperature: options.temperature || 0.7,
                maxOutputTokens: options.max_tokens || 1500,
                topP: options.top_p || 0.9,
            },
        };

        if (systemMessage) {
            body.systemInstruction = {
                parts: [{ text: systemMessage.content }],
            };
        }

        const url = `${GEMINI_BASE}/${modelName}:generateContent?key=${this.geminiKey}`;
        const response = await axios.post(url, body, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000, // Reduced from 30s
        });

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Empty Gemini response');
        return text;
    }

    // ═══════════════════════════════════════════
    // ← OpenRouter API Call (Fallback)
    // ═══════════════════════════════════════════

    async _callOpenRouter(modelName, messages, options = {}) {
        const response = await axios.post(OPENROUTER_BASE, {
            model: modelName,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            temperature: options.temperature || 0.7,
            max_tokens: options.max_tokens || 1500,
        }, {
            headers: {
                'Authorization': `Bearer ${this.openrouterKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://mashriq.com',
                'X-Title': 'Mashriq Noor AI',
            },
            timeout: 20000, // Reduced from 60s to fail fast
        });

        const text = response.data?.choices?.[0]?.message?.content;
        if (!text) throw new Error('Empty OpenRouter response');
        return text;
    }

    // ═══════════════════════════════════════════
    // ← Main Chat (Gemini → OpenRouter Fallback)
    // ═══════════════════════════════════════════

    // ═══════════════════════════════════════════
    // ← Main Chat (OpenRouter First → Gemini Fallback)
    // ═══════════════════════════════════════════

    async chat(messages, options = {}) {
        if (!this.isConfigured()) {
            throw new Error('No AI API keys configured');
        }

        // ── المرحلة 1: جرّب OpenRouter (الأسرع والأوفر حالياً) ──
        if (this.openrouterKey) {
            // ترتيب النماذج: Flash Lite (الأسرع) -> DeepSeek (الأذكى) -> Llama (البديل)
            const models = [
                'google/gemini-2.0-flash-lite-preview-02-05:free', // سرعة خيالية
                'deepseek/deepseek-r1:free',
                'meta-llama/llama-3.3-70b-instruct:free',
            ];

            for (const modelName of models) {
                try {
                    const text = await this._callOpenRouter(modelName, messages, options);
                    console.log(`✅ OpenRouter [${modelName}] succeeded`);
                    return { success: true, content: text, model: modelName };
                } catch (error) {
                    console.warn(`⚠️ OpenRouter [${modelName}] failed`, error.message?.substring(0, 50));
                    continue; 
                }
            }
        }

        // ── المرحلة 2: جرّب Gemini المباشر (احتياطي) ──
        if (this.geminiKey) {
            for (const modelName of GEMINI_MODELS) {
                try {
                    const text = await this._callGemini(modelName, messages, options);
                    return { success: true, content: text, model: modelName };
                } catch (error) {
                     console.warn(`⚠️ Direct Gemini [${modelName}] failed`, error.message?.substring(0, 50));
                }
            }
        }

        // ── كل النماذج فشلت ──
        console.error('❌ All AI models failed');
        return {
            success: false,
            error: 'جميع النماذج غير متاحة حالياً. حاول مرة أخرى بعد دقيقة.',
        };
    }

    async chatCompletion(messages, options = {}) {
        return this.chat(messages, options);
    }

    async generateContent(prompt, options = {}) {
        if (!this.isConfigured()) {
            return { success: false, error: 'AI غير مفعّل' };
        }
        try {
            return await this.chat(
                [{ role: 'user', content: prompt }],
                { temperature: options.temperature || 0.7, max_tokens: options.max_tokens || 2000 }
            );
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

const geminiService = new GeminiService();
module.exports = geminiService;
