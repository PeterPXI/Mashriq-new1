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
        normalSearchInput: document.getElementById('normalSearchInput'),
        ctaButton: document.getElementById('ctaButton'),
        // Search Mode Elements
        tabNormal: document.getElementById('tabNormal'),
        tabSmart: document.getElementById('tabSmart'),
        aiBadge: document.getElementById('aiBadge'),
        smartSearchHint: document.getElementById('smartSearchHint'),
        examplePrompts: document.getElementById('examplePrompts'),
        quickTags: document.getElementById('quickTags'),
        // New Buttons
        clearSearchBtn: document.getElementById('clearSearchBtn'),
        voiceSearchBtn: document.getElementById('voiceSearchBtn'),
    };
    
    // Current search mode: 'normal' or 'smart'
    let currentSearchMode = 'normal';
    
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
    
    // Smart Search State
    let searchTimeout = null;
    let selectedIndex = -1;
    let currentResults = [];
    
    function bindEvents() {
        // Search Mode Tabs
        document.querySelectorAll('.search-mode-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                switchSearchMode(tab.dataset.mode);
            });
        });
        
        // Initialize tabs visual state
        updateTabsVisual();
        
        // Hero search form
        elements.heroSearchForm?.addEventListener('submit', handleSearch);
        
        // Normal Search Input
        elements.normalSearchInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = elements.normalSearchInput.value.trim();
                if (query) navigateToExplore(query);
            }
        });
        
        // Smart Search: Live search on typing
        elements.heroSearchInput?.addEventListener('input', (e) => {
            handleSmartSearch(e);
            toggleClearButton(e.target.value);
        });
        
        // Normal Search Button Toggle
        elements.normalSearchInput?.addEventListener('input', (e) => {
            toggleClearButton(e.target.value);
        });

        // Clear Search Button
        elements.clearSearchBtn?.addEventListener('click', handleClearSearch);

        // Voice Search Button
        elements.voiceSearchBtn?.addEventListener('click', handleVoiceSearch);
        
        // Smart Search: Keyboard navigation
        elements.heroSearchInput?.addEventListener('keydown', handleSearchKeyboard);
        
        // Smart Search: Focus/Blur
        elements.heroSearchInput?.addEventListener('focus', () => {
            const query = elements.heroSearchInput.value.trim();
            if (query.length >= 2) {
                showSearchDropdown();
            }
        });
        
        // Click outside to close dropdown
        document.addEventListener('click', (e) => {
            const container = document.getElementById('heroSearchContainer');
            if (container && !container.contains(e.target)) {
                hideSearchDropdown();
            }
        });
        
        // Quick search tags (Normal Mode)
        document.querySelectorAll('.quick-search-tag').forEach(btn => {
            btn.addEventListener('click', () => {
                const searchTerm = btn.dataset.search;
                if (searchTerm) {
                    if (currentSearchMode === 'normal') {
                        navigateToExplore(searchTerm);
                    } else {
                        if (elements.heroSearchInput) {
                            elements.heroSearchInput.value = searchTerm;
                        }
                        performSmartSearch(searchTerm);
                    }
                }
            });
        });
        
        // Example prompts (Smart Mode)
        document.querySelectorAll('.example-prompt').forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.textContent.trim();
                if (prompt && elements.heroSearchInput) {
                    elements.heroSearchInput.value = prompt;
                    elements.heroSearchInput.focus();
                    performSmartSearch(prompt);
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
    
    // Switch between Normal and Smart search modes
    function switchSearchMode(mode) {
        currentSearchMode = mode;
        
        const normalInput = elements.normalSearchInput;
        const smartInput = elements.heroSearchInput;
        const aiBadge = elements.aiBadge;
        const hint = elements.smartSearchHint;
        const examples = elements.examplePrompts;
        const quickTags = elements.quickTags;
        
        // Sync values
        if (mode === 'smart' && normalInput.value) {
            smartInput.value = normalInput.value;
            toggleClearButton(smartInput.value);
        } else if (mode === 'normal' && smartInput.value) {
            normalInput.value = smartInput.value;
            toggleClearButton(normalInput.value);
        }
        
        if (mode === 'smart') {
            // Switch to Smart Search
            normalInput?.classList.add('hidden');
            smartInput?.classList.remove('hidden');
            aiBadge?.classList.remove('hidden');
            aiBadge?.classList.add('inline-flex');
            hint?.classList.remove('hidden');
            examples?.classList.remove('hidden');
            quickTags?.classList.add('hidden');
            smartInput?.focus();
        } else {
            // Switch to Normal Search
            normalInput?.classList.remove('hidden');
            smartInput?.classList.add('hidden');
            aiBadge?.classList.add('hidden');
            aiBadge?.classList.remove('inline-flex');
            hint?.classList.add('hidden');
            examples?.classList.add('hidden');
            quickTags?.classList.remove('hidden');
            hideSearchDropdown();
            normalInput?.focus();
        }
        
        updateTabsVisual();
    }
    
    // Update tabs visual state (Liner style - green active)
    function updateTabsVisual() {
        const tabNormal = elements.tabNormal;
        const tabSmart = elements.tabSmart;
        
        // Reset both
        tabNormal?.classList.remove('bg-orange-500', 'text-white', 'shadow-sm');
        tabSmart?.classList.remove('bg-orange-500', 'text-white', 'shadow-sm');
        tabNormal?.classList.add('text-gray-500', 'hover:text-gray-700');
        tabSmart?.classList.add('text-gray-500', 'hover:text-gray-700');
        
        if (currentSearchMode === 'normal') {
            tabNormal?.classList.remove('text-gray-500', 'hover:text-gray-700');
            tabNormal?.classList.add('bg-orange-500', 'text-white', 'shadow-sm');
        } else {
            tabSmart?.classList.remove('text-gray-500', 'hover:text-gray-700');
            tabSmart?.classList.add('bg-orange-500', 'text-white', 'shadow-sm');
        }
    }
    
    // Navigate to explore page with search query
    function navigateToExplore(query) {
        if (query && query.trim()) {
            window.location.href = `/app/explore.html?search=${encodeURIComponent(query.trim())}`;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Smart Search Functions
    // ─────────────────────────────────────────────────────────────────────────
    
    function handleSmartSearch(e) {
        const query = e.target.value.trim();
        
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Hide dropdown if query too short
        if (query.length < 2) {
            hideSearchDropdown();
            return;
        }
        
        // Show loading
        showSearchLoading();
        
        // Debounce: wait 200ms after user stops typing
        searchTimeout = setTimeout(() => {
            performSmartSearch(query);
        }, 200);
    }
    
    function performSmartSearch(query) {
        // Check if SmartSearch is available
        if (typeof SmartSearch === 'undefined') {
            console.warn('SmartSearch not available');
            hideSearchDropdown();
            return;
        }
        
        // Perform search
        const results = SmartSearch.search(query, { limit: 8 });
        
        console.log('🔍 Smart Search:', query, results);
        
        // Store results for keyboard navigation
        currentResults = results.services || [];
        selectedIndex = -1;
        
        // Render results
        renderSearchResults(results);
        
        // Update meta info
        const meta = document.getElementById('searchMeta');
        if (meta && results.meta) {
            meta.textContent = `${results.meta.totalFound} نتيجة • ${results.meta.time}ms`;
        }
        
        // Hide loading, show dropdown
        hideSearchLoading();
        showSearchDropdown();
    }
    
    function renderSearchResults(results) {
        const container = document.getElementById('searchResults');
        if (!container) return;
        
        const { services, categories, suggestions } = results;
        
        // Font Awesome icons map
        const catIcons = {
            'design': 'fa-palette',
            'programming': 'fa-code',
            'writing': 'fa-pen-fancy',
            'translation': 'fa-language',
            'video': 'fa-video',
            'marketing': 'fa-bullhorn',
            'audio': 'fa-microphone',
            'business': 'fa-briefcase'
        };
        
        // Category colors map
        const catColors = {
            'design': 'bg-rose-100 text-rose-600',
            'programming': 'bg-sky-100 text-sky-600',
            'writing': 'bg-amber-100 text-amber-600',
            'translation': 'bg-emerald-100 text-emerald-600',
            'video': 'bg-purple-100 text-purple-600',
            'marketing': 'bg-orange-100 text-orange-600',
            'audio': 'bg-fuchsia-100 text-fuchsia-600',
            'business': 'bg-slate-100 text-slate-600'
        };
        
        // No results
        if (services.length === 0 && categories.length === 0) {
            container.innerHTML = `
                <div class="px-6 py-10 text-center">
                    <div class="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <i class="fa-solid fa-magnifying-glass text-xl"></i>
                    </div>
                    <div class="text-gray-700 font-semibold">لم نجد نتائج</div>
                    <div class="text-gray-400 text-sm mt-1">جرب كلمات أخرى</div>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        // Categories section
        if (categories.length > 0) {
            html += '<div class="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><span class="text-xs font-bold text-gray-400 uppercase tracking-wide">التصنيفات</span></div>';
            
            categories.forEach((cat, idx) => {
                const icon = catIcons[cat.id] || 'fa-folder';
                const colors = catColors[cat.id] || 'bg-gray-100 text-gray-600';
                
                html += `
                    <div class="search-result-item px-4 py-3 hover:bg-orange-50 cursor-pointer flex items-center gap-3 transition-all duration-150 border-b border-gray-100 group"
                         data-type="category" data-id="${cat.id}" data-index="cat-${idx}">
                        <div class="w-10 h-10 rounded-xl ${colors} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                        <div class="flex-1">
                            <div class="font-semibold text-gray-800 text-sm">${cat.name}</div>
                            <div class="text-xs text-gray-400">تصفح الخدمات</div>
                        </div>
                        <i class="fa-solid fa-chevron-left text-gray-300 group-hover:text-orange-400 transition-colors text-sm"></i>
                    </div>
                `;
            });
        }
        
        // Services section
        if (services.length > 0) {
            html += '<div class="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><span class="text-xs font-bold text-gray-400 uppercase tracking-wide">الخدمات</span></div>';
            
            services.forEach((service, idx) => {
                const icon = catIcons[service.category] || 'fa-cube';
                const colors = catColors[service.category] || 'bg-gray-100 text-gray-600';
                const price = service.price ? `<span class="text-xs font-bold text-emerald-600">$${service.price}</span>` : '';
                
                // Match badge
                let badge = '';
                if (service._matchType === 'exact') badge = '<span class="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">مطابق</span>';
                else if (service._matchType === 'high') badge = '<span class="px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded text-xs font-medium">متوافق</span>';
                else if (service._matchType === 'medium') badge = '<span class="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">مشابه</span>';
                
                html += `
                    <div class="search-result-item px-4 py-3 hover:bg-orange-50 cursor-pointer flex items-center gap-3 transition-all duration-150 border-b border-gray-100 group animate-fade-up"
                         style="animation-delay: ${idx * 0.05}s"
                         data-type="service" data-id="${service.id}" data-index="${idx}" data-title="${service.title}">
                        <div class="w-10 h-10 rounded-xl ${colors} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="font-semibold text-gray-800 text-sm truncate">${service.title}</div>
                            <div class="flex items-center gap-2 mt-0.5">${badge} ${price}</div>
                        </div>
                        <i class="fa-solid fa-chevron-left text-gray-300 group-hover:text-orange-400 transition-colors text-sm"></i>
                    </div>
                `;
            });
        }
        
        // Suggestions
        if (suggestions && suggestions.length > 0) {
            html += '<div class="px-4 py-2.5 bg-indigo-50 border-b border-indigo-100"><span class="text-xs font-bold text-indigo-500 uppercase tracking-wide flex items-center gap-1.5"><i class="fa-solid fa-wand-magic-sparkles"></i> اقتراحات</span></div>';
            
            suggestions.slice(0, 3).forEach(sug => {
                html += `
                    <div class="search-result-item px-4 py-2.5 hover:bg-indigo-50 cursor-pointer flex items-center gap-2.5 transition-all duration-150 group"
                         data-type="suggestion" data-query="${sug.text}">
                        <div class="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-500 flex-shrink-0">
                            <i class="fa-solid fa-lightbulb text-xs"></i>
                        </div>
                        <span class="text-sm font-medium text-indigo-700">${sug.text}</span>
                        <span class="text-xs text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded">${sug.label}</span>
                    </div>
                `;
            });
        }
        
        container.innerHTML = html;
        
        // Bind click events
        container.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => handleResultClick(item));
        });
    }
    
    function getMatchBadge(matchType) {
        const badges = {
            'exact': '<span class="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">مطابق</span>',
            'high': '<span class="px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded text-xs font-medium">متوافق</span>',
            'medium': '<span class="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">مشابه</span>',
            'low': '',
        };
        return badges[matchType] || '';
    }
    
    function getCategoryIcon(category) {
        const icons = {
            'design': '<i class="fa-solid fa-palette"></i>',
            'programming': '<i class="fa-solid fa-code"></i>',
            'writing': '<i class="fa-solid fa-pen-fancy"></i>',
            'translation': '<i class="fa-solid fa-language"></i>',
            'video': '<i class="fa-solid fa-video"></i>',
            'marketing': '<i class="fa-solid fa-bullhorn"></i>',
            'audio': '<i class="fa-solid fa-microphone"></i>',
            'business': '<i class="fa-solid fa-briefcase"></i>',
        };
        return icons[category] || '<i class="fa-solid fa-cube"></i>';
    }
    
    function handleResultClick(item) {
        const type = item.dataset.type;
        const id = item.dataset.id;
        const query = item.dataset.query;
        const title = item.dataset.title;
        
        hideSearchDropdown();
        
        if (type === 'category') {
            window.location.href = `/app/explore.html?category=${id}`;
        } else if (type === 'service') {
            // Navigate to explore with the service title as search
            navigateToExplore(title);
        } else if (type === 'suggestion') {
            elements.heroSearchInput.value = query;
            performSmartSearch(query);
        }
    }
    
    function handleSearchKeyboard(e) {
        const dropdown = document.getElementById('smartSearchDropdown');
        const isVisible = dropdown && !dropdown.classList.contains('hidden');
        
        if (!isVisible) return;
        
        const items = document.querySelectorAll('.search-result-item');
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                updateSelectedItem(items);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateSelectedItem(items);
                break;
                
            case 'Enter':
                if (selectedIndex >= 0 && items[selectedIndex]) {
                    e.preventDefault();
                    handleResultClick(items[selectedIndex]);
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                hideSearchDropdown();
                elements.heroSearchInput.blur();
                break;
        }
    }
    
    function updateSelectedItem(items) {
        items.forEach((item, idx) => {
            if (idx === selectedIndex) {
                item.classList.add('bg-orange-50');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('bg-orange-50');
            }
        });
    }
    
    function showSearchDropdown() {
        const dropdown = document.getElementById('smartSearchDropdown');
        if (dropdown) {
            dropdown.classList.remove('hidden');
            elements.heroSearchInput?.setAttribute('aria-expanded', 'true');
        }
    }
    
    function hideSearchDropdown() {
        const dropdown = document.getElementById('smartSearchDropdown');
        if (dropdown) {
            dropdown.classList.add('hidden');
            elements.heroSearchInput?.setAttribute('aria-expanded', 'false');
        }
        selectedIndex = -1;
    }
    
    function showSearchLoading() {
        const loader = document.getElementById('searchLoading');
        const icon = document.getElementById('searchIcon');
        if (loader) loader.classList.remove('hidden');
        if (icon) icon.classList.add('hidden');
    }
    
    function hideSearchLoading() {
        const loader = document.getElementById('searchLoading');
        const icon = document.getElementById('searchIcon');
        if (loader) loader.classList.add('hidden');
        if (icon) icon.classList.remove('hidden');
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Handle Search (Form Submit)
    // ─────────────────────────────────────────────────────────────────────────
    
    function handleSearch(e) {
        e.preventDefault();
        hideSearchDropdown();
        
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
    // Input Actions (Clear & Voice)
    // ─────────────────────────────────────────────────────────────────────────

    function toggleClearButton(value) {
        const btn = elements.clearSearchBtn;
        if (!btn) return;

        if (value && value.trim().length > 0) {
            btn.classList.remove('hidden');
        } else {
            btn.classList.add('hidden');
        }
    }

    function handleClearSearch() {
        const input = currentSearchMode === 'smart' ? elements.heroSearchInput : elements.normalSearchInput;
        if (!input) return;

        input.value = '';
        input.focus();
        toggleClearButton('');
        hideSearchDropdown();
        
        // Trigger input event to reset state if needed
        input.dispatchEvent(new Event('input'));
    }

    function handleVoiceSearch() {
        if (!('webkitSpeechRecognition' in window)) {
            // Fallback for non-supported browsers
            alert('خدمة البحث الصوتي غير مدعومة في متصفحك الحالي.');
            return;
        }

        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'ar-SA'; // Arabic
        recognition.continuous = false;
        recognition.interimResults = false;

        const btn = elements.voiceSearchBtn;
        const originalIcon = btn.innerHTML;
        
        // Visual feedback
        btn.innerHTML = '<i class="fa-solid fa-microphone-lines fa-beat-fade text-orange-500"></i>';
        btn.classList.add('text-orange-500');

        recognition.onstart = () => {
            console.log('Voice recognition started');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('Voice Result:', transcript);
            
            const input = currentSearchMode === 'smart' ? elements.heroSearchInput : elements.normalSearchInput;
            
            if (input) {
                input.value = transcript;
                input.focus();
                toggleClearButton(transcript);
                
                // Trigger smart search or navigate depending on mode
                if (currentSearchMode === 'smart') {
                    // Trigger input event to start smart search
                    input.dispatchEvent(new Event('input'));
                } else {
                     // For normal mode, maybe just fill it or auto-submit? let's just fill it.
                     // input.dispatchEvent(new Event('input')); // Optional
                }
            }
        };

        recognition.onerror = (event) => {
            console.warn('Voice recognition error', event.error);
        };

        recognition.onend = () => {
            // Reset button
            btn.innerHTML = originalIcon;
            btn.classList.remove('text-orange-500');
        };

        try {
            recognition.start();
        } catch (e) {
            console.error('Recognition start failed', e);
        }
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
