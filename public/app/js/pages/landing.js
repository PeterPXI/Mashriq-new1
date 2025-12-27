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
        await loadStats();
        
        // Load featured services from API
        await loadFeaturedServices();
        
        // Update CTA based on auth state
        updateCTAButton();
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Load Stats from API
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadStats() {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            
            if (data.data?.stats) {
                const stats = data.data.stats;
                
                // Animate counters
                animateCounter('statServices', stats.services || 0, '+');
                animateCounter('statSellers', stats.sellers || 0, '+');
                animateCounter('statOrders', stats.completedOrders || 0, '+');
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
            // Keep default values on error
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Animate Counter
    // ─────────────────────────────────────────────────────────────────────────
    
    function animateCounter(elementId, targetValue, prefix = '') {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const duration = 2000; // 2 seconds
        const startTime = performance.now();
        const startValue = 0;
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function - ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(startValue + (targetValue - startValue) * eased);
            
            element.textContent = prefix + current;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = prefix + targetValue;
            }
        }
        
        requestAnimationFrame(update);
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Categories - Premium Design
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderCategories() {
        if (!elements.categoriesGrid) return;
        
        // Category colors for visual variety
        const categoryColors = {
            'design': 'from-pink-500 to-rose-500',
            'writing': 'from-blue-500 to-indigo-500',
            'programming': 'from-green-500 to-emerald-500',
            'marketing': 'from-purple-500 to-violet-500',
            'video': 'from-orange-500 to-red-500',
            'audio': 'from-cyan-500 to-teal-500',
            'translation': 'from-yellow-500 to-amber-500',
            'other': 'from-gray-500 to-slate-500'
        };
        
        const categoriesHTML = CONFIG.CATEGORIES.map(category => {
            const gradient = categoryColors[category.id] || 'from-orange-500 to-red-500';
            return `
                <a href="/app/explore.html?category=${category.id}" 
                   class="group relative bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-xl border border-gray-100 hover:border-orange-200 transition-all duration-300 transform hover:-translate-y-1">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        ${category.icon}
                    </div>
                    <span class="font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">${category.name}</span>
                    <div class="absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                </a>
            `;
        }).join('');
        
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
