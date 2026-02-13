/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ IMAGE HANDLER
 * منصة مشرق - معالج الصور
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * يوفر:
 * - Lazy loading للصور
 * - Placeholder أثناء التحميل  
 * - Fallback للصور المكسورة
 * - تأثيرات fade-in
 */

const ImageHandler = (function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // Configuration
    // ─────────────────────────────────────────────────────────────────────────
    
    const config = {
        // صورة placeholder افتراضية
        placeholder: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Cpath fill='%23d1d5db' d='M150 100h100v100H150z'/%3E%3Ccircle fill='%23d1d5db' cx='180' cy='130' r='20'/%3E%3Cpath fill='%239ca3af' d='M150 170l30-30 20 20 30-30 20 20v50H150z'/%3E%3C/svg%3E`,
        
        // صورة avatar افتراضية
        avatarPlaceholder: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23f97316' width='100' height='100' rx='50'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='white' font-size='40' font-family='Arial'%3E?%3C/text%3E%3C/svg%3E`,
        
        // صورة خدمة افتراضية
        servicePlaceholder: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect fill='%23fff7ed' width='400' height='250'/%3E%3Ccircle fill='%23fed7aa' cx='200' cy='100' r='50'/%3E%3Crect fill='%23fdba74' x='140' y='170' width='120' height='12' rx='6'/%3E%3Crect fill='%23fed7aa' x='160' y='195' width='80' height='8' rx='4'/%3E%3C/svg%3E`,
        
        // فئات CSS
        loadingClass: 'img-loading',
        loadedClass: 'img-loaded',
        errorClass: 'img-error'
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // CSS Styles (injected once)
    // ─────────────────────────────────────────────────────────────────────────
    
    function injectStyles() {
        if (document.getElementById('image-handler-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'image-handler-styles';
        style.textContent = `
            .img-loading {
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .img-loaded {
                opacity: 1;
            }
            
            .img-error {
                opacity: 0.5;
                filter: grayscale(50%);
            }
            
            .img-container {
                position: relative;
                overflow: hidden;
                background-color: #f3f4f6;
            }
            
            .img-container::before {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                animation: img-shimmer 1.5s infinite;
            }
            
            .img-container.loaded::before {
                display: none;
            }
            
            @keyframes img-shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Core Functions
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * تهيئة صورة مع lazy loading
     * 
     * @param {HTMLImageElement} img - عنصر الصورة
     * @param {Object} options - خيارات
     */
    function init(img, options = {}) {
        if (!img || !(img instanceof HTMLImageElement)) return;
        
        const type = options.type || 'default';
        const fallback = getFallback(type);
        
        // أضف class التحميل
        img.classList.add(config.loadingClass);
        
        // عند نجاح التحميل
        img.onload = function() {
            img.classList.remove(config.loadingClass);
            img.classList.add(config.loadedClass);
            img.parentElement?.classList.add('loaded');
        };
        
        // عند فشل التحميل
        img.onerror = function() {
            img.classList.remove(config.loadingClass);
            img.classList.add(config.errorClass);
            img.src = fallback;
            img.onerror = null; // منع التكرار
        };
    }
    
    /**
     * الحصول على صورة fallback حسب النوع
     */
    function getFallback(type) {
        switch(type) {
            case 'avatar':
                return config.avatarPlaceholder;
            case 'service':
                return config.servicePlaceholder;
            default:
                return config.placeholder;
        }
    }
    
    /**
     * تهيئة جميع الصور في عنصر
     * 
     * @param {HTMLElement} container - العنصر الحاوي
     */
    function initAll(container = document) {
        const images = container.querySelectorAll('img[data-lazy]');
        images.forEach(img => {
            const type = img.dataset.type || 'default';
            init(img, { type });
            
            // نقل الـ src من data-src
            if (img.dataset.src) {
                img.src = img.dataset.src;
            }
        });
    }
    
    /**
     * إنشاء صورة avatar مع fallback
     * 
     * @param {string} src - رابط الصورة
     * @param {string} name - اسم المستخدم (للحرف الأول)
     * @param {string} size - الحجم (sm, md, lg)
     * @returns {string} HTML
     */
    function avatar(src, name = '?', size = 'md') {
        const sizes = {
            sm: 'w-8 h-8 text-sm',
            md: 'w-12 h-12 text-lg',
            lg: 'w-16 h-16 text-xl',
            xl: 'w-24 h-24 text-3xl'
        };
        
        const sizeClass = sizes[size] || sizes.md;
        const initial = (name || '?').charAt(0).toUpperCase();
        
        if (src) {
            return `
                <div class="relative ${sizeClass} rounded-full overflow-hidden bg-orange-100 img-container">
                    <img 
                        src="${src}" 
                        alt="${name}"
                        class="w-full h-full object-cover img-loading"
                        onerror="this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold\\'>${initial}</div>'"
                        onload="this.classList.remove('img-loading');this.classList.add('img-loaded');this.parentElement.classList.add('loaded')"
                    >
                </div>
            `;
        }
        
        // لا يوجد صورة - عرض الحرف الأول
        return `
            <div class="${sizeClass} rounded-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold">
                ${initial}
            </div>
        `;
    }
    
    /**
     * إنشاء صورة خدمة مع placeholder
     * 
     * @param {string} src - رابط الصورة
     * @param {string} alt - النص البديل
     * @returns {string} HTML
     */
    function serviceImage(src, alt = 'خدمة') {
        const placeholder = config.servicePlaceholder;
        
        return `
            <div class="aspect-video rounded-xl overflow-hidden bg-gray-100 img-container">
                <img 
                    src="${src || placeholder}" 
                    alt="${alt}"
                    class="w-full h-full object-cover img-loading"
                    onerror="this.src='${placeholder}';this.classList.add('img-error')"
                    onload="this.classList.remove('img-loading');this.classList.add('img-loaded');this.parentElement.classList.add('loaded')"
                >
            </div>
        `;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Initialize
    // ─────────────────────────────────────────────────────────────────────────
    
    // Inject styles on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectStyles);
    } else {
        injectStyles();
    }
    
    // Public API
    return {
        init,
        initAll,
        avatar,
        serviceImage,
        getFallback,
        config
    };
    
})();

// Export if module system available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageHandler;
}
