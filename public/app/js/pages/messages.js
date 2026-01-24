(function() {
    'use strict';
    
    const state = {
        chats: [],
        isLoading: false,
    };
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        chatsLoading: document.getElementById('chatsLoading'),
        chatsList: document.getElementById('chatsList'),
        emptyState: document.getElementById('emptyState'),
        totalChats: document.getElementById('totalChats'),
    };
    
    async function init() {
        if (!Auth.requireAuth()) {
            return;
        }
        
        Navbar.render(elements.navbar);
        Footer.render(elements.footer);
        
        await loadChats();
    }
    
    async function loadChats() {
        state.isLoading = true;
        elements.chatsLoading.classList.remove('hidden');
        elements.chatsList.classList.add('hidden');
        elements.emptyState.classList.add('hidden');
        
        try {
            const response = await API.get('/chats');
            const data = response.data || response;
            state.chats = data.chats || data || [];
            
            elements.totalChats.textContent = state.chats.length;
            
            if (state.chats.length === 0) {
                showEmptyState();
            } else {
                renderChats();
            }
        } catch (error) {
            console.error('Failed to load chats:', error);
            Toast.error('خطأ', 'تعذر تحميل المحادثات');
            showEmptyState();
        } finally {
            state.isLoading = false;
            elements.chatsLoading.classList.add('hidden');
        }
    }
    
    function renderChats() {
        elements.chatsList.classList.remove('hidden');
        elements.emptyState.classList.add('hidden');
        
        const currentUserId = Auth.getUserId();
        
        elements.chatsList.innerHTML = state.chats.map(chat => {
            const orderId = chat.orderId?._id || chat.orderId;
            const orderNumber = chat.orderId?.orderNumber || chat.orderNumber || orderId?.slice(-8) || '---';
            
            const isBuyer = (chat.buyerId?._id || chat.buyerId) === currentUserId;
            const otherUser = isBuyer 
                ? (chat.sellerId || { fullName: 'البائع' }) 
                : (chat.buyerId || { fullName: 'المشتري' });
            
            const otherName = otherUser.fullName || otherUser.username || (isBuyer ? 'البائع' : 'المشتري');
            const otherAvatar = otherUser.avatarUrl;
            
            const lastMessage = chat.lastMessage || {};
            const messagePreview = lastMessage.content || 'لا توجد رسائل بعد';
            const messageTime = lastMessage.createdAt ? formatTime(lastMessage.createdAt) : '';
            
            const serviceTitle = chat.orderId?.serviceSnapshot?.title || chat.serviceTitle || 'خدمة';
            const hasUnread = chat.unreadCount > 0;
            
            return `
                <a href="/app/order.html?id=${orderId}" class="chat-item block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all ${hasUnread ? 'unread' : ''}">
                    <div class="flex gap-4">
                        <div class="flex-shrink-0">
                            ${otherAvatar 
                                ? `<img src="${otherAvatar}" alt="${Utils.escapeHtml(otherName)}" class="w-12 h-12 rounded-full object-cover">`
                                : `<div class="w-12 h-12 rounded-full avatar-placeholder flex items-center justify-center text-white font-bold text-lg">${otherName.charAt(0)}</div>`
                            }
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between mb-1">
                                <h3 class="font-semibold text-gray-900 truncate">${Utils.escapeHtml(otherName)}</h3>
                                <span class="text-xs text-gray-400 flex-shrink-0 mr-2">${messageTime}</span>
                            </div>
                            <p class="text-sm text-gray-600 message-preview mb-2">${Utils.escapeHtml(messagePreview)}</p>
                            <div class="flex items-center justify-between">
                                <span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg truncate max-w-[200px]">
                                    #${orderNumber} - ${Utils.escapeHtml(serviceTitle)}
                                </span>
                                ${hasUnread ? `<span class="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">${chat.unreadCount}</span>` : ''}
                            </div>
                        </div>
                        <div class="flex-shrink-0 self-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
                                <polyline points="15,18 9,12 15,6"/>
                            </svg>
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    }
    
    function showEmptyState() {
        elements.chatsList.classList.add('hidden');
        elements.emptyState.classList.remove('hidden');
    }
    
    function formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'أمس';
        } else if (diffDays < 7) {
            return date.toLocaleDateString('ar-EG', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
