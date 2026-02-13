/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ CHAT PAGE
 * منصة مشرق - صفحة المحادثة
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────
    
    const POLL_INTERVAL = 30000; // 30 seconds fallback (WebSocket is primary)
    const TYPING_DEBOUNCE = 1000;
    
    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────
    
    const state = {
        conversations: [],
        activeConversation: null,
        activeChat: null,
        messages: [],
        pollingInterval: null,
        typingTimeout: null,
        isTyping: false,
        canSendMessages: true,
        currentUserId: null,
        searchQuery: '',
        useWebSocket: false,  // Will be set to true if WebSocket connects
        socketUnsubscribers: [],  // Store unsubscribe functions
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // Elements
    // ─────────────────────────────────────────────────────────────────────────
    
    const elements = {
        // Sidebar
        chatSidebar: document.getElementById('chatSidebar'),
        conversationsCount: document.getElementById('conversationsCount'),
        searchConversations: document.getElementById('searchConversations'),
        conversationsList: document.getElementById('conversationsList'),
        conversationsLoading: document.getElementById('conversationsLoading'),
        
        // Main
        chatMain: document.getElementById('chatMain'),
        emptyChatState: document.getElementById('emptyChatState'),
        activeChat: document.getElementById('activeChat'),
        
        // Chat Header
        backToList: document.getElementById('backToList'),
        chatUserAvatar: document.getElementById('chatUserAvatar'),
        chatUserImg: document.getElementById('chatUserImg'),
        chatUserInitials: document.getElementById('chatUserInitials'),
        chatUserName: document.getElementById('chatUserName'),
        chatUserStatus: document.getElementById('chatUserStatus'),
        viewOrderLink: document.getElementById('viewOrderLink'),
        
        // Order Bar
        chatOrderBar: document.getElementById('chatOrderBar'),
        chatOrderTitle: document.getElementById('chatOrderTitle'),
        chatOrderStatus: document.getElementById('chatOrderStatus'),
        
        // Messages
        chatMessagesArea: document.getElementById('chatMessagesArea'),
        chatTyping: document.getElementById('chatTyping'),
        typingUserName: document.getElementById('typingUserName'),
        
        // Input
        chatForm: document.getElementById('chatForm'),
        chatInput: document.getElementById('chatInput'),
        charCount: document.getElementById('charCount'),
        submitBtn: document.getElementById('submitBtn'),
        
        // Locked
        chatLockedOverlay: document.getElementById('chatLockedOverlay'),
        chatLockedReason: document.getElementById('chatLockedReason'),
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // Initialize
    // ─────────────────────────────────────────────────────────────────────────
    
    async function init() {
        if (!Auth.isAuthenticated()) {
            window.location.href = '/app/login.html?redirect=' + encodeURIComponent(window.location.pathname);
            return;
        }
        
        state.currentUserId = Auth.getUserId();
        
        // Load components
        await Promise.all([
            loadNavbar(),
            loadFooter(),
        ]);
        
        // Bind events
        bindEvents();
        
        // Load conversations
        await loadConversations();
        
        // Check for order ID in URL
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('order');
        if (orderId) {
            await openChatByOrderId(orderId);
        }
    }
    
    async function loadNavbar() {
        const navbarEl = document.getElementById('navbar');
        if (navbarEl && typeof Navbar !== 'undefined') {
            Navbar.render(navbarEl);
        }
    }
    
    async function loadFooter() {
        const footerEl = document.getElementById('footer');
        if (footerEl && typeof Footer !== 'undefined') {
            Footer.render(footerEl);
        }
    }
    
    function bindEvents() {
        // Search
        if (elements.searchConversations) {
            elements.searchConversations.addEventListener('input', handleSearch);
        }
        
        // Back button (mobile)
        if (elements.backToList) {
            elements.backToList.addEventListener('click', handleBackToList);
        }
        
        // Chat form
        if (elements.chatForm) {
            elements.chatForm.addEventListener('submit', handleSendMessage);
        }
        
        // Chat input
        if (elements.chatInput) {
            elements.chatInput.addEventListener('input', handleInputChange);
            elements.chatInput.addEventListener('keydown', handleInputKeydown);
        }
        
        // Visibility change (pause/resume polling)
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Cleanup on unload
        window.addEventListener('beforeunload', cleanup);
        
        // ─────────────────────────────────────────────────────────────────────
        // WebSocket Event Listeners
        // ─────────────────────────────────────────────────────────────────────
        setupWebSocketListeners();
    }
    
    /**
     * Setup WebSocket event listeners for real-time messaging.
     */
    function setupWebSocketListeners() {
        if (typeof MashriqSocket === 'undefined') {
            console.log('⚠️ WebSocket client not available, using polling');
            return;
        }
        
        // Check if already connected or wait for connection
        if (MashriqSocket.isConnected()) {
            state.useWebSocket = true;
            console.log('🟢 WebSocket connected, real-time messaging enabled');
        }
        
        // Listen for connection status
        const unsubConnect = MashriqSocket.on('connected', () => {
            state.useWebSocket = true;
            console.log('🟢 WebSocket connected');
            
            // If we have an active chat, join it via WebSocket
            if (state.activeChat) {
                MashriqSocket.joinChat(state.activeChat._id);
            }
            
            // Stop polling if WebSocket is connected
            stopPolling();
        });
        state.socketUnsubscribers.push(unsubConnect);
        
        // Listen for disconnection
        const unsubDisconnect = MashriqSocket.on('disconnected', () => {
            state.useWebSocket = false;
            console.log('🔴 WebSocket disconnected, falling back to polling');
            
            // Start polling as fallback
            if (state.activeChat && state.canSendMessages) {
                startPolling();
            }
        });
        state.socketUnsubscribers.push(unsubDisconnect);
        
        // Listen for new messages
        const unsubMessage = MashriqSocket.on('message', (data) => {
            if (data.chatId === state.activeConversation) {
                handleNewMessageFromSocket(data.message);
            }
        });
        state.socketUnsubscribers.push(unsubMessage);
        
        // Listen for typing indicators
        const unsubTyping = MashriqSocket.on('typing', (data) => {
            if (state.activeChat && data.userId !== state.currentUserId) {
                showTypingIndicator(data.user?.fullName || 'المستخدم');
            }
        });
        state.socketUnsubscribers.push(unsubTyping);
        
        const unsubTypingStopped = MashriqSocket.on('typing-stopped', () => {
            hideTypingIndicator();
        });
        state.socketUnsubscribers.push(unsubTypingStopped);
        
        // Listen for online status
        const unsubOnline = MashriqSocket.on('user-online', (data) => {
            if (state.activeChat) {
                updateUserOnlineStatus(true);
            }
        });
        state.socketUnsubscribers.push(unsubOnline);
        
        const unsubOffline = MashriqSocket.on('user-offline', () => {
            if (state.activeChat) {
                updateUserOnlineStatus(false);
            }
        });
        state.socketUnsubscribers.push(unsubOffline);
        
        // Listen for read receipts
        const unsubRead = MashriqSocket.on('messages-read', (data) => {
            // Could update UI to show read status
            console.log('Messages read by other user:', data);
        });
        state.socketUnsubscribers.push(unsubRead);
    }
    
    /**
     * Handle new message received via WebSocket.
     */
    function handleNewMessageFromSocket(message) {
        // Check if message already exists (avoid duplicates)
        const exists = state.messages.some(m => m._id === message._id);
        if (exists) return;
        
        // Remove any temp message with matching content (from optimistic update)
        state.messages = state.messages.filter(m => {
            if (m._id.startsWith('temp-') && m.content === message.content) {
                return false;
            }
            return true;
        });
        
        // Add the new message
        state.messages.push(message);
        
        // Re-render with smooth scroll
        const wasAtBottom = isScrolledToBottom();
        renderMessages(wasAtBottom);
        
        // Mark as read if page is visible
        if (document.visibilityState === 'visible') {
            MashriqSocket.markAsRead();
        }
        
        console.log('💬 New message received via WebSocket');
    }
    
    /**
     * Show typing indicator.
     */
    function showTypingIndicator(userName) {
        if (elements.chatTyping) {
            elements.chatTyping.classList.remove('hidden');
        }
        if (elements.typingUserName) {
            elements.typingUserName.textContent = `${userName} يكتب...`;
        }
    }
    
    /**
     * Hide typing indicator.
     */
    function hideTypingIndicator() {
        if (elements.chatTyping) {
            elements.chatTyping.classList.add('hidden');
        }
    }
    
    /**
     * Update user online status in header.
     */
    function updateUserOnlineStatus(isOnline) {
        if (elements.chatUserStatus) {
            const statusDot = elements.chatUserStatus.querySelector('.status-dot');
            if (statusDot) {
                statusDot.classList.toggle('online', isOnline);
            }
            // Update text inside status span
            const statusText = isOnline ? 'متصل' : 'غير متصل';
            elements.chatUserStatus.innerHTML = `
                <span class="status-dot ${isOnline ? 'online' : ''}"></span>
                ${statusText}
            `;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Conversations
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadConversations() {
        showConversationsLoading(true);
        
        try {
            const response = await API.get('/chats');
            const data = response.data || response;
            state.conversations = data.chats || data || [];
            
            renderConversations();
            
            if (elements.conversationsCount) {
                elements.conversationsCount.textContent = state.conversations.length;
            }
            
        } catch (error) {
            console.error('Failed to load conversations:', error);
            renderConversationsError();
        }
        
        showConversationsLoading(false);
    }
    
    function renderConversations() {
        if (!elements.conversationsList) return;
        
        // Filter by search query
        let filtered = state.conversations;
        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            filtered = filtered.filter(conv => {
                const otherUser = getOtherUser(conv);
                const name = otherUser?.fullName || otherUser?.username || '';
                const title = conv.orderId?.serviceId?.title || '';
                return name.toLowerCase().includes(query) || title.toLowerCase().includes(query);
            });
        }
        
        if (filtered.length === 0) {
            elements.conversationsList.innerHTML = `
                <div class="conversations-loading">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.3">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    <span>${state.searchQuery ? 'لا نتائج للبحث' : 'لا توجد محادثات'}</span>
                </div>
            `;
            return;
        }
        
        elements.conversationsList.innerHTML = filtered.map(conv => {
            const otherUser = getOtherUser(conv);
            const isActive = state.activeConversation === conv._id;
            const lastMessage = conv.lastMessage;
            const unreadCount = conv.unreadCount || 0;
            
            return `
                <div class="conversation-item ${isActive ? 'active' : ''}" 
                     data-chat-id="${conv._id}" 
                     data-order-id="${conv.orderId?._id || conv.orderId}">
                    <div class="conversation-avatar">
                        ${(otherUser?.avatarUrl || otherUser?.avatar)
                            ? `<img src="${otherUser.avatarUrl || otherUser.avatar}" alt="${Utils.escapeHtml(otherUser.fullName || '')}">`
                            : `<div class="conversation-avatar-placeholder">${getInitials(otherUser)}</div>`
                        }
                    </div>
                    <div class="conversation-info">
                        <div class="conversation-header">
                            <span class="conversation-name">${Utils.escapeHtml(otherUser?.fullName || otherUser?.username || 'مستخدم')}</span>
                            <span class="conversation-time">${formatTimeAgo(conv.updatedAt)}</span>
                        </div>
                        <div class="conversation-preview">${lastMessage ? Utils.escapeHtml(lastMessage.content).substring(0, 50) : 'لا رسائل بعد'}</div>
                    </div>
                    <div class="conversation-meta">
                        ${unreadCount > 0 ? `<span class="conversation-badge">${unreadCount}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        // Bind click events
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.dataset.chatId;
                const orderId = item.dataset.orderId;
                openChat(chatId, orderId);
            });
        });
    }
    
    function renderConversationsError() {
        if (!elements.conversationsList) return;
        
        elements.conversationsList.innerHTML = `
            <div class="conversations-loading">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--color-error-500); opacity: 0.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>تعذر تحميل المحادثات</span>
                <button class="btn btn-sm btn-secondary" onclick="location.reload()">إعادة المحاولة</button>
            </div>
        `;
    }
    
    function showConversationsLoading(show) {
        if (elements.conversationsLoading) {
            elements.conversationsLoading.classList.toggle('hidden', !show);
        }
        
        // Use Skeleton loading for better UX
        if (show && elements.conversationsList && typeof Skeleton !== 'undefined') {
            Skeleton.render(elements.conversationsList, 'chat', 5);
        }
    }
    
    function getOtherUser(conv) {
        const buyerId = conv.buyerId?._id || conv.buyerId;
        const sellerId = conv.sellerId?._id || conv.sellerId;
        
        if (buyerId === state.currentUserId) {
            return conv.sellerId;
        }
        return conv.buyerId;
    }
    
    function getInitials(user) {
        if (!user) return '?';
        const name = user.fullName || user.username || '';
        return name.charAt(0).toUpperCase();
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Active Chat
    // ─────────────────────────────────────────────────────────────────────────
    
    async function openChat(chatId, orderId) {
        state.activeConversation = chatId;
        
        // Update UI
        showEmptyState(false);
        updateConversationSelection();
        
        // On mobile, hide sidebar
        if (window.innerWidth <= 768) {
            elements.chatSidebar?.classList.add('hidden');
        }
        
        try {
            // Get chat details
            const chatResponse = await API.get(`/chats/${chatId}`);
            const chatData = chatResponse.data || chatResponse;
            state.activeChat = chatData.chat || chatData;
            state.canSendMessages = chatData.canSendMessages !== false;
            
            // Update header
            updateChatHeader();
            
            // Load messages
            await loadMessages();
            
            // Start polling
            if (state.canSendMessages) {
                startPolling();
            }
            
            // Update URL
            const url = new URL(window.location);
            url.searchParams.set('order', orderId);
            window.history.replaceState({}, '', url);
            
            // ─────────────────────────────────────────────────────────────────
            // WebSocket: Join chat room for real-time updates
            // ─────────────────────────────────────────────────────────────────
            if (state.useWebSocket && typeof MashriqSocket !== 'undefined') {
                MashriqSocket.joinChat(chatId);
                MashriqSocket.markAsRead();
                console.log('🔌 Joined chat room via WebSocket');
            } else if (state.canSendMessages) {
                // Fallback to polling if WebSocket not available
                startPolling();
            }
            
        } catch (error) {
            console.error('Failed to open chat:', error);
            Toast.error('خطأ', 'تعذر فتح المحادثة');
        }
    }
    
    async function openChatByOrderId(orderId) {
        try {
            const response = await API.get(`/chats/order/${orderId}`);
            const data = response.data || response;
            const chat = data.chat || data;
            
            if (chat && chat._id) {
                await openChat(chat._id, orderId);
            }
        } catch (error) {
            console.error('Failed to open chat by order ID:', error);
        }
    }
    
    function updateChatHeader() {
        if (!state.activeChat) return;
        
        const otherUser = getOtherUser(state.activeChat);
        const order = state.activeChat.orderId;
        
        // User info
        if (elements.chatUserName) {
            elements.chatUserName.textContent = otherUser?.fullName || otherUser?.username || 'مستخدم';
        }
        
        // User avatar
        if (elements.chatUserImg) {
            const avatarUrl = otherUser?.avatarUrl || otherUser?.avatar;
            if (avatarUrl) {
                elements.chatUserImg.src = avatarUrl;
                elements.chatUserImg.alt = otherUser?.fullName || '';
                elements.chatUserImg.style.display = 'block';
                if (elements.chatUserInitials) {
                    elements.chatUserInitials.style.display = 'none';
                }
            } else {
                // Hide img and show initials instead
                elements.chatUserImg.style.display = 'none';
                if (elements.chatUserInitials) {
                    elements.chatUserInitials.textContent = getInitials(otherUser);
                    elements.chatUserInitials.style.display = 'flex';
                }
            }
        }
        
        // Order info
        if (elements.chatOrderTitle) {
            const orderTitle = order?.serviceId?.title || order?.snapshotTitle || 'طلب';
            elements.chatOrderTitle.textContent = orderTitle;
        }
        
        if (elements.chatOrderStatus && order?.status) {
            elements.chatOrderStatus.textContent = getStatusLabel(order.status);
            elements.chatOrderStatus.className = 'chat-order-status ' + getStatusClass(order.status);
        }
        
        if (elements.viewOrderLink && order?._id) {
            elements.viewOrderLink.href = `/app/order.html?id=${order._id}`;
        }
        
        // Update locked state
        if (!state.canSendMessages) {
            showChatLocked(true, 'هذه المحادثة مغلقة');
        } else {
            showChatLocked(false);
        }
    }
    
    function showEmptyState(show) {
        if (elements.emptyChatState) {
            if (show) {
                elements.emptyChatState.classList.remove('hidden');
            } else {
                elements.emptyChatState.classList.add('hidden');
            }
        }
        if (elements.activeChat) {
            if (show) {
                elements.activeChat.classList.add('hidden');
            } else {
                elements.activeChat.classList.remove('hidden');
            }
        }
    }
    
    function updateConversationSelection() {
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.toggle('active', item.dataset.chatId === state.activeConversation);
        });
    }
    
    function showChatLocked(show, reason = '') {
        if (elements.chatLockedOverlay) {
            elements.chatLockedOverlay.classList.toggle('hidden', !show);
        }
        if (elements.chatLockedReason) {
            elements.chatLockedReason.textContent = reason;
        }
        if (elements.chatInput) {
            elements.chatInput.disabled = show;
        }
        if (elements.submitBtn) {
            // If locked, disable. Otherwise, check if there's text
            if (show) {
                elements.submitBtn.disabled = true;
            } else {
                const hasText = elements.chatInput?.value?.trim().length > 0;
                elements.submitBtn.disabled = !hasText;
            }
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Messages
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadMessages(isPolling = false) {
        if (!state.activeChat) return;
        
        try {
            const chatId = state.activeChat._id;
            const response = await API.get(`/chats/${chatId}/messages`);
            const data = response.data || response;
            const newMessages = data.messages || [];
            
            // Check for new messages
            const hasNewMessages = newMessages.length > state.messages.length;
            
            state.messages = newMessages;
            
            if (!isPolling || hasNewMessages) {
                renderMessages(hasNewMessages && isPolling);
            }
            
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }
    
    function renderMessages(scrollToBottom = true) {
        if (!elements.chatMessagesArea) return;
        
        if (state.messages.length === 0) {
            elements.chatMessagesArea.innerHTML = `
                <div class="chat-empty-state" style="flex:1">
                    <svg class="chat-empty-state-icon" style="width:80px;height:80px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    <h3 class="chat-empty-state-title">لا توجد رسائل بعد</h3>
                    <p class="chat-empty-state-text">ابدأ المحادثة الآن</p>
                </div>
            `;
            return;
        }
        
        const wasAtBottom = isScrolledToBottom();
        let lastDate = null;
        
        let html = state.messages.map(msg => {
            const isOwn = (msg.senderId?._id || msg.senderId) === state.currentUserId;
            const msgDate = new Date(msg.createdAt).toLocaleDateString('ar-EG');
            
            let output = '';
            
            // Date separator
            if (msgDate !== lastDate) {
                output += `<div class="chat-date-separator"><span>${msgDate}</span></div>`;
                lastDate = msgDate;
            }
            
            // System message
            if (msg.isSystemMessage) {
                output += `
                    <div class="chat-date-separator">
                        <span>${Utils.escapeHtml(msg.content)}</span>
                    </div>
                `;
            } else {
                const senderName = msg.senderId?.fullName || msg.senderId?.username || 'مستخدم';
                const msgTime = new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
                
                output += `
                    <div class="chat-message ${isOwn ? 'own' : 'other'}">
                        <div class="chat-message-bubble">
                            ${!isOwn ? `<div class="chat-message-sender">${Utils.escapeHtml(senderName)}</div>` : ''}
                            <div class="chat-message-content">${Utils.escapeHtml(msg.content)}</div>
                            <div class="chat-message-time">${msgTime}</div>
                        </div>
                    </div>
                `;
            }
            
            return output;
        }).join('');
        
        elements.chatMessagesArea.innerHTML = html;
        
        if (wasAtBottom || scrollToBottom) {
            scrollChatToBottom();
        }
    }
    
    function isScrolledToBottom() {
        if (!elements.chatMessagesArea) return true;
        const { scrollTop, scrollHeight, clientHeight } = elements.chatMessagesArea;
        return scrollHeight - scrollTop - clientHeight < 50;
    }
    
    function scrollChatToBottom() {
        if (!elements.chatMessagesArea) return;
        elements.chatMessagesArea.scrollTop = elements.chatMessagesArea.scrollHeight;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Polling
    // ─────────────────────────────────────────────────────────────────────────
    
    function startPolling() {
        stopPolling();
        
        state.pollingInterval = setInterval(() => {
            if (document.visibilityState === 'visible' && state.canSendMessages) {
                loadMessages(true);
            }
        }, POLL_INTERVAL);
        
        console.log('📡 Chat polling started');
    }
    
    function stopPolling() {
        if (state.pollingInterval) {
            clearInterval(state.pollingInterval);
            state.pollingInterval = null;
            console.log('📡 Chat polling stopped');
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Event Handlers
    // ─────────────────────────────────────────────────────────────────────────
    
    function handleSearch(e) {
        state.searchQuery = e.target.value.trim();
        renderConversations();
    }
    
    function handleBackToList(e) {
        e.preventDefault();
        if (elements.chatSidebar) {
            elements.chatSidebar.classList.remove('hidden');
        }
    }
    
    function handleInputChange(e) {
        const value = e.target.value;
        const length = value.length;
        
        // Update char count
        if (elements.charCount) {
            elements.charCount.textContent = `${length}/1000`;
        }
        
        // Enable/disable submit
        if (elements.submitBtn) {
            elements.submitBtn.disabled = length === 0 || !state.canSendMessages;
        }
        
        // Auto-resize textarea
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
        
        // Typing indicator
        handleTyping();
    }
    
    function handleInputKeydown(e) {
        // Submit on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            elements.chatForm?.dispatchEvent(new Event('submit'));
        }
    }
    
    function handleTyping() {
        if (state.typingTimeout) {
            clearTimeout(state.typingTimeout);
        }
        
        if (!state.isTyping) {
            state.isTyping = true;
            // Emit typing event via WebSocket
            if (state.useWebSocket && typeof MashriqSocket !== 'undefined') {
                MashriqSocket.startTyping();
            }
        }
        
        state.typingTimeout = setTimeout(() => {
            state.isTyping = false;
            // Emit stop typing via WebSocket
            if (state.useWebSocket && typeof MashriqSocket !== 'undefined') {
                MashriqSocket.stopTyping();
            }
        }, TYPING_DEBOUNCE);
    }
    
    async function handleSendMessage(e) {
        e.preventDefault();
        
        const content = elements.chatInput?.value.trim();
        if (!content || !state.activeChat || !state.canSendMessages) return;
        
        // Disable UI
        if (elements.submitBtn) elements.submitBtn.disabled = true;
        if (elements.chatInput) {
            elements.chatInput.value = '';
            elements.chatInput.style.height = 'auto';
        }
        if (elements.charCount) elements.charCount.textContent = '0/1000';
        
        // Optimistic update
        const tempMessage = {
            _id: 'temp-' + Date.now(),
            senderId: { _id: state.currentUserId },
            content: content,
            createdAt: new Date().toISOString(),
        };
        state.messages.push(tempMessage);
        renderMessages(true);
        
        try {
            const chatId = state.activeChat._id;
            await API.post(`/chats/${chatId}/messages`, { content });
            
            // If using WebSocket, the message will arrive via socket event
            // If not, reload messages
            if (!state.useWebSocket) {
                await loadMessages(false);
            }
            // If using WebSocket, the message comes back via socket event
            // and handleNewMessageFromSocket will handle it
            
        } catch (error) {
            console.error('Failed to send message:', error);
            
            // Remove optimistic message
            state.messages = state.messages.filter(m => m._id !== tempMessage._id);
            renderMessages(false);
            
            // Restore input
            if (elements.chatInput) elements.chatInput.value = content;
            
            Toast.error('خطأ', error.message || 'تعذر إرسال الرسالة');
        } finally {
            if (elements.submitBtn) {
                elements.submitBtn.disabled = !state.canSendMessages;
            }
            if (elements.chatInput) {
                elements.chatInput.focus();
            }
        }
    }
    
    function handleVisibilityChange() {
        if (document.visibilityState === 'visible' && state.activeChat && state.canSendMessages) {
            loadMessages(true);
        }
    }
    
    function cleanup() {
        stopPolling();
        
        // Leave WebSocket room
        if (typeof MashriqSocket !== 'undefined' && state.activeChat) {
            MashriqSocket.leaveChat();
        }
        
        // Unsubscribe from all socket events
        state.socketUnsubscribers.forEach(unsub => {
            if (typeof unsub === 'function') unsub();
        });
        state.socketUnsubscribers = [];
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
    
    function formatTimeAgo(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} د`;
        if (diffHours < 24) return `منذ ${diffHours} س`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;
        
        return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
    }
    
    function getStatusLabel(status) {
        const labels = {
            'PENDING': 'قيد الانتظار',
            'ACTIVE': 'جاري العمل',
            'DELIVERED': 'تم التسليم',
            'COMPLETED': 'مكتمل',
            'CANCELLED': 'ملغي',
            'DISPUTED': 'متنازع عليه',
        };
        return labels[status] || status;
    }
    
    function getStatusClass(status) {
        const classes = {
            'PENDING': 'status-pending',
            'ACTIVE': 'status-active',
            'DELIVERED': 'status-delivered',
            'COMPLETED': 'status-success',
            'CANCELLED': 'status-error',
            'DISPUTED': 'status-warning',
        };
        return classes[status] || '';
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Run
    // ─────────────────────────────────────────────────────────────────────────
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
