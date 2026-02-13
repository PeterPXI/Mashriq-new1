/* ========================================
   Mashriq (مشرق) - Email Service
   ========================================
   
   PURPOSE:
   Handles all outgoing emails from the platform:
   - Email verification codes
   - Password reset codes
   - Welcome emails
   
   CONFIGURATION:
   - Production: Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env
   - Development: Auto-creates a free Ethereal test account
     → View sent emails at the URL printed in the console
   
   Supports Gmail, SendGrid, Mailgun, or any SMTP provider.
   ======================================== */

const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.isConfigured = false;
        this._initPromise = this._init();
    }

    /**
     * Initialize the email transporter.
     * In development, auto-creates an Ethereal test account.
     * In production, uses configured SMTP.
     */
    async _init() {
        const host = process.env.EMAIL_HOST;
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;

        // If SMTP is configured, use it
        if (host && user && pass) {
            try {
                const port = parseInt(process.env.EMAIL_PORT) || 587;
                this.transporter = nodemailer.createTransport({
                    host,
                    port,
                    secure: port === 465,
                    auth: { user, pass },
                });
                this.isConfigured = true;
                console.log(`✅ Email service configured (SMTP: ${host})`);
                return;
            } catch (err) {
                console.error('❌ Email service SMTP configuration failed:', err.message);
            }
        }

        // No SMTP configured → create Ethereal test account (free, instant)
        try {
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            this.isConfigured = true;
            this._isEthereal = true;
            console.log('─────────────────────────────────────────────');
            console.log('📧 Email Service: Using Ethereal test account');
            console.log(`   User: ${testAccount.user}`);
            console.log(`   Pass: ${testAccount.pass}`);
            console.log('   👉 View sent emails at: https://ethereal.email/login');
            console.log('─────────────────────────────────────────────');
        } catch (err) {
            console.error('❌ Failed to create Ethereal test account:', err.message);
            console.warn('⚠️  Emails will be logged to console only.');
        }
    }

    /**
     * Ensure initialization is complete before sending.
     */
    async _ensureReady() {
        await this._initPromise;
    }

    /**
     * Get the sender address.
     */
    _getFrom() {
        return process.env.EMAIL_FROM || `مشرق Mashriq <${process.env.EMAIL_USER || 'noreply@mashriq.com'}>`;
    }

    /**
     * Send an email.
     * @param {Object} options - { to, subject, html }
     * @returns {Promise<{sent: boolean, previewUrl?: string}>}
     */
    async _send({ to, subject, html }) {
        await this._ensureReady();

        if (!this.isConfigured || !this.transporter) {
            console.log('────────────────────────────────────────');
            console.log(`📧 EMAIL (console only - transporter not available)`);
            console.log(`   To: ${to}`);
            console.log(`   Subject: ${subject}`);
            console.log('────────────────────────────────────────');
            return { sent: false };
        }

        try {
            const info = await this.transporter.sendMail({
                from: this._getFrom(),
                to,
                subject,
                html,
            });

            // If using Ethereal, show the preview URL
            if (this._isEthereal) {
                const previewUrl = nodemailer.getTestMessageUrl(info);
                console.log(`📧 Email sent to ${to} → Preview: ${previewUrl}`);
                return { sent: true, previewUrl };
            }

            console.log(`📧 Email sent to ${to}: ${subject}`);
            return { sent: true };
        } catch (err) {
            console.error(`❌ Failed to send email to ${to}:`, err.message);
            return { sent: false };
        }
    }

    /**
     * Send a password reset code email.
     */
    async sendPasswordResetCode(email, code, fullName = '') {
        const greeting = fullName ? `مرحباً ${fullName}` : 'مرحباً';

        if (process.env.NODE_ENV !== 'production') {
            console.log(`🔐 Password reset code for ${email}: ${code}`);
        }

        return this._send({
            to: email,
            subject: 'إعادة تعيين كلمة المرور - مشرق',
            html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
        <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">مشرق</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">إعادة تعيين كلمة المرور</p>
        </div>
        <div style="padding: 32px 24px;">
            <p style="color: #334155; font-size: 16px; margin: 0 0 16px;">${greeting}،</p>
            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                لقد طلبت إعادة تعيين كلمة المرور. استخدم الرمز التالي:
            </p>
            <div style="background: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #ea580c; font-family: 'Courier New', monospace;">${code}</span>
            </div>
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0 0 8px;">
                ⏱️ الرمز صالح لمدة <strong>ساعة واحدة</strong> فقط.
            </p>
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
                إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة.
            </p>
        </div>
        <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} مشرق - جميع الحقوق محفوظة</p>
        </div>
    </div>
</body>
</html>`,
        });
    }

    /**
     * Send an email verification code.
     */
    async sendVerificationCode(email, code, fullName = '') {
        const greeting = fullName ? `مرحباً ${fullName}` : 'مرحباً';

        if (process.env.NODE_ENV !== 'production') {
            console.log(`📧 Verification code for ${email}: ${code}`);
        }

        return this._send({
            to: email,
            subject: 'تأكيد البريد الإلكتروني - مشرق',
            html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
        <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">مشرق</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">تأكيد البريد الإلكتروني</p>
        </div>
        <div style="padding: 32px 24px;">
            <p style="color: #334155; font-size: 16px; margin: 0 0 16px;">${greeting}،</p>
            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                شكراً لتسجيلك في مشرق! لتأكيد بريدك الإلكتروني، أدخل الرمز التالي:
            </p>
            <div style="background: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #ea580c; font-family: 'Courier New', monospace;">${code}</span>
            </div>
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
                ⏱️ الرمز صالح لمدة <strong>10 دقائق</strong> فقط.
            </p>
        </div>
        <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} مشرق - جميع الحقوق محفوظة</p>
        </div>
    </div>
</body>
</html>`,
        });
    }

    /**
     * Send a welcome email after registration.
     */
    async sendWelcomeEmail(email, fullName) {
        return this._send({
            to: email,
            subject: 'مرحباً بك في مشرق! 🎉',
            html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
        <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">مرحباً بك في مشرق! 🎉</h1>
        </div>
        <div style="padding: 32px 24px;">
            <p style="color: #334155; font-size: 16px; margin: 0 0 16px;">مرحباً ${fullName}،</p>
            <p style="color: #64748b; font-size: 14px; line-height: 1.8; margin: 0 0 24px;">
                تم إنشاء حسابك بنجاح. يمكنك الآن:
            </p>
            <ul style="color: #64748b; font-size: 14px; line-height: 2; padding-right: 20px;">
                <li>تصفح الخدمات المتاحة</li>
                <li>تفعيل وضع البائع وإضافة خدماتك</li>
                <li>التواصل مع البائعين والمشترين</li>
            </ul>
        </div>
        <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} مشرق - جميع الحقوق محفوظة</p>
        </div>
    </div>
</body>
</html>`,
        });
    }
}

// Export singleton instance
module.exports = new EmailService();
