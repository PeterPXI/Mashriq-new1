(function() {
    'use strict';
    
    const state = {
        notifications: [],
        unreadCount: 0,
        isLoading: false,
    };
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        notificationsLoading: document.getElementById('notificationsLoading'),
        notificationsList: document.getElementById('notificationsList'),
        emptyState: document.getElementById('emptyState'),
        markAllReadBtn: document.getElementById('markAllReadBtn'),
    };
    
    const NOTIFICATION_ICONS = {
        new_order: { icon: '📦', bg: 'bg-blue-100', color: 'text-blue-600' },
        order_delivered: { icon: '✅', bg: 'bg-green-100', color: 'text-green-600' },
        order_completed: { icon: '🎉', bg: 'bg-green-100', color: 'text-green-600' },
        order_cancelled: { icon: '❌', bg: 'bg-red-100', color: 'text-red-600' },
        new_message: { icon: '💬', bg: 'bg-primary-100', color: 'text-primary-600' },
        new_review: { icon: '⭐', bg: 'bg-yellow-100', color: 'text-yellow-600' },
        dispute_opened: { icon: '⚠️', bg: 'bg-orange-100', color: 'text-orange-600' },
        dispute_resolved: { icon: '⚖️', bg: 'bg-purple-100', color: 'text-purple-600' },
        wallet_deposit: { icon: '💰', bg: 'bg-green-100', color: 'text-green-600' },
        wallet_withdrawal: { icon: '💸', bg: 'bg-blue-100', color: 'text-blue-600' },
        system: { icon: '🔔', bg: 'bg-gray-100', color: 'text-gray-600' },
    };
    
    async function init() {
        if (!Auth.requireAuth()) {
            return;
        }
        
        Navbar.render(elements.navbar);
        Footer.render(elements.footer);
        
        bindEvents();
        await loadNotifications();
    }
    
    function bindEvents() {
        elements.markAllReadBtn?.addEventListener('click', markAllAsRead);
    }
    
    async function loadNotifications() {
        state.isLoading = true;
        elements.notificationsLoading.classList.remove('hidden');
        elements.notificationsList.classList.add('hidden');
        elements.emptyState.classList.add('hidden');
        
        try {
            const response = await API.get('/notifications');
            const data = response.data || response;
            state.notifications = data.notifications || [];
            state.unreadCount = data.unreadCount || 0;
            
            if (state.unreadCount > 0) {
                elements.markAllReadBtn.classList.remove('hidden');
            }
            
            if (state.notifications.length === 0) {
                showEmptyState();
            } else {
                renderNotifications();
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
            Toast.error('خطأ', 'تعذر تحميل الإشعارات');
            showEmptyState();
        } finally {
            state.isLoading = false;
            elements.notificationsLoading.classList.add('hidden');
        }
    }
    
    function renderNotifications() {
        elements.notificationsList.classList.remove('hidden');
        elements.emptyState.classList.add('hidden');
        
        elements.notificationsList.innerHTML = state.notifications.map(notif => {
            const iconInfo = NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.system;
            const timeAgo = formatTimeAgo(notif.createdAt);
            
            return `
                <div class="notification-item bg-white rounded-xl shadow-sm p-4 cursor-pointer ${notif.isRead ? '' : 'unread'}" 
                     data-id="${notif._id}" 
                     data-link="${notif.link || ''}"
                     onclick="window.handleNotificationClick(this)">
                    <div class="flex gap-4">
                        <div class="notification-icon ${iconInfo.bg} flex-shrink-0">
                            <span class="text-xl">${iconInfo.icon}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between mb-1">
                                <h3 class="font-semibold text-gray-900">${Utils.escapeHtml(notif.title)}</h3>
                                <span class="text-xs text-gray-400 flex-shrink-0 mr-2">${timeAgo}</span>
                            </div>
                            <p class="text-sm text-gray-600">${Utils.escapeHtml(notif.message)}</p>
                        </div>
                        ${!notif.isRead ? '<div class="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 self-center"></div>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    window.handleNotificationClick = async function(element) {
        const id = element.dataset.id;
        const link = element.dataset.link;
        
        try {
            await API.put(`/notifications/${id}/read`);
            element.classList.remove('unread');
            const dot = element.querySelector('.bg-primary-500');
            if (dot) dot.remove();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
        
        if (link) {
            window.location.href = link;
        }
    };
    
    async function markAllAsRead() {
        try {
            await API.put('/notifications/read-all');
            
            document.querySelectorAll('.notification-item.unread').forEach(el => {
                el.classList.remove('unread');
                const dot = el.querySelector('.bg-primary-500');
                if (dot) dot.remove();
            });
            
            elements.markAllReadBtn.classList.add('hidden');
            Toast.success('تم', 'تم تحديد جميع الإشعارات كمقروءة');
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            Toast.error('خطأ', 'حدث خطأ في تحديث الإشعارات');
        }
    }
    
    function showEmptyState() {
        elements.notificationsList.classList.add('hidden');
        elements.emptyState.classList.remove('hidden');
    }
    
    function formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays === 1) return 'أمس';
        if (diffDays < 7) return `منذ ${diffDays} أيام`;
        return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
