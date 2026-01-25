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
        { id: 'design', name: 'تصميم جرافيك', icon: '🎨' },
        { id: 'writing', name: 'كتابة محتوى', icon: '✍️' },
        { id: 'programming', name: 'برمجة', icon: '💻' },
        { id: 'marketing', name: 'تسويق', icon: '📣' },
        { id: 'video', name: 'فيديو وأنيميشن', icon: '🎬' },
        { id: 'translation', name: 'ترجمة', icon: '🌍' },
        { id: 'voiceover', name: 'تعليق صوتي', icon: '🎙️' },
        { id: 'business', name: 'أعمال', icon: '💼' },
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
