/* ========================================
   Mashriq (مشرق) - Production Backend Server
   Sunrise Theme Platform
   Created by Peter Youssef
   Railway-Ready Deployment Configuration
   ======================================== */

const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Utilities
const { success, error } = require('./utils/apiResponse');

// Models
const User = require('./models/User');
const { USER_ROLES } = require('./models/User');
const Service = require('./models/Service');
const Order = require('./models/Order');
const { ORDER_STATUSES } = require('./models/Order');
const Review = require('./models/Review');

// Routes
const orderRoutes = require('./routes/orderRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'mashriq_simple_secret';

// ============ MIDDLEWARE ============

// Trust proxy for Railway/production environments
app.set('trust proxy', 1);

// CORS configuration for production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Static files middleware - serve the frontend app
const path = require('path');
app.use('/app', express.static(path.join(__dirname, 'public', 'app')));

// Root redirect to app
app.get('/', (req, res) => {
  res.redirect('/app/');
});

// Serve index.html for /app/ root
app.get('/app/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app', 'index.html'));
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============ DATABASE CONNECTION ============

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

const { authenticateToken } = require('./middlewares/authMiddleware');

// ============ SELLER AUTHORIZATION MIDDLEWARE ============
const requireSeller = (req, res, next) => {
  if (!req.user) {
    return error(res, 'يجب تسجيل الدخول أولاً', 'AUTH_REQUIRED', 401);
  }
  
  // User must have SELLER or ADMIN role to perform seller actions
  if (req.user.role !== USER_ROLES.SELLER && req.user.role !== USER_ROLES.ADMIN) {
    return error(res, 'يجب تفعيل وضع البائع أولاً للقيام بهذا الإجراء', 'SELLER_REQUIRED', 403);
  }
  
  next();
};

// ============ ADMIN AUTHORIZATION MIDDLEWARE ============
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return error(res, 'يجب تسجيل الدخول أولاً', 'AUTH_REQUIRED', 401);
  }
  
  if (req.user.role !== USER_ROLES.ADMIN) {
    return error(res, 'هذا الإجراء متاح للمسؤولين فقط', 'ADMIN_REQUIRED', 403);
  }
  
  next();
};

// ============ HEALTH CHECK ENDPOINT ============
app.get('/api/health', (req, res) => {
  return success(res, 'API is healthy', { status: 'ok' });
});

// ============ STATS ROUTES (Public) ============

// Get platform statistics for landing page
app.get('/api/stats/overview', async (req, res) => {
  try {
    const Service = require('./models/Service');
    const Order = require('./models/Order');
    
    const [usersCount, servicesCount, ordersCount] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Service.countDocuments({ status: 'active' }),
      Order.countDocuments()
    ]);
    
    return success(res, 'تم جلب الإحصائيات بنجاح', {
      users: usersCount,
      services: servicesCount,
      orders: ordersCount
    });
  } catch (err) {
    console.error('Stats error:', err);
    return error(res, 'حدث خطأ في جلب الإحصائيات', 'STATS_ERROR', 500);
  }
});

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;
    
    if (!fullName || !username || !email || !password) {
      return error(res, 'جميع الحقول المطلوبة يجب ملؤها', 'MISSING_FIELDS', 400);
    }
    
    if (password.length < 6) {
      return error(res, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'INVALID_PASSWORD', 400);
    }

    const userExists = await User.findOne({ 
        $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] 
    });

    if (userExists) {
        return error(res, 'البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل', 'USER_ALREADY_EXISTS', 400);
    }

    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash: password  
    });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    console.log(`🎉 New user registered: ${user.fullName} (${user.email})`);

    return success(res, 'تم إنشاء الحساب بنجاح! مرحباً بك 🎉', {
      user: {
          id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          role: user.role
      },
      token
    }, 201);
    
  } catch (err) {
    console.error('Registration error:', err);
    return error(res, err.message || 'حدث خطأ في الخادم', 'REGISTRATION_ERROR', 500);
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return error(res, 'يرجى إدخال البريد الإلكتروني وكلمة المرور', 'MISSING_CREDENTIALS', 400);
    }
    
    const user = await User.findByEmail(email);
    
    if (!user) {
        return error(res, 'البريد الإلكتروني أو كلمة المرور غير صحيحة', 'INVALID_CREDENTIALS', 401);
    }
    
    if (!user.isActive) {
        return error(res, 'هذا الحساب معطّل', 'ACCOUNT_DISABLED', 401);
    }
    
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
        return error(res, 'البريد الإلكتروني أو كلمة المرور غير صحيحة', 'INVALID_CREDENTIALS', 401);
    }
    
    user.lastActiveAt = Date.now();
    await user.save();
    
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    return success(res, 'تم تسجيل الدخول بنجاح! مرحباً بك 👋', {
      user: {
          id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          role: user.role
      },
      token
    });
    
  } catch (err) {
    console.error('Login error:', err);
    return error(res, 'حدث خطأ في الخادم', 'LOGIN_ERROR', 500);
  }
});

