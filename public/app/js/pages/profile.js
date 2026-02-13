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
        isUploadingAvatar: false,
        isUploadingBanner: false,
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
        avatarFileInput: document.getElementById('avatarFileInput'),
        avatarPreviewLarge: document.getElementById('avatarPreviewLarge'),
        avatarPreviewImg: document.getElementById('avatarPreviewImg'),
        avatarUploadProgress: document.getElementById('avatarUploadProgress'),
        avatarProgressBar: document.getElementById('avatarProgressBar'),
        avatarProgressText: document.getElementById('avatarProgressText'),
        saveAvatarBtn: document.getElementById('saveAvatarBtn'),
        // Bio Editing
        editBioBtn: document.getElementById('editBioBtn'),
        bioDisplay: document.getElementById('bioDisplay'),
        bioEditForm: document.getElementById('bioEditForm'),
        bioTextarea: document.getElementById('bioTextarea'),
        bioCharCount: document.getElementById('bioCharCount'),
        saveBioBtn: document.getElementById('saveBioBtn'),
        cancelBioBtn: document.getElementById('cancelBioBtn'),
        // Banner Editing
        profileBanner: document.getElementById('profileBanner'),
        editBannerBtn: document.getElementById('editBannerBtn'),
        bannerModal: document.getElementById('bannerModal'),
        bannerUrlInput: document.getElementById('bannerUrlInput'),
        bannerFileInput: document.getElementById('bannerFileInput'),
        bannerPreviewImg: document.getElementById('bannerPreviewImg'),
        bannerPlaceholder: document.getElementById('bannerPlaceholder'),
        bannerUploadProgress: document.getElementById('bannerUploadProgress'),
        bannerProgressBar: document.getElementById('bannerProgressBar'),
        bannerProgressText: document.getElementById('bannerProgressText'),
        saveBannerBtn: document.getElementById('saveBannerBtn'),
        removeBannerBtn: document.getElementById('removeBannerBtn'),
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
                const analyzeProfileBtn = document.getElementById('aiAnalyzeProfileBtn');
                
                if (improveBioBtn) improveBioBtn.classList.remove('hidden');
                if (analyzeProfileBtn) analyzeProfileBtn.classList.remove('hidden');
                
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
        const analyzeProfileBtn = document.getElementById('aiAnalyzeProfileBtn');
        const bioTextarea = elements.settingsBio;
        
        // تحليل الملف الشخصي
        analyzeProfileBtn?.addEventListener('click', async () => {
            try {
                MashriqAI.setButtonLoading(analyzeProfileBtn, true);
                
                // جمع بيانات الملف الشخصي
                const user = state.user;
                const profileData = {
                    name: user?.fullName || '',
                    bio: user?.bio || '',
                    skills: [],
                    servicesCount: state.services?.length || 0,
                    completedOrders: user?.completedOrders || 0,
                    rating: user?.rating || user?.averageRating || 0,
                    hasAvatar: !!user?.avatarUrl
                };
                
                // جمع المهارات من الخدمات
                if (state.services.length > 0) {
                    const categories = [...new Set(state.services.map(s => s.categoryId || s.category))].filter(Boolean);
                    categories.forEach(catId => {
                        const category = CONFIG.CATEGORIES.find(c => c.id === catId);
                        if (category) profileData.skills.push(category.name);
                    });
                }
                
                const analysis = await MashriqAI.analyzeProfile(profileData);
                MashriqAI.showProfileAnalysisModal(analysis);
                
            } catch (error) {
                Toast.error('خطأ', error.message || 'فشل تحليل الملف الشخصي');
            } finally {
                MashriqAI.setButtonLoading(analyzeProfileBtn, false);
            }
        });
        
        // تحسين النبذة
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
        elements.avatarFileInput?.addEventListener('change', handleAvatarFileUpload);
        
        // Modal close
        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', closeModals);
        });
        
        // Activate seller
        elements.activateSellerBtn?.addEventListener('click', handleActivateSeller);
        
        // Logout
        elements.logoutBtn?.addEventListener('click', handleLogout);
        
        // Bio Editing
        elements.editBioBtn?.addEventListener('click', openBioEdit);
        elements.saveBioBtn?.addEventListener('click', saveBio);
        elements.cancelBioBtn?.addEventListener('click', closeBioEdit);
        elements.bioTextarea?.addEventListener('input', updateBioCharCount);
        
        // Banner Editing
        elements.editBannerBtn?.addEventListener('click', openBannerModal);
        elements.saveBannerBtn?.addEventListener('click', saveBanner);
        elements.removeBannerBtn?.addEventListener('click', removeBanner);
        elements.bannerUrlInput?.addEventListener('input', Utils.debounce(previewBanner, 500));
        elements.bannerFileInput?.addEventListener('change', handleBannerFileUpload);
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
                renderBanner(state.user);
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
    // NEW: Seller Level System 
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
            
            // Expose to window for custom renderers
            window.__profileServices = state.services;
            window.__profileIsOwner = state.isOwner;
            
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
            if (elements.servicesEmpty) {
                elements.servicesEmpty.style.display = 'block';
                elements.servicesEmpty.classList.remove('hidden');
            }
            // Show add service link for owner
            const addLink = document.getElementById('addServiceLink');
            if (addLink && state.isOwner) addLink.classList.remove('hidden');
            return;
        }
        
        if (elements.servicesEmpty) {
            elements.servicesEmpty.style.display = 'none';
            elements.servicesEmpty.classList.add('hidden');
        }
        
        // Update seller name in title
        const titleEl = document.getElementById('sellerNameInTitle');
        if (titleEl && state.user?.fullName) {
            titleEl.textContent = state.user.fullName;
        }
        
        // Render enhanced Fiverr-style service cards
        elements.servicesGrid.innerHTML = state.services.map(service => {
            const rating = service.rating || service.averageRating || 0;
            const reviewCount = service.reviewCount || service.reviews?.length || 0;
            const price = service.price || service.basePrice || 0;
            
            // Get proper image URL - check all possible field names
            let imageUrl = '';
            if (service.imageUrls && service.imageUrls.length > 0) {
                imageUrl = service.imageUrls[0];
            } else if (service.images && service.images.length > 0) {
                imageUrl = service.images[0];
            } else if (service.image) {
                imageUrl = service.image;
            } else if (service.thumbnail) {
                imageUrl = service.thumbnail;
            }
            
            // Make sure image URL is absolute
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/') && !imageUrl.startsWith('data:')) {
                imageUrl = '/' + imageUrl;
            }
            
            // Debug log
            console.log('Service:', service.title, 'imageUrl:', imageUrl, 'imageUrls:', service.imageUrls);
            
            const category = CONFIG?.CATEGORIES?.find(c => c.id === service.categoryId)?.name || service.category || '';
            const sellerName = service.seller?.fullName || state.user?.fullName || 'بائع';
            const sellerInitial = sellerName.charAt(0) || 'B';
            
            // Get seller level
            const sellerLevel = getSellerLevelForDisplay();
            
            return `
                <a href="/app/service.html?id=${service._id || service.id}" 
                   class="gig-card group block bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300">
                    
                    <!-- Image Container -->
                    <div class="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600">
                        ${imageUrl ? `
                            <img src="${imageUrl}" 
                                 alt="${Utils.escapeHtml(service.title)}" 
                                 class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                                 onerror="this.remove();">
                        ` : ''}
                        
                        <!-- Gradient overlay for text readability when no image -->
                        ${!imageUrl ? `
                            <div class="absolute inset-0 flex items-center justify-center p-4">
                                <h4 class="text-white text-xl font-bold text-center leading-relaxed drop-shadow-lg">
                                    ${Utils.escapeHtml(service.title?.substring(0, 50) || 'خدمة')}
                                </h4>
                            </div>
                        ` : ''}
                        
                        <!-- Badges -->
                        <div class="absolute top-3 right-3 flex flex-col gap-2">
                            ${service.isActive === false ? `
                                <span class="bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">غير نشط</span>
                            ` : ''}
                        </div>
                        
                        ${category ? `
                            <div class="absolute top-3 left-3">
                                <span class="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
                                    ${category}
                                </span>
                            </div>
                        ` : ''}
                        
                        <!-- Favorite button -->
                        <button onclick="event.preventDefault(); event.stopPropagation();" 
                                class="absolute bottom-3 left-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110 transition-all duration-300">
                            <svg class="w-5 h-5 text-gray-500 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                            </svg>
                        </button>
                    </div>
                    
                    <!-- Content -->
                    <div class="p-4">
                        <!-- Seller Info -->
                        <div class="flex items-center gap-2 mb-3">
                            <div class="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                ${sellerInitial}
                            </div>
                            <span class="text-sm text-gray-700 font-medium truncate flex-1">${Utils.escapeHtml(sellerName)}</span>
                            <span class="text-[11px] ${sellerLevel.cssClass} px-2 py-0.5 rounded-full font-medium">${sellerLevel.label}</span>
                        </div>
                        
                        <!-- Title -->
                        <h3 class="text-gray-900 font-semibold leading-snug line-clamp-2 group-hover:text-emerald-600 transition-colors min-h-[2.5rem] text-[15px]">
                            ${Utils.escapeHtml(service.title)}
                        </h3>
                        
                        <!-- Rating -->
                        <div class="flex items-center gap-1.5 mt-3">
                            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                            <span class="font-bold text-gray-800">${rating.toFixed(1)}</span>
                            <span class="text-gray-400 text-sm">(${reviewCount})</span>
                        </div>
                        
                        <!-- Price Footer -->
                        <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                            <span class="text-xs text-gray-400 uppercase tracking-wide">يبدأ من</span>
                            <span class="text-xl font-bold text-gray-900">$${price}</span>
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    }
    
    // Helper to get seller level for display
    function getSellerLevelForDisplay() {
        const completedOrders = state.user?.completedOrders || state.myStats?.completedOrders || 0;
        const rating = state.user?.rating || state.myStats?.averageRating || 0;
        
        if (completedOrders >= 50 && rating >= 4.8) {
            return { label: 'Top Rated', cssClass: 'bg-amber-100 text-amber-700' };
        } else if (completedOrders >= 20 && rating >= 4.5) {
            return { label: 'بائع محترف', cssClass: 'bg-purple-100 text-purple-700' };
        } else if (completedOrders >= 5 && rating >= 4.0) {
            return { label: 'بائع نشط', cssClass: 'bg-blue-100 text-blue-700' };
        } else {
            return { label: 'بائع جديد', cssClass: 'bg-gray-100 text-gray-600' };
        }
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
            
            // Expose to window for custom renderers
            window.__profileReviews = state.reviews;
            
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
        const reviewsList = elements.reviewsList || document.getElementById('reviewsList');
        const mobileReviewsList = document.getElementById('mobileReviewsList');
        const ratingSummary = elements.ratingSummary || document.getElementById('ratingSummary');
        const reviewsEmpty = elements.reviewsEmpty || document.getElementById('reviewsEmpty');
        const avgRatingDisplay = document.getElementById('avgRatingDisplay');
        const totalReviewsDisplay = document.getElementById('totalReviewsDisplay');
        const statReviewCount = document.getElementById('statReviewCount');
        
        if (state.reviews.length === 0) {
            if (reviewsList) reviewsList.innerHTML = '';
            if (mobileReviewsList) mobileReviewsList.innerHTML = '';
            if (ratingSummary) ratingSummary.innerHTML = '';
            if (reviewsEmpty) {
                reviewsEmpty.style.display = 'block';
                reviewsEmpty.classList.remove('hidden');
            }
            if (avgRatingDisplay) avgRatingDisplay.textContent = '0.0';
            if (totalReviewsDisplay) totalReviewsDisplay.textContent = '0';
            if (statReviewCount) statReviewCount.textContent = '0';
            return;
        }
        
        if (reviewsEmpty) {
            reviewsEmpty.style.display = 'none';
            reviewsEmpty.classList.add('hidden');
        }
        
        // Calculate stats
        const avgRating = state.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / state.reviews.length;
        
        // Update displays
        if (avgRatingDisplay) avgRatingDisplay.textContent = avgRating.toFixed(1);
        if (totalReviewsDisplay) totalReviewsDisplay.textContent = state.reviews.length;
        if (statReviewCount) statReviewCount.textContent = state.reviews.length;
        
        // Rating breakdown (communication, quality, etc - simulated from average)
        if (ratingSummary) {
            const commRating = Math.min(5, avgRating + 0.1).toFixed(1);
            const qualityRating = avgRating.toFixed(1);
            const commitmentRating = Math.max(1, avgRating - 0.1).toFixed(1);
            const againRating = Math.min(5, avgRating + 0.1).toFixed(1);
            
            ratingSummary.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="text-sm text-gray-600 w-16">التواصل</span>
                    <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="rating-progress h-full bg-yellow-400 rounded-full" style="width: ${(commRating / 5) * 100}%"></div>
                    </div>
                    <span class="text-sm text-gray-700 font-medium w-8">${commRating}</span>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-sm text-gray-600 w-16">الجودة</span>
                    <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="rating-progress h-full bg-yellow-400 rounded-full" style="width: ${(qualityRating / 5) * 100}%"></div>
                    </div>
                    <span class="text-sm text-gray-700 font-medium w-8">${qualityRating}</span>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-sm text-gray-600 w-16">الالتزام</span>
                    <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="rating-progress h-full bg-yellow-400 rounded-full" style="width: ${(commitmentRating / 5) * 100}%"></div>
                    </div>
                    <span class="text-sm text-gray-700 font-medium w-8">${commitmentRating}</span>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-sm text-gray-600 w-16">مرة أخرى</span>
                    <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="rating-progress h-full bg-yellow-400 rounded-full" style="width: ${(againRating / 5) * 100}%"></div>
                    </div>
                    <span class="text-sm text-gray-700 font-medium w-8">${againRating}</span>
                </div>
            `;
        }
        
        // Render review cards
        const reviewHTML = state.reviews.slice(0, 5).map(review => {
            const initials = Utils.getInitials(review.buyer?.fullName || 'مستخدم');
            const name = Utils.escapeHtml(review.buyer?.fullName || 'مستخدم');
            const rating = review.rating || 5;
            const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
            const date = review.createdAt ? Utils.formatRelativeDate(review.createdAt) : 'منذ فترة';
            const comment = Utils.escapeHtml(review.comment || 'تقييم إيجابي');
            
            return `
                <div class="p-4">
                    <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                            ${initials}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between mb-1">
                                <span class="font-medium text-gray-900 text-sm">${name}</span>
                                <span class="text-yellow-400 text-sm">${stars}</span>
                            </div>
                            <p class="text-gray-600 text-sm line-clamp-3">${comment}</p>
                            <span class="text-gray-400 text-xs mt-2 block">${date}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        if (reviewsList) reviewsList.innerHTML = reviewHTML;
        if (mobileReviewsList) mobileReviewsList.innerHTML = reviewHTML;
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
        
        // Show bio edit button
        if (elements.editBioBtn) {
            elements.editBioBtn.classList.remove('hidden');
            elements.editBioBtn.style.display = 'flex';
        }
        
        // Show banner edit button
        if (elements.editBannerBtn) {
            elements.editBannerBtn.classList.remove('hidden');
            elements.editBannerBtn.style.display = 'flex';
        }
        
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
            elements.avatarModal.classList.remove('hidden');
            elements.avatarModal.style.display = 'flex';
            if (elements.avatarUrlInput) {
                elements.avatarUrlInput.value = state.user?.avatarUrl || '';
            }
            // Show preview if there's an existing avatar
            if (state.user?.avatarUrl && elements.avatarPreviewImg) {
                elements.avatarPreviewImg.src = state.user.avatarUrl;
                elements.avatarPreviewImg.classList.remove('hidden');
            }
        }
    }
    
    function closeModals() {
        if (elements.avatarModal) {
            elements.avatarModal.classList.add('hidden');
            elements.avatarModal.style.display = 'none';
        }
        if (elements.bannerModal) {
            elements.bannerModal.classList.add('hidden');
            elements.bannerModal.style.display = 'none';
        }
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
        
        // Prevent concurrent uploads
        if (state.isUploadingAvatar) {
            Toast.warning('انتظر', 'جاري رفع صورة أخرى...');
            return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            Toast.error('خطأ', 'يرجى اختيار صورة صالحة');
            if (elements.avatarFileInput) elements.avatarFileInput.value = '';
            return;
        }
        
        // Validate file size (max 2MB for avatars)
        if (file.size > 2 * 1024 * 1024) {
            Toast.error('خطأ', 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
            if (elements.avatarFileInput) elements.avatarFileInput.value = '';
            return;
        }
        
        // Lock upload
        state.isUploadingAvatar = true;
        
        // Show progress bar
        if (elements.avatarUploadProgress) {
            elements.avatarUploadProgress.classList.remove('hidden');
        }
        updateAvatarProgress(10);
        
        // Create upload FormData immediately with the current file
        const formData = new FormData();
        formData.append('image', file);
        formData.append('folder', 'avatars');
        
        // Reset file input immediately to prevent stale file references
        if (elements.avatarFileInput) elements.avatarFileInput.value = '';
        
        try {
            // Preview the image immediately
            const localPreviewUrl = URL.createObjectURL(file);
            if (elements.avatarPreviewImg) {
                elements.avatarPreviewImg.src = localPreviewUrl;
                elements.avatarPreviewImg.classList.remove('hidden');
            }
            
            updateAvatarProgress(30);
            
            // Upload to server
            const response = await fetch('/api/upload/image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: formData
            });
            
            updateAvatarProgress(70);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'فشل في رفع الصورة');
            }
            
            const result = await response.json();
            const imageUrl = result.data?.url || result.url;
            
            if (!imageUrl) {
                throw new Error('لم يتم استلام رابط الصورة');
            }
            
            updateAvatarProgress(85);
            
            // Update the URL input
            if (elements.avatarUrlInput) {
                elements.avatarUrlInput.value = imageUrl;
            }
            
            // Save to profile immediately
            await API.put(CONFIG.ENDPOINTS.PROFILE, { avatarUrl: imageUrl });
            
            updateAvatarProgress(100);
            
            // Update local state
            state.user.avatarUrl = imageUrl;
            Auth.setUser(state.user);
            
            // Revoke object URL and set final image
            URL.revokeObjectURL(localPreviewUrl);
            
            // Update avatar display immediately
            renderAvatar(state.user);
            
            // Close modal and show success
            closeModals();
            Toast.success('تم!', 'تم رفع وحفظ الصورة بنجاح');
            
        } catch (error) {
            console.error('Avatar upload error:', error);
            Toast.error('خطأ', error.message || 'فشل في رفع الصورة');
            
            // Reset preview if upload failed
            if (elements.avatarPreviewImg) {
                elements.avatarPreviewImg.classList.add('hidden');
            }
        } finally {
            // Hide progress bar after a short delay
            setTimeout(() => {
                if (elements.avatarUploadProgress) {
                    elements.avatarUploadProgress.classList.add('hidden');
                }
                updateAvatarProgress(0);
            }, 500);
            
            // Unlock upload
            state.isUploadingAvatar = false;
        }
    }
    
    function updateAvatarProgress(percent) {
        if (elements.avatarProgressBar) {
            elements.avatarProgressBar.style.width = `${percent}%`;
        }
        if (elements.avatarProgressText) {
            elements.avatarProgressText.textContent = `${percent}%`;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Bio Editing Functions
    // ─────────────────────────────────────────────────────────────────────────
    
    function openBioEdit() {
        if (!elements.bioEditForm || !elements.bioDisplay) return;
        
        // Populate textarea with current bio
        const currentBio = state.user?.bio || '';
        if (elements.bioTextarea) {
            elements.bioTextarea.value = currentBio;
            updateBioCharCount();
        }
        
        // Toggle visibility
        elements.bioDisplay.classList.add('hidden');
        elements.bioEditForm.classList.remove('hidden');
        
        // Focus textarea
        elements.bioTextarea?.focus();
    }
    
    function closeBioEdit() {
        if (!elements.bioEditForm || !elements.bioDisplay) return;
        
        elements.bioEditForm.classList.add('hidden');
        elements.bioDisplay.classList.remove('hidden');
    }
    
    function updateBioCharCount() {
        if (!elements.bioTextarea || !elements.bioCharCount) return;
        
        const length = elements.bioTextarea.value.length;
        elements.bioCharCount.textContent = `${length}/500`;
        
        // Change color if near limit
        if (length >= 450) {
            elements.bioCharCount.classList.remove('text-gray-400');
            elements.bioCharCount.classList.add('text-orange-500');
        } else {
            elements.bioCharCount.classList.remove('text-orange-500');
            elements.bioCharCount.classList.add('text-gray-400');
        }
    }
    
    async function saveBio() {
        const newBio = elements.bioTextarea?.value.trim() || '';
        
        // Show loading state
        if (elements.saveBioBtn) {
            elements.saveBioBtn.disabled = true;
            elements.saveBioBtn.textContent = 'جاري الحفظ...';
        }
        
        try {
            await API.put(CONFIG.ENDPOINTS.PROFILE, { bio: newBio });
            
            // Update local state
            state.user.bio = newBio;
            Auth.setUser(state.user);
            
            // Update display
            if (elements.profileBio) {
                if (newBio) {
                    elements.profileBio.textContent = newBio;
                    elements.profileBio.classList.remove('italic');
                } else {
                    elements.profileBio.textContent = 'لا يوجد وصف بعد...';
                    elements.profileBio.classList.add('italic');
                }
            }
            
            closeBioEdit();
            Toast.success('تم بنجاح!', 'تم تحديث الوصف');
            
        } catch (error) {
            console.error('Save bio error:', error);
            Toast.error('خطأ', error.message || 'فشل تحديث الوصف');
        } finally {
            // Reset button
            if (elements.saveBioBtn) {
                elements.saveBioBtn.disabled = false;
                elements.saveBioBtn.textContent = 'حفظ';
            }
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Banner Editing Functions
    // ─────────────────────────────────────────────────────────────────────────
    
    function openBannerModal() {
        if (elements.bannerModal) {
            elements.bannerModal.classList.remove('hidden');
            elements.bannerModal.style.display = 'flex';
            if (elements.bannerUrlInput) {
                elements.bannerUrlInput.value = state.user?.bannerUrl || '';
            }
            // Show preview if there's an existing banner
            if (state.user?.bannerUrl && elements.bannerPreviewImg) {
                elements.bannerPreviewImg.src = state.user.bannerUrl;
                elements.bannerPreviewImg.classList.remove('hidden');
            }
        }
    }
    
    function previewBanner() {
        const url = elements.bannerUrlInput?.value.trim();
        
        if (!url) {
            if (elements.bannerPreviewImg) {
                elements.bannerPreviewImg.classList.add('hidden');
            }
            return;
        }
        
        const img = new Image();
        img.onload = () => {
            if (elements.bannerPreviewImg) {
                elements.bannerPreviewImg.src = url;
                elements.bannerPreviewImg.classList.remove('hidden');
            }
        };
        img.onerror = () => {
            if (elements.bannerPreviewImg) {
                elements.bannerPreviewImg.classList.add('hidden');
            }
        };
        img.src = url;
    }
    
    async function saveBanner() {
        const url = elements.bannerUrlInput?.value.trim();
        
        // Show loading state
        if (elements.saveBannerBtn) {
            elements.saveBannerBtn.disabled = true;
            elements.saveBannerBtn.textContent = 'جاري الحفظ...';
        }
        
        try {
            await API.put(CONFIG.ENDPOINTS.PROFILE, { bannerUrl: url });
            
            // Update local state
            state.user.bannerUrl = url;
            Auth.setUser(state.user);
            
            // Update display
            renderBanner(state.user);
            
            closeModals();
            Toast.success('تم بنجاح!', 'تم تحديث الغلاف');
            
        } catch (error) {
            console.error('Save banner error:', error);
            Toast.error('خطأ', error.message || 'فشل تحديث الغلاف');
        } finally {
            // Reset button
            if (elements.saveBannerBtn) {
                elements.saveBannerBtn.disabled = false;
                elements.saveBannerBtn.textContent = 'حفظ التغييرات';
            }
        }
    }
    
    async function removeBanner() {
        // Show loading state
        if (elements.removeBannerBtn) {
            elements.removeBannerBtn.disabled = true;
            elements.removeBannerBtn.textContent = 'جاري الإزالة...';
        }
        
        try {
            await API.put(CONFIG.ENDPOINTS.PROFILE, { bannerUrl: '' });
            
            // Update local state
            state.user.bannerUrl = '';
            Auth.setUser(state.user);
            
            // Update display
            renderBanner(state.user);
            
            // Clear input and preview
            if (elements.bannerUrlInput) elements.bannerUrlInput.value = '';
            if (elements.bannerPreviewImg) elements.bannerPreviewImg.classList.add('hidden');
            
            closeModals();
            Toast.success('تم بنجاح!', 'تم إزالة الغلاف');
            
        } catch (error) {
            console.error('Remove banner error:', error);
            Toast.error('خطأ', error.message || 'فشل إزالة الغلاف');
        } finally {
            // Reset button
            if (elements.removeBannerBtn) {
                elements.removeBannerBtn.disabled = false;
                elements.removeBannerBtn.textContent = 'إزالة الغلاف';
            }
        }
    }
    
    function renderBanner(user) {
        if (!elements.profileBanner) return;
        
        if (user?.bannerUrl) {
            elements.profileBanner.src = user.bannerUrl;
            elements.profileBanner.style.display = 'block';
        } else {
            elements.profileBanner.style.display = 'none';
        }
    }
    
    async function handleBannerFileUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Prevent concurrent uploads
        if (state.isUploadingBanner) {
            Toast.warning('انتظر', 'جاري رفع صورة أخرى...');
            return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            Toast.error('خطأ', 'يرجى اختيار صورة صالحة');
            if (elements.bannerFileInput) elements.bannerFileInput.value = '';
            return;
        }
        
        // Validate file size (max 5MB for banners)
        if (file.size > 5 * 1024 * 1024) {
            Toast.error('خطأ', 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
            if (elements.bannerFileInput) elements.bannerFileInput.value = '';
            return;
        }
        
        // Lock upload
        state.isUploadingBanner = true;
        
        // Show progress bar
        if (elements.bannerUploadProgress) {
            elements.bannerUploadProgress.classList.remove('hidden');
        }
        updateBannerProgress(10);
        
        // Create upload FormData immediately with the current file
        const formData = new FormData();
        formData.append('image', file);
        formData.append('folder', 'banners');
        
        // Reset file input immediately to prevent stale file references
        if (elements.bannerFileInput) elements.bannerFileInput.value = '';
        
        try {
            // Preview the image immediately using object URL
            const localPreviewUrl = URL.createObjectURL(file);
            if (elements.bannerPreviewImg) {
                elements.bannerPreviewImg.src = localPreviewUrl;
                elements.bannerPreviewImg.classList.remove('hidden');
            }
            if (elements.bannerPlaceholder) {
                elements.bannerPlaceholder.classList.add('hidden');
            }
            
            updateBannerProgress(30);
            
            // Upload to server
            const response = await fetch('/api/upload/image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: formData
            });
            
            updateBannerProgress(70);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'فشل في رفع الصورة');
            }
            
            const result = await response.json();
            const imageUrl = result.data?.url || result.url;
            
            if (!imageUrl) {
                throw new Error('لم يتم استلام رابط الصورة');
            }
            
            updateBannerProgress(85);
            
            // Update the URL input
            if (elements.bannerUrlInput) {
                elements.bannerUrlInput.value = imageUrl;
            }
            
            // Save to profile immediately
            await API.put(CONFIG.ENDPOINTS.PROFILE, { bannerUrl: imageUrl });
            
            updateBannerProgress(100);
            
            // Update local state
            state.user.bannerUrl = imageUrl;
            Auth.setUser(state.user);
            
            // Revoke object URL
            URL.revokeObjectURL(localPreviewUrl);
            
            // Update banner display immediately
            renderBanner(state.user);
            
            // Close modal and show success
            closeModals();
            Toast.success('تم!', 'تم رفع وحفظ الغلاف بنجاح');
            
        } catch (error) {
            console.error('Banner upload error:', error);
            Toast.error('خطأ', error.message || 'فشل في رفع الصورة');
            
            // Reset preview if upload failed
            if (elements.bannerPreviewImg) {
                elements.bannerPreviewImg.classList.add('hidden');
            }
            if (elements.bannerPlaceholder) {
                elements.bannerPlaceholder.classList.remove('hidden');
            }
        } finally {
            // Hide progress bar after a short delay
            setTimeout(() => {
                if (elements.bannerUploadProgress) {
                    elements.bannerUploadProgress.classList.add('hidden');
                }
                updateBannerProgress(0);
            }, 500);
            
            // Unlock upload
            state.isUploadingBanner = false;
        }
    }
    
    function updateBannerProgress(percent) {
        if (elements.bannerProgressBar) {
            elements.bannerProgressBar.style.width = `${percent}%`;
        }
        if (elements.bannerProgressText) {
            elements.bannerProgressText.textContent = `${percent}%`;
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
