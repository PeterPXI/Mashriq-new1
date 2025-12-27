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
        imageFile: document.getElementById('imageFile'),
        fileName: document.getElementById('fileName'),
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
        
        // File input change
        elements.imageFile?.addEventListener('change', handleFileSelect);
        elements.removePreview?.addEventListener('click', removeImagePreview);
        
        // Clear errors on input
        const fields = ['title', 'category', 'description', 'price', 'deliveryTime'];
        fields.forEach(field => {
            elements[field]?.addEventListener('input', () => clearError(field));
        });
    }
    
    // Handle file selection
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) {
            removeImagePreview();
            return;
        }
        
        // Validate type
        if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
            Toast.error('خطأ', 'يُسمح فقط برفع الصور (JPG, PNG, GIF, WebP)');
            e.target.value = '';
            return;
        }
        
        // Validate size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            Toast.error('خطأ', 'حجم الصورة يجب أن يكون أقل من 5MB');
            e.target.value = '';
            return;
        }
        
        // Update file name display
        if (elements.fileName) {
            elements.fileName.textContent = file.name;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (event) => {
            if (elements.previewImg) elements.previewImg.src = event.target.result;
            if (elements.imagePreview) elements.imagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
    
    function removeImagePreview() {
        if (elements.imagePreview) elements.imagePreview.classList.add('hidden');
        if (elements.previewImg) elements.previewImg.src = '';
        if (elements.imageFile) elements.imageFile.value = '';
        if (elements.fileName) elements.fileName.textContent = 'لم يتم اختيار ملف';
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Handle Submit
    // ─────────────────────────────────────────────────────────────────────────
    
    async function handleSubmit(e) {
        e.preventDefault();
        
        // Clear previous errors
        clearAllErrors();
        hideAlert();
        
        // Basic validation
        const title = elements.title?.value.trim();
        const category = elements.category?.value;
        const description = elements.description?.value.trim();
        const price = parseFloat(elements.price?.value) || 0;
        const deliveryTime = parseInt(elements.deliveryTime?.value) || 3;
        const revisions = parseInt(elements.revisions?.value) || 1;
        const requirements = elements.requirements?.value.trim() || '';
        
        if (!title || title.length < 10) {
            showError('title', 'العنوان يجب أن يكون 10 أحرف على الأقل');
            return;
        }
        if (!category) {
            showError('category', 'يرجى اختيار التخصص');
            return;
        }
        if (!description || description.length < 50) {
            showError('description', 'الوصف يجب أن يكون 50 حرف على الأقل');
            return;
        }
        if (price < 5) {
            showError('price', 'السعر يجب أن يكون $5 على الأقل');
            return;
        }
        
        // Prepare FormData
        const formData = new FormData();
        formData.append('title', title);
        formData.append('category', category);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('deliveryTime', deliveryTime);
        formData.append('revisions', revisions);
        formData.append('requirements', requirements);
        
        // Add image file if selected
        const imageFile = elements.imageFile?.files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        // Show loading
        Loader.buttonStart(elements.submitBtn);
        
        try {
            // Call API with FormData
            const response = await fetch('/api/services', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'فشل نشر الخدمة');
            }
            
            // Show success
            Toast.success('تم بنجاح!', 'تم نشر خدمتك بنجاح');
            showAlert('success', 'تم نشر الخدمة بنجاح! جاري التحويل...');
            
            // Redirect to service page
            const serviceId = result.data?.service?._id || result.data?.service?.id;
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
