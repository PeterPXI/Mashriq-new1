/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ FIND SERVICE PAGE - البحث الذكي عن الخدمات
 * منصة مشرق - صفحة المطابقة الذكية بالذكاء الاصطناعي
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // DOM Elements
    // ─────────────────────────────────────────────────────────────────────────
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        matchForm: document.getElementById('matchForm'),
        projectDescription: document.getElementById('projectDescription'),
        budget: document.getElementById('budget'),
        category: document.getElementById('category'),
        searchBtn: document.getElementById('searchBtn'),
        resultsSection: document.getElementById('resultsSection'),
        resultsHeader: document.getElementById('resultsHeader'),
        resultsCount: document.getElementById('resultsCount'),
        aiBadge: document.getElementById('aiBadge'),
        resultsGrid: document.getElementById('resultsGrid'),
        noResults: document.getElementById('noResults'),
        loadingState: document.getElementById('loadingState')
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // Initialize
    // ─────────────────────────────────────────────────────────────────────────
    
    async function init() {
        // Render components
        Navbar.render(elements.navbar);
        Footer.render(elements.footer);
        
        // Bind events
        bindEvents();
        
        // Initialize AI
        if (typeof MashriqAI !== 'undefined') {
            await MashriqAI.init();
        }
    }
    
    function bindEvents() {
        elements.matchForm?.addEventListener('submit', handleSearch);
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Handle Search
    // ─────────────────────────────────────────────────────────────────────────
    
    async function handleSearch(e) {
        e.preventDefault();
        
        const description = elements.projectDescription.value.trim();
        const budget = elements.budget.value ? parseInt(elements.budget.value) : null;
        const category = elements.category.value || null;
        
        if (description.length < 10) {
            Toast.warning('تنبيه', 'يرجى وصف مشروعك بشكل أفضل (10 أحرف على الأقل)');
            return;
        }
        
        // Show loading
        showLoading(true);
        hideResults();
        
        try {
            const result = await MashriqAI.matchServices({ description, budget, category });
            
            if (result.matches.length === 0) {
                showNoResults();
            } else {
                showResults(result);
            }
            
        } catch (error) {
            console.error('Search Error:', error);
            Toast.error('خطأ', error.message || 'حدث خطأ أثناء البحث');
            showNoResults();
        } finally {
            showLoading(false);
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // UI Helpers
    // ─────────────────────────────────────────────────────────────────────────
    
    function showLoading(show) {
        if (show) {
            elements.loadingState.classList.remove('hidden');
            elements.searchBtn.disabled = true;
            elements.searchBtn.innerHTML = `
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" class="opacity-75"></path>
                </svg>
                <span>جاري البحث...</span>
            `;
        } else {
            elements.loadingState.classList.add('hidden');
            elements.searchBtn.disabled = false;
            elements.searchBtn.innerHTML = `
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>🎯 ابحث عن الخدمة المثالية</span>
            `;
        }
    }
    
    function hideResults() {
        elements.resultsSection.classList.add('hidden');
        elements.noResults.classList.add('hidden');
    }
    
    function showNoResults() {
        elements.resultsSection.classList.remove('hidden');
        elements.resultsGrid.classList.add('hidden');
        elements.noResults.classList.remove('hidden');
    }
    
    function showResults(data) {
        elements.resultsSection.classList.remove('hidden');
        elements.resultsGrid.classList.remove('hidden');
        elements.noResults.classList.add('hidden');
        
        // Update count
        elements.resultsCount.textContent = `وجدنا ${data.matches.length} خدمة مناسبة لك`;
        
        // Show AI badge if AI-enabled
        if (data.aiEnabled) {
            elements.aiBadge.classList.remove('hidden');
            elements.aiBadge.classList.add('flex');
        } else {
            elements.aiBadge.classList.add('hidden');
        }
        
        // Render cards
        elements.resultsGrid.innerHTML = data.matches.map((match, index) => 
            renderMatchCard(match, index)
        ).join('');
        
        // Animate cards
        requestAnimationFrame(() => {
            document.querySelectorAll('.match-card').forEach((card, i) => {
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, i * 100);
            });
        });
    }
    
    function renderMatchCard(match, index) {
        const { service, seller, matchScore, matchReasons } = match;
        const scoreColor = matchScore >= 80 ? '#10b981' : matchScore >= 60 ? '#f59e0b' : '#6b7280';
        const scoreBg = matchScore >= 80 ? 'bg-emerald-50' : matchScore >= 60 ? 'bg-amber-50' : 'bg-gray-50';
        
        const imageUrl = service.images?.[0] || '/app/assets/images/placeholder-service.jpg';
        const sellerAvatar = seller?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller?.name || 'U')}&background=f97316&color=fff`;
        
        return `
            <div class="match-card bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100" 
                 style="opacity: 0; transform: translateY(20px); transition: all 0.3s ease ${index * 0.1}s;">
                
                <!-- Match Score Badge -->
                <div class="absolute top-3 left-3 z-10">
                    <div class="match-badge ${scoreBg} px-3 py-1.5 rounded-full flex items-center gap-2" 
                         style="border: 2px solid ${scoreColor};">
                        <svg class="w-4 h-4" style="color: ${scoreColor};" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                        <span class="font-bold text-sm" style="color: ${scoreColor};">${matchScore}% توافق</span>
                    </div>
                </div>
                
                <!-- Image -->
                <div class="relative h-40 bg-gray-100 overflow-hidden">
                    <img src="${imageUrl}" alt="${service.title}" 
                         class="w-full h-full object-cover"
                         onerror="this.src='https://via.placeholder.com/400x200?text=Service'">
                </div>
                
                <!-- Content -->
                <div class="p-4">
                    <!-- Seller Info -->
                    <div class="flex items-center gap-3 mb-3">
                        <img src="${sellerAvatar}" alt="${seller?.name}" 
                             class="w-10 h-10 rounded-full object-cover border-2 border-orange-100">
                        <div>
                            <p class="font-medium text-gray-900 text-sm">${seller?.name || 'بائع'}</p>
                            <div class="flex items-center gap-1 text-xs text-gray-500">
                                <span class="text-yellow-400">★</span>
                                <span>${(seller?.rating || 0).toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Title -->
                    <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 leading-snug">
                        ${service.title}
                    </h3>
                    
                    <!-- Match Reasons -->
                    <div class="flex flex-wrap gap-1 mb-3">
                        ${matchReasons.slice(0, 2).map(reason => `
                            <span class="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded-full">${reason}</span>
                        `).join('')}
                    </div>
                    
                    <!-- Price & Delivery -->
                    <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div>
                            <span class="text-xs text-gray-500">يبدأ من</span>
                            <p class="font-bold text-orange-600 text-lg">${service.price}$</p>
                        </div>
                        <div class="text-left">
                            <span class="text-xs text-gray-500">التسليم</span>
                            <p class="font-medium text-gray-700">${service.deliveryDays} يوم</p>
                        </div>
                    </div>
                    
                    <!-- Action -->
                    <a href="/app/service.html?id=${service.id}" 
                       class="block mt-4 w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-center rounded-lg transition-all">
                        عرض الخدمة
                    </a>
                </div>
            </div>
        `;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Start
    // ─────────────────────────────────────────────────────────────────────────
    
    document.addEventListener('DOMContentLoaded', init);
})();
