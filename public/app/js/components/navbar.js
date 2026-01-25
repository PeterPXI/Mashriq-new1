/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ NAVBAR COMPONENT - Tailwind CSS Version
 * منصة مشرق - شريط التنقل
 * ═══════════════════════════════════════════════════════════════════════════
 */

const Navbar = {
    /**
     * Render the navbar
     */
    render(container) {
        if (!container) {
            container = document.getElementById('navbar');
        }
        if (!container) return;
        
        const isLoggedIn = Auth.isAuthenticated();
        const user = Auth.getUser();
        const isSeller = Auth.isSeller();
        
        container.innerHTML = `
            <nav class="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex items-center justify-between h-16">
                        <!-- Logo -->
                        <a href="${CONFIG.ROUTES.HOME}" class="flex items-center gap-3 font-bold text-xl text-gray-900 hover:text-primary-600 transition-all group">
                            <img src="/app/assets/images/logo-icon.png" alt="مشرق" class="w-10 h-10 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
                            <span class="hidden sm:block bg-gradient-to-l from-primary-600 to-primary-500 bg-clip-text text-transparent text-2xl font-extrabold">مشرق</span>
                        </a>
                        
                        <!-- Navigation Links -->
                        <ul class="flex items-center gap-1">
                            <li>
                                <a href="${CONFIG.ROUTES.EXPLORE}" class="px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base text-gray-600 hover:text-primary-600 hover:bg-primary-50 font-medium transition-colors ${this.isActive('/explore') ? 'text-primary-600 bg-primary-50' : ''}">
                                    استكشف الخدمات
                                </a>
                            </li>
                            ${isSeller ? `
                                <li>
                                    <a href="${CONFIG.ROUTES.SELLER_SERVICES}" class="px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base text-gray-600 hover:text-primary-600 hover:bg-primary-50 font-medium transition-colors ${this.isActive('/seller/services') ? 'text-primary-600 bg-primary-50' : ''}">
                                        خدماتي
                                    </a>
                                </li>
                            ` : ''}
                        </ul>
                        
                        <!-- Actions -->
                        <div class="flex items-center gap-2 sm:gap-3">
                            ${isLoggedIn ? this.renderLoggedIn(user, isSeller) : this.renderLoggedOut()}
                        </div>
                    </div>
                </div>
            </nav>
        `;
        
        this.bindEvents(container);
    },
    
    /**
     * Render logged in state
     */
    renderLoggedIn(user, isSeller) {
        const dashboardUrl = isSeller ? CONFIG.ROUTES.SELLER_DASHBOARD : CONFIG.ROUTES.BUYER_DASHBOARD;
        const initials = Auth.getUserInitials();
        const avatar = Auth.getUserAvatar();
        
        return `
            <a href="${CONFIG.ROUTES.NOTIFICATIONS}" class="relative p-2 rounded-lg hover:bg-gray-100 transition-colors" id="notificationBell" title="الإشعارات">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-600">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                <span id="notificationBadge" class="hidden absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">0</span>
            </a>
            <div class="relative" id="userDropdownWrapper">
                <button class="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors" id="userDropdown">
                    ${avatar 
                        ? `<img src="${avatar}" alt="" class="w-8 h-8 rounded-lg object-cover">` 
                        : `<span class="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">${initials}</span>`
                    }
                    <span class="hidden sm:block text-sm font-medium text-gray-700">${Auth.getUsername()}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </button>
                <div class="hidden absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50" id="userDropdownMenu">
                    <a href="${dashboardUrl}" class="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
                            <rect x="3" y="3" width="7" height="7"/>
                            <rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                        </svg>
                        لوحة التحكم
                    </a>
                    <a href="${CONFIG.ROUTES.PROFILE}" class="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        الملف الشخصي
                    </a>
                    <a href="${CONFIG.ROUTES.BUYER_ORDERS}" class="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                            <rect x="9" y="3" width="6" height="4" rx="1"/>
                        </svg>
                        طلباتي
                    </a>
                    <a href="/app/messages.html" class="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
                            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                        </svg>
                        الرسائل
                    </a>
                    <a href="/app/notifications.html" class="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
                            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 01-3.46 0"/>
                        </svg>
                        الإشعارات
                    </a>
                    <a href="/app/wallet.html" class="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
                            <path d="M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
                            <polyline points="1,10 23,10"/>
                        </svg>
                        المحفظة
                    </a>
                    <a href="${CONFIG.ROUTES.SETTINGS}" class="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                        </svg>
                        الإعدادات
                    </a>
                    ${isSeller ? `
                        <a href="${CONFIG.ROUTES.SELLER_ADD_SERVICE}" class="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 8v8M8 12h8"/>
                            </svg>
                            أضف خدمة
                        </a>
                    ` : ''}
                    ${Auth.isAdmin() ? `
                        <div class="my-2 border-t border-gray-100"></div>
                        <a href="${CONFIG.ROUTES.ADMIN_DASHBOARD}" class="flex items-center gap-3 px-4 py-2.5 text-purple-700 hover:bg-purple-50 transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-purple-500">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            </svg>
                            لوحة الإدارة
                        </a>
                    ` : ''}
                    <div class="my-2 border-t border-gray-100"></div>
                    <button class="flex items-center gap-3 w-full px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors" id="logoutBtn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                            <polyline points="16,17 21,12 16,7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        تسجيل الخروج
                    </button>
                </div>
            </div>
        `;
    },
    
    /**
     * Render logged out state
     */
    renderLoggedOut() {
        return `
            <a href="${CONFIG.ROUTES.LOGIN}" class="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 hover:text-primary-600 font-medium transition-colors">تسجيل الدخول</a>
            <a href="${CONFIG.ROUTES.REGISTER}" class="px-3 sm:px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm sm:text-base rounded-xl font-medium transition-colors">إنشاء حساب</a>
        `;
    },
    
    /**
     * Check if current path matches
     */
    isActive(path) {
        return window.location.pathname.includes(path);
    },
    
    /**
     * Bind navbar events
     */
    bindEvents(container) {
        const dropdown = container.querySelector('#userDropdown');
        const dropdownMenu = container.querySelector('#userDropdownMenu');
        
        dropdown?.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu?.classList.toggle('hidden');
        });
        
        document.addEventListener('click', () => {
            dropdownMenu?.classList.add('hidden');
        });
        
        const logoutBtn = container.querySelector('#logoutBtn');
        logoutBtn?.addEventListener('click', () => {
            Auth.logout();
            Toast.success('تم تسجيل الخروج', 'نراك قريباً!');
            window.location.href = CONFIG.ROUTES.HOME;
        });
        
        if (Auth.isAuthenticated()) {
            this.loadNotificationCount();
        }
    },
    
    async loadNotificationCount() {
        try {
            const response = await fetch('/api/notifications/count', {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            const data = await response.json();
            if (data.success && data.data?.count > 0) {
                const badge = document.getElementById('notificationBadge');
                if (badge) {
                    badge.textContent = data.data.count > 9 ? '9+' : data.data.count;
                    badge.classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error('Failed to load notification count:', error);
        }
    },
};

// Make Navbar object immutable
Object.freeze(Navbar);
