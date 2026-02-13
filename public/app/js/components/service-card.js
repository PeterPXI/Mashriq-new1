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
        if (!service) return '';
        const {
            _id,
            id,
            title,
            basePrice,
            price,
            imageUrl,
            imageUrls,
            seller,
            rating,
            averageRating,
            reviewCount,
            totalReviews,
            category,
        } = service;
        
        const serviceId = _id || id;
        const servicePrice = basePrice || price || 0;
        const PLACEHOLDER = '/app/assets/images/service-placeholder.svg';
        const serviceImage = imageUrl || (imageUrls && imageUrls[0]) || PLACEHOLDER;
        const serviceRating = rating || averageRating || 0;
        const serviceReviews = reviewCount || totalReviews || 0;
        const ordersCount = service.ordersCount || 0;
        const sellerName = seller?.username || seller?.name || 'بائع';
        const sellerAvatar = seller?.avatar || seller?.profileImage || seller?.avatarUrl;
        const sellerInitials = sellerName.substring(0, 2).toUpperCase();
        const serviceUrl = `${CONFIG.ROUTES.SERVICE}?id=${serviceId}`;
        
        return `
            <article class="service-card group hover:shadow-xl transition-all duration-300 border border-gray-100 rounded-xl overflow-hidden bg-white h-full flex flex-col" data-service-id="${serviceId}">
                <a href="${serviceUrl}" class="relative block aspect-[16/10] overflow-hidden">
                    <img src="${serviceImage}" alt="${Utils.escapeHtml(title)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onerror="Utils.handleImageError(this, 'خدمة')">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    ${category ? `<span class="absolute top-2 right-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm text-primary-600 text-[10px] font-bold rounded-md shadow-sm">${category}</span>` : ''}
                </a>
                <div class="p-3 flex flex-col flex-grow">
                    <h3 class="text-xs font-bold text-gray-900 mb-2 line-clamp-2 h-8 hover:text-primary-600 transition-colors">
                        <a href="${serviceUrl}">${Utils.escapeHtml(title)}</a>
                    </h3>
                    <div class="flex items-center justify-between mt-auto mb-3">
                        <div class="flex items-center gap-1.5">
                            ${sellerAvatar ? `<img src="${sellerAvatar}" class="w-5 h-5 rounded-full object-cover border border-gray-100" onerror="this.style.display='none'">` : `<span class="w-5 h-5 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-[9px] font-bold border border-primary-100">${sellerInitials}</span>`}
                            <span class="text-[11px] text-gray-600 font-medium truncate max-w-[70px]">${Utils.escapeHtml(sellerName)}</span>
                        </div>
                        <div class="flex items-center gap-1 text-xs">
                            <svg class="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                            <span class="font-bold text-gray-900">${serviceRating.toFixed(1)}</span>
                            <span class="text-gray-400">(${Utils.formatNumber(serviceReviews)})</span>
                        </div>
                    </div>
                    <div class="pt-2 border-t border-gray-50 flex items-center justify-between">
                        <div class="flex items-center gap-1 text-[10px] text-gray-400">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                            <span>${Utils.formatNumber(ordersCount)} مبيعات</span>
                        </div>
                        <div class="text-primary-600"><span class="text-[9px] text-gray-400 font-medium ml-1">تبدأ من</span><span class="text-xs font-bold">${Utils.formatPrice(servicePrice)}</span></div>
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
