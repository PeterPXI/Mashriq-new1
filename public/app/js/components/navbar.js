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
                        <a href="${CONFIG.ROUTES.HOME}" class="flex items-center gap-2 font-bold text-xl text-gray-900 hover:text-primary-600 transition-colors">
                            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                                <rect width="40" height="40" rx="10" fill="url(#logo-gradient)"/>
                                <path d="M12 28V15L20 10L28 15V28" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M20 28V20" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                                <circle cx="20" cy="15" r="2" fill="white"/>
                                <defs>
                                    <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40">
                                        <stop stop-color="#F97316"/>
                                        <stop offset="1" stop-color="#EA580C"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                            <span>مشرق</span>
                        </a>
                        
                        <!-- Navigation Links (Desktop) -->
                        <ul class="hidden md:flex items-center gap-1" id="navbarNav">
                            <li>
                                <a href="${CONFIG.ROUTES.EXPLORE}" class="px-4 py-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 font-medium transition-colors ${this.isActive('/explore') ? 'text-primary-600 bg-primary-50' : ''}">
                                    استكشف الخدمات
                                </a>
                            </li>
                            ${isSeller ? `
                                <li>
                                    <a href="${CONFIG.ROUTES.SELLER_SERVICES}" class="px-4 py-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 font-medium transition-colors ${this.isActive('/seller/services') ? 'text-primary-600 bg-primary-50' : ''}">
                                        خدماتي
                                    </a>
                                </li>
                            ` : ''}
                        </ul>
                        
                        <!-- Actions -->
                        <div class="flex items-center gap-3">
                            ${isLoggedIn ? this.renderLoggedIn(user, isSeller) : this.renderLoggedOut()}
                            
                            <!-- Mobile Toggle -->
                            <button class="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-gray-100 transition-colors" id="navbarToggle" aria-label="فتح القائمة">
                                <span class="w-5 h-0.5 bg-gray-600 rounded-full transition-transform"></span>
                                <span class="w-5 h-0.5 bg-gray-600 rounded-full transition-opacity"></span>
                                <span class="w-5 h-0.5 bg-gray-600 rounded-full transition-transform"></span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Mobile Menu -->
                    <div class="hidden md:hidden pb-4" id="mobileMenu">
                        <div class="flex flex-col gap-1 pt-2 border-t border-gray-100">
                            <a href="${CONFIG.ROUTES.EXPLORE}" class="px-4 py-3 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg font-medium transition-colors ${this.isActive('/explore') ? 'text-primary-600 bg-primary-50' : ''}">
                                استكشف الخدمات
                            </a>
                            ${isSeller ? `
                                <a href="${CONFIG.ROUTES.SELLER_SERVICES}" class="px-4 py-3 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg font-medium transition-colors ${this.isActive('/seller/services') ? 'text-primary-600 bg-primary-50' : ''}">
                                    خدماتي
                                </a>
                            ` : ''}
                            ${!isLoggedIn ? `
                                <div class="flex flex-col gap-2 pt-3 mt-2 border-t border-gray-100">
                                    <a href="${CONFIG.ROUTES.LOGIN}" class="px-4 py-3 text-center text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">تسجيل الدخول</a>
                                    <a href="${CONFIG.ROUTES.REGISTER}" class="px-4 py-3 text-center text-white bg-primary-500 hover:bg-primary-600 rounded-xl font-medium transition-colors">إنشاء حساب</a>
                                </div>
                            ` : ''}
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
            <div class="relative" id="userDropdownWrapper">
                <button class="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors" id="userDropdown">
                    ${avatar 
                        ? `<img src="${avatar}" alt="" class="w-8 h-8 rounded-lg object-cover">` 
                        : `<span class="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">${initials}</span>`
                    }
                    <span class="hidden lg:block text-sm font-medium text-gray-700">${Auth.getUsername()}</span>
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
                    ${isSeller ? `
                        <a href="${CONFIG.ROUTES.SELLER_ADD_SERVICE}" class="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 8v8M8 12h8"/>
                            </svg>
                            أضف خدمة
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
            <div class="hidden md:flex items-center gap-2">
                <a href="${CONFIG.ROUTES.LOGIN}" class="px-4 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors">تسجيل الدخول</a>
                <a href="${CONFIG.ROUTES.REGISTER}" class="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors">إنشاء حساب</a>
            </div>
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
        // Mobile toggle
        const toggle = container.querySelector('#navbarToggle');
        const mobileMenu = container.querySelector('#mobileMenu');
        
        toggle?.addEventListener('click', () => {
            mobileMenu?.classList.toggle('hidden');
            // Animate hamburger
            const spans = toggle.querySelectorAll('span');
            if (mobileMenu?.classList.contains('hidden')) {
                spans[0]?.classList.remove('rotate-45', 'translate-y-2');
                spans[1]?.classList.remove('opacity-0');
                spans[2]?.classList.remove('-rotate-45', '-translate-y-2');
            } else {
                spans[0]?.classList.add('rotate-45', 'translate-y-2');
                spans[1]?.classList.add('opacity-0');
                spans[2]?.classList.add('-rotate-45', '-translate-y-2');
            }
        });
        
        // User dropdown
        const dropdown = container.querySelector('#userDropdown');
        const dropdownMenu = container.querySelector('#userDropdownMenu');
        
        dropdown?.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu?.classList.toggle('hidden');
        });
        
        // Close dropdown on outside click
        document.addEventListener('click', () => {
            dropdownMenu?.classList.add('hidden');
        });
        
        // Logout button
        const logoutBtn = container.querySelector('#logoutBtn');
        logoutBtn?.addEventListener('click', () => {
            Auth.logout();
            Toast.success('تم تسجيل الخروج', 'نراك قريباً!');
            window.location.href = CONFIG.ROUTES.HOME;
        });
    },
};

// Make Navbar object immutable
Object.freeze(Navbar);
