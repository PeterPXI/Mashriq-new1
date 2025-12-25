/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ REGISTER PAGE
 * منصة مشرق - صفحة إنشاء الحساب
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // DOM Elements
    // ─────────────────────────────────────────────────────────────────────────
    
    const elements = {
        form: document.getElementById('registerForm'),
        fullName: document.getElementById('fullName'),
        username: document.getElementById('username'),
        email: document.getElementById('email'),
        password: document.getElementById('password'),
        confirmPassword: document.getElementById('confirmPassword'),
        terms: document.getElementById('terms'),
        submitBtn: document.getElementById('submitBtn'),
        passwordToggle: document.getElementById('passwordToggle'),
        passwordStrength: document.getElementById('passwordStrength'),
        authAlert: document.getElementById('authAlert'),
        fullNameError: document.getElementById('fullNameError'),
        usernameError: document.getElementById('usernameError'),
        emailError: document.getElementById('emailError'),
        passwordError: document.getElementById('passwordError'),
        confirmPasswordError: document.getElementById('confirmPasswordError'),
        termsError: document.getElementById('termsError'),
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // Initialize
    // ─────────────────────────────────────────────────────────────────────────
    
    function init() {
        // Redirect if already logged in
        if (Auth.redirectIfAuthenticated()) {
            return;
        }
        
        // Bind events
        bindEvents();
        
        // Focus on first input
        elements.fullName?.focus();
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Bind Events
    // ─────────────────────────────────────────────────────────────────────────
    
    function bindEvents() {
        // Form submit
        elements.form?.addEventListener('submit', handleSubmit);
        
        // Password toggle
        elements.passwordToggle?.addEventListener('click', togglePassword);
        
        // Password strength
        elements.password?.addEventListener('input', updatePasswordStrength);
        
        // Clear errors on input
        elements.fullName?.addEventListener('input', () => clearError('fullName'));
        elements.username?.addEventListener('input', () => clearError('username'));
        elements.email?.addEventListener('input', () => clearError('email'));
        elements.password?.addEventListener('input', () => clearError('password'));
        elements.confirmPassword?.addEventListener('input', () => clearError('confirmPassword'));
        elements.terms?.addEventListener('change', () => clearError('terms'));
        
        // Username formatting (lowercase, no spaces)
        elements.username?.addEventListener('input', (e) => {
            e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
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
        const fullName = elements.fullName?.value.trim();
        const username = elements.username?.value.trim();
        const email = elements.email?.value.trim();
        const password = elements.password?.value;
        const confirmPassword = elements.confirmPassword?.value;
        const termsAccepted = elements.terms?.checked;
        
        // Validate
        if (!validateForm(fullName, username, email, password, confirmPassword, termsAccepted)) {
            return;
        }
        
        // Show loading
        Loader.buttonStart(elements.submitBtn);
        
        try {
            // Call API
            const response = await API.auth.register({
                fullName,
                username,
                email,
                password,
                role: document.querySelector('input[name="role"]:checked')?.value || 'buyer'
            });
            
            // Show success
            showAlert('success', response.message || 'تم إنشاء الحساب بنجاح! جاري التحويل لصفحة تسجيل الدخول...');
            Toast.success('مبروك!', 'تم إنشاء حسابك بنجاح');
            
            // Redirect to login after short delay
            setTimeout(() => {
                window.location.href = CONFIG.ROUTES.LOGIN;
            }, 2000);
            
        } catch (error) {
            console.error('Registration error:', error);
            
            // Show error
            showAlert('error', error.message || 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.');
            
            // Handle specific errors
            if (error.message?.includes('البريد') || error.message?.includes('email')) {
                showError('email', error.message);
                elements.email?.focus();
            } else if (error.message?.includes('اسم المستخدم') || error.message?.includes('username')) {
                showError('username', error.message);
                elements.username?.focus();
            }
            
        } finally {
            Loader.buttonStop(elements.submitBtn);
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Validation
    // ─────────────────────────────────────────────────────────────────────────
    
    function validateForm(fullName, username, email, password, confirmPassword, termsAccepted) {
        let isValid = true;
        
        // Full name validation
        if (!fullName) {
            showError('fullName', 'الاسم الكامل مطلوب');
            isValid = false;
        } else if (fullName.length < 3) {
            showError('fullName', 'الاسم يجب أن يكون 3 أحرف على الأقل');
            isValid = false;
        }
        
        // Username validation
        if (!username) {
            showError('username', 'اسم المستخدم مطلوب');
            isValid = false;
        } else if (!Utils.isValidUsername(username)) {
            showError('username', 'اسم المستخدم يجب أن يكون 3-20 حرف بالإنجليزية');
            isValid = false;
        }
        
        // Email validation
        if (!email) {
            showError('email', 'البريد الإلكتروني مطلوب');
            isValid = false;
        } else if (!Utils.isValidEmail(email)) {
            showError('email', 'البريد الإلكتروني غير صالح');
            isValid = false;
        }
        
        // Password validation
        if (!password) {
            showError('password', 'كلمة المرور مطلوبة');
            isValid = false;
        } else if (password.length < 6) {
            showError('password', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            isValid = false;
        }
        
        // Confirm password validation
        if (!confirmPassword) {
            showError('confirmPassword', 'تأكيد كلمة المرور مطلوب');
            isValid = false;
        } else if (password !== confirmPassword) {
            showError('confirmPassword', 'كلمتا المرور غير متطابقتين');
            isValid = false;
        }
        
        // Terms validation
        if (!termsAccepted) {
            showError('terms', 'يجب الموافقة على شروط الاستخدام');
            isValid = false;
        }
        
        return isValid;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Password Strength
    // ─────────────────────────────────────────────────────────────────────────
    
    function updatePasswordStrength() {
        const password = elements.password?.value || '';
        const strengthEl = elements.passwordStrength;
        
        if (!strengthEl) return;
        
        const strength = calculatePasswordStrength(password);
        
        // Remove all classes
        strengthEl.classList.remove('weak', 'fair', 'good', 'strong');
        
        if (password.length === 0) {
            strengthEl.querySelector('.strength-text').textContent = '';
            strengthEl.querySelector('.strength-bar span').style.width = '0';
            return;
        }
        
        // Add appropriate class and text
        if (strength <= 1) {
            strengthEl.classList.add('weak');
            strengthEl.querySelector('.strength-text').textContent = 'ضعيفة';
        } else if (strength <= 2) {
            strengthEl.classList.add('fair');
            strengthEl.querySelector('.strength-text').textContent = 'متوسطة';
        } else if (strength <= 3) {
            strengthEl.classList.add('good');
            strengthEl.querySelector('.strength-text').textContent = 'جيدة';
        } else {
            strengthEl.classList.add('strong');
            strengthEl.querySelector('.strength-text').textContent = 'قوية';
        }
    }
    
    function calculatePasswordStrength(password) {
        let strength = 0;
        
        // Length checks
        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        
        // Contains lowercase
        if (/[a-z]/.test(password)) strength++;
        
        // Contains uppercase
        if (/[A-Z]/.test(password)) strength++;
        
        // Contains number
        if (/[0-9]/.test(password)) strength++;
        
        // Contains special character
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        
        return Math.min(strength, 4);
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // UI Helpers
    // ─────────────────────────────────────────────────────────────────────────
    
    function togglePassword() {
        const isPassword = elements.password?.type === 'password';
        elements.password.type = isPassword ? 'text' : 'password';
        
        const eyeOpen = elements.passwordToggle?.querySelector('.eye-open');
        const eyeClosed = elements.passwordToggle?.querySelector('.eye-closed');
        
        if (eyeOpen && eyeClosed) {
            eyeOpen.style.display = isPassword ? 'none' : 'block';
            eyeClosed.style.display = isPassword ? 'block' : 'none';
        }
    }
    
    function showError(field, message) {
        const errorEl = elements[`${field}Error`];
        const inputEl = elements[field];
        
        if (errorEl) {
            errorEl.textContent = message;
        }
        if (inputEl && inputEl.type !== 'checkbox') {
            inputEl.classList.add('is-error');
        }
    }
    
    function clearError(field) {
        const errorEl = elements[`${field}Error`];
        const inputEl = elements[field];
        
        if (errorEl) {
            errorEl.textContent = '';
        }
        if (inputEl && inputEl.type !== 'checkbox') {
            inputEl.classList.remove('is-error');
        }
    }
    
    function clearAllErrors() {
        ['fullName', 'username', 'email', 'password', 'confirmPassword', 'terms'].forEach(clearError);
    }
    
    function showAlert(type, message) {
        if (!elements.authAlert) return;
        
        elements.authAlert.className = `auth-alert alert-${type}`;
        elements.authAlert.textContent = message;
        elements.authAlert.style.display = 'block';
    }
    
    function hideAlert() {
        if (!elements.authAlert) return;
        elements.authAlert.style.display = 'none';
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
