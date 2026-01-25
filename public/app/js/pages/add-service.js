/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ ADD SERVICE PAGE - Professional Multi-Step Form
 * منصة مشرق - صفحة إضافة خدمة جديدة
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────
    
    const state = {
        currentStep: 1,
        totalSteps: 4,
        selectedCategory: null,
        tags: [],
        images: [],
        maxImages: 5
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // DOM Elements
    // ─────────────────────────────────────────────────────────────────────────
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        form: document.getElementById('serviceForm'),
        stepIndicator: document.getElementById('stepIndicator'),
        // Step 1
        title: document.getElementById('title'),
        titleCounter: document.getElementById('titleCounter'),
        categoryGrid: document.getElementById('categoryGrid'),
        category: document.getElementById('category'),
        description: document.getElementById('description'),
        descriptionCounter: document.getElementById('descriptionCounter'),
        tagsContainer: document.getElementById('tagsContainer'),
        tagInput: document.getElementById('tagInput'),
        // Step 2
        uploadZone: document.getElementById('uploadZone'),
        imageFiles: document.getElementById('imageFiles'),
        imageGrid: document.getElementById('imageGrid'),
        // Step 3
        price: document.getElementById('price'),
        deliveryTime: document.getElementById('deliveryTime'),
        revisions: document.getElementById('revisions'),
        requirements: document.getElementById('requirements'),
        // Step 4 - Preview
        previewImage: document.getElementById('previewImage'),
        previewTitle: document.getElementById('previewTitle'),
        previewPrice: document.getElementById('previewPrice'),
        previewDelivery: document.getElementById('previewDelivery'),
        summaryCategory: document.getElementById('summaryCategory'),
        summaryPrice: document.getElementById('summaryPrice'),
        summaryDelivery: document.getElementById('summaryDelivery'),
        summaryRevisions: document.getElementById('summaryRevisions'),
        summaryImages: document.getElementById('summaryImages'),
        // General
        submitBtn: document.getElementById('submitBtn'),
        formAlert: document.getElementById('formAlert'),
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // Initialize
    // ─────────────────────────────────────────────────────────────────────────
    
    async function init() {
        if (!Auth.requireAuth()) return;
        
        if (!Auth.isSeller()) {
            Toast.warning('تنبيه', 'يجب تفعيل وضع البائع لإضافة خدمات');
            window.location.href = CONFIG.ROUTES.BUYER_DASHBOARD;
            return;
        }
        
        Navbar.render(elements.navbar);
        Footer.render(elements.footer);
        
        renderCategories();
        bindEvents();
        updateCharCounters();
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Render Categories
    // ─────────────────────────────────────────────────────────────────────────
    
    function renderCategories() {
        if (!elements.categoryGrid) return;
        
        elements.categoryGrid.innerHTML = CONFIG.CATEGORIES.map(cat => `
            <div class="category-card" data-category="${cat.id}">
                <div class="icon" style="background: ${cat.bgColor}20;">
                    ${cat.icon.replace('<svg', '<svg style="color: ' + cat.bgColor + ';" class="w-6 h-6"')}
                </div>
                <div class="name">${cat.name}</div>
            </div>
        `).join('');
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Bind Events
    // ─────────────────────────────────────────────────────────────────────────
    
    function bindEvents() {
        // Form submit
        elements.form?.addEventListener('submit', handleSubmit);
        
        // Navigation buttons
        document.querySelectorAll('.btn-next').forEach(btn => {
            btn.addEventListener('click', () => nextStep());
        });
        document.querySelectorAll('.btn-prev').forEach(btn => {
            btn.addEventListener('click', () => prevStep());
        });
        
        // Character counters
        elements.title?.addEventListener('input', () => {
            updateCharCounter('title', 100);
            updatePreview();
        });
        elements.description?.addEventListener('input', () => {
            updateCharCounter('description', 2000);
        });
        
        // Category selection
        elements.categoryGrid?.addEventListener('click', handleCategorySelect);
        
        // Tags
        elements.tagInput?.addEventListener('keydown', handleTagInput);
        elements.tagsContainer?.addEventListener('click', handleTagRemove);
        
        // Image upload
        elements.uploadZone?.addEventListener('click', () => elements.imageFiles?.click());
        elements.uploadZone?.addEventListener('dragover', handleDragOver);
        elements.uploadZone?.addEventListener('dragleave', handleDragLeave);
        elements.uploadZone?.addEventListener('drop', handleDrop);
        elements.imageFiles?.addEventListener('change', handleFileSelect);
        elements.imageGrid?.addEventListener('click', handleImageRemove);
        
        // Price and delivery updates
        elements.price?.addEventListener('input', updatePreview);
        elements.deliveryTime?.addEventListener('input', updatePreview);
        elements.revisions?.addEventListener('input', updatePreview);
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Step Navigation
    // ─────────────────────────────────────────────────────────────────────────
    
    function nextStep() {
        if (!validateCurrentStep()) return;
        
        if (state.currentStep < state.totalSteps) {
            state.currentStep++;
            updateStepUI();
            
            if (state.currentStep === 4) {
                updatePreview();
                updateSummary();
            }
        }
    }
    
    function prevStep() {
        if (state.currentStep > 1) {
            state.currentStep--;
            updateStepUI();
        }
    }
    
    function updateStepUI() {
        // Update sections
        document.querySelectorAll('.form-section').forEach((section, index) => {
            section.classList.toggle('active', index + 1 === state.currentStep);
        });
        
        // Update step indicator
        document.querySelectorAll('.step-dot').forEach((dot, index) => {
            dot.classList.remove('active', 'completed');
            if (index + 1 === state.currentStep) {
                dot.classList.add('active');
            } else if (index + 1 < state.currentStep) {
                dot.classList.add('completed');
            }
        });
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function validateCurrentStep() {
        clearAllErrors();
        
        switch (state.currentStep) {
            case 1:
                return validateStep1();
            case 2:
                return true; // Images are optional
            case 3:
                return validateStep3();
            default:
                return true;
        }
    }
    
    function validateStep1() {
        const title = elements.title?.value.trim();
        const description = elements.description?.value.trim();
        
        if (!title || title.length < 10) {
            showError('title', 'العنوان يجب أن يكون 10 أحرف على الأقل');
            elements.title?.focus();
            return false;
        }
        
        if (!state.selectedCategory) {
            showError('category', 'يرجى اختيار التخصص');
            return false;
        }
        
        if (!description || description.length < 50) {
            showError('description', 'الوصف يجب أن يكون 50 حرف على الأقل');
            elements.description?.focus();
            return false;
        }
        
        return true;
    }
    
    function validateStep3() {
        const price = parseFloat(elements.price?.value) || 0;
        const deliveryTime = parseInt(elements.deliveryTime?.value) || 0;
        
        if (price < 5) {
            showError('price', 'السعر يجب أن يكون $5 على الأقل');
            elements.price?.focus();
            return false;
        }
        
        if (deliveryTime < 1) {
            showError('deliveryTime', 'مدة التسليم يجب أن تكون يوم واحد على الأقل');
            elements.deliveryTime?.focus();
            return false;
        }
        
        return true;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Category Selection
    // ─────────────────────────────────────────────────────────────────────────
    
    function handleCategorySelect(e) {
        const card = e.target.closest('.category-card');
        if (!card) return;
        
        document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        state.selectedCategory = card.dataset.category;
        if (elements.category) elements.category.value = state.selectedCategory;
        
        clearError('category');
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Tags
    // ─────────────────────────────────────────────────────────────────────────
    
    function handleTagInput(e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const value = e.target.value.trim().replace(',', '');
            
            if (value && state.tags.length < 5 && !state.tags.includes(value)) {
                state.tags.push(value);
                renderTags();
            }
            
            e.target.value = '';
        }
    }
    
    function handleTagRemove(e) {
        const removeBtn = e.target.closest('.tag button');
        if (!removeBtn) return;
        
        const tag = removeBtn.closest('.tag');
        const index = Array.from(elements.tagsContainer.querySelectorAll('.tag')).indexOf(tag);
        
        if (index > -1) {
            state.tags.splice(index, 1);
            renderTags();
        }
    }
    
    function renderTags() {
        const tagsHtml = state.tags.map(tag => `
            <span class="tag">
                ${tag}
                <button type="button">&times;</button>
            </span>
        `).join('');
        
        elements.tagsContainer.innerHTML = tagsHtml + `
            <input type="text" class="tag-input" id="tagInput" placeholder="${state.tags.length >= 5 ? 'الحد الأقصى 5 كلمات' : 'اكتب كلمة واضغط Enter...'}" ${state.tags.length >= 5 ? 'disabled' : ''}>
        `;
        
        // Rebind event
        const newInput = document.getElementById('tagInput');
        newInput?.addEventListener('keydown', handleTagInput);
        newInput?.focus();
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Image Upload
    // ─────────────────────────────────────────────────────────────────────────
    
    function handleDragOver(e) {
        e.preventDefault();
        elements.uploadZone?.classList.add('dragover');
    }
    
    function handleDragLeave(e) {
        e.preventDefault();
        elements.uploadZone?.classList.remove('dragover');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        elements.uploadZone?.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    }
    
    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        processFiles(files);
    }
    
    function processFiles(files) {
        const imageFiles = files.filter(file => file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/));
        
        for (const file of imageFiles) {
            if (state.images.length >= state.maxImages) {
                Toast.warning('تنبيه', `يمكنك رفع ${state.maxImages} صور كحد أقصى`);
                break;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                Toast.error('خطأ', `${file.name} حجمه أكبر من 5MB`);
                continue;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                state.images.push({
                    file: file,
                    preview: e.target.result
                });
                renderImageGrid();
            };
            reader.readAsDataURL(file);
        }
    }
    
    function handleImageRemove(e) {
        const removeBtn = e.target.closest('.remove-btn');
        if (!removeBtn) return;
        
        const item = removeBtn.closest('.image-item');
        const index = parseInt(item.dataset.index);
        
        state.images.splice(index, 1);
        renderImageGrid();
    }
    
    function renderImageGrid() {
        if (state.images.length === 0) {
            elements.imageGrid?.classList.add('hidden');
            elements.uploadZone?.classList.remove('has-images');
            return;
        }
        
        elements.imageGrid?.classList.remove('hidden');
        elements.uploadZone?.classList.add('has-images');
        
        elements.imageGrid.innerHTML = state.images.map((img, index) => `
            <div class="image-item ${index === 0 ? 'main' : ''}" data-index="${index}">
                <img src="${img.preview}" alt="صورة ${index + 1}">
                <button type="button" class="remove-btn">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
        `).join('');
        
        // Update preview
        if (elements.previewImage && state.images[0]) {
            elements.previewImage.innerHTML = `<img src="${state.images[0].preview}" style="width:100%;height:100%;object-fit:cover;">`;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Character Counters
    // ─────────────────────────────────────────────────────────────────────────
    
    function updateCharCounters() {
        updateCharCounter('title', 100);
        updateCharCounter('description', 2000);
    }
    
    function updateCharCounter(field, max) {
        const input = elements[field];
        const counter = elements[`${field}Counter`];
        if (!input || !counter) return;
        
        const length = input.value.length;
        counter.textContent = `${length}/${max}`;
        
        counter.classList.remove('warning', 'error');
        if (length > max * 0.9) {
            counter.classList.add('error');
        } else if (length > max * 0.7) {
            counter.classList.add('warning');
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Preview & Summary
    // ─────────────────────────────────────────────────────────────────────────
    
    function updatePreview() {
        const title = elements.title?.value.trim() || 'عنوان الخدمة سيظهر هنا...';
        const price = parseFloat(elements.price?.value) || 0;
        const deliveryTime = parseInt(elements.deliveryTime?.value) || 0;
        
        if (elements.previewTitle) elements.previewTitle.textContent = title;
        if (elements.previewPrice) elements.previewPrice.textContent = `$${price}`;
        if (elements.previewDelivery) elements.previewDelivery.textContent = `التسليم: ${deliveryTime} يوم`;
    }
    
    function updateSummary() {
        const categoryObj = CONFIG.CATEGORIES.find(c => c.id === state.selectedCategory);
        const price = parseFloat(elements.price?.value) || 0;
        const deliveryTime = parseInt(elements.deliveryTime?.value) || 0;
        const revisions = parseInt(elements.revisions?.value) || 0;
        
        if (elements.summaryCategory) elements.summaryCategory.textContent = categoryObj?.name || '-';
        if (elements.summaryPrice) elements.summaryPrice.textContent = `$${price}`;
        if (elements.summaryDelivery) elements.summaryDelivery.textContent = `${deliveryTime} يوم`;
        if (elements.summaryRevisions) elements.summaryRevisions.textContent = revisions;
        if (elements.summaryImages) elements.summaryImages.textContent = `${state.images.length} صور`;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Handle Submit
    // ─────────────────────────────────────────────────────────────────────────
    
    async function handleSubmit(e) {
        e.preventDefault();
        
        if (!validateStep1() || !validateStep3()) {
            Toast.error('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
            return;
        }
        
        const formData = new FormData();
        formData.append('title', elements.title?.value.trim());
        formData.append('category', state.selectedCategory);
        formData.append('description', elements.description?.value.trim());
        formData.append('price', elements.price?.value);
        formData.append('deliveryTime', elements.deliveryTime?.value);
        formData.append('revisions', elements.revisions?.value || 1);
        formData.append('requirements', elements.requirements?.value.trim() || '');
        
        if (state.tags.length > 0) {
            formData.append('tags', JSON.stringify(state.tags));
        }
        
        // Add images
        state.images.forEach((img, index) => {
            formData.append('images', img.file);
        });
        
        Loader.buttonStart(elements.submitBtn);
        
        try {
            const token = Auth.getToken();
            if (!token) {
                Toast.error('خطأ', 'يجب تسجيل الدخول أولاً');
                window.location.href = CONFIG.ROUTES.LOGIN;
                return;
            }
            
            const response = await fetch('/api/services', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'فشل نشر الخدمة');
            }
            
            Toast.success('تم بنجاح!', 'تم نشر خدمتك بنجاح');
            showAlert('success', 'تم نشر الخدمة بنجاح! جاري التحويل...');
            
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
    // UI Helpers
    // ─────────────────────────────────────────────────────────────────────────
    
    function showError(field, message) {
        const errorEl = document.getElementById(`${field}Error`);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
        }
    }
    
    function clearError(field) {
        const errorEl = document.getElementById(`${field}Error`);
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.add('hidden');
        }
    }
    
    function clearAllErrors() {
        ['title', 'category', 'description', 'price', 'deliveryTime', 'image'].forEach(clearError);
    }
    
    function showAlert(type, message) {
        if (!elements.formAlert) return;
        
        const bgColor = type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800';
        elements.formAlert.className = `p-4 rounded-xl border ${bgColor}`;
        elements.formAlert.textContent = message;
        elements.formAlert.classList.remove('hidden');
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
