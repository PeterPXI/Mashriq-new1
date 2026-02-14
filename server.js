/* ========================================
   Mashriq (مشرق) - Production Backend Server
   Sunrise Theme Platform
   Created by Peter Youssef
   Railway-Ready Deployment Configuration
   ======================================== */

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

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
const stripeRoutes = require('./routes/stripeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const aiRoutes = require('./routes/ai');
const noorRoutes = require('./routes/noorRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const referralRoutes = require('./routes/referralRoutes');
const Favorite = require('./models/Favorite');

const app = express();
const server = http.createServer(app);
const emailService = require('./services/EmailService');

// CRITICAL: JWT_SECRET must be set and strong
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'CHANGE_THIS_TO_A_LONG_RANDOM_SECRET' || JWT_SECRET.length < 32) {
    console.error('❌ CRITICAL: JWT_SECRET is not set or too weak! Set a strong secret (32+ chars) in .env');
    if (process.env.NODE_ENV === 'production') {
        process.exit(1); // Do not start in production with weak secret
    }
}

// ============ RATE LIMITING ============

// General API rate limit
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { success: false, message: 'تم تجاوز عدد الطلبات المسموحة. يرجى المحاولة لاحقاً.', code: 'RATE_LIMIT_EXCEEDED' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict rate limit for auth endpoints (login, register)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { success: false, message: 'محاولات كثيرة جداً. يرجى الانتظار 15 دقيقة.', code: 'AUTH_RATE_LIMIT' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Very strict rate limit for password reset (prevent abuse)
const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { success: false, message: 'تم تجاوز عدد محاولات إعادة تعيين كلمة المرور. يرجى الانتظار.', code: 'RESET_RATE_LIMIT' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Initialize Socket.IO
const SocketService = require('./services/SocketService');
SocketService.initialize(server);

// Initialize Passport (Google OAuth)
const initializePassport = require('./config/passport');
initializePassport(app);

// ============ MIDDLEWARE ============

// Trust proxy for Railway/production environments
app.set('trust proxy', 1);

// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.headers['x-forwarded-proto'] !== 'https') {
            return res.redirect(301, `https://${req.hostname}${req.url}`);
        }
        next();
    });
}

// Security headers via Helmet
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for now (inline scripts in HTML)
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' } // Allow Cloudinary images
}));

// CORS configuration - whitelist-based
const corsOptions = {
  origin: function(origin, callback) {
      const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
      // Allow requests with no origin (mobile apps, curl, same-origin)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
          callback(null, true);
      } else {
          callback(new Error('Not allowed by CORS'));
      }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// ============ CLOUDINARY CONFIGURATION ============
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary storage for service images (fast upload, no transformation)
const serviceImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mashriq/services',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    resource_type: 'auto'
    // Transformations removed for faster upload - apply on-the-fly when displaying
  }
});

// Cloudinary storage for avatars (fast upload, no transformation)
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mashriq/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    resource_type: 'auto'
    // Transformations removed for faster upload - apply on-the-fly when displaying
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const isValid = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
  cb(isValid ? null : new Error('يُسمح فقط برفع الصور'), isValid);
};

const upload = multer({ storage: serviceImageStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });
const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 2 * 1024 * 1024 }, fileFilter });


// Serve static files from public/app for /app
app.use('/app', express.static(path.join(__dirname, 'public', 'app')));

// Serve assets specifically
app.use('/app/assets', express.static(path.join(__dirname, 'public', 'app', 'assets')));
app.use('/app/js', express.static(path.join(__dirname, 'public', 'app', 'js')));

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Root redirect to app
app.get('/', (req, res) => {
  res.redirect('/app/');
});

// Serve index.html for /app/ root
app.get('/app/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app', 'index.html'));
});

// Stripe webhook must be registered BEFORE express.json() to receive raw body
const stripeWebhookRouter = require('./routes/stripeRoutes');
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookRouter.webhookHandler);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize user input against NoSQL injection
app.use(mongoSanitize());

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// Apply strict rate limiting to auth endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', forgotPasswordLimiter);
app.use('/api/auth/reset-password', forgotPasswordLimiter);
app.use('/api/auth/verify-reset-code', forgotPasswordLimiter);
app.use('/api/auth/send-verification', forgotPasswordLimiter);
app.use('/api/auth/verify-email', forgotPasswordLimiter);

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============ DATABASE CONNECTION ============

