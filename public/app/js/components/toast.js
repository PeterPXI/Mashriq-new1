/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ TOAST COMPONENT
 * منصة مشرق - إشعارات Toast
 * ═══════════════════════════════════════════════════════════════════════════
 */

const Toast = {
    container: null,
    
    /**
     * Initialize toast container
     */
    init() {
        if (this.container) return;
        
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.id = 'toast-container';
        document.body.appendChild(this.container);
    },
    
    /**
     * Show toast notification
     */
    show(type, title, message, duration = CONFIG.TOAST_DURATION) {
        this.init();
        
        const icons = {
            success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>`,
            error: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`,
            warning: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>`,
            info: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
        };
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            ${icons[type] || icons.info}
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                ${message ? `<p class="toast-message">${message}</p>` : ''}
            </div>
            <button class="toast-close" aria-label="إغلاق">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
        `;
        
        // Close button handler
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.dismiss(toast);
        });
        
        // Add to container
        this.container.appendChild(toast);
        
        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => this.dismiss(toast), duration);
        }
        
        return toast;
    },
    
    /**
     * Dismiss toast
     */
    dismiss(toast) {
        if (!toast || !toast.parentNode) return;
        
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    },
    
    /**
     * Convenience methods
     */
    success(title, message, duration) {
        return this.show('success', title, message, duration);
    },
    
    error(title, message, duration) {
        return this.show('error', title, message, duration);
    },
    
    warning(title, message, duration) {
        return this.show('warning', title, message, duration);
    },
    
    info(title, message, duration) {
        return this.show('info', title, message, duration);
    },
    
    /**
     * Clear all toasts
     */
    clearAll() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    },
};

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(-20px); }
    }
`;
document.head.appendChild(style);

// Make Toast object immutable
Object.freeze(Toast);
