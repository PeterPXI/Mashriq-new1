/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ EDIT SERVICE PAGE
 * منصة مشرق - صفحة تعديل الخدمة
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // Page State
    // ─────────────────────────────────────────────────────────────────────────
    
    const state = {
        serviceId: null,
        service: null,
        isLoading: false,
        originalData: null,
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // DOM Elements
    // ─────────────────────────────────────────────────────────────────────────
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        loadingState: document.getElementById('loadingState'),
        errorState: document.getElementById('errorState'),
        errorMessage: document.getElementById('errorMessage'),
        formSection: document.getElementById('formSection'),
        statsSection: document.getElementById('statsSection'),
        form: document.getElementById('serviceForm'),
        serviceStatus: document.getElementById('serviceStatus'),
        title: document.getElementById('title'),
        category: document.getElementById('category'),
        description: document.getElementById('description'),
        price: document.getElementById('price'),
        deliveryTime: document.getElementById('deliveryTime'),
        revisions: document.getElementById('revisions'),
        image: document.getElementById('image'),
        requirements: document.getElementById('requirements'),
        imagePreview: document.getElementById('imagePreview'),
        previewImg: document.getElementById('previewImg'),
        removePreview: document.getElementById('removePreview'),
        submitBtn: document.getElementById('submitBtn'),
        formAlert: document.getElementById('formAlert'),
        // Stats
        ordersCount: document.getElementById('ordersCount'),
        ratingValue: document.getElementById('ratingValue'),
        viewsCount: document.getElementById('viewsCount'),
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
            Toast.warning('تنبيه', 'يجب تفعيل وضع البائع لتعديل الخدمات');
            window.location.href = CONFIG.ROUTES.BUYER_DASHBOARD;
            return;
        }
        
        // Render components
        Navbar.render(elements.navbar);
        Footer.render(elements.footer);
        
        // Get service ID from URL
        state.serviceId = Utils.getUrlParam('id');
        
        if (!state.serviceId) {
            showError('لم يتم تحديد الخدمة المراد تعديلها');
            return;
        }
        
        // Populate categories
        populateCategories();
        
        // Bind events
        bindEvents();
        
        // Load service data
        await loadService();
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Populate Categories
    // ─────────────────────────────────────────────────────────────────────────
    
    function populateCategories() {
        if (!elements.category) return;
        
        const options = CONFIG.CATEGORIES.map(cat => 
            `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`
        ).join('');
        
        elements.category.innerHTML = `
            <option value="">اختر التخصص</option>
            ${options}
        `;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Bind Events
    // ─────────────────────────────────────────────────────────────────────────
    
    function bindEvents() {
        // Form submit
        elements.form?.addEventListener('submit', handleSubmit);
        
        // Image preview
        elements.image?.addEventListener('input', Utils.debounce(handleImageInput, 500));
        elements.removePreview?.addEventListener('click', removeImagePreview);
        
        // Clear errors on input
        const fields = ['title', 'category', 'description', 'price', 'deliveryTime', 'image'];
        fields.forEach(field => {
            elements[field]?.addEventListener('input', () => clearError(field));
        });
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Load Service
    // ─────────────────────────────────────────────────────────────────────────
    
    async function loadService() {
        state.isLoading = true;
        showLoading();
        
        try {
            const response = await API.services.getById(state.serviceId);
            const data = response.data || response;
            state.service = data.service || data;
            
            // Check ownership
            const currentUserId = Auth.getUserId();
            const serviceOwnerId = state.service.seller?._id || state.service.seller;
            
            if (serviceOwnerId && serviceOwnerId !== currentUserId) {
                showError('لا يمكنك تعديل هذه الخدمة لأنها ليست ملكك');
                return;
            }
            
            // Populate form with service data
            populateForm();
            
            // Show form
            showForm();
            
        } catch (error) {
            console.error('Failed to load service:', error);
            showError(error.message || 'تعذر تحميل بيانات الخدمة');
        } finally {
            state.isLoading = false;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Populate Form
    // ─────────────────────────────────────────────────────────────────────────
    
    function populateForm() {
        const service = state.service;
        
        // Status (active = isActive && !isPaused)
        if (elements.serviceStatus) {
            const isActive = service.isActive !== false;
            const isPaused = service.isPaused === true;
            elements.serviceStatus.checked = isActive && !isPaused;
        }
        
        // Basic info
        if (elements.title) elements.title.value = service.title || '';
        if (elements.category) elements.category.value = service.category || '';
        if (elements.description) elements.description.value = service.description || '';
        
        // Pricing
        if (elements.price) elements.price.value = service.price || service.basePrice || '';
        if (elements.deliveryTime) elements.deliveryTime.value = service.deliveryTime || '';
        if (elements.revisions) elements.revisions.value = service.revisions || 1;
        
        // Media
        if (elements.image) {
            elements.image.value = service.image || '';
            if (service.image) {
                handleImageInput();
            }
        }
        
        // Requirements
        if (elements.requirements) elements.requirements.value = service.requirements || '';
        
        // Stats
        if (elements.ordersCount) {
            elements.ordersCount.textContent = Utils.formatNumber(service.ordersCount || service.totalOrders || 0);
        }
        if (elements.ratingValue) {
            const rating = service.rating || service.averageRating || 0;
            elements.ratingValue.textContent = rating.toFixed(1);
        }
        if (elements.viewsCount) {
            elements.viewsCount.textContent = Utils.formatNumber(service.views || 0);
        }
        
        // Save original data for comparison
        state.originalData = {
            title: service.title,
            category: service.category,
            description: service.description,
            price: service.price || service.basePrice,
            deliveryTime: service.deliveryTime,
            revisions: service.revisions,
            image: service.image,
            requirements: service.requirements,
            status: service.status,
        };
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Handle Submit
    // ─────────────────────────────────────────────────────────────────────────
    
    async function handleSubmit(e) {
        e.preventDefault();
        
        // Clear previous errors
        clearAllErrors();
        hideAlert();
        
        // Get values
        const data = {
            title: elements.title?.value.trim(),
            category: elements.category?.value,
            description: elements.description?.value.trim(),
            price: parseFloat(elements.price?.value) || 0,
            deliveryTime: parseInt(elements.deliveryTime?.value) || 3,
            revisions: parseInt(elements.revisions?.value) || 1,
            image: elements.image?.value.trim(),
            requirements: elements.requirements?.value.trim(),
            status: elements.serviceStatus?.checked ? 'active' : 'paused',
        };
        
        // Validate
        if (!validateForm(data)) {
            return;
        }
        
        // Show loading
        Loader.buttonStart(elements.submitBtn);
        
        try {
            // Call API
            const response = await API.services.update(state.serviceId, data);
            
            // Show success
            Toast.success('تم بنجاح!', 'تم تحديث الخدمة بنجاح');
            showAlert('success', 'تم حفظ التغييرات بنجاح!');
            
            // Update original data
            state.originalData = { ...data };
            state.service = { ...state.service, ...data };
            
        } catch (error) {
            console.error('Update service error:', error);
            showAlert('error', error.message || 'فشل تحديث الخدمة. يرجى المحاولة مرة أخرى.');
            Toast.error('خطأ', error.message);
        } finally {
            Loader.buttonStop(elements.submitBtn);
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Validation
    // ─────────────────────────────────────────────────────────────────────────
    
    function validateForm(data) {
        let isValid = true;
        
        // Title
        if (!data.title) {
            showFieldError('title', 'عنوان الخدمة مطلوب');
            isValid = false;
        } else if (data.title.length < 10) {
            showFieldError('title', 'العنوان يجب أن يكون 10 أحرف على الأقل');
            isValid = false;
        }
        
        // Category
        if (!data.category) {
            showFieldError('category', 'يرجى اختيار التخصص');
            isValid = false;
        }
        
        // Description
        if (!data.description) {
            showFieldError('description', 'وصف الخدمة مطلوب');
            isValid = false;
        } else if (data.description.length < 50) {
            showFieldError('description', 'الوصف يجب أن يكون 50 حرف على الأقل');
            isValid = false;
        }
        
        // Price
        if (!data.price || data.price < 5) {
            showFieldError('price', 'السعر يجب أن يكون $5 على الأقل');
            isValid = false;
        }
        
        // Delivery time
        if (!data.deliveryTime || data.deliveryTime < 1) {
            showFieldError('deliveryTime', 'مدة التسليم يجب أن تكون يوم واحد على الأقل');
            isValid = false;
        }
        
        // Image URL validation (if provided)
        if (data.image && !isValidUrl(data.image)) {
            showFieldError('image', 'رابط الصورة غير صالح');
            isValid = false;
        }
        
        return isValid;
    }
    
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Image Preview
    // ─────────────────────────────────────────────────────────────────────────
    
    function handleImageInput() {
        const url = elements.image?.value.trim();
        
        if (!url) {
            removeImagePreview();
            return;
        }
        
        if (!isValidUrl(url)) {
            return;
        }
        
        // Test if image loads
        const img = new Image();
        img.onload = () => {
            if (elements.previewImg) elements.previewImg.src = url;
            if (elements.imagePreview) elements.imagePreview.style.display = 'inline-block';
        };
        img.onerror = () => {
            removeImagePreview();
        };
        img.src = url;
    }
    
    function removeImagePreview() {
        if (elements.imagePreview) elements.imagePreview.style.display = 'none';
        if (elements.previewImg) elements.previewImg.src = '';
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // UI State Helpers
    // ─────────────────────────────────────────────────────────────────────────
    
    function showLoading() {
        elements.loadingState.style.display = 'block';
        elements.errorState.style.display = 'none';
        elements.formSection.style.display = 'none';
        elements.statsSection.style.display = 'none';
    }
    
    function showError(message) {
        elements.loadingState.style.display = 'none';
        elements.errorState.style.display = 'block';
        elements.formSection.style.display = 'none';
        elements.statsSection.style.display = 'none';
        if (elements.errorMessage) {
            elements.errorMessage.textContent = message;
        }
    }
    
    function showForm() {
        elements.loadingState.style.display = 'none';
        elements.errorState.style.display = 'none';
        elements.formSection.style.display = 'block';
        elements.statsSection.style.display = 'block';
    }
    
    function showFieldError(field, message) {
        const errorEl = document.getElementById(`${field}Error`);
        const inputEl = elements[field];
        
        if (errorEl) errorEl.textContent = message;
        if (inputEl) inputEl.classList.add('is-error');
    }
    
    function clearError(field) {
        const errorEl = document.getElementById(`${field}Error`);
        const inputEl = elements[field];
        
        if (errorEl) errorEl.textContent = '';
        if (inputEl) inputEl.classList.remove('is-error');
    }
    
    function clearAllErrors() {
        ['title', 'category', 'description', 'price', 'deliveryTime', 'image'].forEach(clearError);
    }
    
    function showAlert(type, message) {
        if (!elements.formAlert) return;
        
        elements.formAlert.className = `auth-alert alert-${type}`;
        elements.formAlert.textContent = message;
        elements.formAlert.style.display = 'block';
        
        // Scroll to alert
        elements.formAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    function hideAlert() {
        if (!elements.formAlert) return;
        elements.formAlert.style.display = 'none';
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