const connectDB = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 15000,
        maxPoolSize: 10,
      });
      console.log('✅ MongoDB Connected Successfully');
      return;
    } catch (err) {
      console.error(`❌ MongoDB Connection Attempt ${i + 1}/${retries} Failed:`, err.message);
      if (i < retries - 1) {
        const wait = Math.min(1000 * Math.pow(2, i), 10000);
        console.log(`⏳ Retrying in ${wait / 1000}s...`);
        await new Promise(r => setTimeout(r, wait));
      }
    }
  }
  console.error('❌ MongoDB: All connection attempts failed. Server running without DB.');
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting reconnection...');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

connectDB();

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

// ============ OPTIONAL AUTH MIDDLEWARE ============
// Reads token if present but doesn't require it
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return next(); // No token, continue without user
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // Invalid token, continue without user
  }
  
  next();
};

// ============ HEALTH CHECK ENDPOINT ============
app.get('/api/health', (req, res) => {
  return success(res, 'API is healthy', { status: 'ok' });
});

// ============ AI ROUTES ============
// AI routes are mounted below after authentication setup
app.use('/api/noor', noorRoutes);

// ============ REFERRAL ROUTES ============
app.use('/api/referral', referralRoutes);

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
    const { fullName, username, email, password, role, referralCode } = req.body;
    
    if (!fullName || !username || !email || !password) {
      return error(res, 'جميع الحقول المطلوبة يجب ملؤها', 'MISSING_FIELDS', 400);
    }
    
    if (password.length < 8) {
      return error(res, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'INVALID_PASSWORD', 400);
    }
    
    // Require at least one letter and one number
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return error(res, 'كلمة المرور يجب أن تحتوي على أحرف وأرقام', 'WEAK_PASSWORD', 400);
    }

    const userExists = await User.findOne({ 
        $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] 
    });

    if (userExists) {
        return error(res, 'البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل', 'USER_ALREADY_EXISTS', 400);
    }

    // Determine role (default to BUYER if invalid or not provided)
    const userRole = role === USER_ROLES.SELLER ? USER_ROLES.SELLER : USER_ROLES.BUYER;

    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash: password,
        role: userRole
    });

    // Process referral if code provided
    if (referralCode) {
        try {
            const ReferralController = require('./controllers/ReferralController');
            await ReferralController.processReferral(user._id, referralCode);
        } catch (refErr) {
            console.error('Referral processing error (non-blocking):', refErr.message);
        }
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    console.log(`🎉 New user registered: ${user.username}${referralCode ? ' via referral' : ''}`);

    // Auto-send verification code after registration (non-blocking)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.emailVerificationAttempts = 0;
    user.emailVerificationLastSent = new Date();
    user.save().then(() => {
        // Send verification code email
        emailService.sendVerificationCode(user.email, verificationCode, user.fullName).catch(err => {
            console.error('Verification email error (non-blocking):', err.message);
        });
        // Send welcome email
        emailService.sendWelcomeEmail(user.email, user.fullName).catch(err => {
            console.error('Welcome email error (non-blocking):', err.message);
        });
    }).catch(err => {
        console.error('Save verification code error (non-blocking):', err.message);
    });

    return success(res, 'تم إنشاء الحساب بنجاح! مرحباً بك 🎉', {
      user: {
          id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          role: user.role,
          isEmailVerified: user.isEmailVerified
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
    
    // Check if this is a Google-only account (no password set)
    if (user.googleId && !user.passwordHash) {
        return error(res, 'هذا الحساب مسجل عبر Google. يرجى تسجيل الدخول بـ Google.', 'GOOGLE_ACCOUNT', 401);
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
          bannerUrl: user.bannerUrl,
          bio: user.bio,
          role: user.role,
          isEmailVerified: user.isEmailVerified
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
            bannerUrl: user.bannerUrl,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt
        } 
    });
});

