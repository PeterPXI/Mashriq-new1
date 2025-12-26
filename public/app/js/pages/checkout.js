/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ CHECKOUT PAGE
 * منصة مشرق - صفحة إتمام الطلب
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // Page State
    // ─────────────────────────────────────────────────────────────────────────
    
    const state = {
        service: null,
        seller: null,
        isLoading: false,
        isSubmitting: false,
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // DOM Elements
    // ─────────────────────────────────────────────────────────────────────────
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        checkoutContent: document.getElementById('checkoutContent'),
        checkoutError: document.getElementById('checkoutError'),
        errorMessage: document.getElementById('errorMessage'),
        serviceLink: document.getElementById('serviceLink'),
        serviceSummary: document.getElementById('serviceSummary'),
        sellerSummary: document.getElementById('sellerSummary'),
        deliveryTime: document.getElementById('deliveryTime'),
        revisions: document.getElementById('revisions'),
        buyerNotes: document.getElementById('buyerNotes'),
        basePrice: document.getElementById('basePrice'),
        extrasRow: document.getElementById('extrasRow'),
        extrasPrice: document.getElementById('extrasPrice'),
        feeRow: document.getElementById('feeRow'),
        serviceFee: document.getElementById('serviceFee'),
        totalPrice: document.getElementById('totalPrice'),
        confirmOrderBtn: document.getElementById('confirmOrderBtn'),
        successModal: document.getElementById('successModal'),
        viewOrderBtn: document.getElementById('viewOrderBtn'),
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
        
        // Get service ID from URL
        const serviceId = Utils.getUrlParam('service') || Utils.getUrlParam('id');
        
        if (!serviceId) {
            showError('لم يتم تحديد الخدمة المطلوبة');
            return;
        }
        
        // Load service data
        await loadService(serviceId);
        
        // Bind events
        bindEvents();
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Load Service
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadService(serviceId) {
        state.isLoading = true;
        
        try {
            const response = await API.services.getById(serviceId);
            const data = response.data || response;
            state.service = data.service || data;
            
            if (!state.service) {
                showError('الخدمة غير موجودة');
                return;
            }
            
            // Check if user is trying to buy their own service
            const userId = Auth.getUserId();
            const sellerId = state.service.sellerId?._id || state.service.sellerId;
            
            if (userId === sellerId) {
                showError('لا يمكنك طلب خدمتك الخاصة');
                return;
            }
            
            // Render the page
            renderServiceSummary();
            renderSellerSummary();
            renderDeliveryDetails();
            renderPricing();
            updateBreadcrumb();
            
        } catch (error) {
            console.error('Failed to load service:', error);
            showError(error.message || 'تعذر تحميل بيانات الخدمة');
        } finally {
            state.isLoading = false;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Service Summary
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderServiceSummary() {
        if (!elements.serviceSummary || !state.service) return;
        
        const service = state.service;
        const image = service.imageUrls?.[0] || service.image || '';
        const category = getCategoryInfo(service.categoryId);
        
        elements.serviceSummary.innerHTML = `
            <div class="service-summary-image">
                ${image 
                    ? `<img src="${image}" alt="${Utils.escapeHtml(service.title)}" onerror="this.src='/app/assets/images/placeholder.svg'">`
                    : `<div class="placeholder-image">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                            <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                        </svg>
                    </div>`
                }
            </div>
            <div class="service-summary-info">
                <h3 class="service-summary-title">${Utils.escapeHtml(service.title)}</h3>
                <span class="service-summary-category">
                    <span class="category-icon">${category.icon}</span>
                    ${category.name}
                </span>
            </div>
        `;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Seller Summary
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderSellerSummary() {
        if (!elements.sellerSummary || !state.service) return;
        
        const seller = state.service.seller || state.service.sellerId || {};
        const sellerName = seller.fullName || seller.username || 'البائع';
        const sellerAvatar = seller.avatarUrl;
        const initial = sellerName.charAt(0).toUpperCase();
        
        elements.sellerSummary.innerHTML = `
            <div class="seller-avatar">
                ${sellerAvatar 
                    ? `<img src="${sellerAvatar}" alt="${Utils.escapeHtml(sellerName)}">`
                    : initial
                }
            </div>
            <div class="seller-info">
                <div class="seller-name">${Utils.escapeHtml(sellerName)}</div>
                <div class="seller-meta">
                    <span class="seller-rating">
                        <svg width="14" height="14" viewBox="0 0 24 24">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                        ${(seller.rating || 5.0).toFixed(1)}
                    </span>
                    <span>•</span>
                    <span>بائع موثوق</span>
                </div>
            </div>
        `;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Delivery Details
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderDeliveryDetails() {
        if (!state.service) return;
        
        const service = state.service;
        const deliveryDays = service.deliveryDays || service.deliveryTime || 3;
        const revisions = service.revisions || 0;
        
        if (elements.deliveryTime) {
            elements.deliveryTime.textContent = `${deliveryDays} ${deliveryDays === 1 ? 'يوم' : 'أيام'}`;
        }
        
        if (elements.revisions) {
            elements.revisions.textContent = revisions === 0 ? 'غير محدود' : `${revisions} تعديل`;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Pricing
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderPricing() {
        if (!state.service) return;
        
        const service = state.service;
        const basePrice = service.basePrice || service.price || 0;
        
        if (elements.basePrice) {
            elements.basePrice.textContent = Utils.formatPrice(basePrice);
        }
        
        // For now, total = base price (no extras selected)
        const total = basePrice;
        
        if (elements.totalPrice) {
            elements.totalPrice.textContent = Utils.formatPrice(total);
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Update Breadcrumb
    // ─────────────────────────────────────────────────────────────────────────
    
    function updateBreadcrumb() {
        if (!state.service) return;
        
        const serviceId = state.service._id || state.service.id;
        
        if (elements.serviceLink) {
            elements.serviceLink.href = `/app/service.html?id=${serviceId}`;
            elements.serviceLink.textContent = Utils.truncate(state.service.title, 30);
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Bind Events
    // ─────────────────────────────────────────────────────────────────────────
    
    function bindEvents() {
        // Confirm order button
        elements.confirmOrderBtn?.addEventListener('click', handleConfirmOrder);
        
        // Close modal on overlay click
        elements.successModal?.addEventListener('click', (e) => {
            if (e.target === elements.successModal) {
                // Don't close - force user to use buttons
            }
        });
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Handle Confirm Order
    // ─────────────────────────────────────────────────────────────────────────
    
    async function handleConfirmOrder() {
        if (state.isSubmitting || !state.service) return;
        
        state.isSubmitting = true;
        Loader.buttonStart(elements.confirmOrderBtn);
        
        try {
            const serviceId = state.service._id || state.service.id;
            const notes = elements.buyerNotes?.value.trim() || '';
            
            // Create order
            const response = await API.orders.create({
                serviceId: serviceId,
                notes: notes,
            });
            
            const data = response.data || response;
            const order = data.order || data;
            const orderId = order._id || order.id;
            
            // Update view order button
            if (elements.viewOrderBtn && orderId) {
                elements.viewOrderBtn.href = `/app/order.html?id=${orderId}`;
            }
            
            // Show success modal
            showSuccessModal();
            
            // Show toast
            Toast.success('تم بنجاح!', 'تم إنشاء طلبك بنجاح');
            
        } catch (error) {
            console.error('Failed to create order:', error);
            Toast.error('خطأ', error.message || 'فشل إنشاء الطلب. يرجى المحاولة مرة أخرى.');
        } finally {
            state.isSubmitting = false;
            Loader.buttonStop(elements.confirmOrderBtn);
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Show Success Modal
    // ─────────────────────────────────────────────────────────────────────────
    
    function showSuccessModal() {
        if (!elements.successModal) return;
        
        elements.successModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Show Error
    // ─────────────────────────────────────────────────────────────────────────
    
    function showError(message) {
        if (elements.checkoutContent) {
            elements.checkoutContent.style.display = 'none';
        }
        
        if (elements.checkoutError) {
            elements.checkoutError.style.display = 'block';
        }
        
        if (elements.errorMessage) {
            elements.errorMessage.textContent = message;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
    
    function getCategoryInfo(categoryId) {
        const category = CONFIG.CATEGORIES?.find(c => c.id === categoryId);
        return category || { id: categoryId, name: 'أخرى', icon: '📦' };
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
