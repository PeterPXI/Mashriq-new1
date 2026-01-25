/**
 * MASHRIQ - Forgot Password Page
 */

(function() {
    'use strict';
    
    let userEmail = '';
    
    const elements = {
        step1: document.getElementById('step1'),
        step2: document.getElementById('step2'),
        step3: document.getElementById('step3'),
        emailForm: document.getElementById('emailForm'),
        codeForm: document.getElementById('codeForm'),
        email: document.getElementById('email'),
        code: document.getElementById('code'),
        newPassword: document.getElementById('newPassword'),
        confirmPassword: document.getElementById('confirmPassword'),
        sentEmail: document.getElementById('sentEmail'),
        sendCodeBtn: document.getElementById('sendCodeBtn'),
        resetBtn: document.getElementById('resetBtn'),
        resendBtn: document.getElementById('resendBtn'),
        alert: document.getElementById('alert'),
        emailError: document.getElementById('emailError'),
        codeError: document.getElementById('codeError'),
        passwordError: document.getElementById('passwordError')
    };
    
    function init() {
        elements.emailForm?.addEventListener('submit', handleSendCode);
        elements.codeForm?.addEventListener('submit', handleResetPassword);
        elements.resendBtn?.addEventListener('click', handleResend);
        
        // Auto-format code input
        elements.code?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
        });
    }
    
    async function handleSendCode(e) {
        e.preventDefault();
        
        const email = elements.email?.value.trim();
        if (!email) {
            showError('emailError', 'يرجى إدخال البريد الإلكتروني');
            return;
        }
        
        userEmail = email;
        Loader.buttonStart(elements.sendCodeBtn);
        
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message);
            }
            
            // Show step 2
            elements.step1.classList.add('hidden');
            elements.step2.classList.remove('hidden');
            elements.sentEmail.textContent = email;
            
            Toast.success('تم الإرسال', 'تحقق من بريدك الإلكتروني');
            
        } catch (err) {
            showAlert('error', err.message || 'حدث خطأ، يرجى المحاولة مرة أخرى');
        } finally {
            Loader.buttonStop(elements.sendCodeBtn);
        }
    }
    
    async function handleResetPassword(e) {
        e.preventDefault();
        
        const code = elements.code?.value.trim();
        const newPassword = elements.newPassword?.value;
        const confirmPassword = elements.confirmPassword?.value;
        
        if (!code || code.length !== 6) {
            showError('codeError', 'يرجى إدخال رمز التحقق المكون من 6 أرقام');
            return;
        }
        
        if (newPassword.length < 6) {
            showError('passwordError', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showError('passwordError', 'كلمتا المرور غير متطابقتين');
            return;
        }
        
        Loader.buttonStart(elements.resetBtn);
        
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: userEmail, 
                    code, 
                    newPassword 
                })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message);
            }
            
            // Show success
            elements.step2.classList.add('hidden');
            elements.step3.classList.remove('hidden');
            
            Toast.success('تم بنجاح', 'تم تغيير كلمة المرور');
            
        } catch (err) {
            showError('codeError', err.message || 'الرمز غير صحيح');
        } finally {
            Loader.buttonStop(elements.resetBtn);
        }
    }
    
    async function handleResend() {
        if (!userEmail) return;
        
        try {
            await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });
            
            Toast.success('تم الإرسال', 'تم إرسال رمز جديد');
        } catch (err) {
            Toast.error('خطأ', 'فشل إعادة الإرسال');
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
