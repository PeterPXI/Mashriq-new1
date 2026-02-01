/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ SELLER DASHBOARD
 * منصة مشرق - لوحة تحكم البائع
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // Page State
    // ─────────────────────────────────────────────────────────────────────────
    
    const state = {
        orders: [],
        services: [],
        stats: {
            totalServices: 0,
            activeOrders: 0,
            completedOrders: 0,
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
        userName: document.getElementById('userName'),
        totalServices: document.getElementById('totalServices'),
        activeOrders: document.getElementById('activeOrders'),
        completedOrders: document.getElementById('completedOrders'),
        totalEarnings: document.getElementById('totalEarnings'),
        ordersTableBody: document.getElementById('ordersTableBody'),
        ordersTableWrapper: document.getElementById('ordersTableWrapper'),
        ordersEmpty: document.getElementById('ordersEmpty'),
        servicesTableBody: document.getElementById('servicesTableBody'),
        servicesTableWrapper: document.getElementById('servicesTableWrapper'),
        servicesEmpty: document.getElementById('servicesEmpty'),
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // Initialize
    // ─────────────────────────────────────────────────────────────────────────
    
    async function init() {
        // Require seller authentication
        if (!Auth.requireAuth()) {
            return;
        }
        
        // Check if user is seller
        if (!Auth.isSeller()) {
            Toast.warning('تنبيه', 'يجب تفعيل وضع البائع للوصول لهذه الصفحة');
            window.location.href = CONFIG.ROUTES.BUYER_DASHBOARD;
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
        
        // Load data in parallel
        await Promise.all([
            loadOrders(),
            loadServices(),
        ]);
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Load Orders
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadOrders() {
        try {
            const response = await API.orders.getSellerOrders();
            const data = response.data || response;
            state.orders = data.orders || data || [];
            
            // Calculate order stats
            state.stats.activeOrders = state.orders.filter(order => 
                ['pending', 'active', 'delivered'].includes(order.status)
            ).length;
            
            state.stats.completedOrders = state.orders.filter(order => 
                order.status === 'completed'
            ).length;
            
            state.stats.totalEarnings = state.orders
                .filter(order => order.status === 'completed')
                .reduce((sum, order) => sum + (order.totalPrice || order.price || 0), 0);
            
            // Render
            renderOrderStats();
            renderOrders();
            
        } catch (error) {
            console.error('Failed to load orders:', error);
            renderOrdersError();
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Load Services
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadServices() {
        try {
            const response = await API.services.getMyServices();
            const data = response.data || response;
            state.services = data.services || data || [];
            
            state.stats.totalServices = state.services.length;
            
            // Render
            renderServiceStats();
            renderServices();
            
        } catch (error) {
            console.error('Failed to load services:', error);
            renderServicesError();
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Stats
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderOrderStats() {
        if (elements.activeOrders) {
            elements.activeOrders.textContent = Utils.formatNumber(state.stats.activeOrders);
        }
        if (elements.completedOrders) {
            elements.completedOrders.textContent = Utils.formatNumber(state.stats.completedOrders);
        }
        if (elements.totalEarnings) {
            elements.totalEarnings.textContent = Utils.formatPrice(state.stats.totalEarnings);
        }
    }
    
    function renderServiceStats() {
        if (elements.totalServices) {
            elements.totalServices.textContent = Utils.formatNumber(state.stats.totalServices);
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Orders
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderOrders() {
        if (!elements.ordersTableBody) return;
        
        if (state.orders.length === 0) {
            if (elements.ordersTableWrapper) elements.ordersTableWrapper.style.display = 'none';
            if (elements.ordersEmpty) {
                elements.ordersEmpty.classList.remove('hidden');
                elements.ordersEmpty.style.display = 'block';
            }
            return;
        }
        
        if (elements.ordersTableWrapper) elements.ordersTableWrapper.style.display = 'block';
        if (elements.ordersEmpty) {
            elements.ordersEmpty.classList.add('hidden');
            elements.ordersEmpty.style.display = 'none';
        }
        
        const recentOrders = state.orders.slice(0, 5);
        
        elements.ordersTableBody.innerHTML = recentOrders.map(order => {
            const statusInfo = getStatusInfo(order.status);
            const serviceImage = order.service?.image || order.serviceSnapshot?.image || '';
            const serviceTitle = order.service?.title || order.serviceSnapshot?.title || 'خدمة';
            const buyerName = order.buyer?.fullName || order.buyer?.username || order.buyerName || 'عميل';
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
                    <td>${Utils.escapeHtml(buyerName)}</td>
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
                </td>
            </tr>
        `;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Services
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderServices() {
        if (!elements.servicesTableBody) return;
        
        if (state.services.length === 0) {
            if (elements.servicesTableWrapper) elements.servicesTableWrapper.style.display = 'none';
            if (elements.servicesEmpty) {
                elements.servicesEmpty.classList.remove('hidden');
                elements.servicesEmpty.style.display = 'block';
            }
            return;
        }
        
        if (elements.servicesTableWrapper) elements.servicesTableWrapper.style.display = 'block';
        if (elements.servicesEmpty) {
            elements.servicesEmpty.classList.add('hidden');
            elements.servicesEmpty.style.display = 'none';
        }
        
        const recentServices = state.services.slice(0, 5);
        
        elements.servicesTableBody.innerHTML = recentServices.map(service => {
            const serviceId = service._id || service.id;
            // SINGLE SOURCE OF TRUTH: imageUrl
            const PLACEHOLDER = '/app/assets/images/service-placeholder.svg';
            const serviceImage = service.imageUrl || (service.imageUrls && service.imageUrls[0]) || PLACEHOLDER;
            const serviceRating = service.rating || service.averageRating || 0;
            const serviceOrders = service.ordersCount || service.totalOrders || 0;
            const servicePrice = service.price || service.basePrice || 0;
            const isActive = service.status === 'active';
            
        return `
                <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td class="py-3">
                        <div class="service-cell flex items-center gap-3">
                            <img src="${serviceImage}" alt="" class="service-cell-image rounded-lg object-cover flex-shrink-0" style="width: 80px; height: 56px;" onerror="this.src='/app/assets/images/service-placeholder.svg'">
                            <span class="service-cell-title font-medium text-gray-900 line-clamp-2">${Utils.escapeHtml(service.title)}</span>
                        </div>
                    </td>
                    <td class="order-price">${Utils.formatPrice(servicePrice)}</td>
                    <td>
                        <span class="service-stat">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                            </svg>
                            ${serviceOrders}
                        </span>
                    </td>
                    <td>
                        <span class="service-stat">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="color: var(--color-warning-500)">
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                            </svg>
                            ${serviceRating.toFixed(1)}
                        </span>
                    </td>
                    <td>
                        <span class="badge badge-${isActive ? 'success' : 'secondary'}">
                            ${isActive ? 'نشط' : 'متوقف'}
                        </span>
                    </td>
                    <td>
                        <div class="order-actions">
                            <a href="/app/service.html?id=${serviceId}" class="btn btn-sm btn-outline-secondary">عرض</a>
                            <a href="/app/seller/edit-service.html?id=${serviceId}" class="btn btn-sm btn-secondary">تعديل</a>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    function renderServicesError() {
        if (!elements.servicesTableBody) return;
        
        elements.servicesTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-8 text-muted">
                    تعذر تحميل الخدمات.
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
