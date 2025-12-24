/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ SERVICE DETAIL PAGE
 * منصة مشرق - صفحة تفاصيل الخدمة
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // Page State
    // ─────────────────────────────────────────────────────────────────────────
    
    const state = {
        serviceId: null,
        service: null,
        seller: null,
        reviews: [],
        relatedServices: [],
        isLoading: false,
        error: null,
        currentImageIndex: 0,
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // DOM Elements
    // ─────────────────────────────────────────────────────────────────────────
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        breadcrumbTitle: document.getElementById('breadcrumbTitle'),
        serviceContent: document.getElementById('serviceContent'),
        serviceGallery: document.getElementById('serviceGallery'),
        serviceHeader: document.getElementById('serviceHeader'),
        serviceDescription: document.getElementById('serviceDescription'),
        serviceFeatures: document.getElementById('serviceFeatures'),
        featuresList: document.getElementById('featuresList'),
        serviceRequirements: document.getElementById('serviceRequirements'),
        requirementsContent: document.getElementById('requirementsContent'),
        sellerCard: document.getElementById('sellerCard'),
        sellerInfoMobile: document.getElementById('sellerInfoMobile'),
        orderCard: document.getElementById('orderCard'),
        reviewsSection: document.getElementById('reviewsSection'),
        reviewsCount: document.getElementById('reviewsCount'),
        reviewsList: document.getElementById('reviewsList'),
        relatedSection: document.getElementById('relatedSection'),
        relatedServicesGrid: document.getElementById('relatedServicesGrid'),
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // Initialize Page
    // ─────────────────────────────────────────────────────────────────────────
    
    async function init() {
        // Render static components
        Navbar.render(elements.navbar);
        Footer.render(elements.footer);
        
        // Get service ID from URL
        state.serviceId = Utils.getUrlParam('id');
        
        if (!state.serviceId) {
            renderError('لم يتم تحديد الخدمة');
            return;
        }
        
        // Load service data
        await loadService();
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Load Service Data
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadService() {
        state.isLoading = true;
        
        try {
            // Fetch service details
            const response = await API.services.getById(state.serviceId);
            const data = response.data || response;
            
            state.service = data.service || data;
            state.seller = data.seller || state.service.seller;
            
            // Update page
            updatePageMeta();
            renderGallery();
            renderHeader();
            renderDescription();
            renderFeatures();
            renderRequirements();
            renderSeller();
            renderOrderCard();
            
            // Load reviews
            await loadReviews();
            
            // Load related services
            await loadRelatedServices();
            
        } catch (error) {
            console.error('Failed to load service:', error);
            renderError(error.message || 'تعذر تحميل الخدمة');
        } finally {
            state.isLoading = false;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Update Page Meta
    // ─────────────────────────────────────────────────────────────────────────
    
    function updatePageMeta() {
        const { title, description } = state.service;
        
        // Update page title
        document.title = `${title} | مشرق`;
        
        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = Utils.truncate(description, 160);
        }
        
        // Update breadcrumb
        if (elements.breadcrumbTitle) {
            elements.breadcrumbTitle.textContent = Utils.truncate(title, 50);
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Gallery
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderGallery() {
        if (!elements.serviceGallery) return;
        
        const { image, images } = state.service;
        const allImages = images?.length ? images : (image ? [image] : []);
        
        if (allImages.length === 0) {
            elements.serviceGallery.innerHTML = `
                <div class="service-gallery-placeholder">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21,15 16,10 5,21"/>
                    </svg>
                    <span>لا توجد صور</span>
                </div>
            `;
            return;
        }
        
        if (allImages.length === 1) {
            elements.serviceGallery.innerHTML = `
                <img 
                    src="${allImages[0]}" 
                    alt="${state.service.title}"
                    class="service-gallery-main"
                    onerror="Utils.handleImageError(this, 'صورة الخدمة')"
                >
            `;
            return;
        }
        
        // Multiple images - create slider
        elements.serviceGallery.innerHTML = `
            <div class="gallery-slider">
                <div class="gallery-main">
                    <img 
                        src="${allImages[0]}" 
                        alt="${state.service.title}"
                        class="gallery-main-image"
                        id="mainGalleryImage"
                        onerror="Utils.handleImageError(this, 'صورة الخدمة')"
                    >
                    <button class="gallery-nav gallery-nav-prev" id="galleryPrev">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    </button>
                    <button class="gallery-nav gallery-nav-next" id="galleryNext">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 18l-6-6 6-6"/>
                        </svg>
                    </button>
                </div>
                <div class="gallery-thumbs">
                    ${allImages.map((img, i) => `
                        <button class="gallery-thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
                            <img src="${img}" alt="صورة ${i + 1}" onerror="this.parentElement.style.display='none'">
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Bind gallery events
        bindGalleryEvents(allImages);
    }
    
    function bindGalleryEvents(images) {
        const mainImage = document.getElementById('mainGalleryImage');
        const prevBtn = document.getElementById('galleryPrev');
        const nextBtn = document.getElementById('galleryNext');
        const thumbs = document.querySelectorAll('.gallery-thumb');
        
        function updateImage(index) {
            state.currentImageIndex = index;
            mainImage.src = images[index];
            
            thumbs.forEach((thumb, i) => {
                thumb.classList.toggle('active', i === index);
            });
        }
        
        prevBtn?.addEventListener('click', () => {
            const newIndex = state.currentImageIndex > 0 
                ? state.currentImageIndex - 1 
                : images.length - 1;
            updateImage(newIndex);
        });
        
        nextBtn?.addEventListener('click', () => {
            const newIndex = state.currentImageIndex < images.length - 1 
                ? state.currentImageIndex + 1 
                : 0;
            updateImage(newIndex);
        });
        
        thumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                updateImage(parseInt(thumb.dataset.index));
            });
        });
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Header
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderHeader() {
        if (!elements.serviceHeader) return;
        
        const { title, rating, averageRating, reviewCount, totalReviews, ordersCount, category } = state.service;
        const serviceRating = rating || averageRating || 0;
        const serviceReviews = reviewCount || totalReviews || 0;
        
        const categoryInfo = CONFIG.CATEGORIES.find(c => c.id === category);
        
        elements.serviceHeader.innerHTML = `
            <h1 class="service-title">${Utils.escapeHtml(title)}</h1>
            <div class="service-meta">
                ${categoryInfo ? `
                    <a href="/app/explore.html?category=${category}" class="service-category-link">
                        <span class="category-icon">${categoryInfo.icon}</span>
                        ${categoryInfo.name}
                    </a>
                    <span class="meta-separator">•</span>
                ` : ''}
                <div class="service-rating-inline">
                    <div class="rating">
                        ${Utils.renderStars(serviceRating)}
                    </div>
                    <span class="rating-value">${serviceRating.toFixed(1)}</span>
                    <span class="rating-count">(${Utils.formatNumber(serviceReviews)} تقييم)</span>
                </div>
                ${ordersCount ? `
                    <span class="meta-separator">•</span>
                    <span class="orders-count">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                            <rect x="9" y="3" width="6" height="4" rx="1"/>
                        </svg>
                        ${Utils.formatNumber(ordersCount)} طلب
                    </span>
                ` : ''}
            </div>
        `;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Description
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderDescription() {
        if (!elements.serviceDescription) return;
        
        const { description } = state.service;
        
        // Convert line breaks to paragraphs
        const paragraphs = description.split('\n').filter(p => p.trim());
        
        elements.serviceDescription.innerHTML = `
            <h2 class="service-section-title">وصف الخدمة</h2>
            <div class="service-description-content">
                ${paragraphs.map(p => `<p>${Utils.escapeHtml(p)}</p>`).join('')}
            </div>
        `;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Features
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderFeatures() {
        if (!elements.serviceFeatures || !elements.featuresList) return;
        
        const { features } = state.service;
        
        if (!features || features.length === 0) {
            elements.serviceFeatures.style.display = 'none';
            return;
        }
        
        elements.serviceFeatures.style.display = 'block';
        elements.featuresList.innerHTML = features.map(feature => `
            <li class="feature-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
                <span>${Utils.escapeHtml(feature)}</span>
            </li>
        `).join('');
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Requirements
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderRequirements() {
        if (!elements.serviceRequirements || !elements.requirementsContent) return;
        
        const { requirements } = state.service;
        
        if (!requirements || requirements.trim() === '') {
            elements.serviceRequirements.style.display = 'none';
            return;
        }
        
        elements.serviceRequirements.style.display = 'block';
        elements.requirementsContent.innerHTML = `<p>${Utils.escapeHtml(requirements)}</p>`;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Seller Info
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderSeller() {
        const seller = state.seller || {};
        const { 
            fullName, username, name, avatarUrl, avatar, profileImage, 
            bio, level, rating, reviewCount, createdAt 
        } = seller;
        
        const sellerName = fullName || username || name || state.service.sellerName || 'بائع';
        const sellerAvatar = avatarUrl || avatar || profileImage;
        const sellerInitials = sellerName.substring(0, 2).toUpperCase();
        const sellerLevel = CONFIG.SELLER_LEVELS[level] || CONFIG.SELLER_LEVELS.NEW;
        const memberSince = createdAt ? Utils.formatDate(createdAt, { year: 'numeric', month: 'long' }) : null;
        
        const sellerHTML = `
            <div class="seller-card-header">
                <div class="seller-avatar-wrapper">
                    ${sellerAvatar 
                        ? `<img src="${sellerAvatar}" alt="${sellerName}" class="avatar avatar-xl" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">`
                        : ''
                    }
                    <span class="avatar avatar-xl" ${sellerAvatar ? 'style="display:none"' : ''}>${sellerInitials}</span>
                </div>
                <div class="seller-info">
                    <h3 class="seller-name">${Utils.escapeHtml(sellerName)}</h3>
                    <span class="badge badge-${sellerLevel.color}">${sellerLevel.label}</span>
                </div>
            </div>
            ${bio ? `<p class="seller-bio">${Utils.escapeHtml(bio)}</p>` : ''}
            <div class="seller-stats">
                ${rating ? `
                    <div class="seller-stat">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                        <span>${rating.toFixed(1)}</span>
                    </div>
                ` : ''}
                ${memberSince ? `
                    <div class="seller-stat">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span>عضو منذ ${memberSince}</span>
                    </div>
                ` : ''}
            </div>
            <a href="#" class="btn btn-outline-secondary btn-block mt-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                تواصل مع البائع
            </a>
        `;
        
        if (elements.sellerCard) {
            elements.sellerCard.innerHTML = sellerHTML;
        }
        
        // Mobile version
        if (elements.sellerInfoMobile) {
            elements.sellerInfoMobile.innerHTML = `
                <div class="seller-card-mobile">
                    ${sellerAvatar 
                        ? `<img src="${sellerAvatar}" alt="${sellerName}" class="avatar avatar-md">`
                        : `<span class="avatar avatar-md">${sellerInitials}</span>`
                    }
                    <div>
                        <span class="seller-name-mobile">${Utils.escapeHtml(sellerName)}</span>
                        <span class="badge badge-sm badge-${sellerLevel.color}">${sellerLevel.label}</span>
                    </div>
                </div>
            `;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Order Card
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderOrderCard() {
        if (!elements.orderCard) return;
        
        const { 
            price, basePrice, deliveryTime, revisions, 
            _id, id, sellerId 
        } = state.service;
        
        const servicePrice = basePrice || price || 0;
        const serviceId = _id || id;
        
        // Check if current user is the seller
        const currentUserId = Auth.getUserId();
        const isOwner = currentUserId && (sellerId === currentUserId || sellerId?._id === currentUserId);
        
        elements.orderCard.innerHTML = `
            <div class="service-order-header">
                <div class="service-order-pricing">
                    <span class="service-order-price">${Utils.formatPrice(servicePrice)}</span>
                </div>
            </div>
            <div class="service-order-body">
                <ul class="service-order-features">
                    <li>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12,6 12,12 16,14"/>
                        </svg>
                        <span>مدة التسليم</span>
                        <strong>${deliveryTime || 3} ${deliveryTime === 1 ? 'يوم' : 'أيام'}</strong>
                    </li>
                    <li>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M23 4v6h-6"/>
                            <path d="M1 20v-6h6"/>
                            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                        </svg>
                        <span>عدد التعديلات</span>
                        <strong>${revisions || 1} ${revisions === 1 ? 'مرة' : 'مرات'}</strong>
                    </li>
                </ul>
                
                ${isOwner ? `
                    <a href="/app/seller/edit-service.html?id=${serviceId}" class="btn btn-secondary btn-block btn-lg">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        تعديل الخدمة
                    </a>
                ` : `
                    <a href="/app/checkout.html?service=${serviceId}" class="btn btn-primary btn-block btn-lg" id="orderBtn">
                        اطلب الخدمة الآن
                    </a>
                `}
            </div>
            
            <div class="service-order-footer">
                <div class="order-guarantee">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <path d="M9 12l2 2 4-4"/>
                    </svg>
                    <span>ضمان استرداد 100% في حالة عدم التسليم</span>
                </div>
            </div>
        `;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Load Reviews
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadReviews() {
        if (!elements.reviewsList || !elements.reviewsCount) return;
        
        try {
            const response = await API.reviews.getServiceReviews(state.serviceId, { limit: 5 });
            const data = response.data || response;
            state.reviews = data.reviews || data || [];
            
            renderReviews();
        } catch (error) {
            console.error('Failed to load reviews:', error);
            elements.reviewsList.innerHTML = `
                <p class="text-muted text-center py-4">لا توجد تقييمات حتى الآن</p>
            `;
        }
    }
    
    function renderReviews() {
        if (!elements.reviewsList || !elements.reviewsCount) return;
        
        const { rating, averageRating, reviewCount, totalReviews } = state.service;
        const serviceRating = rating || averageRating || 0;
        const totalReviewCount = reviewCount || totalReviews || state.reviews.length;
        
        elements.reviewsCount.innerHTML = `
            <div class="rating-lg">
                ${Utils.renderStars(serviceRating)}
                <span class="rating-value">${serviceRating.toFixed(1)}</span>
            </div>
            <span>(${Utils.formatNumber(totalReviewCount)} تقييم)</span>
        `;
        
        if (state.reviews.length === 0) {
            elements.reviewsList.innerHTML = `
                <div class="empty-reviews">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                    <p>لا توجد تقييمات حتى الآن</p>
                </div>
            `;
            return;
        }
        
        elements.reviewsList.innerHTML = state.reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="review-author">
                        ${review.buyer?.avatar 
                            ? `<img src="${review.buyer.avatar}" alt="" class="avatar avatar-sm">`
                            : `<span class="avatar avatar-sm">${(review.buyer?.username || 'م').substring(0, 2)}</span>`
                        }
                        <div>
                            <span class="review-author-name">${Utils.escapeHtml(review.buyer?.username || 'مشتري')}</span>
                            <span class="review-date">${Utils.formatRelativeDate(review.createdAt)}</span>
                        </div>
                    </div>
                    <div class="review-rating">
                        ${Utils.renderStars(review.rating)}
                    </div>
                </div>
                ${review.comment ? `<p class="review-content">${Utils.escapeHtml(review.comment)}</p>` : ''}
            </div>
        `).join('');
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Load Related Services
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadRelatedServices() {
        if (!elements.relatedSection || !elements.relatedServicesGrid) return;
        
        try {
            const { category, _id, id } = state.service;
            const serviceId = _id || id;
            
            const response = await API.services.getAll({
                category: category,
                limit: 4,
            });
            
            const data = response.data || response;
            let services = data.services || data || [];
            
            // Filter out current service
            services = services.filter(s => (s._id || s.id) !== serviceId);
            
            if (services.length === 0) {
                elements.relatedSection.style.display = 'none';
                return;
            }
            
            state.relatedServices = services.slice(0, 4);
            elements.relatedSection.style.display = 'block';
            elements.relatedServicesGrid.innerHTML = ServiceCard.renderList(state.relatedServices);
            
        } catch (error) {
            console.error('Failed to load related services:', error);
            elements.relatedSection.style.display = 'none';
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Error State
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderError(message) {
        if (!elements.serviceContent) return;
        
        elements.serviceContent.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 8v4M12 16h.01"/>
                    </svg>
                </div>
                <h3 class="empty-state-title">تعذر تحميل الخدمة</h3>
                <p class="empty-state-description">${Utils.escapeHtml(message)}</p>
                <div class="flex gap-3 mt-4">
                    <button class="btn btn-primary" onclick="location.reload()">إعادة المحاولة</button>
                    <a href="/app/explore.html" class="btn btn-secondary">تصفح الخدمات</a>
                </div>
            </div>
        `;
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
