/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ LOGIN PAGE
 * منصة مشرق - صفحة تسجيل الدخول
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // DOM Elements
    // ─────────────────────────────────────────────────────────────────────────
    
    const elements = {
        form: document.getElementById('loginForm'),
        email: document.getElementById('email'),
        password: document.getElementById('password'),
        remember: document.getElementById('remember'),
        submitBtn: document.getElementById('submitBtn'),
        passwordToggle: document.getElementById('passwordToggle'),
        authAlert: document.getElementById('authAlert'),
        emailError: document.getElementById('emailError'),
        passwordError: document.getElementById('passwordError'),
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
        
        // Focus on email input
        elements.email?.focus();
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Bind Events
    // ─────────────────────────────────────────────────────────────────────────
    
    function bindEvents() {
        // Form submit
        elements.form?.addEventListener('submit', handleSubmit);
        
        // Password toggle
        elements.passwordToggle?.addEventListener('click', togglePassword);
        
        // Clear errors on input
        elements.email?.addEventListener('input', () => clearError('email'));
        elements.password?.addEventListener('input', () => clearError('password'));
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
        const email = elements.email?.value.trim();
        const password = elements.password?.value;
        
        // Validate
        if (!validateForm(email, password)) {
            return;
        }
        
        // Show loading
        Loader.buttonStart(elements.submitBtn);
        
        try {
            // Call API
            const response = await API.auth.login(email, password);
            
            // Show success
            showAlert('success', response.message || 'تم تسجيل الدخول بنجاح! جاري التحويل...');
            Toast.success('مرحباً بك!', response.message);
            
            // Redirect after short delay
            setTimeout(() => {
                const redirectTo = sessionStorage.getItem('redirect_after_login') || Auth.getDashboardUrl();
                sessionStorage.removeItem('redirect_after_login');
                window.location.href = redirectTo;
            }, 1000);
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Show error
            showAlert('error', error.message || 'فشل تسجيل الدخول. يرجى التحقق من بياناتك.');
            
            // Focus on email for retry
            elements.email?.focus();
            
        } finally {
            Loader.buttonStop(elements.submitBtn);
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Validation
    // ─────────────────────────────────────────────────────────────────────────
    
    function validateForm(email, password) {
        let isValid = true;
        
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
        
        return isValid;
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
        if (inputEl) {
            inputEl.classList.add('is-error');
        }
    }
    
    function clearError(field) {
        const errorEl = elements[`${field}Error`];
        const inputEl = elements[field];
        
        if (errorEl) {
            errorEl.textContent = '';
        }
        if (inputEl) {
            inputEl.classList.remove('is-error');
        }
    }
    
    function clearAllErrors() {
        clearError('email');
        clearError('password');
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