// Update User Profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, bio, avatarUrl, bannerUrl } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return error(res, 'المستخدم غير موجود', 'USER_NOT_FOUND', 404);
    }
    
    if (fullName) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (bannerUrl !== undefined) user.bannerUrl = bannerUrl;
    
    await user.save();
    
    return success(res, 'تم تحديث الملف الشخصي بنجاح', {
      user: {
          id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
          bannerUrl: user.bannerUrl,
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
    
    if (newPassword.length < 8) {
      return error(res, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل', 'INVALID_PASSWORD', 400);
    }
    
    // Require at least one letter and one number
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return error(res, 'كلمة المرور يجب أن تحتوي على أحرف وأرقام', 'WEAK_PASSWORD', 400);
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
    
    console.log(`🎉 New seller activated: ${user.username}`);
    
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

// Upload Avatar
app.post('/api/auth/upload-avatar', authenticateToken, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return error(res, 'يرجى اختيار صورة', 'NO_FILE', 400);
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return error(res, 'المستخدم غير موجود', 'USER_NOT_FOUND', 404);
    }
    
    // Note: Old local avatars won't be deleted (legacy support)
    // Cloudinary automatically manages storage
    
    // Cloudinary returns the URL in req.file.path
    const avatarUrl = req.file.path;
    user.avatarUrl = avatarUrl;
    await user.save();
    
    return success(res, 'تم رفع الصورة بنجاح', {
      avatarUrl,
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
    console.error('Avatar upload error:', err);
    return error(res, 'حدث خطأ أثناء رفع الصورة', 'AVATAR_UPLOAD_ERROR', 500);
  }
});

// Get Public User Profile by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash -__v');
    
    if (!user) {
      return error(res, 'المستخدم غير موجود', 'USER_NOT_FOUND', 404);
    }
    
    // Get user's services count
    const servicesCount = await Service.countDocuments({ seller: user._id, isActive: true });
    
    // Get user's completed orders count
    const ordersCount = await Order.countDocuments({
      $or: [{ buyer: user._id }, { seller: user._id }],
      status: ORDER_STATUSES.COMPLETED
    });
    
    // Get user's reviews
    const reviews = await Review.find({ seller: user._id })
      .populate('buyer', 'fullName username avatarUrl')
      .populate('service', 'title')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Calculate average rating
    const allReviews = await Review.find({ seller: user._id });
    const avgRating = allReviews.length > 0 
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
      : 0;
    
    return success(res, 'تم جلب بيانات المستخدم', {
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt,
        isSeller: user.role === USER_ROLES.SELLER || user.role === USER_ROLES.ADMIN,
      },
      stats: {
        services: servicesCount,
        orders: ordersCount,
        reviews: allReviews.length,
        rating: parseFloat(avgRating),
      },
      reviews: reviews.map(r => ({
        id: r._id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        buyer: r.buyer ? {
          id: r.buyer._id,
          fullName: r.buyer.fullName,
          username: r.buyer.username,
          avatarUrl: r.buyer.avatarUrl,
        } : null,
        service: r.service ? {
          id: r.service._id,
          title: r.service.title,
        } : null,
      })),
    });
    
  } catch (err) {
    console.error('Get user profile error:', err);
    return error(res, 'حدث خطأ في الخادم', 'GET_USER_ERROR', 500);
  }
});

// ============ SERVICES ROUTES ============

// Get all services (public)
app.get('/api/services', async (req, res) => {
  try {
    const { 
      category, search, sellerId, limit, page,
      minPrice, maxPrice, minRating, deliveryTime, sort 
    } = req.query;
    
    let query = { isActive: true, isPaused: false };
    
    // Category filter
    if (category) query.categoryId = category;
    if (sellerId) query.sellerId = sellerId;
    
    // Search filter
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { sellerName: regex }
      ];
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Rating filter
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }
    
    // Delivery time filter
    if (deliveryTime) {
      query.deliveryDays = { $lte: parseInt(deliveryTime) };
    }
    
    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const skip = (pageNum - 1) * limitNum;
    
    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort) {
      if (sort === '-rating') sortOption = { rating: -1, createdAt: -1 };
      else if (sort === 'price') sortOption = { price: 1 };
      else if (sort === '-price') sortOption = { price: -1 };
      else if (sort === '-ordersCount') sortOption = { ordersCount: -1, createdAt: -1 };
      else if (sort === '-createdAt') sortOption = { createdAt: -1 };
      else if (sort === 'createdAt') sortOption = { createdAt: 1 };
    }
    
    // Get total count for pagination
    const total = await Service.countDocuments(query);
    
    // Get services
    const services = await Service.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .populate('seller', 'fullName username avatarUrl');
    
    return success(res, 'تم جلب الخدمات بنجاح', { 
      services: services.map(s => s.toObject({ getters: true })),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    console.error('Get services error:', err);
    return error(res, 'حدث خطأ في الخادم', 'GET_SERVICES_ERROR', 500);
  }
});

