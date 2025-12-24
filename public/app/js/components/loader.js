/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ LOADER COMPONENT
 * منصة مشرق - مكونات التحميل
 * ═══════════════════════════════════════════════════════════════════════════
 */

const Loader = {
    // ─────────────────────────────────────────────────────────────────────────
    // Page Loader
    // ─────────────────────────────────────────────────────────────────────────
    
    pageLoader: null,
    
    /**
     * Show full page loader
     */
    showPage(text = 'جاري التحميل...') {
        if (this.pageLoader) return;
        
        this.pageLoader = document.createElement('div');
        this.pageLoader.className = 'page-loader';
        this.pageLoader.id = 'page-loader';
        this.pageLoader.innerHTML = `
            <div class="loader loader-lg"></div>
            <span class="page-loader-text">${text}</span>
        `;
        document.body.appendChild(this.pageLoader);
        document.body.style.overflow = 'hidden';
    },
    
    /**
     * Hide page loader
     */
    hidePage() {
        if (!this.pageLoader) return;
        
        this.pageLoader.style.opacity = '0';
        setTimeout(() => {
            this.pageLoader?.remove();
            this.pageLoader = null;
            document.body.style.overflow = '';
        }, 300);
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Inline Loader
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * Create inline loader HTML
     */
    inline(size = 'md') {
        const sizeClass = size === 'sm' ? 'loader-sm' : size === 'lg' ? 'loader-lg' : '';
        return `<div class="loader ${sizeClass}"></div>`;
    },
    
    /**
     * Show loader in element
     */
    show(element, text = '') {
        if (!element) return;
        
        element.dataset.originalContent = element.innerHTML;
        element.innerHTML = `
            <div class="flex items-center justify-center gap-3 p-6">
                <div class="loader"></div>
                ${text ? `<span class="text-secondary">${text}</span>` : ''}
            </div>
        `;
    },
    
    /**
     * Restore original content
     */
    hide(element) {
        if (!element || !element.dataset.originalContent) return;
        
        element.innerHTML = element.dataset.originalContent;
        delete element.dataset.originalContent;
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Button Loader
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * Set button to loading state
     */
    buttonStart(button) {
        if (!button) return;
        
        button.dataset.originalText = button.innerHTML;
        button.disabled = true;
        button.classList.add('btn-loading');
    },
    
    /**
     * Reset button from loading state
     */
    buttonStop(button) {
        if (!button) return;
        
        button.disabled = false;
        button.classList.remove('btn-loading');
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
            delete button.dataset.originalText;
        }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // Skeleton Loader
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * Generate skeleton loader HTML
     */
    skeleton: {
        text(lines = 3, className = '') {
            let html = '';
            for (let i = 0; i < lines; i++) {
                const width = i === lines - 1 ? 'short' : '';
                html += `<div class="skeleton skeleton-text ${width} ${className}" style="margin-bottom: 0.5rem;"></div>`;
            }
            return html;
        },
        
        avatar(size = 'md') {
            return `<div class="skeleton skeleton-avatar avatar-${size}"></div>`;
        },
        
        image(aspectRatio = '16 / 10') {
            return `<div class="skeleton skeleton-image" style="aspect-ratio: ${aspectRatio};"></div>`;
        },
        
        serviceCard() {
            return `
                <div class="service-card">
                    <div class="skeleton skeleton-image"></div>
                    <div class="service-card-body">
                        <div class="flex items-center gap-2 mb-3">
                            <div class="skeleton skeleton-avatar avatar-sm"></div>
                            <div class="skeleton skeleton-text" style="width: 100px;"></div>
                        </div>
                        <div class="skeleton skeleton-text" style="margin-bottom: 0.5rem;"></div>
                        <div class="skeleton skeleton-text short"></div>
                        <div class="service-card-footer" style="margin-top: 1rem;">
                            <div class="skeleton skeleton-text" style="width: 60px;"></div>
                            <div class="skeleton skeleton-text" style="width: 80px;"></div>
                        </div>
                    </div>
                </div>
            `;
        },
        
        serviceCards(count = 4) {
            let html = '';
            for (let i = 0; i < count; i++) {
                html += this.serviceCard();
            }
            return html;
        },
        
        tableRow(columns = 5) {
            let html = '<tr>';
            for (let i = 0; i < columns; i++) {
                html += `<td><div class="skeleton skeleton-text"></div></td>`;
            }
            html += '</tr>';
            return html;
        },
        
        tableRows(rows = 5, columns = 5) {
            let html = '';
            for (let i = 0; i < rows; i++) {
                html += this.tableRow(columns);
            }
            return html;
        },
    },
};

// Make Loader object immutable
Object.freeze(Loader);
Object.freeze(Loader.skeleton);
