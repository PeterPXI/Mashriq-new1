/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ UTILITIES
 * منصة مشرق - الأدوات المساعدة
 * ═══════════════════════════════════════════════════════════════════════════
 */

const Utils = {
    // ─────────────────────────────────────────────────────────────────────────
    // Formatting
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * Format price with currency
     */
    formatPrice(amount, currency = CONFIG.CURRENCY) {
        if (amount == null || isNaN(amount)) return '0 $';
        return new Intl.NumberFormat(currency.locale, {
            style: 'currency',
            currency: currency.code,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    },
    
    /**
     * Format date relative (e.g., "منذ 3 أيام")
     */
    formatRelativeDate(date) {
        const now = new Date();
        const targetDate = new Date(date);
        const diffMs = now - targetDate;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffWeek = Math.floor(diffDay / 7);
        const diffMonth = Math.floor(diffDay / 30);
        const diffYear = Math.floor(diffDay / 365);
        
        if (diffSec < 60) return 'الآن';
        if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
        if (diffHour < 24) return `منذ ${diffHour} ساعة`;
        if (diffDay < 7) return `منذ ${diffDay} يوم`;
        if (diffWeek < 4) return `منذ ${diffWeek} أسبوع`;
        if (diffMonth < 12) return `منذ ${diffMonth} شهر`;
        return `منذ ${diffYear} سنة`;
    },
    
    /**
     * Format date in Arabic
     */
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };
        return new Intl.DateTimeFormat('ar-EG', { ...defaultOptions, ...options }).format(new Date(date));
    },
    
    /**
     * Format number with Arabic numerals
     */
    formatNumber(num) {
        if (num == null || isNaN(num)) return '0';
        return new Intl.NumberFormat('ar-EG').format(num);
    },
    
    /**
     * Pluralize Arabic word
     */
    pluralize(count, singular, dual, plural) {
        if (count === 1) return singular;
        if (count === 2) return dual;
        if (count >= 3 && count <= 10) return plural;
        return singular; // For 11+
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // URL Helpers
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * Get URL parameter
     */
    getUrlParam(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    },
    
    /**
     * Set URL parameter without reload
     */
    setUrlParam(name, value) {
        const url = new URL(window.location.href);
        if (value) {
            url.searchParams.set(name, value);
        } else {
            url.searchParams.delete(name);
        }
        window.history.replaceState({}, '', url);
    },
    
    /**
     * Build URL with parameters
     */
    buildUrl(base, params = {}) {
        const url = new URL(base, window.location.origin);
        Object.entries(params).forEach(([key, value]) => {
            if (value != null && value !== '') {
                url.searchParams.set(key, value);
            }
        });
        return url.toString();
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // DOM Helpers
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * Shorthand for querySelector
     */
    $(selector, parent = document) {
        return parent.querySelector(selector);
    },
    
    /**
     * Shorthand for querySelectorAll
     */
    $$(selector, parent = document) {
        return [...parent.querySelectorAll(selector)];
    },
    
    /**
     * Create element with attributes and children
     */
    createElement(tag, attrs = {}, children = []) {
        const el = document.createElement(tag);
        
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'innerHTML') {
                el.innerHTML = value;
            } else if (key === 'textContent') {
                el.textContent = value;
            } else if (key.startsWith('on')) {
                el.addEventListener(key.slice(2).toLowerCase(), value);
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    el.dataset[dataKey] = dataValue;
                });
            } else {
                el.setAttribute(key, value);
            }
        });
        
        children.forEach(child => {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                el.appendChild(child);
            }
        });
        
        return el;
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Validation
    // ─────────────────────────────────────────────────────────────────────────
    
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    isValidPassword(password, minLength = 6) {
        return password && password.length >= minLength;
    },
    
    isValidUsername(username) {
        return /^[a-zA-Z0-9_]{3,20}$/.test(username);
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // String Helpers
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * Truncate text
     */
    truncate(text, maxLength = 100, suffix = '...') {
        if (!text || text.length <= maxLength) return text;
        return text.slice(0, maxLength).trim() + suffix;
    },
    
    /**
     * Slugify text
     */
    slugify(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[\s\W-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },
    
    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Debounce & Throttle
    // ─────────────────────────────────────────────────────────────────────────
    
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    throttle(func, limit = 300) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Storage Helpers
    // ─────────────────────────────────────────────────────────────────────────
    
    storage: {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch {
                return defaultValue;
            }
        },
        
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch {
                return false;
            }
        },
        
        remove(key) {
            localStorage.removeItem(key);
        },
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Async Helpers
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * Sleep/delay
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    /**
     * Retry a function
     */
    async retry(fn, maxAttempts = 3, delay = 1000) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === maxAttempts - 1) throw error;
                await this.sleep(delay);
            }
        }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Rating Helpers
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * Render star rating HTML
     */
    renderStars(rating, maxStars = 5) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);
        
        let html = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            html += '<svg class="rating-star filled" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>';
        }
        
        // Half star
        if (hasHalfStar) {
            html += '<svg class="rating-star half" viewBox="0 0 20 20"><defs><linearGradient id="half-star-gradient"><stop offset="50%" stop-color="#F59E0B"/><stop offset="50%" stop-color="#E7E5E4"/></linearGradient></defs><path fill="url(#half-star-gradient)" d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            html += '<svg class="rating-star" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>';
        }
        
        return html;
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Image Helpers
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * Get placeholder image URL
     */
    getPlaceholderImage(width = 400, height = 300, text = '') {
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--color-secondary-200').trim() || '#E7E5E4';
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--color-secondary-500').trim() || '#78716C';
        return `https://via.placeholder.com/${width}x${height}/${bgColor.replace('#', '')}/${textColor.replace('#', '')}?text=${encodeURIComponent(text)}`;
    },
    
    /**
     * Handle image error - show placeholder
     */
    handleImageError(img, placeholderText = 'صورة') {
        img.onerror = null; // Prevent infinite loop
        img.src = this.getPlaceholderImage(img.width || 400, img.height || 300, placeholderText);
    },
};

// Make Utils object immutable
Object.freeze(Utils);
Object.freeze(Utils.storage);
