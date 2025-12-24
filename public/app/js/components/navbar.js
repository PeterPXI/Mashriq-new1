/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ NAVBAR COMPONENT
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
            <nav class="navbar">
                <div class="container flex items-center justify-between">
                    <!-- Logo -->
                    <a href="${CONFIG.ROUTES.HOME}" class="navbar-brand">
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
                    
                    <!-- Navigation Links -->
                    <ul class="navbar-nav" id="navbarNav">
                        <li><a href="${CONFIG.ROUTES.EXPLORE}" class="nav-link ${this.isActive('/explore') ? 'active' : ''}">استكشف الخدمات</a></li>
                        ${isSeller ? `
                            <li><a href="${CONFIG.ROUTES.SELLER_SERVICES}" class="nav-link ${this.isActive('/seller/services') ? 'active' : ''}">خدماتي</a></li>
                        ` : ''}
                    </ul>
                    
                    <!-- Actions -->
                    <div class="navbar-actions">
                        ${isLoggedIn ? this.renderLoggedIn(user, isSeller) : this.renderLoggedOut()}
                        
                        <!-- Mobile Toggle -->
                        <button class="navbar-toggle" id="navbarToggle" aria-label="فتح القائمة">
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
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
            <div class="dropdown">
                <button class="btn btn-ghost dropdown-toggle flex items-center gap-2" id="userDropdown">
                    ${avatar 
                        ? `<img src="${avatar}" alt="" class="avatar avatar-sm">` 
                        : `<span class="avatar avatar-sm">${initials}</span>`
                    }
                    <span class="md:hidden lg:block">${Auth.getUsername()}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </button>
                <div class="dropdown-menu" id="userDropdownMenu">
                    <a href="${dashboardUrl}" class="dropdown-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7"/>
                            <rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                        </svg>
                        لوحة التحكم
                    </a>
                    <a href="${CONFIG.ROUTES.BUYER_ORDERS}" class="dropdown-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                            <rect x="9" y="3" width="6" height="4" rx="1"/>
                        </svg>
                        طلباتي
                    </a>
                    ${isSeller ? `
                        <a href="${CONFIG.ROUTES.SELLER_ADD_SERVICE}" class="dropdown-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 8v8M8 12h8"/>
                            </svg>
                            أضف خدمة
                        </a>
                    ` : ''}
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item text-error" id="logoutBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
            <a href="${CONFIG.ROUTES.LOGIN}" class="btn btn-ghost btn-sm">تسجيل الدخول</a>
            <a href="${CONFIG.ROUTES.REGISTER}" class="btn btn-primary btn-sm">إنشاء حساب</a>
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
        const nav = container.querySelector('#navbarNav');
        
        toggle?.addEventListener('click', () => {
            nav?.classList.toggle('show');
        });
        
        // User dropdown
        const dropdown = container.querySelector('#userDropdown');
        const dropdownMenu = container.querySelector('#userDropdownMenu');
        
        dropdown?.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu?.classList.toggle('show');
        });
        
        // Close dropdown on outside click
        document.addEventListener('click', () => {
            dropdownMenu?.classList.remove('show');
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
