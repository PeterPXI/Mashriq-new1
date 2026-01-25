/* ========================================
   Mashriq (مشرق) - Favorite Routes
   ======================================== */

const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const Service = require('../models/Service');
const { success, error } = require('../utils/apiResponse');
// Get user's favorites
router.get('/', async (req, res) => {
    try {
        const favorites = await Favorite.find({ user: req.user.id })
            .populate({
                path: 'service',
                populate: { path: 'seller', select: 'fullName username avatarUrl' }
            })
            .sort({ createdAt: -1 });
        
        // Filter out null services (deleted services)
        const validFavorites = favorites.filter(f => f.service !== null);
        
        return success(res, 'تم جلب المفضلة بنجاح', { 
            favorites: validFavorites.map(f => f.service),
            count: validFavorites.length
        });
    } catch (err) {
        console.error('Get favorites error:', err);
        return error(res, 'حدث خطأ في جلب المفضلة', 'FAVORITES_ERROR', 500);
    }
});

// Add to favorites
router.post('/:serviceId', async (req, res) => {
    try {
        const { serviceId } = req.params;
        
        // Check if service exists
        const service = await Service.findById(serviceId);
        if (!service) {
            return error(res, 'الخدمة غير موجودة', 'SERVICE_NOT_FOUND', 404);
        }
        
        // Check if already favorited
        const existing = await Favorite.findOne({ 
            user: req.user.id, 
            service: serviceId 
        });
        
        if (existing) {
            return error(res, 'الخدمة موجودة بالفعل في المفضلة', 'ALREADY_FAVORITED', 400);
        }
        
        // Create favorite
        await Favorite.create({
            user: req.user.id,
            service: serviceId
        });
        
        return success(res, 'تمت إضافة الخدمة للمفضلة', null, 201);
    } catch (err) {
        console.error('Add favorite error:', err);
        return error(res, 'حدث خطأ في إضافة المفضلة', 'ADD_FAVORITE_ERROR', 500);
    }
});

// Remove from favorites
router.delete('/:serviceId', async (req, res) => {
    try {
        const { serviceId } = req.params;
        
        const result = await Favorite.findOneAndDelete({ 
            user: req.user.id, 
            service: serviceId 
        });
        
        if (!result) {
            return error(res, 'الخدمة غير موجودة في المفضلة', 'NOT_IN_FAVORITES', 404);
        }
        
        return success(res, 'تمت إزالة الخدمة من المفضلة');
    } catch (err) {
        console.error('Remove favorite error:', err);
        return error(res, 'حدث خطأ في إزالة المفضلة', 'REMOVE_FAVORITE_ERROR', 500);
    }
});

// Check if service is favorited
router.get('/check/:serviceId', async (req, res) => {
    try {
        const { serviceId } = req.params;
        
        const favorite = await Favorite.findOne({ 
            user: req.user.id, 
            service: serviceId 
        });
        
        return success(res, 'تم التحقق بنجاح', { 
            isFavorited: !!favorite 
        });
    } catch (err) {
        console.error('Check favorite error:', err);
        return error(res, 'حدث خطأ في التحقق', 'CHECK_FAVORITE_ERROR', 500);
    }
});

module.exports = router;
