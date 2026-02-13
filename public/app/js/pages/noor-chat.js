/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NOOR CHAT PAGE - ChatGPT Style
 * منصة مشرق - صفحة شات نور
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    // State
    const state = {
        conversationHistory: [],
        isTyping: false
    };

    // Elements
    const elements = {
        chatArea: document.getElementById('chatArea'),
        welcomeState: document.getElementById('welcomeState'),
        messagesContainer: document.getElementById('messagesContainer'),
        messageInput: document.getElementById('messageInput'),
        sendBtn: document.getElementById('sendBtn'),
        usageDisplay: document.getElementById('usageDisplay'),
        userName: document.getElementById('userName'),
        userAvatar: document.getElementById('userAvatar'),
        userPlan: document.getElementById('userPlan'),
        chatHistory: document.getElementById('chatHistory')
    };

    // Initialize
    async function init() {
        loadUserInfo();
        await loadUsage();
        autoResizeTextarea();
    }

    // Load User Info
    function loadUserInfo() {
        const user = Auth.getUser();
        if (user) {
            elements.userName.textContent = user.fullName || user.username;
            elements.userAvatar.textContent = (user.fullName || user.username).charAt(0);
            
            const planNames = { free: 'خطة مجانية', pro: 'Pro ⭐', business: 'Business 🚀' };
            elements.userPlan.textContent = planNames[user.aiPlan] || 'خطة مجانية';
        }
    }

    // Load Usage
    async function loadUsage() {
        try {
            const result = await API.request('/noor/usage', { method: 'GET' });
            if (result.success && !result.isGuest) {
                if (result.remaining.chat === -1) {
                    elements.usageDisplay.textContent = 'غير محدود';
                } else {
                    elements.usageDisplay.textContent = `${result.remaining.chat} رسائل متبقية`;
                }
            }
        } catch (e) {
            console.error('Load usage error:', e);
        }
    }

    // Auto-resize textarea
    function autoResizeTextarea() {
        elements.messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 160) + 'px';
        });
    }

    // Handle keyboard
    window.handleKeyDown = function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Quick prompt
    window.quickPrompt = function(text) {
        elements.messageInput.value = text;
        sendMessage();
    };

    // New Chat
    window.newChat = function() {
        state.conversationHistory = [];
        elements.messagesContainer.innerHTML = '';
        elements.messagesContainer.classList.add('hidden');
        elements.welcomeState.classList.remove('hidden');
        elements.messageInput.value = '';
    };

    // Toggle Sidebar
    window.toggleSidebar = function() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
    };

    // Send Message
    window.sendMessage = async function() {
        const message = elements.messageInput.value.trim();
        if (!message || state.isTyping) return;

        // Hide welcome, show messages
        elements.welcomeState.classList.add('hidden');
        elements.messagesContainer.classList.remove('hidden');

        // Add user message
        addMessage(message, 'user');
        elements.messageInput.value = '';
        elements.messageInput.style.height = 'auto';

        // Show typing
        state.isTyping = true;
        elements.sendBtn.disabled = true;
        const typingEl = addTypingIndicator();

        try {
            const result = await API.request('/noor/chat', {
                method: 'POST',
                body: {
                    message,
                    conversationHistory: state.conversationHistory
                }
            });

            typingEl.remove();

            if (result.limitReached) {
                addMessage(result.message, 'noor');
            } else if (result.success) {
                addMessage(result.response, 'noor');
                
                state.conversationHistory.push(
                    { role: 'user', content: message },
                    { role: 'assistant', content: result.response }
                );

                if (state.conversationHistory.length > 20) {
                    state.conversationHistory = state.conversationHistory.slice(-20);
                }

                await loadUsage();
            }

        } catch (error) {
            typingEl.remove();
            addMessage('عذراً، حدث خطأ. حاول مرة أخرى.', 'noor');
        } finally {
            state.isTyping = false;
            elements.sendBtn.disabled = false;
        }
    };

    // Add Message
    function addMessage(content, type) {
        const div = document.createElement('div');
        div.className = `flex gap-4 ${type === 'user' ? 'flex-row-reverse' : ''}`;
        
        const avatar = type === 'user' 
            ? `<div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">${elements.userAvatar.textContent}</div>`
            : `<div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-sm flex-shrink-0">🌟</div>`;
        
        const bgClass = type === 'user' ? 'bg-dark-700' : 'bg-dark-800 border border-dark-600';
        
        div.innerHTML = `
            ${avatar}
            <div class="${bgClass} rounded-2xl p-4 max-w-[80%]">
                <p class="text-gray-100 leading-relaxed whitespace-pre-wrap">${escapeHtml(content)}</p>
            </div>
        `;
        
        elements.messagesContainer.appendChild(div);
        div.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    // Typing Indicator
    function addTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'flex gap-4';
        div.id = 'typingIndicator';
        div.innerHTML = `
            <div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-sm flex-shrink-0">🌟</div>
            <div class="bg-dark-800 border border-dark-600 rounded-2xl p-4">
                <div class="flex gap-1">
                    <span class="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style="animation-delay: 0s"></span>
                    <span class="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                    <span class="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
                </div>
            </div>
        `;
        elements.messagesContainer.appendChild(div);
        div.scrollIntoView({ behavior: 'smooth', block: 'end' });
        return div;
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Start
    document.addEventListener('DOMContentLoaded', init);
})();
