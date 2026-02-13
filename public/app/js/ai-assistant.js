/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ AI ASSISTANT (Frontend)
 * منصة مشرق - المساعد الذكي
 * ═══════════════════════════════════════════════════════════════════════════
 */

const MashriqAI = (function() {
    'use strict';
    
    const API_BASE = '/api/ai';
    let isEnabled = false;
    
    // ─────────────────────────────────────────────────────────────────────────
    // Helper Functions
    // ─────────────────────────────────────────────────────────────────────────
    
    async function request(endpoint, data = null) {
        try {
            const options = {
                method: data ? 'POST' : 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            const token = localStorage.getItem('token');
            if (token) {
                options.headers['Authorization'] = `Bearer ${token}`;
            }
            
            if (data) {
                options.body = JSON.stringify(data);
            }
            
            const response = await fetch(`${API_BASE}${endpoint}`, options);
            return await response.json();
            
        } catch (error) {
            console.error('AI Request Error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Modal Management
    // ─────────────────────────────────────────────────────────────────────────
    
    function createModalContainer() {
        // Remove existing modal
        const existing = document.getElementById('aiModal');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = 'aiModal';
        modal.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            padding: 16px;
            animation: fadeIn 0.2s ease;
        `;
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(modal);
        return modal;
    }
    
    function closeModal() {
        const modal = document.getElementById('aiModal');
        if (modal) {
            modal.style.animation = 'fadeIn 0.2s ease reverse';
            setTimeout(() => modal.remove(), 150);
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────
    
    return {
        /**
         * تهيئة AI
         */
        async init() {
            try {
                const status = await request('/status');
                isEnabled = status.success && status.configured;
                console.log('🤖 AI Status:', isEnabled ? 'Enabled' : 'Fallback Mode');
                return true; // Always return true to show AI buttons (fallback works)
            } catch (e) {
                isEnabled = false;
                return true; // Still show buttons for fallback
            }
        },
        
        /**
         * التحقق من حالة AI
         */
        async getStatus() {
            return request('/status');
        },
        
        /**
         * البحث الذكي
         */
        async smartSearch(query, categories = []) {
            if (!query || query.length < 3) {
                throw new Error('الاستفسار قصير جداً');
            }
            
            const result = await request('/search', { query });
            
            if (!result.success) {
                throw new Error(result.error || 'فشل البحث الذكي');
            }
            
            const data = result.data || {};
            return {
                searchTerms: data.keywords || [query],
                suggestedCategory: data.category || null,
                priceRange: data.priceRange || null,
                tips: data.intent ? [data.intent] : []
            };
        },
        
        /**
         * توليد وصف الخدمة
         */
        async generateDescription({ title, category, points }) {
            if (!title) throw new Error('يرجى إدخال عنوان الخدمة');
            if (!points || points.length === 0) throw new Error('يرجى إدخال نقاط عن الخدمة');
            
            const result = await request('/generate-description', { title, category, points });
            
            if (!result.success) {
                throw new Error(result.message || 'فشل توليد الوصف');
            }
            
            return result.description;
        },
        
        /**
         * اقتراح عناوين للخدمة
         */
        async suggestTitles({ type, specialty }, count = 5) {
            if (!type && !specialty) throw new Error('يرجى تحديد نوع الخدمة');
            
            const result = await request('/suggest-titles', { type, specialty, count });
            
            if (!result.success) {
                throw new Error(result.message || 'فشل اقتراح العناوين');
            }
            
            return result.titles || [];
        },
        
        /**
         * تحليل الملف الشخصي
         */
        async analyzeProfile(profile) {
            if (!profile) throw new Error('بيانات الملف الشخصي مطلوبة');
            
            const result = await request('/analyze-profile', { profile });
            
            if (!result.success) {
                throw new Error(result.message || 'فشل تحليل الملف الشخصي');
            }
            
            return result.analysis;
        },
        
        /**
         * المطابقة الذكية للخدمات
         * @param {string} description - وصف المشروع
         * @param {number} budget - الميزانية (اختياري)
         * @param {string} category - الفئة (اختياري)
         */
        async matchServices({ description, budget, category }) {
            if (!description || description.trim().length < 10) {
                throw new Error('يرجى وصف مشروعك بشكل أفضل (10 أحرف على الأقل)');
            }
            
            const result = await request('/match-services', { description, budget, category });
            
            if (!result.success) {
                throw new Error(result.message || 'فشل البحث عن الخدمات');
            }
            
            return {
                matches: result.matches || [],
                aiEnabled: result.aiEnabled,
                totalFound: result.totalFound,
                analysis: result.analysis
            };
        },
        
        /**
         * عرض نتيجة تحليل البروفايل في modal جميل
         */
        showProfileAnalysisModal(analysis) {
            const modal = createModalContainer();
            
            const scoreColor = analysis.score >= 80 ? '#10b981' : 
                              analysis.score >= 60 ? '#f59e0b' : 
                              analysis.score >= 40 ? '#ef4444' : '#6b7280';
            
            const strengthsHtml = analysis.strengths?.map(s => `
                <li class="flex items-center gap-2">
                    <span style="color: #10b981;">✓</span>
                    <span>${s}</span>
                </li>
            `).join('') || '';
            
            const improvementsHtml = analysis.improvements?.map(i => `
                <li class="flex items-center gap-2">
                    <span style="color: #f59e0b;">↑</span>
                    <span>${i}</span>
                </li>
            `).join('') || '';
            
            const tipsHtml = analysis.tips?.map(t => `
                <li class="flex items-center gap-2">
                    <span style="color: #3b82f6;">💡</span>
                    <span>${t}</span>
                </li>
            `).join('') || '';
            
            modal.innerHTML = `
                <div style="
                    background: white;
                    border-radius: 20px;
                    max-width: 560px;
                    width: 100%;
                    max-height: 85vh;
                    overflow: hidden;
                    animation: slideUp 0.3s ease;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                ">
                    <div style="
                        padding: 20px 24px;
                        border-bottom: 1px solid #f3f4f6;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        background: linear-gradient(135deg, #fff7ed, #fef3c7);
                    ">
                        <h3 style="font-size: 18px; font-weight: 700; color: #1f2937; margin: 0;">📊 تحليل الملف الشخصي</h3>
                        <button id="aiModalClose" style="
                            width: 32px; height: 32px;
                            background: white;
                            border: none;
                            border-radius: 50%;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: #6b7280;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        ">✕</button>
                    </div>
                    
                    <div style="padding: 24px; max-height: 500px; overflow-y: auto;">
                        <!-- Score Circle -->
                        <div style="text-align: center; margin-bottom: 24px;">
                            <div style="
                                width: 120px; height: 120px;
                                margin: 0 auto 12px;
                                border-radius: 50%;
                                background: conic-gradient(${scoreColor} ${analysis.score}%, #e5e7eb ${analysis.score}%);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">
                                <div style="
                                    width: 96px; height: 96px;
                                    background: white;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    flex-direction: column;
                                ">
                                    <span style="font-size: 32px; font-weight: 700; color: ${scoreColor};">${analysis.score}</span>
                                    <span style="font-size: 12px; color: #6b7280;">من 100</span>
                                </div>
                            </div>
                            <p style="color: #6b7280; font-size: 14px;">
                                ${analysis.score >= 80 ? '🎉 ملفك الشخصي ممتاز!' :
                                  analysis.score >= 60 ? '👍 ملفك جيد، مع بعض التحسينات' :
                                  analysis.score >= 40 ? '💪 يحتاج لمزيد من التحسين' :
                                  '🚀 ابدأ ببناء ملفك الشخصي'}
                            </p>
                        </div>
                        
                        <!-- Strengths -->
                        ${strengthsHtml ? `
                        <div style="margin-bottom: 20px; padding: 16px; background: #f0fdf4; border-radius: 12px;">
                            <h4 style="font-weight: 600; color: #166534; margin-bottom: 12px; font-size: 14px;">✅ نقاط القوة</h4>
                            <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px; color: #374151; display: flex; flex-direction: column; gap: 8px;">
                                ${strengthsHtml}
                            </ul>
                        </div>
                        ` : ''}
                        
                        <!-- Improvements -->
                        ${improvementsHtml ? `
                        <div style="margin-bottom: 20px; padding: 16px; background: #fffbeb; border-radius: 12px;">
                            <h4 style="font-weight: 600; color: #92400e; margin-bottom: 12px; font-size: 14px;">⚡ نقاط التحسين</h4>
                            <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px; color: #374151; display: flex; flex-direction: column; gap: 8px;">
                                ${improvementsHtml}
                            </ul>
                        </div>
                        ` : ''}
                        
                        <!-- Tips -->
                        ${tipsHtml ? `
                        <div style="padding: 16px; background: #eff6ff; border-radius: 12px;">
                            <h4 style="font-weight: 600; color: #1e40af; margin-bottom: 12px; font-size: 14px;">💡 نصائح للتحسين</h4>
                            <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px; color: #374151; display: flex; flex-direction: column; gap: 8px;">
                                ${tipsHtml}
                            </ul>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div style="padding: 16px 24px; border-top: 1px solid #f3f4f6; text-align: center;">
                        <button id="aiModalCloseBtn" style="
                            padding: 12px 32px;
                            background: linear-gradient(135deg, #f97316, #ea580c);
                            border: none;
                            border-radius: 12px;
                            cursor: pointer;
                            font-size: 14px;
                            color: white;
                            font-weight: 600;
                        ">حسناً</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            requestAnimationFrame(() => modal.style.opacity = '1');
            
            const closeModal = () => {
                modal.style.opacity = '0';
                setTimeout(() => modal.remove(), 200);
            };
            
            modal.querySelector('#aiModalClose')?.addEventListener('click', closeModal);
            modal.querySelector('#aiModalCloseBtn')?.addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        },
        
        /**
         * تعيين حالة تحميل الزر
         */
        setButtonLoading(button, loading) {
            if (!button) return;
            
            if (loading) {
                button.disabled = true;
                button.dataset.originalText = button.innerHTML;
                button.innerHTML = `
                    <svg class="animate-spin" style="width: 16px; height: 16px; margin-left: 8px; animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                        <path d="M12 2a10 10 0 0110 10" stroke-linecap="round"/>
                    </svg>
                    جاري المعالجة...
                `;
                button.style.opacity = '0.7';
            } else {
                button.disabled = false;
                button.innerHTML = button.dataset.originalText || 'AI';
                button.style.opacity = '1';
            }
        },
        
        /**
         * عرض نافذة قائمة (للاختيار من قائمة)
         */
        showListModal(title, items, onSelect) {
            const modal = createModalContainer();
            
            const itemsHtml = items.map((item, i) => `
                <button class="ai-list-item" data-index="${i}" style="
                    width: 100%;
                    text-align: right;
                    padding: 12px 16px;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 14px;
                    color: #374151;
                " onmouseover="this.style.borderColor='#f97316'; this.style.background='#fff7ed';"
                   onmouseout="this.style.borderColor='#e5e7eb'; this.style.background='white';">
                    ${item}
                </button>
            `).join('');
            
            modal.innerHTML = `
                <div style="
                    background: white;
                    border-radius: 20px;
                    max-width: 480px;
                    width: 100%;
                    max-height: 80vh;
                    overflow: hidden;
                    animation: slideUp 0.3s ease;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                ">
                    <div style="
                        padding: 20px 24px;
                        border-bottom: 1px solid #f3f4f6;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    ">
                        <h3 style="font-size: 18px; font-weight: 700; color: #1f2937; margin: 0;">${title}</h3>
                        <button id="aiModalClose" style="
                            width: 32px; height: 32px;
                            background: #f3f4f6;
                            border: none;
                            border-radius: 50%;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: #6b7280;
                        ">✕</button>
                    </div>
                    <div style="padding: 20px 24px; max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
                        ${itemsHtml}
                    </div>
                </div>
            `;
            
            // Close button
            modal.querySelector('#aiModalClose').addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
            
            // Item selection
            modal.querySelectorAll('.ai-list-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.dataset.index);
                    onSelect(items[index]);
                    closeModal();
                });
            });
        },
        
        /**
         * عرض نافذة نتيجة (لعرض نص مع خيارات)
         */
        showResultModal(title, contentHtml, options = {}) {
            const modal = createModalContainer();
            
            const { copyText, onUse } = options;
            
            modal.innerHTML = `
                <div style="
                    background: white;
                    border-radius: 20px;
                    max-width: 560px;
                    width: 100%;
                    max-height: 85vh;
                    overflow: hidden;
                    animation: slideUp 0.3s ease;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                ">
                    <div style="
                        padding: 20px 24px;
                        border-bottom: 1px solid #f3f4f6;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        background: linear-gradient(135deg, #fff7ed, #fef3c7);
                    ">
                        <h3 style="font-size: 18px; font-weight: 700; color: #1f2937; margin: 0;">${title}</h3>
                        <button id="aiModalClose" style="
                            width: 32px; height: 32px;
                            background: white;
                            border: none;
                            border-radius: 50%;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: #6b7280;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        ">✕</button>
                    </div>
                    <div style="padding: 24px; max-height: 400px; overflow-y: auto; color: #374151; line-height: 1.8; font-size: 14px;">
                        ${contentHtml}
                    </div>
                    <div style="padding: 16px 24px; border-top: 1px solid #f3f4f6; display: flex; gap: 12px; justify-content: flex-end;">
                        ${copyText ? `
                            <button id="aiCopyBtn" style="
                                padding: 10px 20px;
                                background: #f3f4f6;
                                border: none;
                                border-radius: 12px;
                                cursor: pointer;
                                font-size: 14px;
                                color: #374151;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                                </svg>
                                نسخ
                            </button>
                        ` : ''}
                        ${onUse ? `
                            <button id="aiUseBtn" style="
                                padding: 10px 24px;
                                background: linear-gradient(135deg, #f97316, #ea580c);
                                border: none;
                                border-radius: 12px;
                                cursor: pointer;
                                font-size: 14px;
                                color: white;
                                font-weight: 600;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                استخدام
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
            
            // Close button
            modal.querySelector('#aiModalClose').addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
            
            // Copy button
            const copyBtn = modal.querySelector('#aiCopyBtn');
            if (copyBtn && copyText) {
                copyBtn.addEventListener('click', () => {
                    navigator.clipboard.writeText(copyText);
                    copyBtn.innerHTML = '✓ تم النسخ';
                    setTimeout(() => {
                        copyBtn.innerHTML = `
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2"/>
                                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                            </svg>
                            نسخ
                        `;
                    }, 2000);
                });
            }
            
            // Use button
            const useBtn = modal.querySelector('#aiUseBtn');
            if (useBtn && onUse) {
                useBtn.addEventListener('click', () => {
                    onUse(copyText);
                    closeModal();
                });
            }
        },
        
        /**
         * كتابة عرض ذكي
         */
        async writeProposal(jobDescription, sellerProfile = null) {
            return request('/write-proposal', { jobDescription, sellerProfile });
        },
        
        /**
         * تحسين البروفايل
         */
        async improveProfile(profile) {
            return request('/improve-profile', { profile });
        },
        
        /**
         * اقتراح ردود سريعة
         */
        async suggestReply(lastMessage, context = '') {
            return request('/suggest-reply', { lastMessage, context });
        }
    };
    
})();

// التصدير للاستخدام في النافذة
if (typeof window !== 'undefined') {
    window.MashriqAI = MashriqAI;
    
    // Add spin animation
    const style = document.createElement('style');
    style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
}
