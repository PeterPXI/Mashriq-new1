/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NOOR AI HUB PAGE
 * منصة مشرق - صفحة نور للذكاء الاصطناعي الشامل
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────
    
    const state = {
        conversationHistory: [],
        usage: null,
        features: []
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // DOM Elements
    // ─────────────────────────────────────────────────────────────────────────
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        planBadge: document.getElementById('planBadge'),
        usageText: document.getElementById('usageText'),
        
        // Chat
        chatMessages: document.getElementById('chatMessages'),
        chatInput: document.getElementById('chatInput'),
        sendChatBtn: document.getElementById('sendChatBtn'),
        
        // Proposal
        proposalForm: document.getElementById('proposalForm'),
        proposalResult: document.getElementById('proposalResult'),
        proposalText: document.getElementById('proposalText'),
        copyProposalBtn: document.getElementById('copyProposalBtn'),
        
        // Content
        contentForm: document.getElementById('contentForm'),
        contentResult: document.getElementById('contentResult'),
        contentText: document.getElementById('contentText'),
        copyContentBtn: document.getElementById('copyContentBtn'),
        
        // Features
        featuresGrid: document.getElementById('featuresGrid')
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // Initialize
    // ─────────────────────────────────────────────────────────────────────────
    
    async function init() {
        Navbar.render(elements.navbar);
        Footer.render(elements.footer);
        
        bindEvents();
        await loadUsage();
        await loadFeatures();
    }
    
    function bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });
        
        // Chat
        elements.sendChatBtn?.addEventListener('click', sendChat);
        elements.chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChat();
        });
        
        // Quick suggestions
        document.querySelectorAll('.quick-suggestion').forEach(btn => {
            btn.addEventListener('click', () => {
                elements.chatInput.value = btn.textContent.trim();
                sendChat();
            });
        });
        
        // Proposal form
        elements.proposalForm?.addEventListener('submit', handleProposalSubmit);
        
        // Content form
        elements.contentForm?.addEventListener('submit', handleContentSubmit);
        
        // Copy buttons
        elements.copyProposalBtn?.addEventListener('click', () => copyToClipboard(elements.proposalText.textContent));
        elements.copyContentBtn?.addEventListener('click', () => copyToClipboard(elements.contentText.textContent));
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Tab Switching
    // ─────────────────────────────────────────────────────────────────────────
    
    function switchTab(tabId) {
        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabId}`);
        });
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Load Usage & Features
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadUsage() {
        try {
            const result = await API.request('/noor/usage', { method: 'GET' });
            
            if (result.success && !result.isGuest) {
                state.usage = result;
                
                const planNames = { free: 'مجانية', pro: 'Pro ⭐', business: 'Business 🚀' };
                elements.planBadge.textContent = planNames[result.plan] || 'مجانية';
                
                if (result.remaining.chat === -1) {
                    elements.usageText.textContent = 'رسائل غير محدودة';
                } else {
                    elements.usageText.textContent = `${result.remaining.chat} رسائل متبقية اليوم`;
                }
            }
        } catch (error) {
            console.error('Load Usage Error:', error);
        }
    }
    
    async function loadFeatures() {
        try {
            const result = await API.request('/noor/features', { method: 'GET' });
            
            if (result.success) {
                state.features = result.features;
                renderFeatures(result.features);
            }
        } catch (error) {
            console.error('Load Features Error:', error);
        }
    }
    
    function renderFeatures(features) {
        elements.featuresGrid.innerHTML = features.map(f => `
            <div class="feature-card ${!f.available ? 'locked' : ''} bg-white rounded-xl p-5 flex items-start gap-4">
                <div class="text-3xl">${f.name.split(' ')[0]}</div>
                <div class="flex-1">
                    <h4 class="font-bold text-gray-900">${f.name.replace(/^[^\s]+\s/, '')}</h4>
                    <p class="text-gray-500 text-sm mt-1">${f.description}</p>
                    <span class="inline-block mt-2 px-3 py-1 ${f.available ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'} rounded-full text-xs font-medium">
                        ${f.limit}
                    </span>
                </div>
                ${!f.available ? '<span class="text-2xl">🔒</span>' : ''}
            </div>
        `).join('');
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Chat
    // ─────────────────────────────────────────────────────────────────────────
    
    async function sendChat() {
        const message = elements.chatInput.value.trim();
        if (!message) return;
        
        // Add user message
        addChatMessage(message, 'user');
        elements.chatInput.value = '';
        
        // Show typing indicator
        const typingId = showTyping();
        
        try {
            const result = await API.request('/noor/chat', {
                method: 'POST',
                body: {
                    message,
                    conversationHistory: state.conversationHistory
                }
            });
            
            hideTyping(typingId);
            
            if (result.limitReached) {
                addChatMessage(result.message, 'noor');
                return;
            }
            
            if (result.success) {
                addChatMessage(result.response, 'noor');
                
                // Update conversation history
                state.conversationHistory.push(
                    { role: 'user', content: message },
                    { role: 'assistant', content: result.response }
                );
                
                // Keep only last 10 messages
                if (state.conversationHistory.length > 20) {
                    state.conversationHistory = state.conversationHistory.slice(-20);
                }
                
                // Update usage display
                await loadUsage();
            }
            
        } catch (error) {
            hideTyping(typingId);
            addChatMessage('عذراً، حدث خطأ. حاول مرة أخرى.', 'noor');
        }
    }
    
    function addChatMessage(text, type) {
        const div = document.createElement('div');
        div.className = `chat-message ${type} p-4 mb-3`;
        div.innerHTML = `<p>${text}</p>`;
        elements.chatMessages.appendChild(div);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }
    
    function showTyping() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'chat-message noor p-4 mb-3';
        div.innerHTML = `
            <div class="typing-indicator flex gap-1">
                <span></span><span></span><span></span>
            </div>
        `;
        elements.chatMessages.appendChild(div);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        return id;
    }
    
    function hideTyping(id) {
        document.getElementById(id)?.remove();
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Proposal Generator
    // ─────────────────────────────────────────────────────────────────────────
    
    async function handleProposalSubmit(e) {
        e.preventDefault();
        
        const btn = document.getElementById('generateProposalBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" class="opacity-75"></path></svg><span>جاري الإنشاء...</span>';
        btn.disabled = true;
        
        try {
            const result = await API.request('/noor/proposal', {
                method: 'POST',
                body: {
                    projectTitle: document.getElementById('proposalTitle').value,
                    projectDescription: document.getElementById('proposalDescription').value,
                    price: document.getElementById('proposalPrice').value,
                    deliveryDays: document.getElementById('proposalDays').value,
                    experience: document.getElementById('proposalExperience').value
                }
            });
            
            if (result.limitReached) {
                Toast.warning('تنبيه', result.message);
                return;
            }
            
            if (result.success) {
                elements.proposalText.textContent = result.proposal;
                elements.proposalResult.classList.remove('hidden');
                
                // Scroll to result
                elements.proposalResult.scrollIntoView({ behavior: 'smooth' });
                
                await loadUsage();
            } else {
                Toast.error('خطأ', result.message);
            }
            
        } catch (error) {
            Toast.error('خطأ', 'فشل إنشاء العرض');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Content Generator
    // ─────────────────────────────────────────────────────────────────────────
    
    async function handleContentSubmit(e) {
        e.preventDefault();
        
        const btn = document.getElementById('generateContentBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" class="opacity-75"></path></svg><span>جاري الإنشاء...</span>';
        btn.disabled = true;
        
        try {
            const result = await API.request('/noor/content', {
                method: 'POST',
                body: {
                    type: document.getElementById('contentType').value,
                    topic: document.getElementById('contentTopic').value,
                    platform: document.getElementById('contentPlatform').value,
                    tone: document.getElementById('contentTone').value,
                    length: document.getElementById('contentLength').value
                }
            });
            
            if (result.limitReached) {
                Toast.warning('تنبيه', result.message);
                return;
            }
            
            if (result.success) {
                elements.contentText.textContent = result.content;
                elements.contentResult.classList.remove('hidden');
                
                // Scroll to result
                elements.contentResult.scrollIntoView({ behavior: 'smooth' });
                
                await loadUsage();
            } else {
                Toast.error('خطأ', result.message);
            }
            
        } catch (error) {
            Toast.error('خطأ', 'فشل إنشاء المحتوى');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Utilities
    // ─────────────────────────────────────────────────────────────────────────
    
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            Toast.success('تم النسخ', 'تم نسخ المحتوى بنجاح');
        } catch (error) {
            Toast.error('خطأ', 'فشل نسخ المحتوى');
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Start
    // ─────────────────────────────────────────────────────────────────────────
    
    document.addEventListener('DOMContentLoaded', init);
})();