// Get single service (public)
app.get('/api/services/:id', optionalAuth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return error(res, 'الخدمة غير موجودة', 'SERVICE_NOT_FOUND', 404);
    }
    
    const seller = await User.findById(service.sellerId).select('fullName username avatarUrl bio');
    
    // Track service view for referral anti-spam (if user is authenticated)
    if (req.user && req.user.id) {
      const ReferralController = require('./controllers/ReferralController');
      ReferralController.trackServiceView(req.user.id);
    }
    
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

// Create new service (seller only) - with image upload
app.post('/api/services', authenticateToken, requireSeller, upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, price, category, imageUrl, deliveryTime, revisions, requirements } = req.body;
    
    if (!title || !description || !price || !category) {
      return error(res, 'جميع الحقول المطلوبة يجب ملؤها', 'MISSING_FIELDS', 400);
    }
    
    // Collect all image URLs from uploaded files
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      // Cloudinary returns the URL in file.path
      imageUrls = req.files.map(file => file.path);
    } else if (imageUrl) {
      imageUrls = [imageUrl];
    }
    
    const service = await Service.create({
      title,
      description,
      basePrice: parseFloat(price),
      categoryId: category,
      imageUrls: imageUrls,
      deliveryDays: deliveryTime || 3,
      revisions: revisions || 0,
      requirements: requirements || '',
      sellerId: req.user.id,
    });
    
    console.log(`✅ New service added: "${service.title}" by ${req.user.username}`);
    
    // Track service publish for referral anti-spam
    const ReferralController = require('./controllers/ReferralController');
    ReferralController.trackServicePublish(req.user.id);
    
    return success(res, 'تم إضافة الخدمة بنجاح! 🎉', {
      service: service.toObject({ getters: true })
    }, 201);
    
  } catch (err) {
    console.error('Add service error:', err);
    // Note: Cloudinary handles storage cleanup automatically
    // We don't need to manually delete files
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
    
    // Fix: Map fields to correct Model names
    if (title) service.title = title;
    if (description) service.description = description;
    if (price) service.basePrice = parseFloat(price);
    if (category) service.categoryId = category;
    if (image) service.imageUrls = [image];
    if (deliveryTime) service.deliveryDays = deliveryTime;
    if (revisions !== undefined) service.revisions = revisions;
    if (requirements !== undefined) service.requirements = requirements;
    
    // Handle status: 'active' -> isActive=true, isPaused=false
    // Handle status: 'paused' -> isActive=true, isPaused=true
    if (status === 'active') {
      service.isActive = true;
      service.isPaused = false;
    } else if (status === 'paused') {
      service.isActive = true;
      service.isPaused = true;
    }
    
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
    service.isActive = false;
    service.isPaused = false;
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
      isActive: true
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

// Mount Stripe payment routes
app.use('/api/stripe', stripeRoutes);

// Mount notification routes with authentication
app.use('/api/notifications', authenticateToken, notificationRoutes);

// Mount admin routes with authentication and admin check
app.use('/api/admin', authenticateToken, requireAdmin, adminRoutes);

// Mount auth routes (forgot password, email verification)
app.use('/api/auth', authRoutes);

// Mount favorites routes with authentication
app.use('/api/favorites', authenticateToken, favoriteRoutes);

// Mount AI routes (some public, some require auth - handled per-route)
app.use('/api/ai', aiRoutes);

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

// ============ UPLOAD ROUTES ============
app.use('/api/upload', uploadRoutes);

// ============ ERROR HANDLING & CATCH-ALL ============

// Global Error Handler (for API routes only)
app.use('/api', (err, req, res, next) => {
  console.error('API Error:', err);
  return error(res, 'Internal Server Error', 'INTERNAL_SERVER_ERROR', 500);
});

// API 404 Handler - JSON response for API routes ONLY
app.use('/api/*', (req, res) => {
  return error(res, 'API endpoint not found', 'ENDPOINT_NOT_FOUND', 404);
});

// ============ FRONTEND 404 HANDLING ============
// This handles requests to /app/* that weren't served by static middleware
// i.e., the file doesn't exist

app.use('/app/*', (req, res) => {
  // If we reached here, the file doesn't exist
  // Return 404 page or redirect to home
  console.log(`[404] Frontend file not found: ${req.path}`);
  
  // Option 1: Redirect to home
  res.redirect('/app/');
  
  // Option 2: Could also send a custom 404 page
  // res.status(404).sendFile(path.join(__dirname, 'public', 'app', '404.html'));
});

// Ultimate fallback - redirect to app
app.use((req, res) => {
  res.redirect('/app/');
});

// ============ START SERVER ============

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 WebSocket ready for connections`);
});
