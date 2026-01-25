/* ========================================
   Mashriq (مشرق) - Auth Routes
   Password Reset & Email Verification
   ======================================== */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Generate 6-digit code
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate secure token
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// ============ FORGOT PASSWORD ============

// Request password reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return error(res, 'يرجى إدخال البريد الإلكتروني', 'MISSING_EMAIL', 400);
        }
        
        const user = await User.findOne({ email: email.toLowerCase() });
        
        // Always return success to prevent email enumeration
        if (!user) {
            return success(res, 'إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور');
        }
        
        // Generate reset token and code
        const resetToken = generateToken();
        const resetCode = generateCode();
        
        // Save to user
        user.passwordResetToken = resetCode; // Using code for simplicity
        user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();
        
        // In production, send email here
        // For now, log the code (development only)
        console.log(`🔐 Password reset code for ${email}: ${resetCode}`);
        
        return success(res, 'تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني', {
            // In development, return the code for testing
            // Remove in production!
            _devCode: process.env.NODE_ENV === 'development' ? resetCode : undefined
        });
    } catch (err) {
        console.error('Forgot password error:', err);
        return error(res, 'حدث خطأ، يرجى المحاولة مرة أخرى', 'FORGOT_PASSWORD_ERROR', 500);
    }
});

// Verify reset code
router.post('/verify-reset-code', async (req, res) => {
    try {
        const { email, code } = req.body;
        
        if (!email || !code) {
            return error(res, 'يرجى إدخال البريد الإلكتروني والرمز', 'MISSING_FIELDS', 400);
        }
        
        const user = await User.findOne({ 
            email: email.toLowerCase(),
            passwordResetToken: code,
            passwordResetExpiry: { $gt: new Date() }
        });
        
        if (!user) {
            return error(res, 'الرمز غير صحيح أو منتهي الصلاحية', 'INVALID_CODE', 400);
        }
        
        return success(res, 'الرمز صحيح', { valid: true });
    } catch (err) {
        console.error('Verify reset code error:', err);
        return error(res, 'حدث خطأ في التحقق', 'VERIFY_CODE_ERROR', 500);
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        
        if (!email || !code || !newPassword) {
            return error(res, 'جميع الحقول مطلوبة', 'MISSING_FIELDS', 400);
        }
        
        if (newPassword.length < 6) {
            return error(res, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'INVALID_PASSWORD', 400);
        }
        
        const user = await User.findOne({ 
            email: email.toLowerCase(),
            passwordResetToken: code,
            passwordResetExpiry: { $gt: new Date() }
        });
        
        if (!user) {
            return error(res, 'الرمز غير صحيح أو منتهي الصلاحية', 'INVALID_CODE', 400);
        }
        
        // Update password
        user.passwordHash = newPassword; // Will be hashed by pre-save hook
        user.passwordResetToken = null;
        user.passwordResetExpiry = null;
        await user.save();
        
        console.log(`🔑 Password reset successful for ${email}`);
        
        return success(res, 'تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول');
    } catch (err) {
        console.error('Reset password error:', err);
        return error(res, 'حدث خطأ في تغيير كلمة المرور', 'RESET_PASSWORD_ERROR', 500);
    }
});

// ============ EMAIL VERIFICATION ============

// Send verification code
router.post('/send-verification', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return error(res, 'المستخدم غير موجود', 'USER_NOT_FOUND', 404);
        }
        
        if (user.isEmailVerified) {
            return error(res, 'البريد الإلكتروني موثق بالفعل', 'ALREADY_VERIFIED', 400);
        }
        
        // Generate verification code
        const verificationCode = generateCode();
        
        // Save to user
        user.emailVerificationCode = verificationCode;
        user.emailVerificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();
        
        // In production, send email here
        console.log(`📧 Verification code for ${user.email}: ${verificationCode}`);
        
        return success(res, 'تم إرسال رمز التحقق إلى بريدك الإلكتروني', {
            // In development, return the code for testing
            _devCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
        });
    } catch (err) {
        console.error('Send verification error:', err);
        return error(res, 'حدث خطأ في إرسال رمز التحقق', 'SEND_VERIFICATION_ERROR', 500);
    }
});

// Verify email
router.post('/verify-email', authenticateToken, async (req, res) => {
    try {
        const { code } = req.body;
        
        if (!code) {
            return error(res, 'يرجى إدخال رمز التحقق', 'MISSING_CODE', 400);
        }
        
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return error(res, 'المستخدم غير موجود', 'USER_NOT_FOUND', 404);
        }
        
        if (user.isEmailVerified) {
            return error(res, 'البريد الإلكتروني موثق بالفعل', 'ALREADY_VERIFIED', 400);
        }
        
        // Check code
        if (user.emailVerificationCode !== code) {
            return error(res, 'رمز التحقق غير صحيح', 'INVALID_CODE', 400);
        }
        
        // Check expiry
        if (!user.emailVerificationExpiry || user.emailVerificationExpiry < new Date()) {
            return error(res, 'رمز التحقق منتهي الصلاحية', 'CODE_EXPIRED', 400);
        }
        
        // Mark as verified
        user.isEmailVerified = true;
        user.emailVerificationCode = null;
        user.emailVerificationExpiry = null;
        await user.save();
        
        console.log(`✅ Email verified for ${user.email}`);
        
        return success(res, 'تم توثيق البريد الإلكتروني بنجاح!', {
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                isEmailVerified: true
            }
        });
    } catch (err) {
        console.error('Verify email error:', err);
        return error(res, 'حدث خطأ في توثيق البريد', 'VERIFY_EMAIL_ERROR', 500);
    }
});

module.exports = router;
