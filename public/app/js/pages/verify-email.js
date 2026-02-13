/**
 * MASHRIQ - Email Verification Page
 */

(function() {
    'use strict';
    
    const elements = {
        alreadyVerified: document.getElementById('alreadyVerified'),
        verificationForm: document.getElementById('verificationForm'),
        successSection: document.getElementById('successSection'),
        sendCodeSection: document.getElementById('sendCodeSection'),
        enterCodeSection: document.getElementById('enterCodeSection'),
        sendCodeBtn: document.getElementById('sendCodeBtn'),
        codeForm: document.getElementById('codeForm'),
        code: document.getElementById('code'),
        verifyBtn: document.getElementById('verifyBtn'),
        resendBtn: document.getElementById('resendBtn'),
        userEmail: document.getElementById('userEmail'),
        codeError: document.getElementById('codeError'),
        alert: document.getElementById('alert')
    };
    
    async function init() {
        // Check if logged in
        if (!Auth.isAuthenticated()) {
            window.location.href = CONFIG.ROUTES.LOGIN;
            return;
        }
        
        const user = Auth.getUser();
        
        // Check if already verified
        if (user?.isEmailVerified) {
            elements.verificationForm.classList.add('hidden');
            elements.alreadyVerified.classList.remove('hidden');
            return;
        }
        
        // Show email
        if (elements.userEmail) {
            elements.userEmail.textContent = user?.email || '';
        }
        
        // If user just registered, code was already sent → show code input directly
        const cameFromRegistration = document.referrer.includes('register');
        if (cameFromRegistration || sessionStorage.getItem('verification_code_sent')) {
            elements.sendCodeSection?.classList.add('hidden');
            elements.enterCodeSection?.classList.remove('hidden');
            sessionStorage.setItem('verification_code_sent', 'true');
        }
        
        // Bind events
        elements.sendCodeBtn?.addEventListener('click', handleSendCode);
        elements.codeForm?.addEventListener('submit', handleVerify);
        elements.resendBtn?.addEventListener('click', handleSendCode);
        
        // Auto-format code
        elements.code?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
        });
    }
    
    async function handleSendCode() {
        const btn = elements.sendCodeBtn;
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'جاري الإرسال...';
        
        try {
            const response = await API.post('/auth/send-verification');
            
            if (!response.success) {
                throw new Error(response.message);
            }
            
            // Show code input
            elements.sendCodeSection.classList.add('hidden');
            elements.enterCodeSection.classList.remove('hidden');
            sessionStorage.setItem('verification_code_sent', 'true');
            
            Toast.success('تم الإرسال', 'تحقق من بريدك الإلكتروني');
            
        } catch (err) {
            showAlert('error', err.message || 'حدث خطأ في إرسال الرمز');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
    
    async function handleVerify(e) {
        e.preventDefault();
        
        const code = elements.code?.value.trim();
        
        if (!code || code.length !== 6) {
            showError('codeError', 'يرجى إدخال رمز التحقق المكون من 6 أرقام');
            return;
        }
        
        const btn = elements.verifyBtn;
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'جاري التحقق...';
        
        try {
            const response = await API.post('/auth/verify-email', { code });
            
            if (!response.success) {
                throw new Error(response.message);
            }
            
            // Update local user data
            if (response.data?.user) {
                Auth.setUser({ ...Auth.getUser(), isEmailVerified: true });
            }
            
            // Show success
            elements.verificationForm.classList.add('hidden');
            elements.successSection.classList.remove('hidden');
            
            Toast.success('تم بنجاح', 'تم توثيق بريدك الإلكتروني');
            
        } catch (err) {
            showError('codeError', err.message || 'الرمز غير صحيح');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
    
    function showError(field, message) {
        const el = elements[field];
        if (el) {
            el.textContent = message;
            el.classList.remove('hidden');
        }
    }
    
    function showAlert(type, message) {
        if (!elements.alert) return;
        const bgColor = type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200';
        elements.alert.className = `mt-4 p-4 rounded-xl text-sm ${bgColor}`;
        elements.alert.textContent = message;
        elements.alert.classList.remove('hidden');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