// Verify Token & Get Current User
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    const user = req.user;
    
    return success(res, 'تم جلب بيانات المستخدم بنجاح', {
        user: {
            id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt
        } 
    });
});

// Update User Profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, bio, avatarUrl } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return error(res, 'المستخدم غير موجود', 'USER_NOT_FOUND', 404);
    }
    
    if (fullName) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    
    await user.save();
    
    return success(res, 'تم تحديث الملف الشخصي بنجاح', {
      user: {
          id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
          role: user.role
      }
    });
    
  } catch (err) {
    console.error('Profile update error:', err);
    return error(res, 'حدث خطأ في الخادم', 'PROFILE_UPDATE_ERROR', 500);
  }
});

// Change Password
app.put('/api/auth/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return error(res, 'يرجى إدخال كلمة المرور الحالية والجديدة', 'MISSING_FIELDS', 400);
    }
    
    if (newPassword.length < 6) {
      return error(res, 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل', 'INVALID_PASSWORD', 400);
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return error(res, 'المستخدم غير موجود', 'USER_NOT_FOUND', 404);
    }
    
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
       return error(res, 'كلمة المرور الحالية غير صحيحة', 'INVALID_CREDENTIALS', 401);
    }
    
    user.passwordHash = newPassword;
    await user.save();
    
    return success(res, 'تم تغيير كلمة المرور بنجاح');
    
  } catch (err) {
    console.error('Password change error:', err);
    return error(res, 'حدث خطأ في الخادم', 'PASSWORD_CHANGE_ERROR', 500);
  }
});

// Activate Seller Mode
app.post('/api/auth/activate-seller', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return error(res, 'المستخدم غير موجود', 'USER_NOT_FOUND', 404);
    }
    
    if (user.role === USER_ROLES.SELLER || user.role === USER_ROLES.ADMIN) {
      return error(res, 'أنت بائع بالفعل', 'ALREADY_SELLER', 400);
    }
    
    user.role = USER_ROLES.SELLER;
    await user.save();
    
    console.log(`🎉 New seller activated: ${user.fullName} (${user.email})`);
    
    return success(res, 'تم تفعيل وضع البائع بنجاح! يمكنك الآن إضافة خدماتك 🎉', {
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (err) {
    console.error('Activate seller error:', err);
    return error(res, 'حدث خطأ في الخادم', 'ACTIVATE_SELLER_ERROR', 500);
  }
});

// ============ SERVICES ROUTES ============

// Get all services (public)
app.get('/api/services', async (req, res) => {
  try {
    const { category, search, sellerId, limit } = req.query;
    let query = { status: 'active' };
    
    if (category) query.category = category;
    if (sellerId) query.sellerId = sellerId;
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { sellerName: regex }
      ];
    }
    
    let servicesQuery = Service.find(query);
    if (limit) servicesQuery = servicesQuery.limit(parseInt(limit));
    
    const services = await servicesQuery.sort({ createdAt: -1 });
    
    return success(res, 'تم جلب الخدمات بنجاح', { 
      services: services.map(s => s.toObject({ getters: true })) 
    });
  } catch (err) {
    console.error('Get services error:', err);
    return error(res, 'حدث خطأ في الخادم', 'GET_SERVICES_ERROR', 500);
  }
});

// Get single service (public)
app.get('/api/services/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return error(res, 'الخدمة غير موجودة', 'SERVICE_NOT_FOUND', 404);
    }
    
    const seller = await User.findById(service.sellerId).select('fullName username avatarUrl bio');
    
    return success(res, 'تم جلب تفاصيل الخدمة بنجاح', { 
      service: service.toObject({ getters: true }),
      seller: seller ? seller.toObject({ getters: true }) : null
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return error(res, 'الخدمة غير موجودة', 'SERVICE_NOT_FOUND', 404);
    }
    console.error('Get service error:', err);
    return error(res, 'حدث خطأ في الخادم', 'GET_SERVICE_ERROR', 500);
  }
});

// Create new service (seller only)
app.post('/api/services', authenticateToken, requireSeller, async (req, res) => {
  try {
    const { title, description, price, category, image, deliveryTime, revisions, requirements } = req.body;
    
    if (!title || !description || !price || !category) {
      return error(res, 'جميع الحقول المطلوبة يجب ملؤها', 'MISSING_FIELDS', 400);
    }
    
    const service = await Service.create({
      title,
      description,
      price: parseFloat(price),
      category,
      image: image || 'https://via.placeholder.com/600x400?text=صورة+الخدمة',
      deliveryTime: deliveryTime || 3,
      revisions: revisions || 1,
      requirements: requirements || '',
      sellerId: req.user.id,
      sellerName: req.user.fullName
    });
    
    console.log(`✅ New service added: "${service.title}" by ${req.user.fullName}`);
    
    return success(res, 'تم إضافة الخدمة بنجاح! 🎉', {
      service: service.toObject({ getters: true })
    }, 201);
    
  } catch (err) {
    console.error('Add service error:', err);
    return error(res, err.message || 'حدث خطأ في الخادم', 'ADD_SERVICE_ERROR', 500);
  }
});

