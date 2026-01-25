/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ LANDING PAGE
 * منصة مشرق - الصفحة الرئيسية
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // Page State
    // ─────────────────────────────────────────────────────────────────────────
    
    const state = {
        services: [],
        isLoading: false,
        error: null,
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // DOM Elements
    // ─────────────────────────────────────────────────────────────────────────
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        categoriesGrid: document.getElementById('categoriesGrid'),
        featuredServicesGrid: document.getElementById('featuredServicesGrid'),
        heroSearchForm: document.getElementById('heroSearchForm'),
        heroSearchInput: document.getElementById('heroSearchInput'),
        ctaButton: document.getElementById('ctaButton'),
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // Initialize Page
    // ─────────────────────────────────────────────────────────────────────────
    
    async function init() {
        // Render static components
        Navbar.render(elements.navbar);
        Footer.render(elements.footer);
        
        // Render categories
        renderCategories();
        
        // Bind events
        bindEvents();
        
        // Load real stats from API
        await loadPlatformStats();
        
        // Load featured services from API
        await loadFeaturedServices();
        
        // Update CTA based on auth state
        updateCTAButton();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Load Platform Stats
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadPlatformStats() {
        try {
            const response = await API.stats.getOverview();
            const stats = response.data || {};
            
            if (document.getElementById('statServices')) {
                document.getElementById('statServices').textContent = '+' + (stats.services || 500);
            }
            if (document.getElementById('statSellers')) {
                document.getElementById('statSellers').textContent = '+' + (stats.users || 200);
            }
            if (document.getElementById('statOrders')) {
                document.getElementById('statOrders').textContent = '+' + (stats.orders || 1000);
            }
        } catch (error) {
            console.warn('Could not load platform stats:', error);
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Categories
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderCategories() {
        if (!elements.categoriesGrid) return;
        
        const categoriesHTML = CONFIG.CATEGORIES.map(category => `
            <a href="/app/explore.html?category=${category.id}" 
               class="group flex flex-col items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary-200 hover:-translate-y-1 transition-all duration-300">
                <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300" style="background: ${category.bgColor};">
                    ${category.icon.replace('<svg', '<svg class="w-6 h-6 sm:w-7 sm:h-7"')}
                </div>
                <span class="text-sm sm:text-base font-semibold text-gray-800 group-hover:text-primary-600 transition-colors text-center">${category.name}</span>
            </a>
        `).join('');
        
        elements.categoriesGrid.innerHTML = categoriesHTML;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Load Featured Services
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadFeaturedServices() {
        if (!elements.featuredServicesGrid) return;
        
        // Show skeleton loading
        elements.featuredServicesGrid.innerHTML = ServiceCard.renderSkeleton(8);
        state.isLoading = true;
        
        try {
            // Fetch services from API
            const response = await API.services.getAll({
                limit: 8,
                sort: '-rating', // Get highest rated
                status: 'active',
            });
            
            // Extract services array from response
            const services = response.data?.services || response.data || response.services || [];
            state.services = Array.isArray(services) ? services : [];
            
            // Render services
            renderFeaturedServices();
            
        } catch (error) {
            console.error('Failed to load services:', error);
            state.error = error.message;
            renderServicesError();
        } finally {
            state.isLoading = false;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Featured Services
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderFeaturedServices() {
        if (!elements.featuredServicesGrid) return;
        
        if (!state.services || state.services.length === 0) {
            elements.featuredServicesGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                        </svg>
                    </div>
                    <h3 class="empty-state-title">لا توجد خدمات حالياً</h3>
                    <p class="empty-state-description">كن أول من يضيف خدمة على المنصة!</p>
                    <a href="/app/seller/add-service.html" class="btn btn-primary mt-4">أضف خدمتك الأولى</a>
                </div>
            `;
            return;
        }
        
        elements.featuredServicesGrid.innerHTML = ServiceCard.renderList(state.services);
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Error State
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderServicesError() {
        if (!elements.featuredServicesGrid) return;
        
        elements.featuredServicesGrid.innerHTML = `
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
    // Bind Events
    // ─────────────────────────────────────────────────────────────────────────
    
    function bindEvents() {
        // Hero search form
        elements.heroSearchForm?.addEventListener('submit', handleSearch);
        
        // Search suggestions
        document.querySelectorAll('.search-suggestion').forEach(btn => {
            btn.addEventListener('click', () => {
                const searchTerm = btn.dataset.search;
                if (searchTerm) {
                    navigateToExplore(searchTerm);
                }
            });
        });
        
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');
                if (targetId && targetId !== '#') {
                    e.preventDefault();
                    const target = document.querySelector(targetId);
                    target?.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Handle Search
    // ─────────────────────────────────────────────────────────────────────────
    
    function handleSearch(e) {
        e.preventDefault();
        
        const searchTerm = elements.heroSearchInput?.value.trim();
        if (searchTerm) {
            navigateToExplore(searchTerm);
        } else {
            // Just go to explore page
            window.location.href = '/app/explore.html';
        }
    }
    
    function navigateToExplore(searchTerm) {
        const url = Utils.buildUrl('/app/explore.html', { search: searchTerm });
        window.location.href = url;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Update CTA Button
    // ─────────────────────────────────────────────────────────────────────────
    
    function updateCTAButton() {
        if (!elements.ctaButton) return;
        
        if (Auth.isAuthenticated()) {
            const dashboardUrl = Auth.getDashboardUrl();
            elements.ctaButton.href = dashboardUrl;
            elements.ctaButton.innerHTML = `
                انتقل للوحة التحكم
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            `;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Intersection Observer for Animations
    // ─────────────────────────────────────────────────────────────────────────
    
    function setupScrollAnimations() {
        // Skip if browser doesn't support IntersectionObserver
        if (!('IntersectionObserver' in window)) {
            return;
        }
        
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Observe sections - but only hide elements that are NOT already visible
        document.querySelectorAll('.section-header, .step-card, .trust-feature').forEach(el => {
            const rect = el.getBoundingClientRect();
            // Only animate elements that are below the fold (not yet visible)
            if (rect.top > window.innerHeight) {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                observer.observe(el);
            }
        });
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Run
    // ─────────────────────────────────────────────────────────────────────────
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Setup scroll animations after initial load
    window.addEventListener('load', setupScrollAnimations);
    
})();
