/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🤖 نور - المساعد الذكي لمنصة مشرق
 * NOOR AI CHATBOT COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * شات بوت عائم يظهر في كل صفحات المنصة
 * يستخدم Tailwind CSS بالكامل + SVG Icons
 */

const NoorChatbot = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════
    
    let isOpen = false;
    let isLoading = false;
    let messages = [];
    let elements = {};

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════
    
    const CONFIG = {
        apiEndpoint: '/api/noor/chat',
        welcomeEndpoint: '/api/noor/welcome',
        maxMessages: 50,
        typingDelay: 500
    };

    // SVG Icons
    const ICONS = {
        robot: `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2M7.5 13A2.5 2.5 0 005 15.5 2.5 2.5 0 007.5 18a2.5 2.5 0 002.5-2.5A2.5 2.5 0 007.5 13m9 0a2.5 2.5 0 00-2.5 2.5 2.5 2.5 0 002.5 2.5 2.5 2.5 0 002.5-2.5 2.5 2.5 0 00-2.5-2.5z"/></svg>`,
        robotSmall: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2M7.5 13A2.5 2.5 0 005 15.5 2.5 2.5 0 007.5 18a2.5 2.5 0 002.5-2.5A2.5 2.5 0 007.5 13m9 0a2.5 2.5 0 00-2.5 2.5 2.5 2.5 0 002.5 2.5 2.5 2.5 0 002.5-2.5 2.5 2.5 0 00-2.5-2.5z"/></svg>`,
        close: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
        minus: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>`,
        send: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`,
        search: `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>`,
        store: `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        pen: `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>`
    };

    const QUICK_ACTIONS = [
        { text: 'كيف أبحث عن خدمة؟', icon: 'search' },
        { text: 'كيف أبيع خدمة؟', icon: 'store' },
        { text: 'ساعدني في كتابة عرض', icon: 'pen' }
    ];

    // ═══════════════════════════════════════════════════════════════════════
    // HTML TEMPLATE (Tailwind CSS + SVG)
    // ═══════════════════════════════════════════════════════════════════════
    
    function createTemplate() {
        return `
        <!-- Noor Chatbot Container -->
        <div id="noorChatbot" style="position: fixed !important; bottom: 24px !important; left: 24px !important; z-index: 99999 !important; font-family: sans-serif;" dir="rtl">
            
            <!-- Floating Action Button -->
            <button id="noorFab" 
                style="position: relative; width: 56px; height: 56px; background: linear-gradient(135deg, #ff8c00ff, #ffa600ff); border-radius: 50%; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(255, 149, 0, 1); display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;"
                class="group"
                aria-label="فتح المساعد الذكي نور">
                <!-- Bot Icon -->
                <span id="noorFabIcon" style="color: white;">
                    ${ICONS.robot}
                </span>
                <!-- Close Icon (hidden) -->
                <span id="noorFabClose" style="display: none; color: white;">
                    ${ICONS.close}
                </span>
                <!-- Pulse Animation -->
                <span id="noorPulse" style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: #f97316; animation: noorPulse 2s infinite; opacity: 0.3;"></span>
            </button>
            
            <!-- Tooltip -->
            <div id="noorTooltip" style="position: absolute; bottom: 64px; left: 50%; transform: translateX(-50%); padding: 6px 12px; background: #1f2937; color: white; font-size: 14px; border-radius: 8px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.3s;">
                مرحباً! أنا نور 👋
            </div>

            <!-- Chat Window -->
            <div id="noorWindow" 
                style="display: none; position: absolute; bottom: 70px; left: 0; width: 360px; height: 500px; background: white; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border: 1px solid #e5e7eb; flex-direction: column; overflow: hidden; transform: scale(0.95); opacity: 0; transition: all 0.3s ease; transform-origin: bottom left;">
                
                <!-- Header -->
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: linear-gradient(to right, #f97316, #ea580c); color: white;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            ${ICONS.robotSmall}
                        </div>
                        <div>
                            <h3 style="font-weight: bold; font-size: 16px; margin: 0;">نور</h3>
                            <p style="font-size: 12px; color: rgba(255,255,255,0.8); margin: 0;">مساعدك الذكي</p>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <!-- Online Indicator -->
                        <span style="display: flex; align-items: center; gap: 6px; padding: 2px 8px; background: rgba(255,255,255,0.2); border-radius: 9999px; font-size: 12px;">
                            <span style="width: 6px; height: 6px; background: #4ade80; border-radius: 50%;"></span>
                            متصل
                        </span>
                        <!-- Minimize Button -->
                        <button id="noorMinimize" style="width: 32px; height: 32px; background: transparent; border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white;">
                            ${ICONS.minus}
                        </button>
                    </div>
                </div>
                
                <!-- Messages Area -->
                <div id="noorMessages" style="flex: 1; overflow-y: auto; padding: 16px; background: #fafafa; display: flex; flex-direction: column; gap: 16px;">
                    <!-- Welcome Message -->
                    <div style="display: flex; gap: 12px;">
                        <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white;">
                            ${ICONS.robotSmall}
                        </div>
                        <div style="flex: 1;">
                            <div style="background: white; border-radius: 16px; border-top-right-radius: 0; padding: 12px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;">
                                <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">
                                    مرحباً! 👋 أنا <strong style="color: #f97316;">نور</strong>، مساعدك الذكي في منصة مشرق.
                                    <br><br>
                                    كيف يمكنني مساعدتك اليوم؟
                                </p>
                            </div>
                            <span style="font-size: 12px; color: #9ca3af; margin-top: 4px; display: block;">الآن</span>
                        </div>
                    </div>
                    
                    <!-- Quick Actions -->
                    <div id="noorQuickActions" style="display: flex; flex-wrap: wrap; gap: 8px; padding: 0 8px;">
                        ${QUICK_ACTIONS.map(action => `
                            <button class="quick-action" style="padding: 6px 12px; background: white; border: 1px solid #e5e7eb; color: #4b5563; font-size: 14px; border-radius: 9999px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                ${ICONS[action.icon]}
                                ${action.text}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Input Area -->
                <div style="padding: 12px; background: white; border-top: 1px solid #e5e7eb;">
                    <form id="noorForm" style="display: flex; align-items: center; gap: 8px;">
                        <input type="text" 
                            id="noorInput"
                            style="flex: 1; padding: 12px 16px; background: #f3f4f6; border-radius: 12px; border: none; color: #1f2937; font-size: 14px; outline: none;"
                            placeholder="اكتب رسالتك هنا..."
                            autocomplete="off">
                        <button type="submit" 
                            id="noorSendBtn"
                            style="width: 44px; height: 44px; background: linear-gradient(135deg, #f97316, #ea580c); border: none; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white;">
                            ${ICONS.send}
                        </button>
                    </form>
                    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 8px;">
                        مدعوم بالذكاء الاصطناعي ✨
                    </p>
                </div>
            </div>
        </div>
        `;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════
    
    function init() {
        // Check if already initialized
        if (document.getElementById('noorChatbot')) {
            console.log('🤖 نور: المساعد الذكي موجود بالفعل');
            return;
        }

        // Inject CSS for animations
        if (!document.getElementById('noorStyles')) {
            const style = document.createElement('style');
            style.id = 'noorStyles';
            style.textContent = `
                @keyframes noorPulse {
                    0%, 100% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.1); opacity: 0.1; }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                #noorFab:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(249, 115, 22, 0.5); }
                #noorFab:active { transform: scale(0.95); }
            `;
            document.head.appendChild(style);
        }

        // Inject HTML
        const container = document.createElement('div');
        container.innerHTML = createTemplate();
        document.body.appendChild(container.firstElementChild);
        
        // Cache elements
        elements = {
            container: document.getElementById('noorChatbot'),
            fab: document.getElementById('noorFab'),
            fabIcon: document.getElementById('noorFabIcon'),
            fabClose: document.getElementById('noorFabClose'),
            tooltip: document.getElementById('noorTooltip'),
            window: document.getElementById('noorWindow'),
            minimize: document.getElementById('noorMinimize'),
            messages: document.getElementById('noorMessages'),
            form: document.getElementById('noorForm'),
            input: document.getElementById('noorInput'),
            sendBtn: document.getElementById('noorSendBtn'),
            quickActions: document.getElementById('noorQuickActions')
        };
        
        // Bind events
        bindEvents();
        
        console.log('🤖 نور: تم تحميل المساعد الذكي بنجاح ✅');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════════
    
    function bindEvents() {
        // Toggle chat window
        elements.fab?.addEventListener('click', toggleWindow);
        elements.minimize?.addEventListener('click', closeWindow);
        
        // Send message
        elements.form?.addEventListener('submit', handleSubmit);
        
        // Quick actions
        elements.quickActions?.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.textContent.trim();
                elements.input.value = text;
                handleSubmit(new Event('submit'));
            });
        });
        
        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) {
                closeWindow();
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // WINDOW CONTROLS
    // ═══════════════════════════════════════════════════════════════════════
    
    function toggleWindow() {
        if (isOpen) {
            closeWindow();
        } else {
            openWindow();
        }
    }
    
    function openWindow() {
        isOpen = true;
        elements.window.style.display = 'flex';
        
        // Animate in
        requestAnimationFrame(() => {
            elements.window.style.transform = 'scale(1)';
            elements.window.style.opacity = '1';
        });
        
        // Update FAB
        elements.fabIcon.style.display = 'none';
        elements.fabClose.style.display = 'block';
        const pulse = document.getElementById('noorPulse');
        if (pulse) pulse.style.display = 'none';
        
        // Focus input
        setTimeout(() => elements.input?.focus(), 300);
    }
    
    function closeWindow() {
        isOpen = false;
        
        // Animate out
        elements.window.style.transform = 'scale(0.95)';
        elements.window.style.opacity = '0';
        
        setTimeout(() => {
            elements.window.style.display = 'none';
        }, 300);
        
        // Update FAB
        elements.fabIcon.style.display = 'block';
        elements.fabClose.style.display = 'none';
        const pulse = document.getElementById('noorPulse');
        if (pulse) pulse.style.display = 'block';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MESSAGE HANDLING
    // ═══════════════════════════════════════════════════════════════════════
    
    function handleSubmit(e) {
        e.preventDefault();
        
        const message = elements.input.value.trim();
        if (!message || isLoading) return;
        
        // Add user message
        addMessage('user', message);
        elements.input.value = '';
        
        // Hide quick actions after first message
        if (elements.quickActions) {
            elements.quickActions.classList.add('hidden');
        }
        
        // Show typing indicator
        showTyping();
        
        // Send to API
        sendMessage(message);
    }
    
    function addMessage(type, content) {
        const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        
        const messageHTML = type === 'user' 
            ? createUserMessage(content, time)
            : createBotMessage(content, time);
        
        // Remove typing indicator if exists
        const typingEl = elements.messages.querySelector('.typing-indicator');
        typingEl?.remove();
        
        elements.messages.insertAdjacentHTML('beforeend', messageHTML);
        scrollToBottom();
        
        messages.push({ type, content, time });
    }
    
    function createUserMessage(content, time) {
        return `
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <div style="flex: 1; max-width: 80%;">
                    <div style="background: linear-gradient(135deg, #f97316, #ea580c); color: white; border-radius: 16px; border-top-left-radius: 0; padding: 12px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <p style="font-size: 14px; line-height: 1.6; margin: 0;">${escapeHTML(content)}</p>
                    </div>
                    <span style="font-size: 12px; color: #9ca3af; margin-top: 4px; display: block; text-align: left;">${time}</span>
                </div>
            </div>
        `;
    }
    
    function createBotMessage(content, time) {
        return `
            <div style="display: flex; gap: 12px;">
                <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white;">
                    ${ICONS.robotSmall}
                </div>
                <div style="flex: 1; max-width: 85%;">
                    <div style="background: white; border-radius: 16px; border-top-right-radius: 0; padding: 12px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;">
                        <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">${formatBotMessage(content)}</p>
                    </div>
                    <span style="font-size: 12px; color: #9ca3af; margin-top: 4px; display: block;">${time}</span>
                </div>
            </div>
        `;
    }
    
    function showTyping() {
        const typingHTML = `
            <div class="typing-indicator" style="display: flex; gap: 12px;">
                <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white;">
                    ${ICONS.robotSmall}
                </div>
                <div style="background: white; border-radius: 16px; border-top-right-radius: 0; padding: 12px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;">
                    <div style="display: flex; gap: 4px;">
                        <span style="width: 8px; height: 8px; background: #d1d5db; border-radius: 50%; animation: bounce 1s infinite;"></span>
                        <span style="width: 8px; height: 8px; background: #d1d5db; border-radius: 50%; animation: bounce 1s infinite 0.15s;"></span>
                        <span style="width: 8px; height: 8px; background: #d1d5db; border-radius: 50%; animation: bounce 1s infinite 0.3s;"></span>
                    </div>
                </div>
            </div>
        `;
        elements.messages.insertAdjacentHTML('beforeend', typingHTML);
        scrollToBottom();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // API COMMUNICATION
    // ═══════════════════════════════════════════════════════════════════════
    
    async function sendMessage(message) {
        isLoading = true;
        elements.sendBtn.disabled = true;
        
        try {
            const response = await fetch(CONFIG.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify({ 
                    message,
                    context: getContextSummary()
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                addMessage('bot', data.response);
            } else {
                addMessage('bot', 'عذراً، حدث خطأ. حاول مرة أخرى.');
            }
            
        } catch (error) {
            console.error('Noor API Error:', error);
            // Fallback response
            addMessage('bot', getFallbackResponse(message));
        } finally {
            isLoading = false;
            elements.sendBtn.disabled = false;
        }
    }
    
    function getContextSummary() {
        // Get last 5 messages for context
        return messages.slice(-5).map(m => `${m.type}: ${m.content}`).join('\n');
    }
    
    function getFallbackResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('بحث') || lowerMessage.includes('خدمة')) {
            return 'يمكنك البحث عن أي خدمة من خلال شريط البحث في الأعلى! جرب كتابة ما تحتاجه بكلماتك الخاصة. 🔍';
        }
        if (lowerMessage.includes('بيع') || lowerMessage.includes('أبيع')) {
            return 'لبيع خدماتك، اذهب إلى "خدماتي" ثم "إضافة خدمة جديدة". سأساعدك في كتابة وصف احترافي! 💼';
        }
        if (lowerMessage.includes('عرض') || lowerMessage.includes('كتابة')) {
            return 'يسعدني مساعدتك في كتابة عرض! أخبرني عن المشروع وسأقترح لك صياغة احترافية. ✍️';
        }
        
        return 'شكراً لتواصلك! أنا هنا لمساعدتك. جرب أن تسألني عن البحث عن خدمات، أو كيفية البيع على المنصة. 🌟';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════
    
    function scrollToBottom() {
        elements.messages.scrollTop = elements.messages.scrollHeight;
    }
    
    function escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function formatBotMessage(content) {
        // Convert markdown-like formatting
        return escapeHTML(content)
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f97316;">$1</strong>')
            .replace(/\n/g, '<br>');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════
    
    return {
        init,
        open: openWindow,
        close: closeWindow,
        toggle: toggleWindow
    };

})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        NoorChatbot.init();
    });
} else {
    // DOM already loaded
    NoorChatbot.init();
}