// Update service (owner only)
app.put('/api/services/:id', authenticateToken, async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);
    
    if (!service) {
      return error(res, 'الخدمة غير موجودة', 'SERVICE_NOT_FOUND', 404);
    }
    
    if (!service.isOwner(req.user.id)) {
      return error(res, 'ليس لديك صلاحية لتعديل هذه الخدمة', 'FORBIDDEN', 403);
    }
    
    const { title, description, price, category, image, deliveryTime, revisions, requirements, status } = req.body;
    if (title) service.title = title;
    if (description) service.description = description;
    if (price) service.price = parseFloat(price);
    if (category) service.category = category;
    if (image) service.image = image;
    if (deliveryTime) service.deliveryTime = deliveryTime;
    if (revisions !== undefined) service.revisions = revisions;
    if (requirements !== undefined) service.requirements = requirements;
    if (status && ['active', 'paused'].includes(status)) service.status = status;
    
    await service.save();
    
    return success(res, 'تم تحديث الخدمة بنجاح', {
      service: service.toObject({ getters: true })
    });
    
  } catch (err) {
    console.error('Update service error:', err);
    return error(res, 'حدث خطأ في الخادم', 'UPDATE_SERVICE_ERROR', 500);
  }
});

// Delete/Deactivate service (owner only)
app.delete('/api/services/:id', authenticateToken, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return error(res, 'الخدمة غير موجودة', 'SERVICE_NOT_FOUND', 404);
    }
    
    if (!service.isOwner(req.user.id)) {
      return error(res, 'ليس لديك صلاحية لحذف هذه الخدمة', 'FORBIDDEN', 403);
    }
    
    service.status = 'deleted';
    await service.save();
    
    console.log(`🗑️ Service deactivated: "${service.title}"`);
    
    return success(res, 'تم حذف الخدمة بنجاح');
    
  } catch (err) {
    console.error('Delete service error:', err);
    return error(res, 'حدث خطأ في الخادم', 'DELETE_SERVICE_ERROR', 500);
  }
});

// Get my services (seller)
app.get('/api/my-services', authenticateToken, async (req, res) => {
  try {
    const services = await Service.find({ 
      sellerId: req.user.id,
      status: { $ne: 'deleted' }  
    }).sort({ createdAt: -1 });
    
    return success(res, 'تم جلب خدماتي بنجاح', { 
      services: services.map(s => s.toObject({ getters: true })) 
    });
  } catch (err) {
    console.error('Get my services error:', err);
    return error(res, 'حدث خطأ في الخادم', 'GET_MY_SERVICES_ERROR', 500);
  }
});

// ============ CORE BUSINESS ROUTES (Controllers) ============

// Mount order routes with authentication
app.use('/api/orders', authenticateToken, orderRoutes);

// Mount dispute routes with authentication
app.use('/api/disputes', authenticateToken, disputeRoutes);

// Mount chat routes with authentication
app.use('/api/chats', authenticateToken, chatRoutes);

// Mount review routes (auth applied per-route)
app.use('/api/reviews', reviewRoutes);

// ============ STATS ROUTES (Public) ============
// Stats are derived from Service and Order models.

// Get platform stats
app.get('/api/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ isActive: true });
        const activeServices = await Service.countDocuments({ status: 'active' });
        const completedOrders = await Order.countDocuments({ status: 'completed' });
        
        return success(res, 'تم جلب الإحصائيات بنجاح', {
            totalUsers,
            totalServices: activeServices,
            totalCompletedOrders: completedOrders
        });
    } catch (err) {
        return error(res, 'Server Error', 'STATS_ERROR', 500);
    }
});

// Get user stats (seller dashboard)
app.get('/api/my-stats', authenticateToken, async (req, res) => {
    try {
        const myServices = await Service.find({ sellerId: req.user.id, status: { $ne: 'deleted' } });
        const activeServices = myServices.filter(s => s.status === 'active').length;
        
        const completedOrders = await Order.countDocuments({ 
            sellerId: req.user.id, 
            status: 'completed' 
        });
        
        const reviews = await Review.find({ sellerId: req.user.id });
        const avgRating = reviews.length > 0 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
            : null;  
        
        return success(res, 'تم جلب إحصائياتي بنجاح', {
            totalServices: myServices.length,
            activeServices,
            completedOrders,
            averageRating: avgRating,
            reviewsCount: reviews.length
        });
    } catch (err) {
        console.error('Get my stats error:', err);
        return error(res, 'Server Error', 'MY_STATS_ERROR', 500);
    }
});

// ============ ERROR HANDLING & CATCH-ALL ============

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  return error(res, 'Internal Server Error', 'INTERNAL_SERVER_ERROR', 500);
});

// Catch-all: API 404
app.use((req, res) => {
  return error(res, 'API endpoint not found', 'ENDPOINT_NOT_FOUND', 404);
});

// ============ START SERVER ============

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
