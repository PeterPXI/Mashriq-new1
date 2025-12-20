const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'mashriq_simple_secret';

const { error } = require('../utils/apiResponse');

/**
 * Global Authentication Middleware
 * Verifies JWT token and attaches user to request object.
 */
const authenticateToken = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      
      req.user = await User.findById(decoded.id).select('-passwordHash');
      
      if (!req.user) {
        return error(res, 'المستخدم غير موجود', 'USER_NOT_FOUND', 401);
      }
      
      next();
    } catch (err) {
      console.error(err);
      return error(res, 'الجلسة منتهية، يرجى تسجيل الدخول مجدداً', 'INVALID_TOKEN', 401);
    }
  } else {
    return error(res, 'يجب تسجيل الدخول للوصول لهذه الخدمة', 'AUTH_REQUIRED', 401);
  }
};

module.exports = { authenticateToken };
