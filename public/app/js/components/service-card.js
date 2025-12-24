/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ SERVICE CARD COMPONENT
 * منصة مشرق - بطاقة الخدمة
 * ═══════════════════════════════════════════════════════════════════════════
 */

const ServiceCard = {
    /**
     * Render a single service card
     * @param {object} service - Service data
     * @returns {string} - HTML string
     */
    render(service) {
        const {
            _id,
            id,
            title,
            description,
            basePrice,
            price,
            images,
            image,
            thumbnail,
            seller,
            rating,
            averageRating,
            reviewCount,
            totalReviews,
            category,
            deliveryTime,
        } = service;
        
        const serviceId = _id || id;
        const servicePrice = basePrice || price || 0;
        const serviceImage = images?.[0] || image || thumbnail || Utils.getPlaceholderImage(400, 250, 'خدمة');
        const serviceRating = rating || averageRating || 0;
        const serviceReviews = reviewCount || totalReviews || 0;
        
        // Seller info
        const sellerName = seller?.username || seller?.name || 'بائع';
        const sellerAvatar = seller?.avatar || seller?.profileImage;
        const sellerLevel = seller?.level || 'NEW';
        const sellerInitials = sellerName.substring(0, 2).toUpperCase();
        
        const serviceUrl = `${CONFIG.ROUTES.SERVICE}?id=${serviceId}`;
        
        return `
            <article class="service-card" data-service-id="${serviceId}">
                <!-- Image -->
                <a href="${serviceUrl}" class="service-card-image">
                    <img 
                        src="${serviceImage}" 
                        alt="${Utils.escapeHtml(title)}"
                        loading="lazy"
                        onerror="Utils.handleImageError(this, 'خدمة')"
                    >
                    ${category ? `<span class="service-card-badge badge badge-primary">${category}</span>` : ''}
                </a>
                
                <!-- Body -->
                <div class="service-card-body">
                    <!-- Seller -->
                    <div class="service-card-seller">
                        ${sellerAvatar 
                            ? `<img src="${sellerAvatar}" alt="${sellerName}" class="avatar avatar-xs" onerror="this.style.display='none'">`
                            : `<span class="avatar avatar-xs">${sellerInitials}</span>`
                        }
                        <div>
                            <span class="service-card-seller-name">${Utils.escapeHtml(sellerName)}</span>
                            ${sellerLevel && sellerLevel !== 'NEW' ? `
                                <span class="service-card-seller-level">${CONFIG.SELLER_LEVELS[sellerLevel]?.label || ''}</span>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Title -->
                    <h3 class="service-card-title">
                        <a href="${serviceUrl}">${Utils.escapeHtml(title)}</a>
                    </h3>
                    
                    <!-- Footer -->
                    <div class="service-card-footer">
                        <!-- Rating -->
                        <div class="service-card-rating">
                            <svg viewBox="0 0 20 20">
                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                            </svg>
                            <strong>${serviceRating.toFixed(1)}</strong>
                            <span>(${Utils.formatNumber(serviceReviews)})</span>
                        </div>
                        
                        <!-- Price -->
                        <div class="service-card-price">
                            ابتداءً من <strong>${Utils.formatPrice(servicePrice)}</strong>
                        </div>
                    </div>
                </div>
            </article>
        `;
    },
    
    /**
     * Render multiple service cards
     * @param {array} services - Array of service objects
     * @returns {string} - HTML string
     */
    renderList(services) {
        if (!services || !services.length) {
            return this.renderEmpty();
        }
        
        return services.map(service => this.render(service)).join('');
    },
    
    /**
     * Render empty state
     */
    renderEmpty() {
        return `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                </div>
                <h3 class="empty-state-title">لا توجد خدمات</h3>
                <p class="empty-state-description">لم نتمكن من العثور على خدمات مطابقة لبحثك. جرب تغيير معايير البحث.</p>
            </div>
        `;
    },
    
    /**
     * Render skeleton loading cards
     */
    renderSkeleton(count = 4) {
        return Loader.skeleton.serviceCards(count);
    },
};

// Make ServiceCard object immutable
Object.freeze(ServiceCard);
