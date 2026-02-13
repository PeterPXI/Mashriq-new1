/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ SKELETON COMPONENT
 * منصة مشرق - مكون Skeleton Loading
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * استخدام:
 * Skeleton.serviceCard()    → بطاقة خدمة
 * Skeleton.chatItem()       → عنصر محادثة
 * Skeleton.message('own')   → رسالة
 * Skeleton.render(container, type, count)
 */

const Skeleton = (function() {
    'use strict';
    
    /**
     * بطاقة خدمة Skeleton
     */
    function serviceCard() {
        return `
            <div class="skeleton-service-card">
                <div class="skeleton skeleton-image"></div>
                <div class="skeleton skeleton-text skeleton-w-3/4"></div>
                <div class="skeleton skeleton-text-sm skeleton-w-1/2"></div>
                <div class="flex justify-between items-center mt-4">
                    <div class="skeleton skeleton-text-sm" style="width: 60px;"></div>
                    <div class="skeleton skeleton-text-sm" style="width: 80px;"></div>
                </div>
            </div>
        `;
    }
    
    /**
     * عنصر محادثة Skeleton
     */
    function chatItem() {
        return `
            <div class="skeleton-chat-item">
                <div class="skeleton skeleton-avatar"></div>
                <div class="skeleton-content">
                    <div class="skeleton skeleton-text skeleton-w-1/3"></div>
                    <div class="skeleton skeleton-text-sm skeleton-w-2/3"></div>
                </div>
                <div class="skeleton skeleton-text-sm" style="width: 40px;"></div>
            </div>
        `;
    }
    
    /**
     * رسالة Skeleton
     */
    function message(type = 'own') {
        const widths = ['40%', '60%', '35%', '55%', '45%'];
        const width = widths[Math.floor(Math.random() * widths.length)];
        
        return `
            <div class="skeleton-message ${type}">
                <div class="skeleton skeleton-bubble" style="width: ${width}; height: 48px;"></div>
            </div>
        `;
    }
    
    /**
     * بطاقة طلب Skeleton
     */
    function orderCard() {
        return `
            <div class="skeleton-order-card">
                <div class="flex items-start gap-4">
                    <div class="skeleton skeleton-image-square" style="width: 80px; height: 80px;"></div>
                    <div class="flex-1">
                        <div class="skeleton skeleton-text skeleton-w-2/3"></div>
                        <div class="skeleton skeleton-text-sm skeleton-w-1/2"></div>
                        <div class="flex gap-2 mt-3">
                            <div class="skeleton skeleton-text-sm" style="width: 60px;"></div>
                            <div class="skeleton skeleton-text-sm" style="width: 80px;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * بروفايل Skeleton
     */
    function profile() {
        return `
            <div class="skeleton-profile">
                <div class="skeleton skeleton-avatar-lg mx-auto"></div>
                <div class="skeleton skeleton-text skeleton-w-1/3 mx-auto mt-4"></div>
                <div class="skeleton skeleton-text-sm skeleton-w-1/2 mx-auto"></div>
                <div class="flex justify-center gap-4 mt-4">
                    <div class="skeleton" style="width: 60px; height: 40px;"></div>
                    <div class="skeleton" style="width: 60px; height: 40px;"></div>
                    <div class="skeleton" style="width: 60px; height: 40px;"></div>
                </div>
            </div>
        `;
    }
    
    /**
     * جدول Skeleton
     */
    function tableRow() {
        return `
            <div class="flex items-center gap-4 py-3 border-b border-gray-100">
                <div class="skeleton skeleton-avatar-sm"></div>
                <div class="skeleton skeleton-text skeleton-w-1/4"></div>
                <div class="skeleton skeleton-text-sm skeleton-w-1/3"></div>
                <div class="skeleton skeleton-text-sm" style="width: 80px;"></div>
                <div class="skeleton skeleton-button" style="width: 60px; height: 32px;"></div>
            </div>
        `;
    }
    
    /**
     * رسم Skeleton في عنصر
     * 
     * @param {HTMLElement|string} container - العنصر أو المعرف
     * @param {string} type - نوع الـ Skeleton
     * @param {number} count - عدد العناصر
     */
    function render(container, type, count = 3) {
        const el = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
            
        if (!el) return;
        
        const generators = {
            'service': serviceCard,
            'chat': chatItem,
            'message': message,
            'order': orderCard,
            'profile': profile,
            'table': tableRow
        };
        
        const generator = generators[type];
        if (!generator) return;
        
        let html = '';
        for (let i = 0; i < count; i++) {
            html += generator();
        }
        
        el.innerHTML = html;
    }
    
    /**
     * رسم Skeleton للرسائل مع تناوب
     */
    function renderMessages(container, count = 5) {
        const el = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
            
        if (!el) return;
        
        let html = '';
        for (let i = 0; i < count; i++) {
            const type = i % 2 === 0 ? 'other' : 'own';
            html += message(type);
        }
        
        el.innerHTML = html;
    }
    
    // Public API
    return {
        serviceCard,
        chatItem,
        message,
        orderCard,
        profile,
        tableRow,
        render,
        renderMessages
    };
    
})();

// Export if module system available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Skeleton;
}
