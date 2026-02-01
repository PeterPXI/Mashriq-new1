/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ PROFILE PAGE
 * منصة مشرق - صفحة الملف الشخصي
 * Premium Design - Best in Market
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // Page State
    // ─────────────────────────────────────────────────────────────────────────
    
    const state = {
        userId: null,
        user: null,
        isOwner: false,
        services: [],
        reviews: [],
        achievements: [],
        currentTab: 'overview',
        isLoading: true,
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // Achievements Data
    // ─────────────────────────────────────────────────────────────────────────
    
    const ACHIEVEMENTS = [
        { id: 'first_order', name: 'أول طلب', description: 'أكملت طلبك الأول', icon: '🎯', requirement: 1, field: 'ordersCount' },
        { id: 'five_orders', name: 'خمسة طلبات', description: 'أكملت 5 طلبات', icon: '🚀', requirement: 5, field: 'ordersCount' },
        { id: 'ten_orders', name: 'عشرة طلبات', description: 'أكملت 10 طلبات', icon: '⭐', requirement: 10, field: 'ordersCount' },
        { id: 'first_service', name: 'بائع جديد', description: 'أضفت خدمتك الأولى', icon: '🎨', requirement: 1, field: 'servicesCount' },
        { id: 'five_services', name: 'متعدد المواهب', description: 'أضفت 5 خدمات', icon: '💼', requirement: 5, field: 'servicesCount' },
        { id: 'first_review', name: 'أول تقييم', description: 'حصلت على أول تقييم', icon: '💬', requirement: 1, field: 'reviewsCount' },
        { id: 'five_stars', name: 'نجم ساطع', description: 'حصلت على تقييم 5 نجوم', icon: '🌟', requirement: 5, field: 'rating' },
        { id: 'verified', name: 'موثق', description: 'تم التحقق من حسابك', icon: '✅', requirement: true, field: 'isVerified' },
    ];
    
    // ─────────────────────────────────────────────────────────────────────────
    // DOM Elements
    // ─────────────────────────────────────────────────────────────────────────
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        // Cover & Avatar
        profileCover: document.getElementById('profileCover'),
        editCoverBtn: document.getElementById('editCoverBtn'),
        profileAvatar: document.getElementById('profileAvatar'),
        avatarImg: document.getElementById('avatarImg'),
        avatarInitials: document.getElementById('avatarInitials'),
        editAvatarBtn: document.getElementById('editAvatarBtn'),
        avatarBadge: document.getElementById('avatarBadge'),
        // NEW: Online & Level indicators
        onlineIndicator: document.getElementById('onlineIndicator'),
        sellerLevelBadge: document.getElementById('sellerLevelBadge'),
        sellerLevelTag: document.getElementById('sellerLevelTag'),
        sellerLevelLabel: document.getElementById('sellerLevelLabel'),
        // Profile Info
        profileName: document.getElementById('profileName'),
        profileUsername: document.getElementById('profileUsername'),
        profileBio: document.getElementById('profileBio'),
        profileBadges: document.getElementById('profileBadges'),
        profileMeta: document.getElementById('profileMeta'),
        memberSince: document.getElementById('memberSince'),
        locationMeta: document.getElementById('locationMeta'),
        userLocation: document.getElementById('userLocation'),
        profileActions: document.getElementById('profileActions'),
        // NEW: Response Time & Last Online
        responseTimeMeta: document.getElementById('responseTimeMeta'),
        avgResponseTime: document.getElementById('avgResponseTime'),
        lastOnlineMeta: document.getElementById('lastOnlineMeta'),
        lastOnlineText: document.getElementById('lastOnlineText'),
        contactSellerBtn: document.getElementById('contactSellerBtn'),
        // NEW: Trust Signals
        trustSignalsSection: document.getElementById('trustSignalsSection'),
        verifiedIdentity: document.getElementById('verifiedIdentity'),
        verifiedEmail: document.getElementById('verifiedEmail'),
        verifiedPhone: document.getElementById('verifiedPhone'),
        // Stats
        statOrders: document.getElementById('statOrders'),
        statServices: document.getElementById('statServices'),
        statServicesWrapper: document.getElementById('statServicesWrapper'),
        statRating: document.getElementById('statRating'),
        statReviewCount: document.getElementById('statReviewCount'),
        statEarnings: document.getElementById('statEarnings'),
        statEarningsWrapper: document.getElementById('statEarningsWrapper'),
        // NEW: Enhanced Stats
        statCompletionWrapper: document.getElementById('statCompletionWrapper'),
        statCompletionRate: document.getElementById('statCompletionRate'),
        statOnTimeWrapper: document.getElementById('statOnTimeWrapper'),
        statOnTimeRate: document.getElementById('statOnTimeRate'),
        // NEW: Level Progress
        levelProgressSection: document.getElementById('levelProgressSection'),
        currentLevelName: document.getElementById('currentLevelName'),
        nextLevelName: document.getElementById('nextLevelName'),
        levelProgressBar: document.getElementById('levelProgressBar'),
        levelProgressText: document.getElementById('levelProgressText'),
        // Tabs
        profileTabs: document.getElementById('profileTabs'),
        servicesTabBtn: document.getElementById('servicesTabBtn'),
        settingsTabBtn: document.getElementById('settingsTabBtn'),
        servicesCount: document.getElementById('servicesCount'),
        reviewsCount: document.getElementById('reviewsCount'),
        // Tab Panels
        overviewPanel: document.getElementById('overviewPanel'),
        servicesPanel: document.getElementById('servicesPanel'),
        reviewsPanel: document.getElementById('reviewsPanel'),
        achievementsPanel: document.getElementById('achievementsPanel'),
        settingsPanel: document.getElementById('settingsPanel'),
        // Overview
        quickStatsGrid: document.getElementById('quickStatsGrid'),
        activityTimeline: document.getElementById('activityTimeline'),
        skillsSection: document.getElementById('skillsSection'),
        skillsGrid: document.getElementById('skillsGrid'),
        topServicesSection: document.getElementById('topServicesSection'),
        topServicesGrid: document.getElementById('topServicesGrid'),
        latestReviews: document.getElementById('latestReviews'),
        // Services
        servicesGrid: document.getElementById('servicesGrid'),
        servicesEmpty: document.getElementById('servicesEmpty'),
        // Reviews
        ratingSummary: document.getElementById('ratingSummary'),
        reviewsList: document.getElementById('reviewsList'),
        reviewsEmpty: document.getElementById('reviewsEmpty'),
        // Achievements
        achievementsGrid: document.getElementById('achievementsGrid'),
        // Settings
        profileForm: document.getElementById('profileForm'),
        settingsFullName: document.getElementById('settingsFullName'),
        settingsUsername: document.getElementById('settingsUsername'),
        settingsBio: document.getElementById('settingsBio'),
        settingsAvatar: document.getElementById('settingsAvatar'),
        settingsEmail: document.getElementById('settingsEmail'),
        saveProfileBtn: document.getElementById('saveProfileBtn'),
        sellerModeOption: document.getElementById('sellerModeOption'),
        sellerModeStatus: document.getElementById('sellerModeStatus'),
        activateSellerBtn: document.getElementById('activateSellerBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
        // Modals
        avatarModal: document.getElementById('avatarModal'),
        avatarUrlInput: document.getElementById('avatarUrlInput'),
        avatarPreviewLarge: document.getElementById('avatarPreviewLarge'),
        avatarPreviewImg: document.getElementById('avatarPreviewImg'),
        saveAvatarBtn: document.getElementById('saveAvatarBtn'),
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // Initialize
    // ─────────────────────────────────────────────────────────────────────────
    
    async function init() {
        // Render components
        Navbar.render(elements.navbar);
        Footer.render(elements.footer);
        
        // Get user ID from URL or use current user
        state.userId = Utils.getUrlParam('id');
        const currentUser = Auth.getUser();
        
        if (!state.userId && currentUser) {
            state.userId = currentUser.id || currentUser._id;
            state.isOwner = true;
        } else if (state.userId && currentUser) {
            state.isOwner = state.userId === (currentUser.id || currentUser._id);
        }
        
        if (!state.userId) {
            // No user ID and not logged in
            window.location.href = CONFIG.ROUTES.LOGIN + '?redirect=' + encodeURIComponent(window.location.pathname);
            return;
        }
        
        // Bind events
        bindEvents();
        
        // Load data
        await loadProfile();
        
        // Initialize AI features
        await initAI();
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // AI Features
    // ─────────────────────────────────────────────────────────────────────────
    
    let aiEnabled = false;
    
    async function initAI() {
        if (!state.isOwner) return; // Only for profile owner
        if (typeof MashriqAI === 'undefined') {
            console.log('AI Assistant not loaded');
            return;
        }
        
        try {
            aiEnabled = await MashriqAI.init();
            
            if (aiEnabled) {
                // Show AI buttons
                const improveBioBtn = document.getElementById('aiImproveBioBtn');
                if (improveBioBtn) improveBioBtn.classList.remove('hidden');
                
                // Bind AI events
                bindAIEvents();
                
                console.log('🤖 AI features enabled');
            }
        } catch (error) {
            console.log('AI initialization failed:', error);
        }
    }
    
    function bindAIEvents() {
        const improveBioBtn = document.getElementById('aiImproveBioBtn');
        const bioTextarea = elements.settingsBio;
        
        improveBioBtn?.addEventListener('click', async () => {
            try {
                MashriqAI.setButtonLoading(improveBioBtn, true);
                
                // Get current profile data
                const bio = bioTextarea?.value.trim() || '';
                const skills = [];
                
                // Get skills from services categories
                if (state.services.length > 0) {
                    const categories = [...new Set(state.services.map(s => s.categoryId || s.category))].filter(Boolean);
                    categories.forEach(catId => {
                        const category = CONFIG.CATEGORIES.find(c => c.id === catId);
                        if (category) skills.push(category.name);
                    });
                }
                
                const specialty = skills[0] || '';
                
                const result = await MashriqAI.improveProfile({ bio, skills, specialty });
                
                MashriqAI.showResultModal('✨ النبذة المحسّنة', `<div class="space-y-4">
                    <div class="p-4 bg-gray-50 rounded-xl">
                        <h4 class="font-medium mb-2">النبذة الجديدة:</h4>
                        <p style="white-space: pre-wrap;">${result.improvedBio || result}</p>
                    </div>
                    ${result.suggestions ? `
                    <div class="p-4 bg-blue-50 rounded-xl">
                        <h4 class="font-medium text-blue-700 mb-2">💡 نصائح للتحسين:</h4>
                        <ul class="text-sm text-blue-600 space-y-1">
                            ${result.suggestions.map(s => `<li>• ${s}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>`, {
                    copyText: result.improvedBio || result,
                    onUse: (text) => {
                        if (bioTextarea) {
                            bioTextarea.value = text;
                        }
                    }
                });
                
            } catch (error) {
                Toast.error('خطأ', error.message || 'فشل تحسين البروفايل');
            } finally {
                MashriqAI.setButtonLoading(improveBioBtn, false);
            }
        });
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Bind Events
    // ─────────────────────────────────────────────────────────────────────────
    
    function bindEvents() {
        // Tab navigation
        elements.profileTabs?.addEventListener('click', handleTabClick);
        
        // See all links
        document.querySelectorAll('.see-all-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = e.target.dataset.tab;
                if (tab) switchTab(tab);
            });
        });
        
        // Settings form
        elements.profileForm?.addEventListener('submit', handleProfileUpdate);
        
        // Avatar edit
        elements.editAvatarBtn?.addEventListener('click', openAvatarModal);
        elements.saveAvatarBtn?.addEventListener('click', saveAvatar);
        elements.avatarUrlInput?.addEventListener('input', Utils.debounce(previewAvatar, 500));
        
        // Modal close
        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', closeModals);
        });
        
        // Activate seller
        elements.activateSellerBtn?.addEventListener('click', handleActivateSeller);
        
        // Logout
        elements.logoutBtn?.addEventListener('click', handleLogout);
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Load Profile
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadProfile() {
        state.isLoading = true;
        
        try {
            // Load user data - ALWAYS refresh from API if owner
            if (state.isOwner) {
                try {
                    const response = await API.auth.getProfile();
                    state.user = response.data?.user || Auth.getUser();
                    // Update local storage with fresh data
                    Auth.setUser(state.user);
                } catch (e) {
                    console.warn('Could not refresh profile, using cached data');
                    state.user = Auth.getUser();
                }
            } else {
                // For now use cached data
                state.user = Auth.getUser();
            }
            
            if (!state.user) {
                Toast.error('خطأ', 'يرجى تسجيل الدخول أولاً');
                window.location.href = CONFIG.ROUTES.LOGIN;
                return;
            }
            
            console.log('Profile loaded:', state.user);
            
            // Render profile
            try {
                renderProfile();
            } catch (renderErr) {
                console.warn('Non-critical error in renderProfile:', renderErr);
            }
            
            // Load additional data in parallel
            const additionalData = [
                loadServices(),
                loadReviews()
            ];
            
            if (state.user?.role === 'seller') {
                additionalData.push(loadMyStats());
            }
            
            await Promise.all(additionalData);
            
            // Render tabs content - non-critical, don't fail the whole page
            try {
                renderOverview();
                renderAchievements();
            } catch (renderErr) {
                console.warn('Non-critical error in render:', renderErr);
            }
            
            // Show owner-only elements
            if (state.isOwner) {
                showOwnerElements();
            }
            
        } catch (error) {
            console.error('Failed to load profile:', error);
            // Only show error toast if we don't have any user data
            if (!state.user) {
                Toast.error('خطأ', 'تعذر تحميل الملف الشخصي');
            }
        } finally {
            state.isLoading = false;
        }
    }
    
    // Load user stats from API
    async function loadMyStats() {
        try {
            if (state.user?.role === 'seller') {
                const response = await API.stats.getMyStats();
                const stats = response.data || {};
                
                // Update stats display
                if (elements.statOrders) {
                    elements.statOrders.textContent = stats.completedOrders || 0;
                }
                if (elements.statRating) {
                    const rating = stats.averageRating || 0;
                    elements.statRating.textContent = rating.toFixed(1);
                }
                
                // Store for achievements
                state.myStats = stats;
            }
        } catch (error) {
            console.warn('Could not load stats:', error);
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Profile
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderProfile() {
        const user = state.user;
        if (!user) return;
        
        // Name
        if (elements.profileName) {
            elements.profileName.textContent = user.fullName || 'مستخدم';
        }
        
        // Username
        if (elements.profileUsername) {
            elements.profileUsername.textContent = '@' + (user.username || 'user');
        }
        
        // Bio
        if (elements.profileBio) {
            elements.profileBio.textContent = user.bio || 'لا يوجد وصف بعد...';
        }
        
        // Avatar
        renderAvatar(user);
        
        // Badges
        renderBadges(user);
        
        // Member since
        if (elements.memberSince && user.createdAt) {
            elements.memberSince.textContent = 'انضم ' + Utils.formatRelativeDate(user.createdAt);
        }
        
        // Stats
        if (elements.statRating) {
            const rating = user.rating || user.averageRating || 0;
            elements.statRating.textContent = rating.toFixed(1);
        }
        
        // Actions
        renderActions();
        
        // NEW: Render enhanced profile features for sellers
        if (user.role === 'seller') {
            renderSellerLevel(user);
            renderTrustSignals(user);
            renderEnhancedStats(user);
            renderOnlineStatus(user);
        }
        
        // Show owner-only elements
        if (state.isOwner) {
            showOwnerElements();
            if (elements.settingsTabBtn) elements.settingsTabBtn.classList.remove('hidden');
        } else {
            if (elements.settingsTabBtn) elements.settingsTabBtn.classList.add('hidden');
            // Show contact button for visitors viewing seller profile
            if (user.role === 'seller' && elements.contactSellerBtn) {
                elements.contactSellerBtn.classList.remove('hidden');
            }
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // NEW: Seller Level System (like Fiverr)
    // ─────────────────────────────────────────────────────────────────────────
    
    const SELLER_LEVELS = [
        { 
            level: 1, 
            name: 'بائع جديد', 
            nameEn: 'New Seller',
            color: 'bg-gray-100 text-gray-700',
            badgeColor: 'from-gray-400 to-gray-500',
            icon: '🌱',
            minOrders: 0,
            minRating: 0
        },
        { 
            level: 2, 
            name: 'بائع نشط', 
            nameEn: 'Active Seller',
            color: 'bg-blue-100 text-blue-700',
            badgeColor: 'from-blue-400 to-blue-500',
            icon: '⭐',
            minOrders: 5,
            minRating: 4.0
        },
        { 
            level: 3, 
            name: 'بائع محترف', 
            nameEn: 'Pro Seller',
            color: 'bg-purple-100 text-purple-700',
            badgeColor: 'from-purple-400 to-purple-500',
            icon: '💎',
            minOrders: 20,
            minRating: 4.5
        },
        { 
            level: 4, 
            name: 'Top Rated', 
            nameEn: 'Top Rated',
            color: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700',
            badgeColor: 'from-amber-400 to-yellow-500',
            icon: '🏆',
            minOrders: 50,
            minRating: 4.8
        }
    ];
    
    function getSellerLevel(completedOrders = 0, rating = 0) {
        let currentLevel = SELLER_LEVELS[0];
        for (let i = SELLER_LEVELS.length - 1; i >= 0; i--) {
            const level = SELLER_LEVELS[i];
            if (completedOrders >= level.minOrders && rating >= level.minRating) {
                currentLevel = level;
                break;
            }
        }
        return currentLevel;
    }
    
    function getNextLevel(currentLevel) {
        const idx = SELLER_LEVELS.findIndex(l => l.level === currentLevel.level);
        return idx < SELLER_LEVELS.length - 1 ? SELLER_LEVELS[idx + 1] : null;
    }
    
    function renderSellerLevel(user) {
        const completedOrders = user.completedOrders || state.myStats?.completedOrders || 0;
        const rating = user.rating || user.averageRating || state.myStats?.averageRating || 0;
        const currentLevel = getSellerLevel(completedOrders, rating);
        const nextLevel = getNextLevel(currentLevel);
        
        // Seller Level Badge on Avatar
        if (elements.sellerLevelBadge) {
            elements.sellerLevelBadge.innerHTML = `
                <div class="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${currentLevel.badgeColor} rounded-full flex items-center justify-center text-white shadow-lg text-sm sm:text-base" title="${currentLevel.name}">
                    ${currentLevel.icon}
                </div>
            `;
            elements.sellerLevelBadge.classList.remove('hidden');
        }
        
        // Seller Level Tag
        if (elements.sellerLevelTag && elements.sellerLevelLabel) {
            elements.sellerLevelLabel.className = `px-3 py-1 rounded-full text-xs font-bold ${currentLevel.color}`;
            elements.sellerLevelLabel.textContent = `${currentLevel.icon} ${currentLevel.name}`;
            elements.sellerLevelTag.classList.remove('hidden');
        }
        
        // Level Progress (only for owner)
        if (state.isOwner && nextLevel && elements.levelProgressSection) {
            const ordersNeeded = nextLevel.minOrders - completedOrders;
            const progress = Math.min(100, (completedOrders / nextLevel.minOrders) * 100);
            
            if (elements.currentLevelName) {
                elements.currentLevelName.textContent = `${currentLevel.icon} ${currentLevel.name}`;
            }
            if (elements.nextLevelName) {
                elements.nextLevelName.textContent = `المستوى التالي: ${nextLevel.name}`;
            }
            if (elements.levelProgressBar) {
                elements.levelProgressBar.style.width = `${progress}%`;
            }
            if (elements.levelProgressText) {
                if (ordersNeeded > 0) {
                    elements.levelProgressText.textContent = `أكمل ${ordersNeeded} ${ordersNeeded > 1 ? 'طلبات' : 'طلب'} إضافية للترقية`;
                } else if (rating < nextLevel.minRating) {
                    elements.levelProgressText.textContent = `حافظ على تقييم ${nextLevel.minRating}+ للترقية`;
                }
            }
            elements.levelProgressSection.classList.remove('hidden');
        }
    }
    
    function renderTrustSignals(user) {
        if (!elements.trustSignalsSection) return;
        
        // Show trust signals section for sellers
        elements.trustSignalsSection.classList.remove('hidden');
        
        // Email verified (assume true for sellers)
        if (elements.verifiedEmail) {
            elements.verifiedEmail.classList.remove('hidden');
        }
        
        // Identity verified (based on isVerified)
        if (elements.verifiedIdentity) {
            if (user.isVerified) {
                elements.verifiedIdentity.classList.remove('hidden');
            } else {
                elements.verifiedIdentity.classList.add('hidden');
            }
        }
        
        // Phone verified (if available)
        if (elements.verifiedPhone && user.isPhoneVerified) {
            elements.verifiedPhone.classList.remove('hidden');
        }
    }
    
    function renderEnhancedStats(user) {
        const completedOrders = user.completedOrders || state.myStats?.completedOrders || 0;
        const totalOrders = user.totalOrders || state.myStats?.totalOrders || completedOrders;
        const reviewCount = user.reviewCount || state.myStats?.reviewCount || 0;
        
        // Update review count
        if (elements.statReviewCount) {
            elements.statReviewCount.textContent = reviewCount;
        }
        
        // Completion rate (show for sellers)
        if (elements.statCompletionWrapper && completedOrders > 0) {
            const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 100;
            if (elements.statCompletionRate) {
                elements.statCompletionRate.textContent = `${completionRate}%`;
            }
            elements.statCompletionWrapper.classList.remove('hidden');
        }
        
        // On-time delivery (mock data - can be replaced with real data)
        if (elements.statOnTimeWrapper && completedOrders >= 3) {
            const onTimeRate = user.onTimeDeliveryRate || 98; // Default high rate
            if (elements.statOnTimeRate) {
                elements.statOnTimeRate.textContent = `${onTimeRate}%`;
            }
            elements.statOnTimeWrapper.classList.remove('hidden');
        }
    }
    
    function renderOnlineStatus(user) {
        // Simulate online status (in real app, this would come from backend)
        const isOnline = user.isOnline || Math.random() > 0.3; // For demo
        const lastSeen = user.lastSeen || new Date(Date.now() - 3600000); // 1 hour ago
        
        if (isOnline && elements.onlineIndicator) {
            elements.onlineIndicator.classList.remove('hidden');
            if (elements.lastOnlineMeta) {
                elements.lastOnlineMeta.classList.add('hidden');
            }
        } else if (elements.lastOnlineMeta) {
            if (elements.onlineIndicator) {
                elements.onlineIndicator.classList.add('hidden');
            }
            if (elements.lastOnlineText) {
                elements.lastOnlineText.textContent = 'آخر ظهور ' + Utils.formatRelativeDate(lastSeen);
            }
            elements.lastOnlineMeta.classList.remove('hidden');
        }
        
        // Response time (show for sellers)
        if (elements.responseTimeMeta) {
            const responseTime = user.avgResponseTime || '1 ساعة';
            if (elements.avgResponseTime) {
                elements.avgResponseTime.textContent = responseTime;
            }
            elements.responseTimeMeta.classList.remove('hidden');
        }
    }
    
    function renderAvatar(user) {
        const avatarUrl = user.avatarUrl;
        const initials = Utils.getInitials(user.fullName || user.username || 'U');
        
        if (elements.avatarInitials) {
            elements.avatarInitials.textContent = initials;
        }
        
        if (avatarUrl && elements.avatarImg) {
            elements.avatarImg.src = avatarUrl;
            elements.avatarImg.style.display = 'block';
            elements.avatarImg.onerror = () => {
                elements.avatarImg.style.display = 'none';
            };
        }
        
        // Show verified badge for sellers
        if (user.role === 'seller' && elements.avatarBadge) {
            elements.avatarBadge.style.display = 'flex';
        }
    }
    
    function renderBadges(user) {
        if (!elements.profileBadges) return;
        
        let badges = '';
        
        if (user.role === 'seller') {
            badges += `
                <span class="profile-badge seller">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                    </svg>
                    بائع
                </span>
            `;
        }
        
        if (user.isEmailVerified) {
            badges += `
                <span class="profile-badge verified">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                        <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                    موثق
                </span>
            `;
        }
        
        elements.profileBadges.innerHTML = badges;
    }
    
    function renderActions() {
        if (!elements.profileActions) return;
        
        if (state.isOwner) {
            let html = `
                <button class="btn btn-ghost" data-tab="settings" onclick="switchTab('settings')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    تعديل الملف
                </button>
            `;
            
            if (state.user?.role !== 'seller') {
                html += `
                    <button class="btn btn-primary" id="activateSellerBtnAction">
                        تفعيل وضع البائع
                    </button>
                `;
            }
            
            elements.profileActions.innerHTML = html;
            
            // Re-bind activate seller button if it exists
            document.getElementById('activateSellerBtnAction')?.addEventListener('click', handleActivateSeller);
        } else {
            elements.profileActions.innerHTML = `
                <button class="btn btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    راسلني
                </button>
            `;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Load Services
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadServices() {
        try {
            let response;
            if (state.isOwner) {
                response = await API.services.getMyServices();
            } else {
                response = await API.services.getAll({ sellerId: state.userId });
            }
            
            const data = response.data || response;
            state.services = data.services || [];
            
            // Update stats
            if (elements.statServices) {
                elements.statServices.textContent = state.services.length;
            }
            if (elements.servicesCount) {
                elements.servicesCount.textContent = state.services.length;
            }
            
            // Render services
            renderServices();
            renderTopServices();
            
        } catch (error) {
            console.error('Failed to load services:', error);
        }
    }
    
    function renderServices() {
        if (!elements.servicesGrid) return;
        
        if (state.services.length === 0) {
            elements.servicesGrid.innerHTML = '';
            if (elements.servicesEmpty) elements.servicesEmpty.style.display = 'block';
            return;
        }
        
        if (elements.servicesEmpty) elements.servicesEmpty.style.display = 'none';
        
        elements.servicesGrid.innerHTML = state.services.map(service => 
            ServiceCard.render(service)
        ).join('');
    }
    
    function renderTopServices() {
        if (!elements.topServicesGrid || !elements.topServicesSection) return;
        
        const isSeller = state.user?.role === 'seller';
        
        if (!isSeller || state.services.length === 0) {
            elements.topServicesSection.style.display = 'none';
            return;
        }
        
        elements.topServicesSection.style.display = 'block';
        
        const topServices = state.services.slice(0, 3);
        elements.topServicesGrid.innerHTML = topServices.map(service => 
            ServiceCard.render(service, { compact: true })
        ).join('');
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Load Reviews
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadReviews() {
        try {
            // Get reviews for this seller
            if (state.user?.role === 'seller') {
                const sellerId = state.user.id || state.user._id;
                const response = await API.get(CONFIG.ENDPOINTS.SELLER_REVIEWS(sellerId));
                state.reviews = response.data?.reviews || [];
            } else {
                state.reviews = [];
            }
            
            if (elements.reviewsCount) {
                elements.reviewsCount.textContent = state.reviews.length;
            }
            
            renderReviews();
            renderLatestReviews();
            
        } catch (error) {
            console.warn('Could not load reviews:', error);
            state.reviews = [];
        }
    }
    
    function renderReviews() {
        if (!elements.ratingSummary || !elements.reviewsList) return;
        
        if (state.reviews.length === 0) {
            elements.ratingSummary.innerHTML = '';
            elements.reviewsList.innerHTML = '';
            if (elements.reviewsEmpty) elements.reviewsEmpty.style.display = 'block';
            return;
        }
        
        if (elements.reviewsEmpty) elements.reviewsEmpty.style.display = 'none';
        
        // Rating summary
        const avgRating = state.reviews.reduce((sum, r) => sum + r.rating, 0) / state.reviews.length;
        const ratingCounts = [5, 4, 3, 2, 1].map(stars => 
            state.reviews.filter(r => Math.floor(r.rating) === stars).length
        );
        
        elements.ratingSummary.innerHTML = `
            <div class="rating-big">
                <div class="rating-big-value">${avgRating.toFixed(1)}</div>
                <div class="rating-big-stars">
                    ${renderStars(avgRating)}
                </div>
                <div class="rating-big-count">${state.reviews.length} تقييم</div>
            </div>
            <div class="rating-bars">
                ${[5, 4, 3, 2, 1].map((stars, i) => `
                    <div class="rating-bar-row">
                        <span class="rating-bar-label">${stars}</span>
                        <div class="rating-bar">
                            <div class="rating-bar-fill" style="width: ${(ratingCounts[i] / state.reviews.length * 100)}%"></div>
                        </div>
                        <span class="rating-bar-count">${ratingCounts[i]}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Reviews list
        elements.reviewsList.innerHTML = state.reviews.map(review => renderReviewCard(review)).join('');
    }
    
    function renderLatestReviews() {
        if (!elements.latestReviews) return;
        
        if (state.reviews.length === 0) {
            elements.latestReviews.innerHTML = `
                <p class="text-muted text-center py-4">لا توجد تقييمات بعد</p>
            `;
            return;
        }
        
        const latest = state.reviews.slice(0, 3);
        elements.latestReviews.innerHTML = latest.map(review => `
            <div class="review-preview-item">
                <div class="review-author-avatar">${Utils.getInitials(review.buyer?.fullName || 'U')}</div>
                <div class="review-preview-content">
                    <div class="review-rating">${renderStars(review.rating)}</div>
                    <p class="review-preview-text">${Utils.escapeHtml(review.comment || '')}</p>
                </div>
            </div>
        `).join('');
    }
    
    function renderReviewCard(review) {
        return `
            <div class="review-card">
                <div class="review-header">
                    <div class="review-author">
                        <div class="review-author-avatar">${Utils.getInitials(review.buyer?.fullName || 'U')}</div>
                        <div class="review-author-info">
                            <h4>${Utils.escapeHtml(review.buyer?.fullName || 'مستخدم')}</h4>
                            <span>${Utils.formatRelativeDate(review.createdAt)}</span>
                        </div>
                    </div>
                    <div class="review-rating">${renderStars(review.rating)}</div>
                </div>
                <p class="review-content">${Utils.escapeHtml(review.comment || '')}</p>
            </div>
        `;
    }
    
    function renderStars(rating) {
        return Array(5).fill(0).map((_, i) => `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${i < Math.round(rating) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
            </svg>
        `).join('');
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Overview
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderOverview() {
        renderQuickStats();
        renderActivity();
        renderSkills();
    }
    
    function renderQuickStats() {
        if (!elements.quickStatsGrid) return;
        
        const user = state.user;
        const isSeller = user?.role === 'seller';
        
        const stats = [
            {
                icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>',
                value: state.services.length > 0 ? state.services.reduce((sum, s) => sum + (s.totalOrders || 0), 0) : 0,
                label: 'إجمالي الطلبات',
                type: 'primary',
            },
            {
                icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
                value: (user?.rating || user?.averageRating || 0).toFixed(1),
                label: 'متوسط التقييم',
                type: 'warning',
            },
            {
                icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
                value: state.reviews.length,
                label: 'التقييمات',
                type: 'info',
            },
        ];
        
        if (isSeller) {
            stats.push({
                icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>',
                value: state.services.length,
                label: 'الخدمات المنشورة',
                type: 'success',
            });
        }
        
        elements.quickStatsGrid.innerHTML = stats.map(stat => `
            <div class="quick-stat-card ${stat.type}">
                <div class="quick-stat-icon">${stat.icon}</div>
                <div class="quick-stat-value">${stat.value}</div>
                <div class="quick-stat-label">${stat.label}</div>
            </div>
        `).join('');
    }
    
    function renderActivity() {
        if (!elements.activityTimeline) return;
        
        // Mock activity data - in real app, this would come from API
        const activities = [
            { type: 'service', text: 'أضاف خدمة جديدة', time: 'منذ ساعتين' },
            { type: 'review', text: 'حصل على تقييم 5 نجوم', time: 'منذ يوم' },
            { type: 'order', text: 'أكمل طلب جديد', time: 'منذ 3 أيام' },
            { type: 'badge', text: 'حصل على وسام "نجم ساطع"', time: 'منذ أسبوع' },
        ];
        
        if (activities.length === 0) {
            elements.activityTimeline.innerHTML = '<p class="text-muted text-center">لا يوجد نشاط حديث</p>';
            return;
        }
        
        elements.activityTimeline.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    ${getActivityIcon(activity.type)}
                </div>
                <div class="activity-content">
                    <p class="activity-text">${activity.text}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }
    
    function getActivityIcon(type) {
        const icons = {
            order: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/></svg>',
            review: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
            service: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>',
            badge: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88"/></svg>',
        };
        return icons[type] || icons.order;
    }
    
    function renderSkills() {
        if (!elements.skillsSection || !elements.skillsGrid) return;
        
        const isSeller = state.user?.role === 'seller';
        if (!isSeller) {
            elements.skillsSection.style.display = 'none';
            return;
        }
        
        // Get unique categories from services
        const categories = [...new Set(state.services.map(s => s.categoryId || s.category))].filter(Boolean);
        
        if (categories.length === 0) {
            elements.skillsSection.style.display = 'none';
            return;
        }
        
        elements.skillsSection.style.display = 'block';
        
        elements.skillsGrid.innerHTML = categories.map(catId => {
            const category = CONFIG.CATEGORIES.find(c => c.id === catId);
            return `
                <span class="skill-tag">
                    ${category?.icon || '🏷️'} ${category?.name || catId}
                </span>
            `;
        }).join('');
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Achievements
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderAchievements() {
        if (!elements.achievementsGrid) return;
        
        const user = state.user;
        const userData = {
            ordersCount: state.services.reduce((sum, s) => sum + (s.totalOrders || 0), 0),
            servicesCount: state.services.length,
            reviewsCount: state.reviews.length,
            rating: user?.rating || user?.averageRating || 0,
            isVerified: user?.isEmailVerified || false,
        };
        
        elements.achievementsGrid.innerHTML = ACHIEVEMENTS.map(achievement => {
            const current = userData[achievement.field] || 0;
            const isUnlocked = typeof achievement.requirement === 'boolean' 
                ? current === achievement.requirement 
                : current >= achievement.requirement;
            const progress = typeof achievement.requirement === 'boolean' 
                ? (current ? 100 : 0) 
                : Math.min((current / achievement.requirement) * 100, 100);
            
            return `
                <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-glow"></div>
                    <div class="achievement-icon">${achievement.icon}</div>
                    <h3 class="achievement-name">${achievement.name}</h3>
                    <p class="achievement-description">${achievement.description}</p>
                    ${!isUnlocked && typeof achievement.requirement !== 'boolean' ? `
                        <div class="achievement-progress">
                            <div class="achievement-progress-bar">
                                <div class="achievement-progress-fill" style="width: ${progress}%"></div>
                            </div>
                            <div class="achievement-progress-text">${current}/${achievement.requirement}</div>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Show Owner Elements
    // ─────────────────────────────────────────────────────────────────────────
    
    function showOwnerElements() {
        if (elements.editCoverBtn) elements.editCoverBtn.style.display = 'flex';
        if (elements.editAvatarBtn) elements.editAvatarBtn.style.display = 'flex';
        if (elements.settingsTabBtn) elements.settingsTabBtn.style.display = 'flex';
        
        // Show earnings for sellers
        if (state.user?.role === 'seller' && elements.statEarningsWrapper) {
            elements.statEarningsWrapper.style.display = 'block';
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Tab Navigation
    // ─────────────────────────────────────────────────────────────────────────
    
    function handleTabClick(e) {
        const tab = e.target.closest('.profile-tab');
        if (!tab) return;
        
        const tabName = tab.dataset.tab;
        if (tabName) switchTab(tabName);
    }
    
    window.switchTab = function(tabName) {
        state.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.profile-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === tabName + 'Panel');
        });
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // Settings
    // ─────────────────────────────────────────────────────────────────────────
    
    function populateSettingsForm() {
        const user = state.user;
        if (!user) return;
        
        if (elements.settingsFullName) elements.settingsFullName.value = user.fullName || '';
        if (elements.settingsUsername) elements.settingsUsername.value = user.username || '';
        if (elements.settingsBio) elements.settingsBio.value = user.bio || '';
        if (elements.settingsAvatar) elements.settingsAvatar.value = user.avatarUrl || '';
        if (elements.settingsEmail) elements.settingsEmail.textContent = user.email || '---';
        
        // Seller mode
        if (user.role === 'seller') {
            if (elements.sellerModeStatus) elements.sellerModeStatus.textContent = 'مفعل';
            if (elements.activateSellerBtn) {
                elements.activateSellerBtn.textContent = 'مفعل ✓';
                elements.activateSellerBtn.disabled = true;
                elements.activateSellerBtn.classList.remove('btn-primary');
                elements.activateSellerBtn.classList.add('btn-success');
            }
        }
    }
    
    async function handleProfileUpdate(e) {
        e.preventDefault();
        
        const data = {
            fullName: elements.settingsFullName?.value.trim(),
            bio: elements.settingsBio?.value.trim(),
            avatarUrl: elements.settingsAvatar?.value.trim(),
        };
        
        Loader.buttonStart(elements.saveProfileBtn);
        
        try {
            await API.put(CONFIG.ENDPOINTS.PROFILE, data);
            
            // Update local state
            state.user = { ...state.user, ...data };
            Auth.setUser(state.user);
            
            // Re-render
            renderProfile();
            
            Toast.success('تم بنجاح!', 'تم تحديث الملف الشخصي');
            
        } catch (error) {
            console.error('Profile update error:', error);
            Toast.error('خطأ', error.message || 'فشل تحديث الملف الشخصي');
        } finally {
            Loader.buttonStop(elements.saveProfileBtn);
        }
    }
    
    async function handleActivateSeller() {
        if (!confirm('هل تريد تفعيل وضع البائع لبدء عرض خدماتك؟')) return;
        
        try {
            await API.post(CONFIG.ENDPOINTS.ACTIVATE_SELLER);
            
            state.user.role = 'seller';
            Auth.setUser(state.user);
            
            Toast.success('🎉 تهانينا!', 'تم تفعيل وضع البائع بنجاح');
            
            // Reload page
            setTimeout(() => location.reload(), 1500);
            
        } catch (error) {
            console.error('Activate seller error:', error);
            Toast.error('خطأ', error.message || 'فشل تفعيل وضع البائع');
        }
    }
    
    function handleLogout() {
        if (!confirm('هل أنت متأكد من تسجيل الخروج؟')) return;
        
        Auth.logout();
        Toast.info('تم', 'تم تسجيل الخروج بنجاح');
        
        setTimeout(() => {
            window.location.href = CONFIG.ROUTES.HOME;
        }, 1000);
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Avatar Modal & File Upload
    // ─────────────────────────────────────────────────────────────────────────
    
    function openAvatarModal() {
        if (elements.avatarModal) {
            elements.avatarModal.style.display = 'flex';
            if (elements.avatarUrlInput) {
                elements.avatarUrlInput.value = state.user?.avatarUrl || '';
            }
        }
    }
    
    function closeModals() {
        if (elements.avatarModal) elements.avatarModal.style.display = 'none';
    }
    
    function previewAvatar() {
        const url = elements.avatarUrlInput?.value.trim();
        
        if (!url) {
            if (elements.avatarPreviewLarge) elements.avatarPreviewLarge.style.display = 'none';
            return;
        }
        
        const img = new Image();
        img.onload = () => {
            if (elements.avatarPreviewImg) elements.avatarPreviewImg.src = url;
            if (elements.avatarPreviewLarge) elements.avatarPreviewLarge.style.display = 'block';
        };
        img.onerror = () => {
            if (elements.avatarPreviewLarge) elements.avatarPreviewLarge.style.display = 'none';
        };
        img.src = url;
    }
    
    async function saveAvatar() {
        const url = elements.avatarUrlInput?.value.trim();
        
        try {
            await API.put(CONFIG.ENDPOINTS.PROFILE, { avatarUrl: url });
            
            state.user.avatarUrl = url;
            Auth.setUser(state.user);
            
            renderAvatar(state.user);
            closeModals();
            
            Toast.success('تم بنجاح!', 'تم تحديث الصورة الشخصية');
            
        } catch (error) {
            console.error('Save avatar error:', error);
            Toast.error('خطأ', 'فشل تحديث الصورة');
        }
    }
    
    async function handleAvatarFileUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            Toast.error('خطأ', 'يرجى اختيار صورة صالحة');
            return;
        }
        
        if (file.size > 2 * 1024 * 1024) {
            Toast.error('خطأ', 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
            return;
        }
        
        const formData = new FormData();
        formData.append('avatar', file);
        
        try {
            Toast.info('جاري الرفع', 'يتم رفع الصورة...');
            
            const token = Auth.getToken();
            const response = await fetch(CONFIG.API_BASE_URL + CONFIG.ENDPOINTS.UPLOAD_AVATAR, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                Toast.success('تم', 'تم تحديث الصورة بنجاح');
                
                if (data.data?.avatarUrl) {
                    state.user.avatarUrl = data.data.avatarUrl;
                    renderAvatar(state.user);
                }
                
                if (data.data?.user) {
                    Auth.setUser(data.data.user);
                    state.user = data.data.user;
                }
                
                closeModals();
            } else {
                Toast.error('خطأ', data.message || 'فشل رفع الصورة');
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            Toast.error('خطأ', 'حدث خطأ أثناء رفع الصورة');
        }
        
        e.target.value = '';
    }
    
    // Expose function for inline handlers
    window.handleAvatarFileUpload = handleAvatarFileUpload;
    
    // ─────────────────────────────────────────────────────────────────────────
    // Run
    // ─────────────────────────────────────────────────────────────────────────
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
