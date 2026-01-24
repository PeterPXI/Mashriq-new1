/* ========================================
   Mashriq (مشرق) - Stripe Payment Routes
   ========================================
   
   PURPOSE:
   Handle Stripe payment processing for wallet top-ups.
   Integrates with EscrowService for balance management.
   
   SECURITY:
   - Webhook signature verification for payment confirmation
   - Persistent Payment model for idempotency
   - Server-side session verification
   
   ======================================== */

const express = require('express');
const router = express.Router();
const { getStripeClient, getStripePublishableKey, getStripeSecretKey } = require('../services/stripeClient');
const EscrowService = require('../services/EscrowService');
const Payment = require('../models/Payment');
const { PAYMENT_STATUSES } = require('../models/Payment');
const { success, error } = require('../utils/apiResponse');
const { authenticateToken } = require('../middlewares/authMiddleware');

// ============================================================
// GET STRIPE PUBLISHABLE KEY
// Client needs this to initialize Stripe.js
// ============================================================
router.get('/config', async (req, res) => {
    try {
        const publishableKey = await getStripePublishableKey();
        return success(res, 'تم جلب إعدادات Stripe', { publishableKey });
    } catch (err) {
        console.error('Stripe config error:', err);
        return error(res, 'حدث خطأ في جلب إعدادات الدفع', 'STRIPE_CONFIG_ERROR', 500);
    }
});

// ============================================================
// CREATE CHECKOUT SESSION
// Creates a Stripe Checkout Session for wallet top-up
// ============================================================
router.post('/create-checkout', authenticateToken, async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.id;
        
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount < 5 || numAmount > 1000) {
            return error(res, 'المبلغ يجب أن يكون بين 5 و 1000 دولار', 'INVALID_AMOUNT', 400);
        }
        
        const stripe = await getStripeClient();
        
        const baseUrl = process.env.REPLIT_DOMAINS 
            ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
            : `http://localhost:${process.env.PORT || 5000}`;
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'شحن رصيد مشرق',
                        description: `إضافة ${numAmount} دولار إلى محفظتك`,
                    },
                    unit_amount: Math.round(numAmount * 100),
                },
                quantity: 1,
            }],
            metadata: {
                userId: userId.toString(),
                type: 'wallet_topup',
                amount: numAmount.toString()
            },
            success_url: `${baseUrl}/app/wallet.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/app/wallet.html?payment=cancelled`,
        });
        
        await Payment.create({
            stripeSessionId: session.id,
            userId: userId,
            amount: numAmount,
            currency: 'usd',
            status: PAYMENT_STATUSES.PENDING,
            metadata: { type: 'wallet_topup' }
        });
        
        console.log(`💳 Checkout session created: ${session.id} for user ${userId}, amount: $${numAmount}`);
        
        return success(res, 'تم إنشاء جلسة الدفع', {
            sessionId: session.id,
            url: session.url
        });
        
    } catch (err) {
        console.error('Create checkout error:', err);
        return error(res, 'حدث خطأ في إنشاء جلسة الدفع', 'CHECKOUT_ERROR', 500);
    }
});

// ============================================================
// STRIPE WEBHOOK HANDLER
// Handles Stripe events with signature verification
// Exported separately to be mounted before express.json()
// ============================================================
async function handleWebhook(req, res) {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!signature) {
        console.error('Webhook: Missing stripe-signature header');
        return res.status(400).json({ error: 'Missing signature' });
    }
    
    if (!webhookSecret) {
        console.error('Webhook: STRIPE_WEBHOOK_SECRET not configured - rejecting webhook');
        return res.status(500).json({ error: 'Webhook not configured' });
    }
    
    try {
        const stripe = await getStripeClient();
        
        const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
        
        console.log(`📨 Webhook received: ${event.type}`);
        
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            
            if (session.metadata?.type === 'wallet_topup' && session.payment_status === 'paid') {
                await processSuccessfulPayment(session, event.id);
            }
        }
        
        res.status(200).json({ received: true });
        
    } catch (err) {
        console.error('Webhook error:', err.message);
        return res.status(400).json({ error: 'Webhook processing error' });
    }
}

router.webhookHandler = handleWebhook;

