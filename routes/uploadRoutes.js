/* ========================================
   Mashriq (مشرق) - Upload Routes
   ========================================
   
   PURPOSE:
   Handle file uploads to Cloudinary.
   
   ENDPOINTS:
   - POST /api/upload/image - Upload a single image
   
   ======================================== */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { authenticateToken } = require('../middlewares/authMiddleware');
const { success, error } = require('../utils/apiResponse');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer memory storage for processing before upload
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('يرجى رفع صورة صالحة'), false);
        }
    }
});

/**
 * POST /api/upload/image
 * Upload a single image to Cloudinary
 */
router.post('/image', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return error(res, 'لم يتم اختيار صورة', 'NO_FILE', 400);
        }
        
        const folder = req.body.folder || 'general';
        
        // Upload to Cloudinary using stream
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `mashriq/${folder}`,
                    resource_type: 'image',
                    transformation: [
                        { quality: 'auto:good' },
                        { fetch_format: 'auto' }
                    ]
                },
                (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                }
            );
            
            uploadStream.end(req.file.buffer);
        });
        
        return success(res, 'تم رفع الصورة بنجاح', {
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height
        });
        
    } catch (err) {
        console.error('Upload error:', err);
        return error(res, err.message || 'فشل رفع الصورة', 'UPLOAD_ERROR', 500);
    }
});

/**
 * DELETE /api/upload/image/:publicId
 * Delete an image from Cloudinary
 */
router.delete('/image/:publicId', authenticateToken, async (req, res) => {
    try {
        const { publicId } = req.params;
        
        if (!publicId) {
            return error(res, 'معرف الصورة مطلوب', 'MISSING_ID', 400);
        }
        
        await cloudinary.uploader.destroy(publicId);
        
        return success(res, 'تم حذف الصورة بنجاح');
        
    } catch (err) {
        console.error('Delete error:', err);
        return error(res, err.message || 'فشل حذف الصورة', 'DELETE_ERROR', 500);
    }
});

module.exports = router;
