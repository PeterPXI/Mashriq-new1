/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ ORDER DETAIL PAGE
 * منصة مشرق - صفحة تفاصيل الطلب
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // Page State
    // ─────────────────────────────────────────────────────────────────────────
    
    const state = {
        orderId: null,
        order: null,
        chat: null,
        messages: [],
        isLoading: false,
        isBuyer: false,
        isSeller: false,
        selectedRating: 5,
        // Chat enhancements
        chatPollingInterval: null,
        typingTimeout: null,
        isTyping: false,
        otherUserTyping: false,
        lastMessageId: null,
        canSendMessages: true,
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // Timeline Steps
    // ─────────────────────────────────────────────────────────────────────────
    
    const TIMELINE_STEPS = [
        {
            id: 'pending',
            title: 'تم إنشاء الطلب',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>`
        },
        {
            id: 'active',
            title: 'جاري العمل',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
            </svg>`
        },
        {
            id: 'delivered',
            title: 'تم التسليم',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>`
        },
        {
            id: 'completed',
            title: 'مكتمل',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>`
        },
    ];
    
    // ─────────────────────────────────────────────────────────────────────────
    // DOM Elements
    // ─────────────────────────────────────────────────────────────────────────
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        ordersLink: document.getElementById('ordersLink'),
        orderNumber: document.getElementById('orderNumber'),
        orderHeader: document.getElementById('orderHeader'),
        orderTimeline: document.getElementById('orderTimeline'),
        serviceInfo: document.getElementById('serviceInfo'),
        requirementsSection: document.getElementById('requirementsSection'),
        requirementsContent: document.getElementById('requirementsContent'),
        deliverySection: document.getElementById('deliverySection'),
        deliveryContent: document.getElementById('deliveryContent'),
        orderActions: document.getElementById('orderActions'),
        orderSummary: document.getElementById('orderSummary'),
        userCard: document.getElementById('userCard'),
        chatBtn: document.getElementById('chatBtn'),
        // Modals
        deliveryModal: document.getElementById('deliveryModal'),
        closeDeliveryModal: document.getElementById('closeDeliveryModal'),
        cancelDelivery: document.getElementById('cancelDelivery'),
        deliveryForm: document.getElementById('deliveryForm'),
        deliveryMessage: document.getElementById('deliveryMessage'),
        deliveryFiles: document.getElementById('deliveryFiles'),
        reviewModal: document.getElementById('reviewModal'),
        closeReviewModal: document.getElementById('closeReviewModal'),
        cancelReview: document.getElementById('cancelReview'),
        reviewForm: document.getElementById('reviewForm'),
        ratingInput: document.getElementById('ratingInput'),
        ratingValue: document.getElementById('ratingValue'),
        reviewComment: document.getElementById('reviewComment'),
        // Chat elements
        chatSection: document.getElementById('chatSection'),
        chatStatus: document.getElementById('chatStatus'),
        messagesContainer: document.getElementById('messagesContainer'),
        messageForm: document.getElementById('messageForm'),
        messageInput: document.getElementById('messageInput'),
        sendBtn: document.getElementById('sendBtn'),
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
        
        // Get order ID from URL
        state.orderId = Utils.getUrlParam('id');
        
        if (!state.orderId) {
            renderError('لم يتم تحديد الطلب');
            return;
        }
        
        // Update orders link based on role
        updateOrdersLink();
        
        // Bind events
        bindEvents();
        
        // Load order data
        await loadOrder();
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Update Orders Link
    // ─────────────────────────────────────────────────────────────────────────
    
    function updateOrdersLink() {
        if (elements.ordersLink) {
            elements.ordersLink.href = Auth.isSeller() 
                ? '/app/seller/orders.html' 
                : '/app/buyer/orders.html';
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Bind Events
    // ─────────────────────────────────────────────────────────────────────────
    
    function bindEvents() {
        // Delivery modal
        elements.closeDeliveryModal?.addEventListener('click', closeDeliveryModal);
        elements.cancelDelivery?.addEventListener('click', closeDeliveryModal);
        elements.deliveryForm?.addEventListener('submit', handleDeliverySubmit);
        
        // Review modal
        elements.closeReviewModal?.addEventListener('click', closeReviewModal);
        elements.cancelReview?.addEventListener('click', closeReviewModal);
        elements.reviewForm?.addEventListener('submit', handleReviewSubmit);
        
        // Rating input
        const ratingBtns = elements.ratingInput?.querySelectorAll('.rating-star-btn');
        ratingBtns?.forEach(btn => {
            btn.addEventListener('click', () => {
                state.selectedRating = parseInt(btn.dataset.rating);
                elements.ratingValue.value = state.selectedRating;
                updateRatingDisplay();
            });
        });
        
        // Close modals on overlay click
        elements.deliveryModal?.addEventListener('click', (e) => {
            if (e.target === elements.deliveryModal) closeDeliveryModal();
        });
        elements.reviewModal?.addEventListener('click', (e) => {
            if (e.target === elements.reviewModal) closeReviewModal();
        });
        
        // Message form
        elements.messageForm?.addEventListener('submit', handleSendMessage);
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Load Order
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadOrder() {
        state.isLoading = true;
        
        try {
            const response = await API.orders.getById(state.orderId);
            const data = response.data || response;
            state.order = data.order || data;
            
            // Determine user role
            const currentUserId = Auth.getUserId();
            state.isBuyer = state.order.buyer?._id === currentUserId || state.order.buyer === currentUserId;
            state.isSeller = state.order.seller?._id === currentUserId || state.order.seller === currentUserId;
            
            // Render order
            renderOrderHeader();
            renderTimeline();
            renderServiceInfo();
            renderRequirements();
            renderDelivery();
            renderActions();
            renderSummary();
            renderUserCard();
            
            // Set chat button link
            if (elements.chatBtn) {
                elements.chatBtn.href = `/app/messages.html?order=${state.orderId}`;
            }
            
            // Load chat messages
            await loadChat();
            
        } catch (error) {
            console.error('Failed to load order:', error);
            renderError(error.message || 'تعذر تحميل الطلب');
        } finally {
            state.isLoading = false;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Order Header
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderOrderHeader() {
        if (!elements.orderHeader) return;
        
        const { _id, id, status, createdAt } = state.order;
        const orderId = _id || id;
        const statusInfo = getStatusInfo(status);
        
        // Update breadcrumb
        if (elements.orderNumber) {
            elements.orderNumber.textContent = `#${orderId.substring(0, 8)}`;
        }
        
        elements.orderHeader.innerHTML = `
            <div class="order-header-content">
                <div class="order-header-info">
                    <h1 class="order-title">طلب #${orderId.substring(0, 8)}</h1>
                    <div class="order-meta">
                        <span class="order-meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            ${Utils.formatDate(createdAt)}
                        </span>
                    </div>
                </div>
                <span class="order-status badge badge-${statusInfo.color}">${statusInfo.label}</span>
            </div>
        `;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Timeline
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderTimeline() {
        if (!elements.orderTimeline) return;
        
        const { status, createdAt, startedAt, deliveredAt, completedAt, cancelledAt } = state.order;
        
        // Get status index
        const statusOrder = ['pending', 'active', 'delivered', 'completed'];
        const currentIndex = statusOrder.indexOf(status);
        
        // Handle cancelled status
        if (status === 'cancelled') {
            elements.orderTimeline.innerHTML = `
                <div class="timeline-item completed">
                    <div class="timeline-icon">
                        ${TIMELINE_STEPS[0].icon}
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-title">${TIMELINE_STEPS[0].title}</div>
                        <div class="timeline-date">${Utils.formatDate(createdAt)}</div>
                    </div>
                </div>
                <div class="timeline-item current" style="--timeline-color: var(--color-error-500);">
                    <div class="timeline-icon" style="background-color: var(--color-error-500);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-title">تم الإلغاء</div>
                        <div class="timeline-date">${Utils.formatDate(cancelledAt || new Date())}</div>
                    </div>
                </div>
            `;
            return;
        }
        
        const dates = {
            pending: createdAt,
            active: startedAt,
            delivered: deliveredAt,
            completed: completedAt,
        };
        
        elements.orderTimeline.innerHTML = TIMELINE_STEPS.map((step, index) => {
            let itemClass = '';
            if (index < currentIndex) {
                itemClass = 'completed';
            } else if (index === currentIndex) {
                itemClass = 'current';
            } else {
                itemClass = 'pending';
            }
            
            return `
                <div class="timeline-item ${itemClass}">
                    <div class="timeline-icon">
                        ${step.icon}
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-title">${step.title}</div>
                        ${dates[step.id] 
                            ? `<div class="timeline-date">${Utils.formatDate(dates[step.id])}</div>`
                            : ''
                        }
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Service Info
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderServiceInfo() {
        if (!elements.serviceInfo) return;
        
        const { service, serviceSnapshot } = state.order;
        const serviceData = service || serviceSnapshot || {};
        const serviceId = serviceData._id || serviceData.id;
        const serviceImage = serviceData.image || '';
        const serviceTitle = serviceData.title || 'خدمة';
        const serviceCategory = serviceData.category;
        const categoryInfo = CONFIG.CATEGORIES.find(c => c.id === serviceCategory);
        
        elements.serviceInfo.innerHTML = `
            ${serviceImage 
                ? `<img src="${serviceImage}" alt="${serviceTitle}" class="service-info-image" onerror="this.style.display='none'">`
                : ''
            }
            <div class="service-info-content">
                <h3 class="service-info-title">
                    ${serviceId 
                        ? `<a href="/app/service.html?id=${serviceId}">${Utils.escapeHtml(serviceTitle)}</a>`
                        : Utils.escapeHtml(serviceTitle)
                    }
                </h3>
                <div class="service-info-meta">
                    ${categoryInfo ? `${categoryInfo.icon} ${categoryInfo.name}` : ''}
                </div>
            </div>
        `;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Requirements
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderRequirements() {
        if (!elements.requirementsSection || !elements.requirementsContent) return;
        
        const { requirements, buyerRequirements } = state.order;
        const reqText = requirements || buyerRequirements;
        
        if (!reqText || reqText.trim() === '') {
            elements.requirementsSection.style.display = 'none';
            return;
        }
        
        elements.requirementsSection.style.display = 'block';
        elements.requirementsContent.textContent = reqText;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Delivery
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderDelivery() {
        if (!elements.deliverySection || !elements.deliveryContent) return;
        
        const { status, deliveryMessage, deliveryFiles } = state.order;
        
        if (!['delivered', 'completed'].includes(status) || !deliveryMessage) {
            elements.deliverySection.style.display = 'none';
            return;
        }
        
        elements.deliverySection.style.display = 'block';
        
        let filesHTML = '';
        if (deliveryFiles && deliveryFiles.length > 0) {
            filesHTML = `
                <div class="delivery-files">
                    ${deliveryFiles.map((file, i) => `
                        <a href="${file}" target="_blank" class="delivery-file">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            ملف ${i + 1}
                        </a>
                    `).join('')}
                </div>
            `;
        }
        
        elements.deliveryContent.innerHTML = `
            <div class="delivery-message">${Utils.escapeHtml(deliveryMessage)}</div>
            ${filesHTML}
        `;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Actions
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderActions() {
        if (!elements.orderActions) return;
        
        const { status } = state.order;
        const actions = [];
        
        // Seller actions
        if (state.isSeller) {
            if (status === 'active') {
                actions.push(`
                    <button class="btn btn-primary" onclick="window.openDeliveryModal()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                            <polyline points="22,4 12,14.01 9,11.01"/>
                        </svg>
                        تسليم الطلب
                    </button>
                `);
            }
        }
        
        // Buyer actions
        if (state.isBuyer) {
            if (status === 'delivered') {
                actions.push(`
                    <button class="btn btn-success" onclick="window.acceptDelivery()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                            <polyline points="22,4 12,14.01 9,11.01"/>
                        </svg>
                        قبول التسليم
                    </button>
                `);
                actions.push(`
                    <button class="btn btn-outline-warning" onclick="window.requestRevision()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M23 4v6h-6"/>
                            <path d="M1 20v-6h6"/>
                            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                        </svg>
                        طلب تعديل
                    </button>
                `);
            }
            
            if (status === 'completed' && !state.order.reviewed) {
                actions.push(`
                    <button class="btn btn-primary" onclick="window.openReviewModal()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                        </svg>
                        تقييم الخدمة
                    </button>
                `);
            }
        }
        
        // Cancel action (both can cancel in certain statuses)
        if (['pending', 'active'].includes(status)) {
            actions.push(`
                <button class="btn btn-outline-error" onclick="window.cancelOrder()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    إلغاء الطلب
                </button>
            `);
        }
        
        if (actions.length === 0) {
            elements.orderActions.style.display = 'none';
            return;
        }
        
        elements.orderActions.innerHTML = actions.join('');
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Summary
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderSummary() {
        if (!elements.orderSummary) return;
        
        const { totalPrice, price, deliveryTime, service, serviceSnapshot } = state.order;
        const orderPrice = totalPrice || price || 0;
        const serviceData = service || serviceSnapshot || {};
        const deliveryDays = deliveryTime || serviceData.deliveryTime || 3;
        
        elements.orderSummary.innerHTML = `
            <h3 class="order-summary-title">ملخص الطلب</h3>
            <div class="order-summary-body">
                <div class="summary-row">
                    <span class="summary-label">سعر الخدمة</span>
                    <span class="summary-value">${Utils.formatPrice(orderPrice)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">مدة التسليم</span>
                    <span class="summary-value">${deliveryDays} ${deliveryDays === 1 ? 'يوم' : 'أيام'}</span>
                </div>
                <div class="summary-row total">
                    <span class="summary-label">الإجمالي</span>
                    <span class="summary-value">${Utils.formatPrice(orderPrice)}</span>
                </div>
            </div>
        `;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render User Card
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderUserCard() {
        if (!elements.userCard) return;
        
        // Show the other party (seller if buyer, buyer if seller)
        const user = state.isBuyer ? state.order.seller : state.order.buyer;
        const label = state.isBuyer ? 'البائع' : 'العميل';
        
        if (!user) {
            elements.userCard.style.display = 'none';
            return;
        }
        
        const userName = user.fullName || user.username || user.name || 'مستخدم';
        const userAvatar = user.avatar || user.avatarUrl;
        const userInitials = userName.substring(0, 2).toUpperCase();
        
        elements.userCard.innerHTML = `
            ${userAvatar 
                ? `<img src="${userAvatar}" alt="${userName}" class="avatar avatar-lg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">`
                : ''
            }
            <span class="avatar avatar-lg" ${userAvatar ? 'style="display:none"' : ''}>${userInitials}</span>
            <div class="user-card-info">
                <div class="user-card-label">${label}</div>
                <div class="user-card-name">${Utils.escapeHtml(userName)}</div>
            </div>
        `;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Modal Functions
    // ─────────────────────────────────────────────────────────────────────────
    
    window.openDeliveryModal = function() {
        elements.deliveryModal?.classList.add('show');
        elements.deliveryModal.style.display = 'flex';
    };
    
    function closeDeliveryModal() {
        elements.deliveryModal?.classList.remove('show');
        setTimeout(() => {
            elements.deliveryModal.style.display = 'none';
        }, 300);
    }
    
    window.openReviewModal = function() {
        elements.reviewModal?.classList.add('show');
        elements.reviewModal.style.display = 'flex';
        updateRatingDisplay();
    };
    
    function closeReviewModal() {
        elements.reviewModal?.classList.remove('show');
        setTimeout(() => {
            elements.reviewModal.style.display = 'none';
        }, 300);
    }
    
    function updateRatingDisplay() {
        const btns = elements.ratingInput?.querySelectorAll('.rating-star-btn');
        btns?.forEach((btn, i) => {
            btn.classList.toggle('active', i < state.selectedRating);
        });
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Action Handlers
    // ─────────────────────────────────────────────────────────────────────────
    
    async function handleDeliverySubmit(e) {
        e.preventDefault();
        
        const message = elements.deliveryMessage?.value.trim();
        const filesStr = elements.deliveryFiles?.value.trim();
        const files = filesStr ? filesStr.split(',').map(f => f.trim()) : [];
        
        if (!message) {
            Toast.error('خطأ', 'يرجى إدخال رسالة التسليم');
            return;
        }
        
        Loader.buttonStart(document.getElementById('submitDelivery'));
        
        try {
            await API.orders.deliver(state.orderId, { message, files });
            Toast.success('تم بنجاح', 'تم تسليم الطلب');
            closeDeliveryModal();
            await loadOrder();
        } catch (error) {
            Toast.error('خطأ', error.message || 'فشل تسليم الطلب');
        } finally {
            Loader.buttonStop(document.getElementById('submitDelivery'));
        }
    }
    
    async function handleReviewSubmit(e) {
        e.preventDefault();
        
        const rating = state.selectedRating;
        const comment = elements.reviewComment?.value.trim();
        
        Loader.buttonStart(document.getElementById('submitReview'));
        
        try {
            await API.reviews.create({
                orderId: state.orderId,
                serviceId: state.order.service?._id || state.order.serviceSnapshot?.id,
                rating,
                comment,
            });
            Toast.success('شكراً لك!', 'تم إرسال تقييمك بنجاح');
            closeReviewModal();
            state.order.reviewed = true;
            renderActions();
        } catch (error) {
            Toast.error('خطأ', error.message || 'فشل إرسال التقييم');
        } finally {
            Loader.buttonStop(document.getElementById('submitReview'));
        }
    }
    
    window.acceptDelivery = async function() {
        if (!confirm('هل أنت متأكد من قبول التسليم وإكمال الطلب؟')) return;
        
        try {
            await API.orders.complete(state.orderId);
            Toast.success('تم بنجاح', 'تم إكمال الطلب');
            await loadOrder();
        } catch (error) {
            Toast.error('خطأ', error.message || 'فشلت العملية');
        }
    };
    
    window.requestRevision = async function() {
        const reason = prompt('ما هو التعديل المطلوب؟');
        if (!reason) return;
        
        try {
            await API.orders.requestRevision(state.orderId, { reason });
            Toast.success('تم', 'تم إرسال طلب التعديل');
            await loadOrder();
        } catch (error) {
            Toast.error('خطأ', error.message || 'فشل طلب التعديل');
        }
    };
    
    window.cancelOrder = async function() {
        if (!confirm('هل أنت متأكد من إلغاء الطلب؟')) return;
        
        try {
            await API.orders.cancel(state.orderId);
            Toast.success('تم', 'تم إلغاء الطلب');
            await loadOrder();
        } catch (error) {
            Toast.error('خطأ', error.message || 'فشل إلغاء الطلب');
        }
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
    
    function getStatusInfo(status) {
        const statuses = CONFIG.ORDER_STATUSES || {
            pending: { label: 'قيد الانتظار', color: 'warning' },
            active: { label: 'جاري العمل', color: 'info' },
            delivered: { label: 'تم التسليم', color: 'primary' },
            completed: { label: 'مكتمل', color: 'success' },
            cancelled: { label: 'ملغي', color: 'error' },
            disputed: { label: 'متنازع عليه', color: 'warning' },
        };
        
        return statuses[status] || { label: status, color: 'secondary' };
    }
    
    function renderError(message) {
        const content = document.getElementById('orderContent');
        if (!content) return;
        
        content.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 8v4M12 16h.01"/>
                    </svg>
                </div>
                <h3 class="empty-state-title">تعذر تحميل الطلب</h3>
                <p class="empty-state-description">${Utils.escapeHtml(message)}</p>
                <div class="flex gap-3 mt-4">
                    <button class="btn btn-primary" onclick="location.reload()">إعادة المحاولة</button>
                    <a href="/app/" class="btn btn-secondary">العودة للرئيسية</a>
                </div>
            </div>
        `;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Chat Functions (Enhanced with Auto-refresh)
    // ─────────────────────────────────────────────────────────────────────────
    
    const CHAT_POLL_INTERVAL = 5000; // Poll every 5 seconds
    const TYPING_DEBOUNCE = 1000; // 1 second typing debounce
    
    async function loadChat(isPolling = false) {
        if (!elements.chatSection) return;
        
        try {
            // Get chat for this order
            const response = await API.get(`/chats/order/${state.orderId}`);
            const data = response.data || response;
            state.chat = data.chat || data;
            state.canSendMessages = data.canSendMessages !== false;
            
            // Load messages
            await loadMessages(isPolling);
            
            // Update chat status
            updateChatStatus();
            
            // Start polling if not already started
            if (!state.chatPollingInterval && state.canSendMessages) {
                startChatPolling();
            }
            
        } catch (error) {
            console.error('Failed to load chat:', error);
            if (elements.chatStatus) {
                elements.chatStatus.textContent = 'تعذر تحميل المحادثة';
            }
            renderEmptyChat();
        }
    }
    
    async function loadMessages(isPolling = false) {
        if (!state.chat) return;
        
        try {
            const chatId = state.chat._id || state.chat.id;
            const response = await API.get(`/chats/${chatId}/messages`);
            const data = response.data || response;
            const newMessages = data.messages || [];
            
            // Check if there are new messages
            const hasNewMessages = newMessages.length > state.messages.length;
            const lastNewMsgId = newMessages.length > 0 ? newMessages[newMessages.length - 1]._id : null;
            
            // Update messages
            state.messages = newMessages;
            
            // Only re-render if there are new messages or not polling
            if (!isPolling || hasNewMessages || state.lastMessageId !== lastNewMsgId) {
                renderMessages(hasNewMessages && isPolling);
                state.lastMessageId = lastNewMsgId;
            }
            
            if (elements.chatStatus) {
                const statusText = state.canSendMessages ? 'متصل' : 'المحادثة مغلقة';
                elements.chatStatus.innerHTML = `
                    ${state.canSendMessages ? '<span class="chat-status-dot"></span>' : ''}
                    <span>${state.messages.length} رسالة - ${statusText}</span>
                `;
            }
            
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }
    
    function startChatPolling() {
        // Clear existing interval
        if (state.chatPollingInterval) {
            clearInterval(state.chatPollingInterval);
        }
        
        // Start new polling
        state.chatPollingInterval = setInterval(() => {
            if (document.visibilityState === 'visible' && state.canSendMessages) {
                loadMessages(true);
            }
        }, CHAT_POLL_INTERVAL);
        
        console.log('📡 Chat polling started');
    }
    
    function stopChatPolling() {
        if (state.chatPollingInterval) {
            clearInterval(state.chatPollingInterval);
            state.chatPollingInterval = null;
            console.log('📡 Chat polling stopped');
        }
    }
    
    function updateChatStatus() {
        // Disable input if chat is read-only
        if (!state.canSendMessages) {
            if (elements.messageInput) {
                elements.messageInput.disabled = true;
                elements.messageInput.placeholder = 'المحادثة مغلقة';
            }
            if (elements.sendBtn) {
                elements.sendBtn.disabled = true;
            }
            stopChatPolling();
        }
    }
    
    function renderEmptyChat() {
        if (!elements.messagesContainer) return;
        
        elements.messagesContainer.innerHTML = `
            <div class="chat-empty">
                <svg class="chat-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <div class="chat-empty-title">لا توجد رسائل بعد</div>
                <div class="chat-empty-text">ابدأ المحادثة مع ${state.isBuyer ? 'البائع' : 'العميل'}</div>
            </div>
        `;
    }
    
    function renderMessages(scrollToBottom = true) {
        if (!elements.messagesContainer) return;
        
        if (state.messages.length === 0) {
            renderEmptyChat();
            return;
        }
        
        const currentUserId = Auth.getUserId();
        const wasScrolledToBottom = isScrolledToBottom();
        
        let messagesHTML = state.messages.map((msg, index) => {
            const isOwn = (msg.senderId?._id || msg.senderId) === currentUserId;
            const senderName = msg.senderId?.fullName || msg.senderId?.username || (isOwn ? 'أنت' : 'الطرف الآخر');
            const msgTime = formatMessageTime(msg.createdAt);
            const isNewMessage = index === state.messages.length - 1 && scrollToBottom;
            
            // System message
            if (msg.isSystemMessage) {
                return `
                    <div class="message-system">
                        <span class="message-system-content">${Utils.escapeHtml(msg.content)}</span>
                    </div>
                `;
            }
            
            return `
                <div class="flex ${isOwn ? 'justify-end' : 'justify-start'}">
                    <div class="message-bubble ${isOwn ? 'own' : 'other'} ${isNewMessage ? 'new' : ''}">
                        ${!isOwn ? `<div class="message-sender">${Utils.escapeHtml(senderName)}</div>` : ''}
                        <div class="message-content">${Utils.escapeHtml(msg.content)}</div>
                        <div class="message-time">${msgTime}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add typing indicator if other user is typing
        if (state.otherUserTyping) {
            messagesHTML += renderTypingIndicator();
        }
        
        elements.messagesContainer.innerHTML = messagesHTML;
        
        // Scroll to bottom if was at bottom or new message
        if (wasScrolledToBottom || scrollToBottom) {
            scrollChatToBottom();
        }
    }
    
    function renderTypingIndicator() {
        const typingName = state.isBuyer ? 'البائع' : 'العميل';
        return `
            <div class="typing-indicator">
                <div class="typing-indicator-dots">
                    <span class="typing-indicator-dot"></span>
                    <span class="typing-indicator-dot"></span>
                    <span class="typing-indicator-dot"></span>
                </div>
                <span class="typing-indicator-text">${typingName} يكتب...</span>
            </div>
        `;
    }
    
    function isScrolledToBottom() {
        if (!elements.messagesContainer) return true;
        const { scrollTop, scrollHeight, clientHeight } = elements.messagesContainer;
        return scrollHeight - scrollTop - clientHeight < 50;
    }
    
    function scrollChatToBottom() {
        if (!elements.messagesContainer) return;
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    }
    
    function formatMessageTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'أمس ' + date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) + ' ' + 
                   date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        }
    }
    
    function handleTypingIndicator() {
        // Clear previous timeout
        if (state.typingTimeout) {
            clearTimeout(state.typingTimeout);
        }
        
        // Set typing to true
        if (!state.isTyping) {
            state.isTyping = true;
            // Could send typing status to server here if needed
        }
        
        // Reset typing after debounce
        state.typingTimeout = setTimeout(() => {
            state.isTyping = false;
        }, TYPING_DEBOUNCE);
    }
    
    async function handleSendMessage(e) {
        e.preventDefault();
        
        const content = elements.messageInput?.value.trim();
        if (!content || !state.chat || !state.canSendMessages) return;
        
        const sendBtn = elements.sendBtn;
        const originalContent = content;
        
        // Disable button and clear input immediately for better UX
        if (sendBtn) sendBtn.disabled = true;
        if (elements.messageInput) elements.messageInput.value = '';
        
        // Add optimistic message
        const tempId = 'temp-' + Date.now();
        const tempMessage = {
            _id: tempId,
            senderId: { _id: Auth.getUserId() },
            content: originalContent,
            createdAt: new Date().toISOString(),
            isOptimistic: true
        };
        state.messages.push(tempMessage);
        renderMessages(true);
        
        try {
            const chatId = state.chat._id || state.chat.id;
            await API.post(`/chats/${chatId}/messages`, { content: originalContent });
            
            // Reload messages to get server version
            await loadMessages(false);
            
        } catch (error) {
            console.error('Failed to send message:', error);
            
            // Remove optimistic message on error
            state.messages = state.messages.filter(m => m._id !== tempId);
            renderMessages(false);
            
            // Restore input content
            if (elements.messageInput) elements.messageInput.value = originalContent;
            
            Toast.error('خطأ', error.message || 'تعذر إرسال الرسالة');
        } finally {
            if (sendBtn) sendBtn.disabled = !state.canSendMessages;
            if (elements.messageInput) elements.messageInput.focus();
        }
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        stopChatPolling();
    });
    
    // Pause polling when tab is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            console.log('📡 Tab hidden, polling paused');
        } else {
            console.log('📡 Tab visible, polling resumed');
            // Immediately fetch new messages when tab becomes visible
            if (state.chat && state.canSendMessages) {
                loadMessages(true);
            }
        }
    });
    
    // Bind typing indicator to input
    if (elements.messageInput) {
        elements.messageInput.addEventListener('input', handleTypingIndicator);
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