// ============================================================
// PROCESS SUCCESSFUL PAYMENT
// Credits wallet after verified payment with atomic idempotency
// ============================================================
async function processSuccessfulPayment(session, eventId = null) {
    const sessionId = session.id;
    const userId = session.metadata.userId;
    const amount = parseFloat(session.metadata.amount);
    
    const payment = await Payment.findOneAndUpdate(
        { 
            stripeSessionId: sessionId, 
            status: PAYMENT_STATUSES.PENDING 
        },
        { 
            status: 'processing',
            stripeEventId: eventId 
        },
        { new: true }
    );
    
    if (!payment) {
        const existingPayment = await Payment.findOne({ stripeSessionId: sessionId });
        if (existingPayment && existingPayment.status !== PAYMENT_STATUSES.PENDING) {
            console.log(`⏭️ Payment ${sessionId} already processed (status: ${existingPayment.status}), skipping`);
            return { alreadyProcessed: true, payment: existingPayment };
        }
        console.log(`⚠️ Payment record not found for session ${sessionId}`);
        return { notFound: true };
    }
    
    try {
        const transaction = await EscrowService.depositFunds(
            userId,
            amount,
            `شحن رصيد عبر Stripe - ${sessionId.slice(-8)}`
        );
        
        await Payment.findByIdAndUpdate(payment._id, {
            status: PAYMENT_STATUSES.COMPLETED,
            transactionId: transaction._id,
            processedAt: new Date()
        });
        
        console.log(`✅ Payment processed: $${amount} to user ${userId}, session ${sessionId}`);
        
        return { success: true, transaction };
        
    } catch (err) {
        await Payment.findByIdAndUpdate(payment._id, {
            status: PAYMENT_STATUSES.FAILED,
            metadata: { ...payment.metadata, error: err.message }
        });
        
        console.error(`❌ Failed to process payment ${sessionId}:`, err);
        throw err;
    }
}

// ============================================================
// VERIFY PAYMENT (Client fallback)
// Called after successful payment redirect
// ============================================================
router.post('/verify-payment', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.body;
        const userId = req.user.id;
        
        if (!sessionId) {
            return error(res, 'معرف الجلسة مطلوب', 'MISSING_SESSION_ID', 400);
        }
        
        const payment = await Payment.findOne({ stripeSessionId: sessionId });
        
        if (!payment) {
            return error(res, 'جلسة الدفع غير موجودة', 'SESSION_NOT_FOUND', 404);
        }
        
        if (payment.userId.toString() !== userId.toString()) {
            return error(res, 'جلسة الدفع غير صالحة', 'INVALID_SESSION', 403);
        }
        
        if (payment.status === PAYMENT_STATUSES.COMPLETED) {
            const balanceSummary = await EscrowService.getBalanceSummary(userId);
            return success(res, 'تم شحن رصيدك بنجاح!', {
                amount: payment.amount,
                newBalance: balanceSummary.availableBalance,
                alreadyProcessed: true
            });
        }
        
        if (payment.status !== PAYMENT_STATUSES.PENDING) {
            return error(res, 'حالة الدفع غير صالحة', 'INVALID_PAYMENT_STATUS', 400);
        }
        
        const stripe = await getStripeClient();
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (session.payment_status !== 'paid') {
            return error(res, 'الدفع لم يكتمل بعد', 'PAYMENT_NOT_COMPLETE', 400);
        }
        
        if (session.metadata?.userId !== userId.toString()) {
            return error(res, 'جلسة الدفع غير صالحة', 'SESSION_USER_MISMATCH', 403);
        }
        
        const result = await processSuccessfulPayment(session, null);
        
        if (result.alreadyProcessed) {
            const balanceSummary = await EscrowService.getBalanceSummary(userId);
            return success(res, 'تم شحن رصيدك بنجاح!', {
                amount: payment.amount,
                newBalance: balanceSummary.availableBalance,
                alreadyProcessed: true
            });
        }
        
        const balanceSummary = await EscrowService.getBalanceSummary(userId);
        
        return success(res, 'تم شحن رصيدك بنجاح! 🎉', {
            amount: payment.amount,
            newBalance: balanceSummary.availableBalance
        });
        
    } catch (err) {
        console.error('Verify payment error:', err);
        return error(res, 'حدث خطأ في التحقق من الدفع', 'VERIFY_ERROR', 500);
    }
});

// ============================================================
// GET WALLET BALANCE
// Returns current wallet balance for authenticated user
// ============================================================
router.get('/balance', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const balanceSummary = await EscrowService.getBalanceSummary(userId);
        
        return success(res, 'تم جلب رصيد المحفظة', balanceSummary);
        
    } catch (err) {
        console.error('Get balance error:', err);
        return error(res, 'حدث خطأ في جلب الرصيد', 'BALANCE_ERROR', 500);
    }
});

// ============================================================
// GET TRANSACTION HISTORY
// Returns transaction history for authenticated user
// ============================================================
router.get('/transactions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, type } = req.query;
        
        const transactions = await EscrowService.getTransactionHistory(userId, {
            limit: parseInt(limit),
            type: type || null
        });
        
        return success(res, 'تم جلب سجل المعاملات', { transactions });
        
    } catch (err) {
        console.error('Get transactions error:', err);
        return error(res, 'حدث خطأ في جلب المعاملات', 'TRANSACTIONS_ERROR', 500);
    }
});

// ============================================================
// GET PAYMENT HISTORY
// Returns payment (top-up) history for authenticated user
// ============================================================
router.get('/payments', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20 } = req.query;
        
        const payments = await Payment.find({ userId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .select('-stripeSessionId -stripePaymentIntentId -stripeEventId');
        
        return success(res, 'تم جلب سجل الدفعات', { payments });
        
    } catch (err) {
        console.error('Get payments error:', err);
        return error(res, 'حدث خطأ في جلب الدفعات', 'PAYMENTS_ERROR', 500);
    }
});

module.exports = router;
