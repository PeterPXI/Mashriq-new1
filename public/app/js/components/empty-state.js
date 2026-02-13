/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ EMPTY STATE COMPONENT
 * منصة مشرق - مكون الحالة الفارغة
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * استخدام:
 * EmptyState.render(container, 'noMessages', { userName: 'محمد' })
 */

const EmptyState = (function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // Templates
    // ─────────────────────────────────────────────────────────────────────────
    
    const templates = {
        // لا توجد محادثات
        noChats: {
            icon: `<svg class="w-20 h-20 text-orange-200" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.97 5.97 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
            </svg>`,
            title: 'لا توجد محادثات',
            message: 'ابدأ محادثة جديدة مع البائع من صفحة الطلب',
            action: null
        },
        
        // لا توجد رسائل
        noMessages: {
            icon: `<svg class="w-20 h-20 text-orange-200" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/>
            </svg>`,
            title: 'ابدأ المحادثة',
            message: 'أرسل رسالتك الأولى للتواصل',
            action: null
        },
        
        // لا توجد خدمات
        noServices: {
            icon: `<svg class="w-20 h-20 text-orange-200" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"/>
            </svg>`,
            title: 'لا توجد خدمات',
            message: 'لم يتم العثور على خدمات مطابقة لبحثك',
            action: {
                text: 'تصفح جميع الخدمات',
                href: '/app/explore.html'
            }
        },
        
        // لا توجد طلبات
        noOrders: {
            icon: `<svg class="w-20 h-20 text-orange-200" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>
            </svg>`,
            title: 'لا توجد طلبات',
            message: 'ستظهر طلباتك هنا بعد شراء خدمة',
            action: {
                text: 'تصفح الخدمات',
                href: '/app/explore.html'
            }
        },
        
        // لا توجد إشعارات
        noNotifications: {
            icon: `<svg class="w-20 h-20 text-orange-200" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
            </svg>`,
            title: 'لا توجد إشعارات',
            message: 'ستصلك الإشعارات هنا',
            action: null
        },
        
        // لا توجد مفضلة
        noFavorites: {
            icon: `<svg class="w-20 h-20 text-orange-200" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
            </svg>`,
            title: 'لا توجد مفضلات',
            message: 'أضف خدمات للمفضلة للوصول إليها بسهولة',
            action: {
                text: 'تصفح الخدمات',
                href: '/app/explore.html'
            }
        },
        
        // خطأ عام
        error: {
            icon: `<svg class="w-20 h-20 text-red-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>`,
            title: 'حدث خطأ',
            message: 'تعذر تحميل البيانات. يرجى المحاولة مرة أخرى.',
            action: {
                text: 'إعادة المحاولة',
                onClick: 'location.reload()'
            }
        },
        
        // صفحة غير موجودة
        notFound: {
            icon: `<svg class="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>`,
            title: 'غير موجود',
            message: 'لم يتم العثور على ما تبحث عنه',
            action: {
                text: 'العودة للرئيسية',
                href: '/app/index.html'
            }
        }
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Function
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * رسم الحالة الفارغة
     * 
     * @param {HTMLElement|string} container - العنصر أو المعرف
     * @param {string} type - نوع الحالة
     * @param {Object} options - خيارات إضافية
     */
    function render(container, type, options = {}) {
        const el = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
            
        if (!el) return;
        
        const template = templates[type];
        if (!template) {
            console.warn(`EmptyState: Unknown type "${type}"`);
            return;
        }
        
        // Merge options
        const icon = options.icon || template.icon;
        const title = options.title || template.title;
        const message = options.message || template.message;
        const action = options.action || template.action;
        
        let actionHtml = '';
        if (action) {
            if (action.href) {
                actionHtml = `<a href="${action.href}" class="mt-6 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg">
                    ${action.text}
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </a>`;
            } else if (action.onClick) {
                actionHtml = `<button onclick="${action.onClick}" class="mt-6 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg">
                    ${action.text}
                </button>`;
            }
        }
        
        el.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16 text-center px-4">
                <div class="w-32 h-32 bg-orange-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    ${icon}
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">${title}</h3>
                <p class="text-gray-500 max-w-sm">${message}</p>
                ${actionHtml}
            </div>
        `;
    }
    
    /**
     * إضافة نوع جديد
     */
    function addType(name, config) {
        templates[name] = config;
    }
    
    // Public API
    return {
        render,
        addType,
        templates
    };
    
})();

// Export if module system available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmptyState;
}
