/**
 * MASHRIQ SERVICE PAGE - Professional Design
 */
(function() {
    'use strict';
    
    const state = {
        serviceId: null,
        service: null,
        seller: null,
        reviews: [],
        currentImageIndex: 0,
        isFavorite: false
    };
    
    const elements = {};
    
    function initElements() {
        const ids = ['navbar', 'footer', 'breadcrumbTitle', 'breadcrumbCategory', 'serviceGallery', 'serviceHeader', 
            'quickStats', 'serviceDescription', 'serviceFeatures', 'featuresList', 'requirementsSection', 'requirementsContent',
            'sellerCard', 'orderCard', 'reviewsHeader', 'reviewsList', 'reviewsCountBadge',
            'faqContent', 'relatedSection', 'relatedServicesGrid', 'mobileOrderBar', 'mobilePrice', 'mobileOrderBtn',
            'tabAbout', 'tabSeller', 'tabReviews', 'tabFaq', 'ratingBadge', 'ordersBadge', 'deliveryBadge'];
        ids.forEach(id => elements[id] = document.getElementById(id));
    }
    
    async function init() {
        initElements();
        Navbar.render(elements.navbar);
        Footer.render(elements.footer);
        
        state.serviceId = Utils.getUrlParam('id');
        if (!state.serviceId) { renderError('لم يتم تحديد الخدمة'); return; }
        
        setupTabs();
        await loadService();
    }
    
    function setupTabs() {
        document.querySelectorAll('.service-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.service-tab-btn').forEach(b => {
                    b.classList.remove('active', 'text-emerald-600', 'border-emerald-600');
                    b.classList.add('text-gray-500', 'border-transparent');
                });
                btn.classList.add('active', 'text-emerald-600', 'border-emerald-600');
                btn.classList.remove('text-gray-500', 'border-transparent');
                
                document.querySelectorAll('.service-tab-content').forEach(c => c.classList.add('hidden'));
                document.getElementById('tab' + btn.dataset.tab.charAt(0).toUpperCase() + btn.dataset.tab.slice(1))?.classList.remove('hidden');
            });
        });
    }
    
    async function loadService() {
        try {
            const response = await API.services.getById(state.serviceId);
            const data = response.data || response;
            state.service = data.service || data;
            state.seller = data.seller || state.service.seller || state.service.sellerId;
            
            document.title = `${state.service.title} | مشرق`;
            if (elements.breadcrumbTitle) elements.breadcrumbTitle.textContent = Utils.truncate(state.service.title, 40);
            
            renderGallery();
            renderHeader();
            renderQuickStats();
            renderDescription();
            renderSeller();
            renderOrderCard();
            updateMobileBar();
            renderFAQ();
            await loadReviews();
            await loadRelatedServices();
        } catch (error) {
            renderError(error.message || 'تعذر تحميل الخدمة');
        }
    }
    
    function renderGallery() {
        if (!elements.serviceGallery) return;
        const images = state.service.imageUrls?.length ? state.service.imageUrls : (state.service.imageUrl ? [state.service.imageUrl] : []);
        
        if (images.length === 0) {
            elements.serviceGallery.innerHTML = `<div class="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400"><svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>`;
            return;
        }
        
        elements.serviceGallery.innerHTML = `
            <div class="relative group">
                <img src="${images[0]}" alt="${state.service.title}" id="mainImage" class="w-full aspect-video object-cover" onerror="this.src='/app/assets/images/placeholder.svg'">
                ${images.length > 1 ? `
                    <button id="prevBtn" class="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M9 18l6-6-6-6"/></svg></button>
                    <button id="nextBtn" class="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M15 18l-6-6 6-6"/></svg></button>
                    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">${images.map((_, i) => `<button class="thumb-dot w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/50'}" data-i="${i}"></button>`).join('')}</div>
                ` : ''}
            </div>
            ${images.length > 1 ? `<div class="flex gap-2 p-3 overflow-x-auto">${images.map((img, i) => `<button class="thumb flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 ${i === 0 ? 'border-emerald-500' : 'border-transparent'}" data-i="${i}"><img src="${img}" class="w-full h-full object-cover"></button>`).join('')}</div>` : ''}
        `;
        
        if (images.length > 1) {
            const mainImg = document.getElementById('mainImage');
            const update = (i) => {
                state.currentImageIndex = i;
                mainImg.src = images[i];
                document.querySelectorAll('.thumb').forEach((t, ti) => t.classList.toggle('border-emerald-500', ti === i));
                document.querySelectorAll('.thumb-dot').forEach((d, di) => { d.classList.toggle('bg-white', di === i); d.classList.toggle('bg-white/50', di !== i); });
            };
            document.getElementById('prevBtn')?.addEventListener('click', () => update(state.currentImageIndex > 0 ? state.currentImageIndex - 1 : images.length - 1));
            document.getElementById('nextBtn')?.addEventListener('click', () => update(state.currentImageIndex < images.length - 1 ? state.currentImageIndex + 1 : 0));
            document.querySelectorAll('.thumb, .thumb-dot').forEach(el => el.addEventListener('click', () => update(parseInt(el.dataset.i))));
        }
    }
    
    function renderHeader() {
        if (!elements.serviceHeader) return;
        const { title, rating, averageRating, reviewCount, totalReviews, category } = state.service;
        const r = rating || averageRating || 0;
        const rev = reviewCount || totalReviews || 0;
        const cat = CONFIG.CATEGORIES?.find(c => c.id === category);
        const seller = state.seller || {};
        
        elements.serviceHeader.innerHTML = `
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div class="flex-1">
                    <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mb-4">${Utils.escapeHtml(title)}</h1>
                    <div class="flex flex-wrap items-center gap-3 text-sm">
                        <button onclick="document.querySelector('[data-tab=seller]').click()" class="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
                            ${seller.avatarUrl ? `<img src="${seller.avatarUrl}" class="w-8 h-8 rounded-full object-cover">` : `<div class="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-sm">${(seller.fullName || seller.username || 'ب').charAt(0)}</div>`}
                            <span class="font-medium">${Utils.escapeHtml(seller.fullName || seller.username || 'بائع')}</span>
                        </button>
                        <span class="text-gray-300">|</span>
                        ${cat ? `<span class="text-gray-500">${cat.icon} ${cat.name}</span><span class="text-gray-300">|</span>` : ''}
                        <div class="flex items-center gap-1.5">
                            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                            <span class="font-bold text-gray-900">${r.toFixed(1)}</span>
                            <span class="text-gray-500">(${rev})</span>
                        </div>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button id="shareBtn" class="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg><span class="hidden sm:inline">مشاركة</span></button>
                    <button id="favoriteBtn" class="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-red-50 rounded-xl text-gray-700 hover:text-red-500 font-medium transition-colors"><svg id="favIcon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg><span class="hidden sm:inline" id="favText">حفظ</span></button>
                </div>
            </div>
        `;
        
        document.getElementById('shareBtn')?.addEventListener('click', () => {
            if (navigator.share) navigator.share({ title: state.service.title, url: location.href }).catch(() => {});
            else { navigator.clipboard.writeText(location.href); Toast.success('تم النسخ', 'تم نسخ الرابط'); }
        });
        
        document.getElementById('favoriteBtn')?.addEventListener('click', () => {
            if (!Auth.isLoggedIn()) { Toast.warning('تنبيه', 'سجل دخول أولاً'); return; }
            state.isFavorite = !state.isFavorite;
            const btn = document.getElementById('favoriteBtn'), icon = document.getElementById('favIcon'), txt = document.getElementById('favText');
            if (state.isFavorite) { btn.classList.add('bg-red-50', 'text-red-500'); icon.setAttribute('fill', 'currentColor'); txt.textContent = 'محفوظ'; Toast.success('تم', 'أضيف للمفضلة'); }
            else { btn.classList.remove('bg-red-50', 'text-red-500'); icon.setAttribute('fill', 'none'); txt.textContent = 'حفظ'; Toast.info('تم', 'أزيل من المفضلة'); }
        });
    }
    
    function renderQuickStats() {
        const { rating, averageRating, ordersCount, totalOrders, completedOrders, deliveryTime, deliveryDays } = state.service;
        const r = rating || averageRating || 0, o = ordersCount || totalOrders || completedOrders || 0, d = deliveryTime || deliveryDays || 3;
        
        // Update badge values
        if (elements.ratingBadge) elements.ratingBadge.textContent = r.toFixed(1);
        if (elements.ordersBadge) elements.ordersBadge.textContent = `${o} طلب`;
        if (elements.deliveryBadge) elements.deliveryBadge.textContent = `${d} ${d === 1 ? 'يوم' : 'أيام'}`;
    }
    
    function renderDescription() {
        if (!elements.serviceDescription) return;
        const desc = (state.service.description || '').split('\n').filter(p => p.trim());
        
        if (desc.length === 0) {
            elements.serviceDescription.innerHTML = `<p class="text-gray-400 italic">لا يوجد وصف متاح لهذه الخدمة</p>`;
        } else {
            elements.serviceDescription.innerHTML = desc.map(p => `<p class="text-gray-600 leading-relaxed mb-4 last:mb-0">${Utils.escapeHtml(p)}</p>`).join('');
        }
        
        // Features section
        if (state.service.features?.length && elements.serviceFeatures && elements.featuresList) {
            elements.serviceFeatures.classList.remove('hidden');
            elements.featuresList.innerHTML = state.service.features.map(f => `
                <div class="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-lg hover:bg-emerald-50 transition-colors">
                    <div class="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <span class="text-gray-700 font-medium">${Utils.escapeHtml(f)}</span>
                </div>
            `).join('');
        }
        
        // Requirements section
        if (state.service.requirements?.trim() && elements.requirementsContent) {
            elements.requirementsContent.innerHTML = `<p class="text-gray-600 leading-relaxed">${Utils.escapeHtml(state.service.requirements)}</p>`;
        }
    }
    
    function renderSeller() {
        const s = state.seller || {};
        const name = s.fullName || s.username || 'بائع';
        const avatar = s.avatarUrl || s.avatar;
        const level = CONFIG.SELLER_LEVELS?.[s.level] || { label: 'بائع جديد', color: 'gray' };
        
        if (elements.sellerCard) {
            elements.sellerCard.innerHTML = `
                <!-- Seller Main Info -->
                <div class="flex items-start gap-4 mb-6">
                    <div class="relative">
                        ${avatar 
                            ? `<img src="${avatar}" class="w-20 h-20 rounded-2xl object-cover shadow-lg ring-2 ring-emerald-100" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\'w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-2xl shadow-lg\'>${name.substring(0,2)}</div>'">`
                            : `<div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-2xl shadow-lg">${name.substring(0,2)}</div>`
                        }
                        <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" title="متصل الآن"></div>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-xl font-bold text-gray-900 mb-2">${Utils.escapeHtml(name)}</h3>
                        <span class="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                            ${level.label}
                        </span>
                    </div>
                </div>
                
                ${s.bio ? `<p class="text-gray-600 mb-6 leading-relaxed bg-gray-50 p-4 rounded-xl">${Utils.escapeHtml(s.bio)}</p>` : ''}
                
                <!-- Seller Stats -->
                <div class="grid grid-cols-2 gap-3 mb-6">
                    ${s.rating ? `
                    <div class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 text-center">
                        <div class="flex items-center justify-center gap-1 text-2xl font-bold text-yellow-600">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                            ${s.rating.toFixed(1)}
                        </div>
                        <div class="text-xs text-gray-500 mt-1">التقييم</div>
                    </div>` : ''}
                    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 text-center">
                        <div class="text-2xl font-bold text-blue-600">${s.responseTime || '<1'}</div>
                        <div class="text-xs text-gray-500 mt-1">ساعة للرد</div>
                    </div>
                    <div class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 text-center">
                        <div class="text-2xl font-bold text-emerald-600">${s.completedOrders || 0}</div>
                        <div class="text-xs text-gray-500 mt-1">طلب مكتمل</div>
                    </div>
                    <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 text-center">
                        <div class="text-2xl font-bold text-purple-600">${s.servicesCount || 1}</div>
                        <div class="text-xs text-gray-500 mt-1">خدمة</div>
                    </div>
                </div>
                
                <!-- Contact Button -->
                <button class="w-full py-3.5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                    تواصل مع البائع
                </button>
            `;
        }
    }
    
    function renderOrderCard() {
        if (!elements.orderCard) return;
        const { price, basePrice, deliveryTime, deliveryDays, revisions, _id, id, sellerId } = state.service;
        const p = basePrice || price || 0, d = deliveryTime || deliveryDays || 3, sId = _id || id;
        const isOwner = Auth.getUserId() && (sellerId === Auth.getUserId() || sellerId?._id === Auth.getUserId());
        
        elements.orderCard.innerHTML = `
            <!-- Price Header -->
            <div class="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 p-6 text-center rounded-t-2xl relative overflow-hidden">
                <div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.05\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
                <div class="relative">
                    <div class="text-4xl font-extrabold text-white drop-shadow-lg">${Utils.formatPrice(p)}</div>
                    <div class="text-sm text-white/80 mt-1 font-medium">السعر الأساسي</div>
                </div>
            </div>
            
            <!-- Service Details -->
            <div class="p-6">
                <div class="space-y-4 mb-6">
                    <div class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div class="flex items-center gap-3 text-gray-600">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center shadow-sm">
                                <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M12 6v6l4 2"/>
                                </svg>
                            </div>
                            <span class="font-medium">مدة التسليم</span>
                        </div>
                        <span class="font-bold text-gray-900 bg-white px-3 py-1 rounded-lg shadow-sm">${d} ${d === 1 ? 'يوم' : 'أيام'}</span>
                    </div>
                    <div class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div class="flex items-center gap-3 text-gray-600">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
                                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                </svg>
                            </div>
                            <span class="font-medium">التعديلات</span>
                        </div>
                        <span class="font-bold text-gray-900 bg-white px-3 py-1 rounded-lg shadow-sm">${revisions || 1} مرات</span>
                    </div>
                </div>
                
                <!-- Order Button -->
                ${isOwner 
                    ? `<a href="/app/seller/edit-service.html?id=${sId}" class="block w-full py-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-bold rounded-xl text-center transition-all shadow-sm hover:shadow">
                        <span class="flex items-center justify-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            تعديل الخدمة
                        </span>
                    </a>` 
                    : `<a href="/app/checkout.html?service=${sId}" class="block w-full py-4 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-600 text-white font-bold rounded-xl text-center transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                        <span class="flex items-center justify-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                            اطلب الخدمة الآن
                        </span>
                    </a>`
                }
                
                <!-- Trust Badge -->
                <div class="flex items-center justify-center gap-2 mt-6 pt-5 border-t border-gray-100 text-gray-500 text-sm">
                    <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                    <span>ضمان استرداد 100%</span>
                </div>
            </div>
        `;
    }
    
    function updateMobileBar() {
        const { price, basePrice, _id, id, sellerId } = state.service;
        const isOwner = Auth.getUserId() && (sellerId === Auth.getUserId() || sellerId?._id === Auth.getUserId());
        if (elements.mobilePrice) elements.mobilePrice.textContent = Utils.formatPrice(basePrice || price || 0);
        if (elements.mobileOrderBtn) {
            elements.mobileOrderBtn.href = isOwner ? `/app/seller/edit-service.html?id=${_id || id}` : `/app/checkout.html?service=${_id || id}`;
            elements.mobileOrderBtn.textContent = isOwner ? 'تعديل الخدمة' : 'اطلب الآن';
        }
    }
    
    function renderFAQ() {
        if (!elements.faqContent) return;
        const faqs = state.service.faqs?.length ? state.service.faqs : [{ q: 'كيف يمكنني التواصل قبل الطلب؟', a: 'اضغط على زر "تواصل مع البائع".' }, { q: 'ماذا لو لم أكن راضياً؟', a: 'نوفر ضمان استرداد كامل.' }];
        elements.faqContent.innerHTML = `<div class="space-y-3">${faqs.map((f, i) => `<div class="border border-gray-200 rounded-xl overflow-hidden"><button class="faq-q w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 text-right" data-i="${i}"><span class="font-medium text-gray-900">${Utils.escapeHtml(f.q || f.question)}</span><svg class="faq-arrow w-5 h-5 text-gray-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M19 9l-7 7-7-7"/></svg></button><div class="faq-a hidden px-4 pb-4 bg-gray-50 text-gray-600">${Utils.escapeHtml(f.a || f.answer)}</div></div>`).join('')}</div>`;
        document.querySelectorAll('.faq-q').forEach(q => q.addEventListener('click', () => { q.nextElementSibling.classList.toggle('hidden'); q.querySelector('.faq-arrow').classList.toggle('rotate-180'); }));
    }
    
    async function loadReviews() {
        try {
            const res = await API.reviews.getServiceReviews(state.serviceId, { limit: 10 });
            state.reviews = res.data?.reviews || res.reviews || [];
            if (elements.reviewsCountBadge) elements.reviewsCountBadge.textContent = state.reviews.length;
            
            const r = state.service.rating || state.service.averageRating || 0;
            const totalReviews = state.service.reviewCount || state.service.totalReviews || state.reviews.length;
            
            // Render reviews header
            if (elements.reviewsHeader) {
                elements.reviewsHeader.innerHTML = `
                    <div class="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-6">
                        <div class="flex flex-col sm:flex-row items-center gap-6">
                            <div class="text-center">
                                <div class="text-5xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">${r.toFixed(1)}</div>
                                <div class="flex gap-0.5 mt-2 justify-center">${Utils.renderStars ? Utils.renderStars(r) : ''}</div>
                                <div class="text-sm text-gray-500 mt-1">${totalReviews} تقييم</div>
                            </div>
                            <div class="flex-1 w-full">
                                ${[5,4,3,2,1].map(star => {
                                    const count = state.reviews.filter(rv => Math.round(rv.rating) === star).length;
                                    const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                                    return `
                                        <div class="flex items-center gap-2 mb-1">
                                            <span class="text-sm text-gray-600 w-3">${star}</span>
                                            <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                            <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div class="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-500" style="width: ${percent}%"></div>
                                            </div>
                                            <span class="text-xs text-gray-400 w-8">${count}</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // Render reviews list
            if (elements.reviewsList) {
                elements.reviewsList.innerHTML = state.reviews.length 
                    ? state.reviews.map(rv => `
                        <div class="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                            <div class="flex items-start gap-4">
                                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                                    ${(rv.buyer?.fullName || rv.buyer?.username || 'م').charAt(0)}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                                        <div>
                                            <span class="font-semibold text-gray-900">${Utils.escapeHtml(rv.buyer?.fullName || rv.buyer?.username || 'مشتري')}</span>
                                            <span class="text-xs text-gray-400 mr-2">${Utils.formatRelativeDate ? Utils.formatRelativeDate(rv.createdAt) : ''}</span>
                                        </div>
                                        <div class="flex gap-0.5">${Utils.renderStars ? Utils.renderStars(rv.rating) : ''}</div>
                                    </div>
                                    ${rv.comment ? `<p class="text-gray-600 leading-relaxed">${Utils.escapeHtml(rv.comment)}</p>` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')
                    : `
                        <div class="text-center py-12">
                            <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                                <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-width="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                                </svg>
                            </div>
                            <p class="text-gray-400">لا توجد تقييمات حتى الآن</p>
                            <p class="text-sm text-gray-300 mt-1">كن أول من يقيّم هذه الخدمة</p>
                        </div>
                    `;
            }
        } catch (e) { console.error('Error loading reviews:', e); }
    }
    
    async function loadRelatedServices() {
        try {
            const res = await API.services.getAll({ category: state.service.category, limit: 4 });
            let svcs = (res.data?.services || res.services || []).filter(s => (s._id || s.id) !== (state.service._id || state.service.id));
            if (svcs.length && elements.relatedSection) { elements.relatedSection.classList.remove('hidden'); elements.relatedServicesGrid.innerHTML = ServiceCard.renderList(svcs.slice(0, 4)); }
        } catch (e) { console.error(e); }
    }
    
    function renderError(msg) {
        document.querySelector('main').innerHTML = `<div class="max-w-lg mx-auto text-center py-20 px-4"><div class="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center"><svg class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div><h2 class="text-2xl font-bold text-gray-900 mb-2">تعذر تحميل الخدمة</h2><p class="text-gray-500 mb-6">${msg}</p><div class="flex gap-3 justify-center"><button onclick="location.reload()" class="px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl">إعادة المحاولة</button><a href="/app/explore.html" class="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl">تصفح الخدمات</a></div></div>`;
        if (elements.mobileOrderBar) elements.mobileOrderBar.style.display = 'none';
    }
    
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
