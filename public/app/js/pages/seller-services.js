/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ SELLER SERVICES PAGE
 * منصة مشرق - صفحة خدماتي
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // Page State
    // ─────────────────────────────────────────────────────────────────────────
    
    const state = {
        services: [],
        filteredServices: [],
        isLoading: false,
        filters: {
            search: '',
            status: '',
            sortBy: 'newest',
        },
        deleteServiceId: null,
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // DOM Elements
    // ─────────────────────────────────────────────────────────────────────────
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        totalServices: document.getElementById('totalServices'),
        activeServices: document.getElementById('activeServices'),
        pausedServices: document.getElementById('pausedServices'),
        searchInput: document.getElementById('searchInput'),
        statusFilter: document.getElementById('statusFilter'),
        sortBy: document.getElementById('sortBy'),
        servicesLoading: document.getElementById('servicesLoading'),
        servicesList: document.getElementById('servicesList'),
        emptyState: document.getElementById('emptyState'),
        noResults: document.getElementById('noResults'),
        clearFilters: document.getElementById('clearFilters'),
        // Delete modal
        deleteModal: document.getElementById('deleteModal'),
        closeDeleteModal: document.getElementById('closeDeleteModal'),
        cancelDelete: document.getElementById('cancelDelete'),
        confirmDelete: document.getElementById('confirmDelete'),
        deleteServiceTitle: document.getElementById('deleteServiceTitle'),
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // Initialize
    // ─────────────────────────────────────────────────────────────────────────
    
    async function init() {
        // Require seller authentication
        if (!Auth.requireAuth()) {
            return;
        }
        
        if (!Auth.isSeller()) {
            Toast.warning('تنبيه', 'يجب تفعيل وضع البائع للوصول لهذه الصفحة');
            window.location.href = CONFIG.ROUTES.BUYER_DASHBOARD;
            return;
        }
        
        // Render components
        Navbar.render(elements.navbar);
        Footer.render(elements.footer);
        
        // Bind events
        bindEvents();
        
        // Load services
        await loadServices();
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Bind Events
    // ─────────────────────────────────────────────────────────────────────────
    
    function bindEvents() {
        // Search
        elements.searchInput?.addEventListener('input', Utils.debounce(handleSearch, 300));
        
        // Filters
        elements.statusFilter?.addEventListener('change', handleFilterChange);
        elements.sortBy?.addEventListener('change', handleFilterChange);
        
        // Clear filters
        elements.clearFilters?.addEventListener('click', clearFilters);
        
        // Delete modal
        elements.closeDeleteModal?.addEventListener('click', closeDeleteModal);
        elements.cancelDelete?.addEventListener('click', closeDeleteModal);
        elements.confirmDelete?.addEventListener('click', handleDeleteConfirm);
        elements.deleteModal?.addEventListener('click', (e) => {
            if (e.target === elements.deleteModal) closeDeleteModal();
        });
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Load Services
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadServices() {
        state.isLoading = true;
        showLoading();
        
        try {
            const response = await API.services.getMyServices();
            const data = response.data || response;
            state.services = data.services || data || [];
            
            // Update stats
            updateStats();
            
            // Apply filters and render
            applyFilters();
            
        } catch (error) {
            console.error('Failed to load services:', error);
            Toast.error('خطأ', 'تعذر تحميل الخدمات');
            showEmptyState();
        } finally {
            state.isLoading = false;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Update Stats
    // ─────────────────────────────────────────────────────────────────────────
    
    function updateStats() {
        const total = state.services.length;
        const active = state.services.filter(s => s.status === 'active').length;
        const paused = state.services.filter(s => s.status === 'paused' || s.status === 'inactive').length;
        
        if (elements.totalServices) elements.totalServices.textContent = Utils.formatNumber(total);
        if (elements.activeServices) elements.activeServices.textContent = Utils.formatNumber(active);
        if (elements.pausedServices) elements.pausedServices.textContent = Utils.formatNumber(paused);
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Filter & Search
    // ─────────────────────────────────────────────────────────────────────────
    
    function handleSearch(e) {
        state.filters.search = e.target.value.trim().toLowerCase();
        applyFilters();
    }
    
    function handleFilterChange() {
        state.filters.status = elements.statusFilter?.value || '';
        state.filters.sortBy = elements.sortBy?.value || 'newest';
        applyFilters();
    }
    
    function clearFilters() {
        state.filters = { search: '', status: '', sortBy: 'newest' };
        elements.searchInput.value = '';
        elements.statusFilter.value = '';
        elements.sortBy.value = 'newest';
        applyFilters();
    }
    
    function applyFilters() {
        let filtered = [...state.services];
        
        // Search filter
        if (state.filters.search) {
            const searchTerm = state.filters.search;
            filtered = filtered.filter(service => 
                service.title?.toLowerCase().includes(searchTerm) ||
                service.description?.toLowerCase().includes(searchTerm)
            );
        }
        
        // Status filter
        if (state.filters.status) {
            filtered = filtered.filter(service => service.status === state.filters.status);
        }
        
        // Sort
        switch (state.filters.sortBy) {
            case 'oldest':
                filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'orders':
                filtered.sort((a, b) => (b.ordersCount || 0) - (a.ordersCount || 0));
                break;
            case 'rating':
                filtered.sort((a, b) => (b.rating || b.averageRating || 0) - (a.rating || a.averageRating || 0));
                break;
            case 'newest':
            default:
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }
        
        state.filteredServices = filtered;
        renderServices();
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Services
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderServices() {
        hideLoading();
        
        // No services at all
        if (state.services.length === 0) {
            showEmptyState();
            return;
        }
        
        // No results from filters
        if (state.filteredServices.length === 0) {
            showNoResults();
            return;
        }
        
        // Show services
        showServicesList();
        
        elements.servicesList.innerHTML = state.filteredServices.map(service => {
            const serviceId = service._id || service.id;
            const serviceImage = service.image || '';
            const serviceTitle = service.title || 'خدمة';
            const serviceStatus = service.status || 'active';
            const servicePrice = service.price || service.basePrice || 0;
            const serviceRating = service.rating || service.averageRating || 0;
            const serviceOrders = service.ordersCount || service.totalOrders || 0;
            const statusInfo = getStatusInfo(serviceStatus);
            const categoryInfo = CONFIG.CATEGORIES.find(c => c.id === service.category);
            
            return `
                <div class="service-item" data-id="${serviceId}">
                    ${serviceImage 
                        ? `<img src="${serviceImage}" alt="${Utils.escapeHtml(serviceTitle)}" class="service-item-image" onerror="this.outerHTML='<div class=\\'service-item-image-placeholder\\'><svg width=\\'32\\' height=\\'32\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1.5\\'><rect x=\\'2\\' y=\\'7\\' width=\\'20\\' height=\\'14\\' rx=\\'2\\'/><path d=\\'M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16\\'/></svg></div>'">`
                        : `<div class="service-item-image-placeholder">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                            </svg>
                        </div>`
                    }
                    
                    <div class="service-item-content">
                        <div class="service-item-header">
                            <h3 class="service-item-title">
                                <a href="/app/service.html?id=${serviceId}">${Utils.escapeHtml(serviceTitle)}</a>
                            </h3>
                            <span class="badge badge-${statusInfo.color} service-item-status">${statusInfo.label}</span>
                        </div>
                        
                        <div class="service-item-meta">
                            <span class="service-item-meta-item price">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="1" x2="12" y2="23"/>
                                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                                </svg>
                                ${Utils.formatPrice(servicePrice)}
                            </span>
                            
                            <span class="service-item-meta-item rating">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                                </svg>
                                ${serviceRating.toFixed(1)}
                            </span>
                            
                            <span class="service-item-meta-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                                    <rect x="9" y="3" width="6" height="4" rx="1"/>
                                </svg>
                                ${serviceOrders} طلب
                            </span>
                            
                            ${categoryInfo ? `
                                <span class="service-item-meta-item">
                                    ${categoryInfo.icon} ${categoryInfo.name}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="service-item-actions">
                        <a href="/app/service.html?id=${serviceId}" class="btn btn-sm btn-outline-secondary" title="عرض">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                            عرض
                        </a>
                        <a href="/app/seller/edit-service.html?id=${serviceId}" class="btn btn-sm btn-secondary" title="تعديل">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            تعديل
                        </a>
                        <button class="btn btn-sm btn-outline-error" title="حذف" onclick="window.openDeleteModal('${serviceId}', '${Utils.escapeHtml(serviceTitle).replace(/'/g, "\\'")}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // UI State Helpers
    // ─────────────────────────────────────────────────────────────────────────
    
    function showLoading() {
        elements.servicesLoading.style.display = 'flex';
        elements.servicesList.style.display = 'none';
        elements.emptyState.style.display = 'none';
        elements.noResults.style.display = 'none';
    }
    
    function hideLoading() {
        elements.servicesLoading.style.display = 'none';
    }
    
    function showEmptyState() {
        hideLoading();
        elements.servicesList.style.display = 'none';
        elements.emptyState.style.display = 'flex';
        elements.noResults.style.display = 'none';
    }
    
    function showNoResults() {
        hideLoading();
        elements.servicesList.style.display = 'none';
        elements.emptyState.style.display = 'none';
        elements.noResults.style.display = 'flex';
    }
    
    function showServicesList() {
        hideLoading();
        elements.servicesList.style.display = 'flex';
        elements.emptyState.style.display = 'none';
        elements.noResults.style.display = 'none';
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Delete Modal
    // ─────────────────────────────────────────────────────────────────────────
    
    window.openDeleteModal = function(serviceId, serviceTitle) {
        state.deleteServiceId = serviceId;
        elements.deleteServiceTitle.textContent = serviceTitle;
        elements.deleteModal.classList.add('show');
        elements.deleteModal.style.display = 'flex';
    };
    
    function closeDeleteModal() {
        elements.deleteModal.classList.remove('show');
        setTimeout(() => {
            elements.deleteModal.style.display = 'none';
            state.deleteServiceId = null;
        }, 300);
    }
    
    async function handleDeleteConfirm() {
        if (!state.deleteServiceId) return;
        
        Loader.buttonStart(elements.confirmDelete);
        
        try {
            await API.services.delete(state.deleteServiceId);
            
            Toast.success('تم الحذف', 'تم حذف الخدمة بنجاح');
            closeDeleteModal();
            
            // Remove from local state
            state.services = state.services.filter(s => (s._id || s.id) !== state.deleteServiceId);
            updateStats();
            applyFilters();
            
        } catch (error) {
            console.error('Delete failed:', error);
            Toast.error('خطأ', error.message || 'فشل حذف الخدمة');
        } finally {
            Loader.buttonStop(elements.confirmDelete);
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
    
    function getStatusInfo(status) {
        const statuses = {
            active: { label: 'نشط', color: 'success' },
            paused: { label: 'متوقف', color: 'warning' },
            inactive: { label: 'متوقف', color: 'warning' },
            pending: { label: 'قيد المراجعة', color: 'info' },
            rejected: { label: 'مرفوض', color: 'error' },
        };
        
        return statuses[status] || { label: status, color: 'secondary' };
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Run
    // ─────────────────────────────────────────────────────────────────────────
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
