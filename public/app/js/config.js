/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ API CONFIG
 * منصة مشرق - إعدادات API
 * ═══════════════════════════════════════════════════════════════════════════
 */

const CONFIG = {
    // ─────────────────────────────────────────────────────────────────────────
    // API Configuration
    // ─────────────────────────────────────────────────────────────────────────
    API_BASE_URL: '/api',
    
    // ─────────────────────────────────────────────────────────────────────────
    // Authentication
    // ─────────────────────────────────────────────────────────────────────────
    TOKEN_KEY: 'mashriq_token',
    USER_KEY: 'mashriq_user',
    
    // ─────────────────────────────────────────────────────────────────────────
    // Pagination
    // ─────────────────────────────────────────────────────────────────────────
    DEFAULT_PAGE_SIZE: 12,
    
    // ─────────────────────────────────────────────────────────────────────────
    // Timeouts
    // ─────────────────────────────────────────────────────────────────────────
    REQUEST_TIMEOUT: 30000, // 30 seconds
    TOAST_DURATION: 4000,   // 4 seconds
    
    // ─────────────────────────────────────────────────────────────────────────
    // Routes
    // ─────────────────────────────────────────────────────────────────────────
    ROUTES: {
        HOME: '/app/',
        LOGIN: '/app/login.html',
        REGISTER: '/app/register.html',
        EXPLORE: '/app/explore.html',
        SERVICE: '/app/service.html',
        CHECKOUT: '/app/checkout.html',
        ORDER: '/app/order.html',
        PROFILE: '/app/profile.html',
        MESSAGES: '/app/messages.html',
        WALLET: '/app/wallet.html',
        NOTIFICATIONS: '/app/notifications.html',
        
        // Buyer Routes
        BUYER_DASHBOARD: '/app/buyer/dashboard.html',
        BUYER_ORDERS: '/app/buyer/orders.html',
        BUYER_ORDER: '/app/buyer/order.html',
        
        // Seller Routes
        SELLER_DASHBOARD: '/app/seller/dashboard.html',
        SELLER_SERVICES: '/app/seller/services.html',
        SELLER_ADD_SERVICE: '/app/seller/add-service.html',
        SELLER_EDIT_SERVICE: '/app/seller/edit-service.html',
        SELLER_ORDERS: '/app/seller/orders.html',
        
        // Admin Routes
        ADMIN_DASHBOARD: '/app/admin/dashboard.html',
        ADMIN_USERS: '/app/admin/users.html',
        ADMIN_DISPUTES: '/app/admin/disputes.html',
        ADMIN_SERVICES: '/app/admin/services.html',
        
        // Settings & Account Routes
        SETTINGS: '/app/settings.html',
        CHANGE_PASSWORD: '/app/change-password.html',
        BECOME_SELLER: '/app/become-seller.html',
        
        // Static Pages
        ABOUT: '/app/about.html',
        TERMS: '/app/terms.html',
        PRIVACY: '/app/privacy.html',
        HELP: '/app/help.html',
        CONTACT: '/app/contact.html',
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // API Endpoints
    // ─────────────────────────────────────────────────────────────────────────
    ENDPOINTS: {
        // Auth
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        ME: '/auth/me',
        PROFILE: '/auth/profile',
        UPLOAD_AVATAR: '/auth/upload-avatar',
        PASSWORD: '/auth/password',
        ACTIVATE_SELLER: '/auth/activate-seller',
        USER_BY_ID: (id) => `/users/${id}`,
        
        // Services
        SERVICES: '/services',
        SERVICE_BY_ID: (id) => `/services/${id}`,
        MY_SERVICES: '/my-services',
        
        // Orders
        ORDERS: '/orders',
        ORDER_BY_ID: (id) => `/orders/${id}`,
        
        // Reviews
        REVIEWS: '/reviews',
        SERVICE_REVIEWS: (serviceId) => `/reviews/service/${serviceId}`,
        SELLER_REVIEWS: (sellerId) => `/reviews/seller/${sellerId}`, // ← Added
        
        // Chat
        CHATS: '/chats',
        CHAT_BY_ID: (id) => `/chats/${id}`,
        
        // Stats
        STATS_OVERVIEW: '/stats/overview',      // ← Added
        MY_STATS: '/my-stats',                  // ← Added
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Categories (Static for now)
    // ─────────────────────────────────────────────────────────────────────────
    CATEGORIES: [
        { 
            id: 'design', 
            name: 'تصميم جرافيك', 
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>',
            color: 'from-rose-500 to-pink-600'
        },
        { 
            id: 'writing', 
            name: 'كتابة محتوى', 
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
            color: 'from-amber-500 to-orange-600'
        },
        { 
            id: 'programming', 
            name: 'برمجة', 
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
            color: 'from-blue-500 to-indigo-600'
        },
        { 
            id: 'marketing', 
            name: 'تسويق', 
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
            color: 'from-emerald-500 to-teal-600'
        },
        { 
            id: 'video', 
            name: 'فيديو وأنيميشن', 
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
            color: 'from-purple-500 to-violet-600'
        },
        { 
            id: 'translation', 
            name: 'ترجمة', 
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
            color: 'from-cyan-500 to-sky-600'
        },
        { 
            id: 'voiceover', 
            name: 'تعليق صوتي', 
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
            color: 'from-fuchsia-500 to-pink-600'
        },
        { 
            id: 'business', 
            name: 'أعمال', 
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
            color: 'from-slate-500 to-gray-600'
        },
    ],
    
    // ─────────────────────────────────────────────────────────────────────────
    // Order Statuses
    // ─────────────────────────────────────────────────────────────────────────
    ORDER_STATUS: {
        ACTIVE: { key: 'ACTIVE', label: 'قيد التنفيذ', color: 'info' },
        DELIVERED: { key: 'DELIVERED', label: 'تم التسليم', color: 'warning' },
        COMPLETED: { key: 'COMPLETED', label: 'مكتمل', color: 'success' },
        CANCELLED: { key: 'CANCELLED', label: 'ملغي', color: 'error' },
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Seller Levels
    // ─────────────────────────────────────────────────────────────────────────
    SELLER_LEVELS: {
        NEW: { key: 'NEW', label: 'بائع جديد', color: 'secondary' },
        LEVEL_1: { key: 'LEVEL_1', label: 'بائع مستوى 1', color: 'info' },
        LEVEL_2: { key: 'LEVEL_2', label: 'بائع مستوى 2', color: 'primary' },
        TOP_RATED: { key: 'TOP_RATED', label: 'بائع مميز', color: 'warning' },
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Currency
    // ─────────────────────────────────────────────────────────────────────────
    CURRENCY: {
        code: 'USD',
        symbol: '$',
        locale: 'en-US',
    },
};

// Make config immutable
Object.freeze(CONFIG);
Object.freeze(CONFIG.ROUTES);
Object.freeze(CONFIG.ENDPOINTS);
Object.freeze(CONFIG.CATEGORIES);
Object.freeze(CONFIG.ORDER_STATUS);
Object.freeze(CONFIG.SELLER_LEVELS);
Object.freeze(CONFIG.CURRENCY);

// Export for modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
