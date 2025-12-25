/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ BUYER DASHBOARD
 * منصة مشرق - لوحة تحكم المشتري
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // Page State
    // ─────────────────────────────────────────────────────────────────────────
    
    const state = {
        orders: [],
        stats: {
            total: 0,
            active: 0,
            completed: 0,
            totalSpent: 0,
        },
        isLoading: false,
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // DOM Elements
    // ─────────────────────────────────────────────────────────────────────────
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        userName: document.getElementById('userName'),
        totalOrders: document.getElementById('totalOrders'),
        activeOrders: document.getElementById('activeOrders'),
        completedOrders: document.getElementById('completedOrders'),
        totalSpent: document.getElementById('totalSpent'),
        ordersTableBody: document.getElementById('ordersTableBody'),
        ordersTableWrapper: document.getElementById('ordersTableWrapper'),
        ordersEmpty: document.getElementById('ordersEmpty'),
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // Initialize
    // ─────────────────────────────────────────────────────────────────────────
    
    async function init() {
        // Require authentication
        if (!Auth.requireAuth()) {
            return;
        }
        
        // Render components
        Navbar.render(elements.navbar);
        Footer.render(elements.footer);
        
        // Set user name
        const userName = Auth.getUserName() || Auth.getUsername();
        if (elements.userName) {
            elements.userName.textContent = userName;
        }
        
        // Load data
        await loadOrders();
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Load Orders
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadOrders() {
        state.isLoading = true;
        
        try {
            // Fetch buyer orders
            const response = await API.orders.getMyOrders();
            const data = response.data || response;
            state.orders = data.orders || data || [];
            
            // Calculate stats
            calculateStats();
            
            // Render
            renderStats();
            renderOrders();
            
        } catch (error) {
            console.error('Failed to load orders:', error);
            Toast.error('خطأ', 'تعذر تحميل الطلبات');
            renderOrdersError();
        } finally {
            state.isLoading = false;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Calculate Stats
    // ─────────────────────────────────────────────────────────────────────────
    
    function calculateStats() {
        state.stats.total = state.orders.length;
        
        state.stats.active = state.orders.filter(order => 
            ['pending', 'active', 'delivered'].includes(order.status)
        ).length;
        
        state.stats.completed = state.orders.filter(order => 
            order.status === 'completed'
        ).length;
        
        state.stats.totalSpent = state.orders
            .filter(order => order.status === 'completed')
            .reduce((sum, order) => sum + (order.totalPrice || order.price || 0), 0);
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Stats
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderStats() {
        if (elements.totalOrders) {
            elements.totalOrders.textContent = Utils.formatNumber(state.stats.total);
        }
        if (elements.activeOrders) {
            elements.activeOrders.textContent = Utils.formatNumber(state.stats.active);
        }
        if (elements.completedOrders) {
            elements.completedOrders.textContent = Utils.formatNumber(state.stats.completed);
        }
        if (elements.totalSpent) {
            elements.totalSpent.textContent = Utils.formatPrice(state.stats.totalSpent);
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Orders
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderOrders() {
        if (!elements.ordersTableBody) return;
        
        // Show empty state if no orders
        if (state.orders.length === 0) {
            if (elements.ordersTableWrapper) elements.ordersTableWrapper.style.display = 'none';
            if (elements.ordersEmpty) elements.ordersEmpty.style.display = 'flex';
            return;
        }
        
        if (elements.ordersTableWrapper) elements.ordersTableWrapper.style.display = 'block';
        if (elements.ordersEmpty) elements.ordersEmpty.style.display = 'none';
        
        // Show only last 5 orders
        const recentOrders = state.orders.slice(0, 5);
        
        elements.ordersTableBody.innerHTML = recentOrders.map(order => {
            const statusInfo = getStatusInfo(order.status);
            const serviceImage = order.service?.image || order.serviceSnapshot?.image || '';
            const serviceTitle = order.service?.title || order.serviceSnapshot?.title || 'خدمة';
            const sellerName = order.seller?.fullName || order.seller?.username || order.sellerName || 'بائع';
            const orderId = order._id || order.id;
            const orderPrice = order.totalPrice || order.price || 0;
            
            return `
                <tr>
                    <td>
                        <div class="order-service-cell">
                            ${serviceImage 
                                ? `<img src="${serviceImage}" alt="" class="order-service-image" onerror="this.style.display='none'">`
                                : ''
                            }
                            <div class="order-service-info">
                                <div class="order-service-title">${Utils.escapeHtml(serviceTitle)}</div>
                            </div>
                        </div>
                    </td>
                    <td>${Utils.escapeHtml(sellerName)}</td>
                    <td class="order-date">${Utils.formatRelativeDate(order.createdAt)}</td>
                    <td><span class="badge badge-${statusInfo.color}">${statusInfo.label}</span></td>
                    <td class="order-price">${Utils.formatPrice(orderPrice)}</td>
                    <td>
                        <a href="/app/order.html?id=${orderId}" class="btn btn-sm btn-outline-secondary">
                            عرض
                        </a>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    function renderOrdersError() {
        if (!elements.ordersTableBody) return;
        
        elements.ordersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-8 text-muted">
                    تعذر تحميل الطلبات. 
                    <button class="btn btn-sm btn-link" onclick="location.reload()">إعادة المحاولة</button>
                </td>
            </tr>
        `;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
    
    function getStatusInfo(status) {
        const statuses = CONFIG.ORDER_STATUSES || {
            pending: { label: 'قيد الانتظار', color: 'warning' },
            active: { label: 'نشط', color: 'info' },
            delivered: { label: 'تم التسليم', color: 'primary' },
            completed: { label: 'مكتمل', color: 'success' },
            cancelled: { label: 'ملغي', color: 'error' },
            disputed: { label: 'متنازع عليه', color: 'warning' },
        };
        
        return statuses[status] || { label: status, color: 'secondary' };
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
