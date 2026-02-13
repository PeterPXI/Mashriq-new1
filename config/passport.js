/* ========================================
   Mashriq (مشرق) - Passport Configuration
   Google OAuth Strategy
   ======================================== */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Helper function to generate unique username
async function generateUniqueUsername(baseName) {
    let username = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (username.length < 3) username = 'user' + Date.now();
    
    let finalUsername = username;
    let counter = 1;
    
    while (await User.findOne({ username: finalUsername })) {
        finalUsername = `${username}${counter}`;
        counter++;
    }
    
    return finalUsername;
}

// Helper function to generate referral code
function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

module.exports = function(app) {
    // Initialize Passport
    app.use(passport.initialize());
    
    // Only configure Google Strategy if credentials are provided
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.log('⚠️ Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
        return;
    }
    
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
        scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists with this Google ID
            let user = await User.findOne({ googleId: profile.id });
            
            if (user) {
                // User exists, return them
                return done(null, user);
            }
            
            // Check if user exists with the same email
            const email = profile.emails?.[0]?.value;
            if (email) {
                user = await User.findOne({ email: email.toLowerCase() });
                
                if (user) {
                    // Link Google account to existing user
                    user.googleId = profile.id;
                    user.isEmailVerified = true; // Google emails are verified
                    if (!user.avatarUrl && profile.photos?.[0]?.value) {
                        user.avatarUrl = profile.photos[0].value;
                    }
                    await user.save();
                    return done(null, user);
                }
            }
            
            // Create new user
            const username = await generateUniqueUsername(
                profile.displayName || profile.name?.givenName || 'user'
            );
            
            const newUser = await User.create({
                googleId: profile.id,
                email: email?.toLowerCase(),
                fullName: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
                username: username,
                avatarUrl: profile.photos?.[0]?.value || null,
                isEmailVerified: true, // Google emails are verified
                role: 'buyer', // Default role
                referralCode: generateReferralCode(),
                isActive: true
            });
            
            console.log(`✅ New Google user created: ${newUser.username}`);
            return done(null, newUser);
            
        } catch (error) {
            console.error('Google OAuth Error:', error);
            return done(error, null);
        }
    }));
    
    // Serialize user for session (we're using JWT, so this is minimal)
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });
    
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
    
    console.log('✅ Google OAuth configured successfully');
};
