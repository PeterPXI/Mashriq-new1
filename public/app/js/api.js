/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ API CLIENT
 * منصة مشرق - عميل API
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Provides a clean interface for making API requests
 * Handles authentication, error handling, and response parsing
 * ═══════════════════════════════════════════════════════════════════════════
 */

const API = {
    // ─────────────────────────────────────────────────────────────────────────
    // Core Request Method
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * Make an API request
     * @param {string} endpoint - API endpoint (without base URL)
     * @param {object} options - Request options
     * @returns {Promise<object>} - Response data
     */
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const token = Auth.getToken();
        
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }
        
        const config = {
            method: options.method || 'GET',
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };
        
        if (options.body && config.method !== 'GET') {
            config.body = JSON.stringify(options.body);
        }
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            // Handle unauthorized responses
            if (response.status === 401) {
                Auth.logout();
                Toast.error('انتهت صلاحية الجلسة', 'يرجى تسجيل الدخول مرة أخرى');
                window.location.href = CONFIG.ROUTES.LOGIN;
                throw new Error('Unauthorized');
            }
            
            // Handle API errors
            if (!response.ok) {
                const errorMessage = data.message || data.error || 'حدث خطأ في الطلب';
                throw new APIError(errorMessage, response.status, data);
            }
            
            return data;
        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }
            
            // Network or parsing error
            console.error('API Request Error:', error);
            throw new APIError('خطأ في الاتصال بالخادم', 0, null);
        }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // HTTP Methods
    // ─────────────────────────────────────────────────────────────────────────
    
    get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    },
    
    post(endpoint, body = {}) {
        return this.request(endpoint, { method: 'POST', body });
    },
    
    put(endpoint, body = {}) {
        return this.request(endpoint, { method: 'PUT', body });
    },
    
    patch(endpoint, body = {}) {
        return this.request(endpoint, { method: 'PATCH', body });
    },
    
    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Auth Endpoints
    // ─────────────────────────────────────────────────────────────────────────
    
    auth: {
        async login(email, password) {
            const response = await API.post(CONFIG.ENDPOINTS.LOGIN, { email, password });
            if (response.data?.token) {
                Auth.setToken(response.data.token);
                Auth.setUser(response.data.user);
            }
            return response;
        },
        
        async register(userData) {
            const response = await API.post(CONFIG.ENDPOINTS.REGISTER, userData);
            return response;
        },
        
        async getProfile() {
            const response = await API.get(CONFIG.ENDPOINTS.ME);
            if (response.data?.user) {
                Auth.setUser(response.data.user);
            }
            return response;
        },
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Services Endpoints
    // ─────────────────────────────────────────────────────────────────────────
    
    services: {
        getAll(params = {}) {
            return API.get(CONFIG.ENDPOINTS.SERVICES, params);
        },
        
        getById(id) {
            return API.get(CONFIG.ENDPOINTS.SERVICE_BY_ID(id));
        },
        
        getMyServices(params = {}) {
            return API.get(CONFIG.ENDPOINTS.MY_SERVICES, params);
        },
        
        create(serviceData) {
            return API.post(CONFIG.ENDPOINTS.SERVICES, serviceData);
        },
        
        update(id, serviceData) {
            return API.put(CONFIG.ENDPOINTS.SERVICE_BY_ID(id), serviceData);
        },
        
        delete(id) {
            return API.delete(CONFIG.ENDPOINTS.SERVICE_BY_ID(id));
        },
        
        search(query, params = {}) {
            return API.get(CONFIG.ENDPOINTS.SERVICES, { search: query, ...params });
        },
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Orders Endpoints
    // ─────────────────────────────────────────────────────────────────────────
    
    orders: {
        getAll(params = {}) {
            return API.get(CONFIG.ENDPOINTS.ORDERS, params);
        },
        
        getById(id) {
            return API.get(CONFIG.ENDPOINTS.ORDER_BY_ID(id));
        },
        
        getMyOrders(params = {}) {
            return API.get(CONFIG.ENDPOINTS.ORDERS, { role: 'buyer', ...params });
        },
        
        getSellerOrders(params = {}) {
            return API.get(CONFIG.ENDPOINTS.ORDERS, { role: 'seller', ...params });
        },
        
        create(orderData) {
            return API.post(CONFIG.ENDPOINTS.ORDERS, orderData);
        },
        
        updateStatus(id, status) {
            return API.patch(CONFIG.ENDPOINTS.ORDER_BY_ID(id), { status });
        },
        
        deliver(id, deliveryData) {
            return API.put(`${CONFIG.ENDPOINTS.ORDER_BY_ID(id)}/deliver`, deliveryData);
        },
        
        accept(id) {
            return API.put(`${CONFIG.ENDPOINTS.ORDER_BY_ID(id)}/complete`);
        },
        
        cancel(id, reason) {
            return API.put(`${CONFIG.ENDPOINTS.ORDER_BY_ID(id)}/cancel`, { reason });
        },
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Reviews Endpoints
    // ─────────────────────────────────────────────────────────────────────────
    
    reviews: {
        getServiceReviews(serviceId, params = {}) {
            return API.get(CONFIG.ENDPOINTS.SERVICE_REVIEWS(serviceId), params);
        },
        
        create(reviewData) {
            return API.post(CONFIG.ENDPOINTS.REVIEWS, reviewData);
        },
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Chat Endpoints
    // ─────────────────────────────────────────────────────────────────────────
    
    chats: {
        getAll(params = {}) {
            return API.get(CONFIG.ENDPOINTS.CHATS, params);
        },
        
        getById(id) {
            return API.get(CONFIG.ENDPOINTS.CHAT_BY_ID(id));
        },
        
        sendMessage(chatId, message) {
            return API.post(`${CONFIG.ENDPOINTS.CHAT_BY_ID(chatId)}/messages`, { content: message });
        },
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Users & Profile Endpoints
    // ─────────────────────────────────────────────────────────────────────────
    
    users: {
        updateProfile(userData) {
            return API.put(CONFIG.ENDPOINTS.PROFILE, userData);
        },
        
        changePassword(currentPassword, newPassword) {
            return API.put(CONFIG.ENDPOINTS.PASSWORD, { currentPassword, newPassword });
        },
        
        activateSeller() {
            return API.post(CONFIG.ENDPOINTS.ACTIVATE_SELLER);
        },
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Stats Endpoints
    // ─────────────────────────────────────────────────────────────────────────
    
    stats: {
        getOverview() {
            return API.get(CONFIG.ENDPOINTS.STATS_OVERVIEW);
        },
        
        getMyStats() {
            return API.get(CONFIG.ENDPOINTS.MY_STATS);
        },
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Custom API Error Class
// ─────────────────────────────────────────────────────────────────────────────

class APIError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

// Make API object immutable
Object.freeze(API.auth);
Object.freeze(API.services);
Object.freeze(API.orders);
Object.freeze(API.reviews);
Object.freeze(API.chats);
Object.freeze(API.users);
Object.freeze(API.stats);
