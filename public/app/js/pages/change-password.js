(function() {
    'use strict';
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        passwordForm: document.getElementById('passwordForm'),
        currentPassword: document.getElementById('currentPassword'),
        newPassword: document.getElementById('newPassword'),
        confirmPassword: document.getElementById('confirmPassword'),
        passwordError: document.getElementById('passwordError'),
    };
    
    function init() {
        if (!Auth.requireAuth()) return;
        
        Navbar.render(elements.navbar);
        Footer.render(elements.footer);
        
        bindEvents();
    }
    
    function bindEvents() {
        elements.passwordForm?.addEventListener('submit', handleSubmit);
        
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', function() {
                const input = this.parentElement.querySelector('input');
                input.type = input.type === 'password' ? 'text' : 'password';
            });
        });
    }
    
    async function handleSubmit(e) {
        e.preventDefault();
        
        elements.passwordError.classList.add('hidden');
        
        const currentPassword = elements.currentPassword.value;
        const newPassword = elements.newPassword.value;
        const confirmPassword = elements.confirmPassword.value;
        
        if (newPassword !== confirmPassword) {
            showError('كلمتا المرور غير متطابقتين');
            return;
        }
        
        if (newPassword.length < 6) {
            showError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }
        
        const submitBtn = elements.passwordForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري التغيير...';
        
        try {
            const response = await API.put(CONFIG.ENDPOINTS.PASSWORD, {
                currentPassword,
                newPassword
            });
            
            if (response.success) {
                Toast.success('تم التغيير', 'تم تغيير كلمة المرور بنجاح');
                setTimeout(() => {
                    window.location.href = '/app/settings.html';
                }, 1500);
            } else {
                showError(response.message || 'فشل تغيير كلمة المرور');
            }
        } catch (error) {
            console.error('Password change error:', error);
            showError(error.message || 'حدث خطأ أثناء تغيير كلمة المرور');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
    
    function showError(message) {
        elements.passwordError.textContent = message;
        elements.passwordError.classList.remove('hidden');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
