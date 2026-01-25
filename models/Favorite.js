/* ========================================
   Mashriq (مشرق) - Favorite Model
   ========================================
   
   PURPOSE:
   Stores user's favorite/saved services.
   Allows users to bookmark services for later viewing.
   
   CONSTITUTION RULES:
   - One favorite per user-service pair (unique index)
   - Deleting a service should cascade delete favorites
   - User can only view their own favorites
   
   ======================================== */

const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure one favorite per user-service pair
favoriteSchema.index({ user: 1, service: 1 }, { unique: true });

// Index for querying user's favorites
favoriteSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Favorite', favoriteSchema);
