/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ AUTH MODULE
 * منصة مشرق - إدارة المصادقة
 * ═══════════════════════════════════════════════════════════════════════════
 */

const Auth = {
    // ─────────────────────────────────────────────────────────────────────────
    // Token Management
    // ─────────────────────────────────────────────────────────────────────────
    
    getToken() {
        return localStorage.getItem(CONFIG.TOKEN_KEY);
    },
    
    setToken(token) {
        localStorage.setItem(CONFIG.TOKEN_KEY, token);
    },
    
    removeToken() {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // User Management
    // ─────────────────────────────────────────────────────────────────────────
    
    getUser() {
        const userStr = localStorage.getItem(CONFIG.USER_KEY);
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    },
    
    setUser(user) {
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
    },
    
    removeUser() {
        localStorage.removeItem(CONFIG.USER_KEY);
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Auth State
    // ─────────────────────────────────────────────────────────────────────────
    
    isAuthenticated() {
        return !!this.getToken();
    },
    
    isSeller() {
        const user = this.getUser();
        return user?.role === 'seller' || user?.isSeller === true;
    },
    
    isBuyer() {
        const user = this.getUser();
        return user?.role === 'buyer' || !user?.isSeller;
    },
    
    getUserId() {
        const user = this.getUser();
        return user?._id || user?.id;
    },
    
    getUsername() {
        const user = this.getUser();
        return user?.username || user?.name || 'مستخدم';
    },
    
    getUserAvatar() {
        const user = this.getUser();
        return user?.avatar || user?.profileImage || null;
    },
    
    getUserInitials() {
        const name = this.getUsername();
        const words = name.split(' ');
        if (words.length >= 2) {
            return words[0][0] + words[1][0];
        }
        return name.substring(0, 2).toUpperCase();
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Auth Actions
    // ─────────────────────────────────────────────────────────────────────────
    
    logout() {
        this.removeToken();
        this.removeUser();
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Route Protection
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * Require authentication - redirect to login if not authenticated
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            const currentPath = window.location.pathname + window.location.search;
            sessionStorage.setItem('redirect_after_login', currentPath);
            window.location.href = CONFIG.ROUTES.LOGIN;
            return false;
        }
        return true;
    },
    
    /**
     * Require seller role - redirect to buyer dashboard if not seller
     */
    requireSeller() {
        if (!this.requireAuth()) return false;
        
        if (!this.isSeller()) {
            Toast.warning('غير مصرح', 'هذه الصفحة متاحة للبائعين فقط');
            window.location.href = CONFIG.ROUTES.BUYER_DASHBOARD;
            return false;
        }
        return true;
    },
    
    /**
     * Redirect authenticated users away from auth pages
     */
    redirectIfAuthenticated() {
        if (this.isAuthenticated()) {
            const redirectTo = sessionStorage.getItem('redirect_after_login') || 
                              (this.isSeller() ? CONFIG.ROUTES.SELLER_DASHBOARD : CONFIG.ROUTES.BUYER_DASHBOARD);
            sessionStorage.removeItem('redirect_after_login');
            window.location.href = redirectTo;
            return true;
        }
        return false;
    },
    
    /**
     * Get appropriate dashboard based on user role
     */
    getDashboardUrl() {
        return this.isSeller() ? CONFIG.ROUTES.SELLER_DASHBOARD : CONFIG.ROUTES.BUYER_DASHBOARD;
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Token Refresh (if needed)
    // ─────────────────────────────────────────────────────────────────────────
    
    async refreshProfile() {
        if (!this.isAuthenticated()) return null;
        
        try {
            const response = await API.auth.getProfile();
            return response.data;
        } catch (error) {
            console.error('Failed to refresh profile:', error);
            if (error.status === 401) {
                this.logout();
            }
            return null;
        }
    },
};

// Make Auth object immutable
Object.freeze(Auth);
