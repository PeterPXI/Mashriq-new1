/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ SELLER ORDERS PAGE
 * منصة مشرق - صفحة طلبات البائع
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // Page State
    // ─────────────────────────────────────────────────────────────────────────
    
    const state = {
        orders: [],
        filteredOrders: [],
        currentFilter: 'all',
        stats: {
            total: 0,
            pending: 0,
            active: 0,
            delivered: 0,
            completed: 0,
            totalEarnings: 0,
        },
        isLoading: false,
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // DOM Elements
    // ─────────────────────────────────────────────────────────────────────────
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        ordersList: document.getElementById('ordersList'),
        emptyState: document.getElementById('emptyState'),
        noResults: document.getElementById('noResults'),
        statusTabs: document.getElementById('statusTabs'),
        // Stats
        totalOrders: document.getElementById('totalOrders'),
        pendingOrders: document.getElementById('pendingOrders'),
        activeOrders: document.getElementById('activeOrders'),
        totalEarnings: document.getElementById('totalEarnings'),
        // Counts
        countAll: document.getElementById('countAll'),
        countPending: document.getElementById('countPending'),
        countActive: document.getElementById('countActive'),
        countDelivered: document.getElementById('countDelivered'),
        countCompleted: document.getElementById('countCompleted'),
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // Initialize
    // ─────────────────────────────────────────────────────────────────────────
    
    async function init() {
        // Require authentication
        if (!Auth.requireAuth()) {
            return;
        }
        
        // Require seller role
        if (!Auth.isSeller()) {
            Toast.warning('تنبيه', 'هذه الصفحة متاحة للبائعين فقط');
            window.location.href = CONFIG.ROUTES.BUYER_DASHBOARD;
            return;
        }
        
        // Render components
        Navbar.render(elements.navbar);
        Footer.render(elements.footer);
        
        // Bind events
        bindEvents();
        
        // Load orders
        await loadOrders();
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Load Orders
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadOrders() {
        state.isLoading = true;
        
        try {
            const response = await API.orders.getSellerOrders();
            const data = response.data || response;
            state.orders = data.orders || data || [];
            
            // Calculate stats
            calculateStats();
            
            // Apply current filter
            applyFilter(state.currentFilter);
            
            // Render stats
            renderStats();
            renderCounts();
            
        } catch (error) {
            console.error('Failed to load orders:', error);
            Toast.error('خطأ', 'تعذر تحميل الطلبات');
            showEmptyState();
        } finally {
            state.isLoading = false;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Calculate Stats
    // ─────────────────────────────────────────────────────────────────────────
    
    function calculateStats() {
        state.stats.total = state.orders.length;
        
        state.stats.pending = state.orders.filter(o => 
            o.status === 'pending'
        ).length;
        
        state.stats.active = state.orders.filter(o => 
            o.status === 'active'
        ).length;
        
        state.stats.delivered = state.orders.filter(o => 
            o.status === 'delivered'
        ).length;
        
        state.stats.completed = state.orders.filter(o => 
            o.status === 'completed'
        ).length;
        
        state.stats.totalEarnings = state.orders
            .filter(o => o.status === 'completed')
            .reduce((sum, o) => sum + (o.totalPrice || o.price || 0), 0);
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Stats
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderStats() {
        if (elements.totalOrders) {
            elements.totalOrders.textContent = Utils.formatNumber(state.stats.total);
        }
        if (elements.pendingOrders) {
            elements.pendingOrders.textContent = Utils.formatNumber(state.stats.pending);
        }
        if (elements.activeOrders) {
            elements.activeOrders.textContent = Utils.formatNumber(state.stats.active);
        }
        if (elements.totalEarnings) {
            elements.totalEarnings.textContent = Utils.formatPrice(state.stats.totalEarnings);
        }
    }
    
    function renderCounts() {
        if (elements.countAll) elements.countAll.textContent = state.stats.total;
        if (elements.countPending) elements.countPending.textContent = state.stats.pending;
        if (elements.countActive) elements.countActive.textContent = state.stats.active;
        if (elements.countDelivered) elements.countDelivered.textContent = state.stats.delivered;
        if (elements.countCompleted) elements.countCompleted.textContent = state.stats.completed;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Bind Events
    // ─────────────────────────────────────────────────────────────────────────
    
    function bindEvents() {
        // Status tabs
        elements.statusTabs?.addEventListener('click', (e) => {
            const tab = e.target.closest('.filter-tab');
            if (!tab) return;
            
            const status = tab.dataset.status;
            applyFilter(status);
            
            // Update active tab
            elements.statusTabs.querySelectorAll('.filter-tab').forEach(t => {
                t.classList.toggle('active', t === tab);
            });
        });
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Apply Filter
    // ─────────────────────────────────────────────────────────────────────────
    
    function applyFilter(status) {
        state.currentFilter = status;
        
        if (status === 'all') {
            state.filteredOrders = [...state.orders];
        } else {
            state.filteredOrders = state.orders.filter(o => o.status === status);
        }
        
        renderOrders();
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Orders
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderOrders() {
        if (!elements.ordersList) return;
        
        // No orders at all
        if (state.orders.length === 0) {
            showEmptyState();
            return;
        }
        
        // No orders matching filter
        if (state.filteredOrders.length === 0) {
            showNoResults();
            return;
        }
        
        // Hide states
        hideStates();
        
        // Render orders
        elements.ordersList.innerHTML = state.filteredOrders.map(order => renderOrderCard(order)).join('');
    }
    
    function renderOrderCard(order) {
        const orderId = order._id || order.id;
        const serviceImage = order.service?.image || order.serviceSnapshot?.image || order.serviceSnapshot?.imageUrls?.[0] || '';
        const serviceTitle = order.service?.title || order.serviceSnapshot?.title || 'خدمة';
        const buyerName = order.buyer?.fullName || order.buyer?.username || order.buyerName || 'المشتري';
        const orderPrice = order.totalPrice || order.price || 0;
        const statusInfo = getStatusInfo(order.status);
        const createdDate = Utils.formatRelativeDate(order.createdAt);
        const deadline = order.deadline ? getDeadlineInfo(order.deadline) : null;
        
        return `
            <div class="order-card">
                <div class="order-card-content">
                    <div class="order-card-image">
                        ${serviceImage 
                            ? `<img src="${serviceImage}" alt="${Utils.escapeHtml(serviceTitle)}" onerror="this.style.display='none'">`
                            : `<div class="placeholder-image">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                                </svg>
                            </div>`
                        }
                    </div>
                    <div class="order-card-body">
                        <div class="order-card-header">
                            <h3 class="order-card-title">
                                <a href="/app/order.html?id=${orderId}">${Utils.escapeHtml(serviceTitle)}</a>
                            </h3>
                            <span class="order-status order-status-${order.status}">
                                ${statusInfo.icon}
                                ${statusInfo.label}
                            </span>
                        </div>
                        <div class="order-card-meta">
                            <span class="order-card-meta-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                                ${Utils.escapeHtml(buyerName)}
                            </span>
                            <span class="order-card-meta-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                ${createdDate}
                            </span>
                            ${deadline ? `
                                <span class="deadline-indicator ${deadline.urgency}">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <polyline points="12,6 12,12 16,14"/>
                                    </svg>
                                    ${deadline.text}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="order-card-footer">
                    <span class="order-card-price">${Utils.formatPrice(orderPrice)}</span>
                    <div class="order-card-actions">
                        <a href="/app/order.html?id=${orderId}" class="btn btn-sm btn-primary">
                            عرض التفاصيل
                        </a>
                        ${order.status === 'active' ? `
                            <button class="btn btn-sm btn-success" onclick="deliverOrder('${orderId}')">
                                تسليم الطلب
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // State Views
    // ─────────────────────────────────────────────────────────────────────────
    
    function showEmptyState() {
        if (elements.ordersList) elements.ordersList.innerHTML = '';
        if (elements.emptyState) elements.emptyState.style.display = 'block';
        if (elements.noResults) elements.noResults.style.display = 'none';
    }
    
    function showNoResults() {
        if (elements.ordersList) elements.ordersList.innerHTML = '';
        if (elements.emptyState) elements.emptyState.style.display = 'none';
        if (elements.noResults) elements.noResults.style.display = 'block';
    }
    
    function hideStates() {
        if (elements.emptyState) elements.emptyState.style.display = 'none';
        if (elements.noResults) elements.noResults.style.display = 'none';
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
    
    function getStatusInfo(status) {
        const statuses = {
            pending: { 
                label: 'بانتظار القبول', 
                icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>'
            },
            active: { 
                label: 'قيد التنفيذ', 
                icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'
            },
            delivered: { 
                label: 'تم التسليم', 
                icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>'
            },
            completed: { 
                label: 'مكتمل', 
                icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>'
            },
            cancelled: { 
                label: 'ملغي', 
                icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
            },
        };
        
        return statuses[status] || { label: status, icon: '' };
    }
    
    function getDeadlineInfo(deadline) {
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diff = deadlineDate - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        
        if (days < 0) {
            return { text: `متأخر ${Math.abs(days)} يوم`, urgency: 'urgent' };
        } else if (days === 0) {
            return { text: 'اليوم', urgency: 'urgent' };
        } else if (days === 1) {
            return { text: 'غداً', urgency: 'warning' };
        } else if (days <= 3) {
            return { text: `${days} أيام`, urgency: 'warning' };
        } else {
            return { text: `${days} يوم`, urgency: 'safe' };
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Global Actions
    // ─────────────────────────────────────────────────────────────────────────
    
    window.deliverOrder = async function(orderId) {
        if (!confirm('هل أنت متأكد من تسليم الطلب؟')) return;
        
        try {
            await API.orders.deliver(orderId, {});
            Toast.success('تم بنجاح!', 'تم تسليم الطلب وإرساله للمشتري للمراجعة');
            await loadOrders();
        } catch (error) {
            console.error('Deliver order error:', error);
            Toast.error('خطأ', error.message || 'فشل تسليم الطلب');
        }
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // Run
    // ─────────────────────────────────────────────────────────────────────────
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
