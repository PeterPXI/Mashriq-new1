/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ EXPLORE PAGE
 * منصة مشرق - صفحة استكشاف الخدمات
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // Page State
    // ─────────────────────────────────────────────────────────────────────────
    
    const state = {
        services: [],
        totalServices: 0,
        currentPage: 1,
        totalPages: 1,
        limit: CONFIG.DEFAULT_PAGE_SIZE,
        isLoading: false,
        error: null,
        viewMode: 'grid', // 'grid' or 'list'
        
        // Filters
        filters: {
            search: '',
            category: '',
            sort: '-createdAt',
            deliveryTime: '',
            minRating: '',
            minPrice: '',
            maxPrice: '',
        },
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // DOM Elements
    // ─────────────────────────────────────────────────────────────────────────
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        searchForm: document.getElementById('searchForm'),
        searchInput: document.getElementById('searchInput'),
        categoryFilter: document.getElementById('categoryFilter'),
        sortFilter: document.getElementById('sortFilter'),
        deliveryFilter: document.getElementById('deliveryFilter'),
        servicesGrid: document.getElementById('servicesGrid'),
        pagination: document.getElementById('pagination'),
        resultsCount: document.getElementById('resultsCount'),
        viewToggle: document.getElementById('viewToggle'),
        activeFilters: document.getElementById('activeFilters'),
        activeFiltersList: document.getElementById('activeFiltersList'),
        clearFiltersBtn: document.getElementById('clearFiltersBtn'),
        ratingFilter: document.getElementById('ratingFilter'),
        priceRangeBtn: document.getElementById('priceRangeBtn'),
        priceRangeLabel: document.getElementById('priceRangeLabel'),
        priceRangeModal: document.getElementById('priceRangeModal'),
        priceModalOverlay: document.getElementById('priceModalOverlay'),
        closePriceModal: document.getElementById('closePriceModal'),
        minPriceInput: document.getElementById('minPriceInput'),
        maxPriceInput: document.getElementById('maxPriceInput'),
        clearPriceBtn: document.getElementById('clearPriceBtn'),
        applyPriceBtn: document.getElementById('applyPriceBtn'),
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // Initialize Page
    // ─────────────────────────────────────────────────────────────────────────
    
    async function init() {
        // Render static components
        Navbar.render(elements.navbar);
        Footer.render(elements.footer);
        
        // Populate category filter
        populateCategoryFilter();
        
        // Read URL parameters
        readUrlParams();
        
        // Bind events
        bindEvents();
        
        // Load services
        await loadServices();
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Populate Category Filter
    // ─────────────────────────────────────────────────────────────────────────
    
    function populateCategoryFilter() {
        if (!elements.categoryFilter) return;
        
        const options = CONFIG.CATEGORIES.map(cat => 
            `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`
        ).join('');
        
        elements.categoryFilter.innerHTML = `
            <option value="">جميع التخصصات</option>
            ${options}
        `;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Read URL Parameters
    // ─────────────────────────────────────────────────────────────────────────
    
    function readUrlParams() {
        const search = Utils.getUrlParam('search');
        const category = Utils.getUrlParam('category');
        const sort = Utils.getUrlParam('sort');
        const page = Utils.getUrlParam('page');
        const delivery = Utils.getUrlParam('delivery');
        
        if (search) {
            state.filters.search = search;
            if (elements.searchInput) elements.searchInput.value = search;
        }
        
        if (category) {
            state.filters.category = category;
            if (elements.categoryFilter) elements.categoryFilter.value = category;
        }
        
        if (sort) {
            state.filters.sort = sort;
            if (elements.sortFilter) elements.sortFilter.value = sort;
        }
        
        if (delivery) {
            state.filters.deliveryTime = delivery;
            if (elements.deliveryFilter) elements.deliveryFilter.value = delivery;
        }
        
        const rating = Utils.getUrlParam('rating');
        if (rating) {
            state.filters.minRating = rating;
            if (elements.ratingFilter) elements.ratingFilter.value = rating;
        }
        
        const minPrice = Utils.getUrlParam('minPrice');
        const maxPrice = Utils.getUrlParam('maxPrice');
        if (minPrice) {
            state.filters.minPrice = minPrice;
            if (elements.minPriceInput) elements.minPriceInput.value = minPrice;
        }
        if (maxPrice) {
            state.filters.maxPrice = maxPrice;
            if (elements.maxPriceInput) elements.maxPriceInput.value = maxPrice;
        }
        updatePriceLabel();
        
        if (page) {
            state.currentPage = parseInt(page) || 1;
        }
    }
    
    function updatePriceLabel() {
        if (!elements.priceRangeLabel) return;
        const { minPrice, maxPrice } = state.filters;
        if (minPrice || maxPrice) {
            if (minPrice && maxPrice) {
                elements.priceRangeLabel.textContent = `$${minPrice} - $${maxPrice}`;
            } else if (minPrice) {
                elements.priceRangeLabel.textContent = `من $${minPrice}`;
            } else {
                elements.priceRangeLabel.textContent = `حتى $${maxPrice}`;
            }
            elements.priceRangeBtn?.classList.add('bg-orange-50', 'border-orange-300', 'text-orange-700');
        } else {
            elements.priceRangeLabel.textContent = 'نطاق السعر';
            elements.priceRangeBtn?.classList.remove('bg-orange-50', 'border-orange-300', 'text-orange-700');
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Load Services
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadServices() {
        if (state.isLoading) return;
        
        state.isLoading = true;
        showLoadingState();
        
        try {
            // Build query parameters
            const params = {
                limit: state.limit,
                page: state.currentPage,
                sort: state.filters.sort,
            };
            
            if (state.filters.search) {
                params.search = state.filters.search;
            }
            
            if (state.filters.category) {
                params.category = state.filters.category;
            }
            
            if (state.filters.deliveryTime) {
                params.deliveryTime = state.filters.deliveryTime;
            }
            
            if (state.filters.minRating) {
                params.minRating = state.filters.minRating;
            }
            
            if (state.filters.minPrice) {
                params.minPrice = state.filters.minPrice;
            }
            
            if (state.filters.maxPrice) {
                params.maxPrice = state.filters.maxPrice;
            }
            
            // Fetch services
            const response = await API.services.getAll(params);
            
            // Extract data - handle both { data: { services: [] } } and { services: [] }
            const data = response.data || response;
            state.services = data.services || (Array.isArray(data) ? data : []);
            state.totalServices = data.total || data.count || state.services.length;
            state.totalPages = Math.ceil(state.totalServices / state.limit) || 1;
            
            // Render
            renderServices();
            renderPagination();
            updateResultsCount();
            updateActiveFilters();
            updateUrl();
            
        } catch (error) {
            console.error('Failed to load services:', error);
            state.error = error.message;
            renderError();
        } finally {
            state.isLoading = false;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Services
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderServices() {
        if (!elements.servicesGrid) return;
        
        if (!state.services || state.services.length === 0) {
            renderEmptyState();
            return;
        }
        
        // Update grid class based on view mode
        elements.servicesGrid.className = state.viewMode === 'list' 
            ? 'space-y-4' 
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
        
        elements.servicesGrid.innerHTML = ServiceCard.renderList(state.services);
        
        // Add animation
        const cards = elements.servicesGrid.querySelectorAll('.service-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.05}s`;
            card.classList.add('animate-fade-in-up');
        });
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render States
    // ─────────────────────────────────────────────────────────────────────────
    
    function showLoadingState() {
        if (!elements.servicesGrid) return;
        elements.servicesGrid.innerHTML = ServiceCard.renderSkeleton(state.limit);
    }
    
    function renderEmptyState() {
        if (!elements.servicesGrid) return;
        
        const hasFilters = state.filters.search || state.filters.category || state.filters.deliveryTime;
        
        elements.servicesGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                    </svg>
                </div>
                <h3 class="empty-state-title">
                    ${hasFilters ? 'لا توجد نتائج مطابقة' : 'لا توجد خدمات حالياً'}
                </h3>
                <p class="empty-state-description">
                    ${hasFilters 
                        ? 'جرب تغيير معايير البحث أو الفلاتر للعثور على ما تبحث عنه' 
                        : 'كن أول من يضيف خدمة على المنصة!'
                    }
                </p>
                ${hasFilters 
                    ? `<button class="btn btn-primary mt-4" onclick="window.ExplorePage.clearFilters()">مسح الفلاتر</button>`
                    : `<a href="/app/seller/add-service.html" class="btn btn-primary mt-4">أضف خدمتك الأولى</a>`
                }
            </div>
        `;
    }
    
    function renderError() {
        if (!elements.servicesGrid) return;
        
        elements.servicesGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 8v4M12 16h.01"/>
                    </svg>
                </div>
                <h3 class="empty-state-title">تعذر تحميل الخدمات</h3>
                <p class="empty-state-description">حدث خطأ أثناء تحميل الخدمات. يرجى المحاولة مرة أخرى.</p>
                <button class="btn btn-primary mt-4" onclick="location.reload()">إعادة المحاولة</button>
            </div>
        `;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Pagination
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderPagination() {
        if (!elements.pagination) return;
        
        if (state.totalPages <= 1) {
            elements.pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // Previous button
        html += `
            <button class="pagination-btn" ${state.currentPage === 1 ? 'disabled' : ''} data-page="${state.currentPage - 1}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6"/>
                </svg>
            </button>
        `;
        
        // Page numbers
        const maxVisible = 5;
        let startPage = Math.max(1, state.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(state.totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        // First page
        if (startPage > 1) {
            html += `<button class="pagination-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn ${i === state.currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }
        
        // Last page
        if (endPage < state.totalPages) {
            if (endPage < state.totalPages - 1) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
            html += `<button class="pagination-btn" data-page="${state.totalPages}">${state.totalPages}</button>`;
        }
        
        // Next button
        html += `
            <button class="pagination-btn" ${state.currentPage === state.totalPages ? 'disabled' : ''} data-page="${state.currentPage + 1}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 18l-6-6 6-6"/>
                </svg>
            </button>
        `;
        
        elements.pagination.innerHTML = html;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Update Results Count
    // ─────────────────────────────────────────────────────────────────────────
    
    function updateResultsCount() {
        if (!elements.resultsCount) return;
        
        if (state.totalServices === 0) {
            elements.resultsCount.textContent = 'لا توجد نتائج';
        } else {
            const start = (state.currentPage - 1) * state.limit + 1;
            const end = Math.min(state.currentPage * state.limit, state.totalServices);
            elements.resultsCount.innerHTML = `
                عرض <strong>${start}-${end}</strong> من <strong>${state.totalServices}</strong> خدمة
            `;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Update Active Filters
    // ─────────────────────────────────────────────────────────────────────────
    
    function updateActiveFilters() {
        if (!elements.activeFilters || !elements.activeFiltersList) return;
        
        const activeFilters = [];
        
        if (state.filters.search) {
            activeFilters.push({
                type: 'search',
                label: `بحث: "${state.filters.search}"`,
            });
        }
        
        if (state.filters.category) {
            const cat = CONFIG.CATEGORIES.find(c => c.id === state.filters.category);
            if (cat) {
                activeFilters.push({
                    type: 'category',
                    label: cat.name,
                });
            }
        }
        
        if (state.filters.deliveryTime) {
            const labels = { '1': 'خلال يوم', '3': 'حتى 3 أيام', '7': 'حتى أسبوع' };
            activeFilters.push({
                type: 'deliveryTime',
                label: labels[state.filters.deliveryTime],
            });
        }
        
        if (state.filters.minRating) {
            activeFilters.push({
                type: 'minRating',
                label: `${state.filters.minRating}+ نجوم`,
            });
        }
        
        if (state.filters.minPrice || state.filters.maxPrice) {
            let label = 'السعر: ';
            if (state.filters.minPrice && state.filters.maxPrice) {
                label += `$${state.filters.minPrice} - $${state.filters.maxPrice}`;
            } else if (state.filters.minPrice) {
                label += `من $${state.filters.minPrice}`;
            } else {
                label += `حتى $${state.filters.maxPrice}`;
            }
            activeFilters.push({
                type: 'price',
                label,
            });
        }
        
        if (activeFilters.length === 0) {
            elements.activeFilters.style.display = 'none';
            return;
        }
        
        elements.activeFilters.style.display = 'flex';
        elements.activeFiltersList.innerHTML = activeFilters.map(filter => `
            <span class="filter-tag">
                ${filter.label}
                <button type="button" class="filter-tag-remove" data-filter="${filter.type}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </span>
        `).join('');
        
        // Bind remove filter events
        elements.activeFiltersList.querySelectorAll('.filter-tag-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                removeFilter(btn.dataset.filter);
            });
        });
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Update URL
    // ─────────────────────────────────────────────────────────────────────────
    
    function updateUrl() {
        const params = new URLSearchParams();
        
        if (state.filters.search) params.set('search', state.filters.search);
        if (state.filters.category) params.set('category', state.filters.category);
        if (state.filters.sort !== '-createdAt') params.set('sort', state.filters.sort);
        if (state.filters.deliveryTime) params.set('delivery', state.filters.deliveryTime);
        if (state.filters.minRating) params.set('rating', state.filters.minRating);
        if (state.filters.minPrice) params.set('minPrice', state.filters.minPrice);
        if (state.filters.maxPrice) params.set('maxPrice', state.filters.maxPrice);
        if (state.currentPage > 1) params.set('page', state.currentPage);
        
        const newUrl = params.toString() 
            ? `${window.location.pathname}?${params.toString()}`
            : window.location.pathname;
        
        window.history.replaceState({}, '', newUrl);
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Bind Events
    // ─────────────────────────────────────────────────────────────────────────
    
    function bindEvents() {
        // Search form
        elements.searchForm?.addEventListener('submit', handleSearch);
        
        // Filters
        elements.categoryFilter?.addEventListener('change', handleFilterChange);
        elements.sortFilter?.addEventListener('change', handleFilterChange);
        elements.deliveryFilter?.addEventListener('change', handleFilterChange);
        elements.ratingFilter?.addEventListener('change', handleRatingChange);
        
        // Price range modal
        elements.priceRangeBtn?.addEventListener('click', openPriceModal);
        elements.priceModalOverlay?.addEventListener('click', closePriceModal);
        elements.closePriceModal?.addEventListener('click', closePriceModal);
        elements.clearPriceBtn?.addEventListener('click', clearPriceFilter);
        elements.applyPriceBtn?.addEventListener('click', applyPriceFilter);
        
        // Clear filters
        elements.clearFiltersBtn?.addEventListener('click', clearFilters);
        
        // Pagination
        elements.pagination?.addEventListener('click', handlePaginationClick);
        
        // View toggle
        elements.viewToggle?.addEventListener('click', handleViewToggle);
        
        // Debounced search
        elements.searchInput?.addEventListener('input', Utils.debounce(handleSearchInput, 500));
    }
    
    function handleRatingChange(e) {
        state.filters.minRating = e.target.value;
        state.currentPage = 1;
        loadServices();
    }
    
    function openPriceModal() {
        elements.priceRangeModal?.classList.remove('hidden');
        if (elements.minPriceInput) elements.minPriceInput.value = state.filters.minPrice || '';
        if (elements.maxPriceInput) elements.maxPriceInput.value = state.filters.maxPrice || '';
    }
    
    function closePriceModal() {
        elements.priceRangeModal?.classList.add('hidden');
    }
    
    function clearPriceFilter() {
        state.filters.minPrice = '';
        state.filters.maxPrice = '';
        if (elements.minPriceInput) elements.minPriceInput.value = '';
        if (elements.maxPriceInput) elements.maxPriceInput.value = '';
        updatePriceLabel();
        closePriceModal();
        state.currentPage = 1;
        loadServices();
    }
    
    function applyPriceFilter() {
        state.filters.minPrice = elements.minPriceInput?.value || '';
        state.filters.maxPrice = elements.maxPriceInput?.value || '';
        updatePriceLabel();
        closePriceModal();
        state.currentPage = 1;
        loadServices();
    }

    function clearFilters() {
        state.filters = {
            search: '',
            category: '',
            sort: '-createdAt',
            deliveryTime: '',
            minRating: '',
            minPrice: '',
            maxPrice: '',
        };
        state.currentPage = 1;
        if (elements.searchInput) elements.searchInput.value = '';
        if (elements.categoryFilter) elements.categoryFilter.value = '';
        if (elements.sortFilter) elements.sortFilter.value = '-createdAt';
        if (elements.deliveryFilter) elements.deliveryFilter.value = '';
        if (elements.ratingFilter) elements.ratingFilter.value = '';
        if (elements.minPriceInput) elements.minPriceInput.value = '';
        if (elements.maxPriceInput) elements.maxPriceInput.value = '';
        updatePriceLabel();
        loadServices();
    }

    function removeFilter(type) {
        if (type === 'price') {
            state.filters.minPrice = '';
            state.filters.maxPrice = '';
            if (elements.minPriceInput) elements.minPriceInput.value = '';
            if (elements.maxPriceInput) elements.maxPriceInput.value = '';
            updatePriceLabel();
        } else if (state.filters[type] !== undefined) {
            state.filters[type] = type === 'sort' ? '-createdAt' : '';
            if (type === 'search' && elements.searchInput) elements.searchInput.value = '';
            if (type === 'category' && elements.categoryFilter) elements.categoryFilter.value = '';
            if (type === 'sort' && elements.sortFilter) elements.sortFilter.value = '-createdAt';
            if (type === 'deliveryTime' && elements.deliveryFilter) elements.deliveryFilter.value = '';
            if (type === 'minRating' && elements.ratingFilter) elements.ratingFilter.value = '';
        }
        state.currentPage = 1;
        loadServices();
    }

    // Expose for global access
    window.ExplorePage = { clearFilters, removeFilter };

    
    // ─────────────────────────────────────────────────────────────────────────
    // Event Handlers
    // ─────────────────────────────────────────────────────────────────────────
    
    function handleSearch(e) {
        e.preventDefault();
        state.filters.search = elements.searchInput?.value.trim() || '';
        state.currentPage = 1;
        loadServices();
    }
    
    function handleSearchInput(e) {
        state.filters.search = e.target.value.trim();
        state.currentPage = 1;
        loadServices();
    }
    
    function handleFilterChange(e) {
        const { id, value } = e.target;
        
        switch (id) {
            case 'categoryFilter':
                state.filters.category = value;
                break;
            case 'sortFilter':
                state.filters.sort = value;
                break;
            case 'deliveryFilter':
                state.filters.deliveryTime = value;
                break;
        }
        
        state.currentPage = 1;
        loadServices();
    }
    
    function handlePaginationClick(e) {
        const btn = e.target.closest('.pagination-btn');
        if (!btn || btn.disabled) return;
        
        const page = parseInt(btn.dataset.page);
        if (page && page !== state.currentPage) {
            state.currentPage = page;
            loadServices();
            
            // Scroll to top of results
            elements.servicesGrid?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    function handleViewToggle(e) {
        const btn = e.target.closest('.view-btn');
        if (!btn) return;
        
        const view = btn.dataset.view;
        if (view && view !== state.viewMode) {
            state.viewMode = view;
            
            // Update active state
            elements.viewToggle.querySelectorAll('.view-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.view === view);
            });
            
            // Re-render services
            renderServices();
        }
    }
    
    function removeFilter(filterType) {
        switch (filterType) {
            case 'search':
                state.filters.search = '';
                if (elements.searchInput) elements.searchInput.value = '';
                break;
            case 'category':
                state.filters.category = '';
                if (elements.categoryFilter) elements.categoryFilter.value = '';
                break;
            case 'deliveryTime':
                state.filters.deliveryTime = '';
                if (elements.deliveryFilter) elements.deliveryFilter.value = '';
                break;
        }
        
        state.currentPage = 1;
        loadServices();
    }
    
    function clearFilters() {
        state.filters = {
            search: '',
            category: '',
            sort: '-createdAt',
            deliveryTime: '',
        };
        state.currentPage = 1;
        
        // Reset form elements
        if (elements.searchInput) elements.searchInput.value = '';
        if (elements.categoryFilter) elements.categoryFilter.value = '';
        if (elements.sortFilter) elements.sortFilter.value = '-createdAt';
        if (elements.deliveryFilter) elements.deliveryFilter.value = '';
        
        loadServices();
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Expose for global access (needed for empty state button)
    // ─────────────────────────────────────────────────────────────────────────
    
    window.ExplorePage = {
        clearFilters,
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
