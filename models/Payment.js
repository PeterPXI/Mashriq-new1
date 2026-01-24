/* ========================================
   Mashriq (مشرق) - Payment Model
   ========================================
   
   PURPOSE:
   Track Stripe payment sessions for wallet top-ups.
   Ensures idempotency and survives server restarts.
   
   CONSTITUTION RULES:
   - Each Stripe session has exactly one Payment record
   - Status transitions: pending -> completed/failed
   - Once completed, cannot be processed again (idempotency)
   - Links to Transaction record after successful processing
   
   ======================================== */

const mongoose = require('mongoose');

const PAYMENT_STATUSES = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    EXPIRED: 'expired'
};

const paymentSchema = new mongoose.Schema({
    
    stripeSessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    stripePaymentIntentId: {
        type: String,
        sparse: true,
        index: true
    },
    
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    amount: {
        type: Number,
        required: true,
        min: [5, 'الحد الأدنى للشحن 5 دولار'],
        max: [1000, 'الحد الأقصى للشحن 1000 دولار']
    },
    
    currency: {
        type: String,
        default: 'usd'
    },
    
    status: {
        type: String,
        enum: Object.values(PAYMENT_STATUSES),
        default: PAYMENT_STATUSES.PENDING,
        index: true
    },
    
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        default: null
    },
    
    processedAt: {
        type: Date,
        default: null
    },
    
    stripeEventId: {
        type: String,
        default: null
    },
    
    metadata: {
        type: Object,
        default: {}
    },
    
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    }
    
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

paymentSchema.index({ createdAt: 1 });
paymentSchema.index({ userId: 1, status: 1 });

paymentSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

paymentSchema.statics.isProcessed = async function(sessionId) {
    const payment = await this.findOne({ stripeSessionId: sessionId });
    return payment && payment.status === PAYMENT_STATUSES.COMPLETED;
};

paymentSchema.statics.markCompleted = async function(sessionId, transactionId, eventId = null) {
    return await this.findOneAndUpdate(
        { stripeSessionId: sessionId, status: PAYMENT_STATUSES.PENDING },
        { 
            status: PAYMENT_STATUSES.COMPLETED,
            transactionId,
            processedAt: new Date(),
            stripeEventId: eventId
        },
        { new: true }
    );
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
