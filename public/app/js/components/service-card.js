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
            imageUrl,        // SINGLE SOURCE OF TRUTH
            imageUrls,       // Fallback for old data
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
        
        // Image: Use imageUrl (virtual), fallback to imageUrls[0], then placeholder
        const PLACEHOLDER = '/app/assets/images/service-placeholder.svg';
        const serviceImage = imageUrl || (imageUrls && imageUrls[0]) || PLACEHOLDER;
        
        const serviceRating = rating || averageRating || 0;
        const serviceReviews = reviewCount || totalReviews || 0;
        
        // Seller info
        const sellerName = seller?.username || seller?.name || 'بائع';
        const sellerAvatar = seller?.avatar || seller?.profileImage || seller?.avatarUrl;
        const sellerLevel = seller?.level || 'NEW';
        const sellerInitials = sellerName.substring(0, 2).toUpperCase();
        
        // Stats
        const serviceRating = rating || averageRating || 0;
        const serviceReviews = reviewCount || totalReviews || 0;
        const ordersCount = service.ordersCount || 0;
        
        const serviceUrl = `${CONFIG.ROUTES.SERVICE}?id=${serviceId}`;
        
        return `
            <article class="service-card group hover:shadow-xl transition-all duration-300 border border-gray-100 rounded-2xl overflow-hidden bg-white" data-service-id="${serviceId}">
                <!-- Image -->
                <a href="${serviceUrl}" class="service-card-image relative block aspect-[4/3] overflow-hidden">
                    <img 
                        src="${serviceImage}" 
                        alt="${Utils.escapeHtml(title)}"
                        loading="lazy"
                        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onerror="Utils.handleImageError(this, 'خدمة')"
                    >
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    ${category ? `<span class="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-primary-600 text-xs font-bold rounded-lg shadow-sm">${category}</span>` : ''}
                </a>
                
                <!-- Body -->
                <div class="p-4">
                    <!-- Title -->
                    <h3 class="text-sm font-bold text-gray-900 mb-3 line-clamp-2 h-10 hover:text-primary-600 transition-colors">
                        <a href="${serviceUrl}">${Utils.escapeHtml(title)}</a>
                    </h3>
                    
                    <!-- Seller & Rating -->
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-2">
                            ${sellerAvatar 
                                ? `<img src="${sellerAvatar}" alt="${sellerName}" class="w-6 h-6 rounded-full object-cover border border-gray-100" onerror="this.style.display='none'">`
                                : `<span class="w-6 h-6 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-[10px] font-bold border border-primary-100">${sellerInitials}</span>`
                            }
                            <span class="text-xs text-gray-600 font-medium truncate max-w-[80px]">${Utils.escapeHtml(sellerName)}</span>
                        </div>
                        
                        <div class="flex items-center gap-1 text-xs">
                            <svg class="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                            </svg>
                            <span class="font-bold text-gray-900">${serviceRating.toFixed(1)}</span>
                            <span class="text-gray-400">(${Utils.formatNumber(serviceReviews)})</span>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="pt-3 border-t border-gray-50 flex items-center justify-between">
                        <div class="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                            </svg>
                            <span>${Utils.formatNumber(ordersCount)} مبيعات</span>
                        </div>
                        
                        <div class="text-primary-600">
                            <span class="text-[10px] text-gray-400 font-medium">تبدأ من</span>
                            <span class="text-sm font-bold">${Utils.formatPrice(servicePrice)}</span>
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
