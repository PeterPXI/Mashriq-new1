(function() {
    'use strict';
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        profileForm: document.getElementById('profileForm'),
        fullName: document.getElementById('fullName'),
        username: document.getElementById('username'),
        email: document.getElementById('email'),
        bio: document.getElementById('bio'),
        avatarUrl: document.getElementById('avatarUrl'),
        avatarFile: document.getElementById('avatarFile'),
        avatarImg: document.getElementById('avatarImg'),
        avatarInitials: document.getElementById('avatarInitials'),
        sellerSection: document.getElementById('sellerSection'),
        sellerNotActivated: document.getElementById('sellerNotActivated'),
        sellerActivated: document.getElementById('sellerActivated'),
        activateSellerBtn: document.getElementById('activateSellerBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
    };
    
    async function init() {
        if (!Auth.requireAuth()) return;
        
        Navbar.render(elements.navbar);
        Footer.render(elements.footer);
        
        await loadUserData();
        bindEvents();
    }
    
    async function loadUserData() {
        try {
            const response = await API.get(CONFIG.ENDPOINTS.ME);
            if (response.success && response.data?.user) {
                const user = response.data.user;
                try {
                    populateForm(user);
                } catch (formErr) {
                    console.warn('Non-critical error populating form:', formErr);
                }
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
            // Only show toast if it's actually a network/API error
            if (error?.message) {
                Toast.error('خطأ', 'تعذر تحميل البيانات');
            }
        }
    }
    
    function populateForm(user) {
        elements.fullName.value = user.fullName || '';
        elements.username.value = user.username || '';
        elements.email.value = user.email || '';
        elements.bio.value = user.bio || '';
        elements.avatarUrl.value = user.avatar || '';
        
        updateAvatarPreview(user.avatar, user.fullName);
        
        elements.sellerSection.classList.remove('hidden');
        if (user.isSeller || user.role === 'seller') {
            elements.sellerNotActivated.classList.add('hidden');
            elements.sellerActivated.classList.remove('hidden');
        } else {
            elements.sellerNotActivated.classList.remove('hidden');
            elements.sellerActivated.classList.add('hidden');
        }
    }
    
    function updateAvatarPreview(avatarUrl, name) {
        if (avatarUrl) {
            elements.avatarImg.src = avatarUrl;
            elements.avatarImg.classList.remove('hidden');
            elements.avatarInitials.classList.add('hidden');
        } else {
            elements.avatarImg.classList.add('hidden');
            elements.avatarInitials.classList.remove('hidden');
            elements.avatarInitials.textContent = Utils.getInitials(name || 'م');
        }
    }
    
    function bindEvents() {
        elements.profileForm?.addEventListener('submit', handleProfileSubmit);
        elements.avatarUrl?.addEventListener('input', () => {
            updateAvatarPreview(elements.avatarUrl.value, elements.fullName.value);
        });
        elements.avatarFile?.addEventListener('change', handleAvatarUpload);
        elements.activateSellerBtn?.addEventListener('click', handleActivateSeller);
        elements.logoutBtn?.addEventListener('click', handleLogout);
    }
    
    async function handleAvatarUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            Toast.error('خطأ', 'يرجى اختيار صورة صالحة');
            return;
        }
        
        if (file.size > 2 * 1024 * 1024) {
            Toast.error('خطأ', 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
            return;
        }
        
        const formData = new FormData();
        formData.append('avatar', file);
        
        try {
            Toast.info('جاري الرفع', 'يتم رفع الصورة...');
            
            const token = Auth.getToken();
            const response = await fetch(CONFIG.API_BASE + CONFIG.ENDPOINTS.UPLOAD_AVATAR, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                Toast.success('تم', 'تم تحديث الصورة بنجاح');
                
                if (data.data?.avatarUrl) {
                    elements.avatarUrl.value = data.data.avatarUrl;
                    updateAvatarPreview(data.data.avatarUrl, elements.fullName.value);
                }
                
                if (data.data?.user) {
                    Auth.setUser(data.data.user);
                }
            } else {
                Toast.error('خطأ', data.message || 'فشل رفع الصورة');
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            Toast.error('خطأ', 'حدث خطأ أثناء رفع الصورة');
        }
        
        e.target.value = '';
    }
    
    async function handleProfileSubmit(e) {
        e.preventDefault();
        
        const submitBtn = elements.profileForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري الحفظ...';
        
        try {
            const userData = {
                fullName: elements.fullName.value.trim(),
                username: elements.username.value.trim(),
                bio: elements.bio.value.trim(),
                avatar: elements.avatarUrl.value.trim(),
            };
            
            const response = await API.put(CONFIG.ENDPOINTS.PROFILE, userData);
            
            if (response.success) {
                Toast.success('تم الحفظ', 'تم تحديث بياناتك بنجاح');
                if (response.data?.user) {
                    Auth.setUser(response.data.user);
                }
            } else {
                Toast.error('خطأ', response.message || 'فشل تحديث البيانات');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            Toast.error('خطأ', error.message || 'حدث خطأ أثناء الحفظ');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
    
    async function handleActivateSeller() {
        const btn = elements.activateSellerBtn;
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'جاري التفعيل...';
        
        try {
            const response = await API.post(CONFIG.ENDPOINTS.ACTIVATE_SELLER);
            
            if (response.success) {
                Toast.success('تم التفعيل', 'أصبحت الآن بائعاً! يمكنك إضافة خدماتك');
                elements.sellerNotActivated.classList.add('hidden');
                elements.sellerActivated.classList.remove('hidden');
                if (response.data?.user) {
                    Auth.setUser(response.data.user);
                }
            } else {
                Toast.error('خطأ', response.message || 'فشل تفعيل وضع البائع');
            }
        } catch (error) {
            console.error('Activate seller error:', error);
            Toast.error('خطأ', error.message || 'حدث خطأ');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
    
    function handleLogout() {
        Auth.logout();
        window.location.href = CONFIG.ROUTES.HOME;
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
