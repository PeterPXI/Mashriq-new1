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
const emailService = require('../services/EmailService');

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
        
        // Generate reset code
        const resetCode = generateCode();
        
        // Save to user
        user.passwordResetToken = resetCode;
        user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        user.passwordResetAttempts = 0; // Reset attempt counter
        await user.save();
        
        // Send email
        await emailService.sendPasswordResetCode(email, resetCode, user.fullName);
        
        return success(res, 'تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
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
            passwordResetExpiry: { $gt: new Date() }
        });
        
        if (!user || !user.passwordResetToken) {
            return error(res, 'الرمز غير صحيح أو منتهي الصلاحية', 'INVALID_CODE', 400);
        }
        
        // Check brute-force attempts
        if (user.passwordResetAttempts >= 5) {
            // Invalidate the code after too many attempts
            user.passwordResetToken = null;
            user.passwordResetExpiry = null;
            user.passwordResetAttempts = 0;
            await user.save();
            return error(res, 'تم تجاوز عدد المحاولات المسموحة. يرجى طلب رمز جديد.', 'TOO_MANY_ATTEMPTS', 429);
        }
        
        // Verify code
        if (user.passwordResetToken !== code) {
            user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
            await user.save();
            const remaining = 5 - user.passwordResetAttempts;
            return error(res, `الرمز غير صحيح. لديك ${remaining} محاولات متبقية.`, 'INVALID_CODE', 400);
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
        
        if (newPassword.length < 8) {
            return error(res, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'INVALID_PASSWORD', 400);
        }
        
        // Require at least one letter and one number
        if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            return error(res, 'كلمة المرور يجب أن تحتوي على أحرف وأرقام', 'WEAK_PASSWORD', 400);
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
        user.passwordResetAttempts = 0;
        await user.save();
        
        console.log(`🔑 Password reset successful for user ID: ${user._id}`);
        
        return success(res, 'تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول');
    } catch (err) {
        console.error('Reset password error:', err);
        return error(res, 'حدث خطأ في تغيير كلمة المرور', 'RESET_PASSWORD_ERROR', 500);
    }
});

// ============ EMAIL VERIFICATION (DISABLED) ============
// Email verification has been removed. All new users are auto-verified.

// ============ GOOGLE OAUTH ============

const passport = require('passport');
const jwt = require('jsonwebtoken');

// JWT_SECRET must be set - no weak fallback
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'CHANGE_THIS_TO_A_LONG_RANDOM_SECRET' || JWT_SECRET.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET is not set or too weak. Set a strong secret (32+ chars) in .env');
}

// Initiate Google OAuth
router.get('/google', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
        return error(res, 'Google OAuth غير مُفعّل', 'GOOGLE_NOT_CONFIGURED', 501);
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// Google OAuth callback
router.get('/google/callback', 
    (req, res, next) => {
        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.redirect('/app/login.html?error=google_not_configured');
        }
        passport.authenticate('google', { 
            session: false,
            failureRedirect: '/app/login.html?error=google_auth_failed' 
        })(req, res, next);
    },
    (req, res) => {
        try {
            // Generate JWT token - consistent payload with server.js register/login
            const token = jwt.sign(
                {
                    id: req.user._id,
                    email: req.user.email,
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            // Store user data for frontend
            const userData = {
                id: req.user._id,
                email: req.user.email,
                fullName: req.user.fullName,
                username: req.user.username,
                role: req.user.role,
                avatarUrl: req.user.avatarUrl,
                isEmailVerified: req.user.isEmailVerified
            };
            
            // Redirect to frontend with token
            const encodedUser = encodeURIComponent(JSON.stringify(userData));
            res.redirect(`/app/oauth-callback.html?token=${token}&user=${encodedUser}`);
            
        } catch (err) {
            console.error('Google callback error:', err);
            res.redirect('/app/login.html?error=token_generation_failed');
        }
    }
);

module.exports = router;
