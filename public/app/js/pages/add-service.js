/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ ADD SERVICE PAGE
 * منصة مشرق - صفحة إضافة خدمة جديدة
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // DOM Elements
    // ─────────────────────────────────────────────────────────────────────────
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        form: document.getElementById('serviceForm'),
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
            Toast.warning('تنبيه', 'يجب تفعيل وضع البائع لإضافة خدمات');
            window.location.href = CONFIG.ROUTES.BUYER_DASHBOARD;
            return;
        }
        
        // Render components
        Navbar.render(elements.navbar);
        Footer.render(elements.footer);
        
        // Populate categories
        populateCategories();
        
        // Bind events
        bindEvents();
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
        };
        
        // Validate
        if (!validateForm(data)) {
            return;
        }
        
        // Show loading
        Loader.buttonStart(elements.submitBtn);
        
        try {
            // Call API
            const response = await API.services.create(data);
            
            // Show success
            Toast.success('تم بنجاح!', 'تم نشر خدمتك بنجاح');
            showAlert('success', 'تم نشر الخدمة بنجاح! جاري التحويل...');
            
            // Redirect to service page
            const serviceId = response.data?.service?._id || response.data?.service?.id;
            setTimeout(() => {
                if (serviceId) {
                    window.location.href = `/app/service.html?id=${serviceId}`;
                } else {
                    window.location.href = CONFIG.ROUTES.SELLER_DASHBOARD;
                }
            }, 1500);
            
        } catch (error) {
            console.error('Add service error:', error);
            showAlert('error', error.message || 'فشل نشر الخدمة. يرجى المحاولة مرة أخرى.');
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
            showError('title', 'عنوان الخدمة مطلوب');
            isValid = false;
        } else if (data.title.length < 10) {
            showError('title', 'العنوان يجب أن يكون 10 أحرف على الأقل');
            isValid = false;
        }
        
        // Category
        if (!data.category) {
            showError('category', 'يرجى اختيار التخصص');
            isValid = false;
        }
        
        // Description
        if (!data.description) {
            showError('description', 'وصف الخدمة مطلوب');
            isValid = false;
        } else if (data.description.length < 50) {
            showError('description', 'الوصف يجب أن يكون 50 حرف على الأقل');
            isValid = false;
        }
        
        // Price
        if (!data.price || data.price < 5) {
            showError('price', 'السعر يجب أن يكون $5 على الأقل');
            isValid = false;
        }
        
        // Delivery time
        if (!data.deliveryTime || data.deliveryTime < 1) {
            showError('deliveryTime', 'مدة التسليم يجب أن تكون يوم واحد على الأقل');
            isValid = false;
        }
        
        // Image URL validation (if provided)
        if (data.image && !isValidUrl(data.image)) {
            showError('image', 'رابط الصورة غير صالح');
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
    // UI Helpers
    // ─────────────────────────────────────────────────────────────────────────
    
    function showError(field, message) {
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
