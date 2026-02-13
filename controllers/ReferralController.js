/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ REFERRAL CONTROLLER
 * نظام الإحالة الفيروسي - ادعُ أصدقاءك واربح!
 * ═══════════════════════════════════════════════════════════════════════════
 */

const User = require('../models/User');
const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────────────────────
// REWARD TIERS
// ─────────────────────────────────────────────────────────────────────────────

const REWARD_TIERS = [
    { count: 5, months: 1, label: 'Pro لمدة شهر' },
    { count: 10, months: 2, label: 'Pro لمدة شهرين' },
    { count: 25, months: 6, label: 'Pro لمدة 6 أشهر' },
    { count: 50, months: 12, label: 'Pro لمدة سنة' }
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function generateReferralCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
}

async function ensureReferralCode(userId) {
    const user = await User.findById(userId);
    if (!user) return null;
    
    if (!user.referralCode) {
        let code;
        let exists = true;
        
        // Ensure unique code
        while (exists) {
            code = generateReferralCode();
            exists = await User.findOne({ referralCode: code });
        }
        
        user.referralCode = code;
        await user.save();
    }
    
    return user.referralCode;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

const ReferralController = {
    
    /**
     * GET /api/referral/code
     * الحصول على كود الإحالة الخاص بالمستخدم
     */
    async getCode(req, res) {
        try {
            const code = await ensureReferralCode(req.user._id);
            
            if (!code) {
                return res.status(404).json({ success: false, message: 'مستخدم غير موجود' });
            }
            
            const baseUrl = process.env.APP_URL || 'http://localhost:5000';
            const referralLink = `${baseUrl}/app/register.html?ref=${code}`;
            
            res.json({
                success: true,
                code,
                link: referralLink
            });
        } catch (error) {
            console.error('Get Referral Code Error:', error);
            res.status(500).json({ success: false, message: 'حدث خطأ' });
        }
    },
    
    /**
     * GET /api/referral/stats
     * إحصائيات الإحالات
     */
    async getStats(req, res) {
        try {
            const user = await User.findById(req.user._id);
            
            if (!user) {
                return res.status(404).json({ success: false, message: 'مستخدم غير موجود' });
            }
            
            // Get referred users with their status
            const referredUsers = await User.find({ referredBy: user._id })
                .select('fullName createdAt avatarUrl referralStatus referralActivities')
                .sort({ createdAt: -1 })
                .limit(20);
            
            // Count active vs pending
            const activeReferrals = referredUsers.filter(u => u.referralStatus === 'active').length;
            const pendingReferrals = referredUsers.filter(u => u.referralStatus === 'pending').length;
            
            // Calculate next reward
            const claimedRewards = user.referralRewardsClaimed || [];
            let nextReward = null;
            
            for (const tier of REWARD_TIERS) {
                if (!claimedRewards.includes(tier.count)) {
                    nextReward = {
                        target: tier.count,
                        current: user.referralCount || 0,
                        remaining: Math.max(0, tier.count - (user.referralCount || 0)),
                        reward: tier.label
                    };
                    break;
                }
            }
            
            // Available rewards to claim
            const availableRewards = REWARD_TIERS.filter(tier => 
                (user.referralCount || 0) >= tier.count && 
                !claimedRewards.includes(tier.count)
            );
            
            res.json({
                success: true,
                stats: {
                    referralCode: user.referralCode || await ensureReferralCode(user._id),
                    totalReferrals: user.referralCount || 0,
                    activeReferrals,
                    pendingReferrals,
                    referredUsers: referredUsers.map(u => ({
                        name: u.fullName,
                        avatar: u.avatarUrl,
                        joinedAt: u.createdAt,
                        status: u.referralStatus || 'pending',
                        activities: {
                            hasViewedService: u.referralActivities?.hasViewedService || false,
                            hasPublishedService: u.referralActivities?.hasPublishedService || false
                        }
                    })),
                    nextReward,
                    availableRewards,
                    claimedRewards,
                    tiers: REWARD_TIERS
                }
            });
        } catch (error) {
            console.error('Get Referral Stats Error:', error);
            res.status(500).json({ success: false, message: 'حدث خطأ' });
        }
    },
    
    /**
     * POST /api/referral/claim
     * المطالبة بمكافأة
     */
    async claimReward(req, res) {
        try {
            const { tier } = req.body; // 5, 10, 25, or 50
            
            const targetTier = REWARD_TIERS.find(t => t.count === tier);
            if (!targetTier) {
                return res.status(400).json({ success: false, message: 'مستوى غير صالح' });
            }
            
            const user = await User.findById(req.user._id);
            
            if (!user) {
                return res.status(404).json({ success: false, message: 'مستخدم غير موجود' });
            }
            
            // Check if already claimed
            if ((user.referralRewardsClaimed || []).includes(tier)) {
                return res.status(400).json({ success: false, message: 'تم استلام هذه المكافأة مسبقاً' });
            }
            
            // Check if eligible
            if ((user.referralCount || 0) < tier) {
                return res.status(400).json({ 
                    success: false, 
                    message: `تحتاج ${tier - (user.referralCount || 0)} إحالات إضافية` 
                });
            }
            
            // Grant reward
            const now = new Date();
            let newExpiry;
            
            if (user.aiPlan === 'pro' && user.aiPlanExpiry && user.aiPlanExpiry > now) {
                // Extend existing subscription
                newExpiry = new Date(user.aiPlanExpiry);
                newExpiry.setMonth(newExpiry.getMonth() + targetTier.months);
            } else {
                // New subscription
                newExpiry = new Date();
                newExpiry.setMonth(newExpiry.getMonth() + targetTier.months);
            }
            
            user.aiPlan = 'pro';
            user.aiPlanExpiry = newExpiry;
            user.referralRewardsClaimed = [...(user.referralRewardsClaimed || []), tier];
            await user.save();
            
            res.json({
                success: true,
                message: `🎉 مبروك! حصلت على ${targetTier.label}`,
                newPlan: 'pro',
                expiresAt: newExpiry
            });
        } catch (error) {
            console.error('Claim Reward Error:', error);
            res.status(500).json({ success: false, message: 'حدث خطأ' });
        }
    },
    
    /**
     * POST /api/referral/validate
     * التحقق من كود الإحالة (للتسجيل)
     */
    async validateCode(req, res) {
        try {
            const { code } = req.body;
            
            if (!code) {
                return res.json({ success: true, valid: false });
            }
            
            const referrer = await User.findOne({ referralCode: code.toUpperCase() });
            
            if (!referrer) {
                return res.json({ success: true, valid: false, message: 'كود غير صالح' });
            }
            
            res.json({
                success: true,
                valid: true,
                referrerName: referrer.fullName
            });
        } catch (error) {
            console.error('Validate Code Error:', error);
            res.status(500).json({ success: false, message: 'حدث خطأ' });
        }
    },
    
    /**
     * Internal: Process referral after registration
     * Called from AuthController after successful registration
     * Sets referral as PENDING until user completes requirements
     */
    async processReferral(newUserId, referralCode) {
        if (!referralCode) return;
        
        try {
            const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
            
            if (referrer && referrer._id.toString() !== newUserId.toString()) {
                // Link new user to referrer with PENDING status
                await User.findByIdAndUpdate(newUserId, { 
                    referredBy: referrer._id,
                    referralStatus: 'pending',
                    referralActivities: {
                        hasViewedService: false,
                        hasPublishedService: false,
                        viewedServiceAt: null,
                        publishedServiceAt: null,
                        activatedAt: null
                    }
                });
                
                // DO NOT increment referrer's count yet - wait for activation
                console.log(`⏳ Referral PENDING: user ${referrer._id} referred new user (awaiting activation)`);
            }
        } catch (error) {
            console.error('Process Referral Error:', error);
        }
    },
    
    /**
     * Internal: Track service view activity
     * Called when user views a service
     */
    async trackServiceView(userId) {
        try {
            const user = await User.findById(userId);
            
            if (!user || !user.referredBy || user.referralStatus !== 'pending') {
                return; // Not a pending referral
            }
            
            if (user.referralActivities?.hasViewedService) {
                return; // Already tracked
            }
            
            user.referralActivities = user.referralActivities || {};
            user.referralActivities.hasViewedService = true;
            user.referralActivities.viewedServiceAt = new Date();
            await user.save();
            
            console.log(`👁️ Service view tracked for user ${userId}`);
            
            // Check if both conditions are now met
            await this.checkAndActivateReferral(userId);
        } catch (error) {
            console.error('Track Service View Error:', error);
        }
    },
    
    /**
     * Internal: Track service publish activity
     * Called when user publishes a service
     */
    async trackServicePublish(userId) {
        try {
            const user = await User.findById(userId);
            
            if (!user || !user.referredBy || user.referralStatus !== 'pending') {
                return; // Not a pending referral
            }
            
            if (user.referralActivities?.hasPublishedService) {
                return; // Already tracked
            }
            
            user.referralActivities = user.referralActivities || {};
            user.referralActivities.hasPublishedService = true;
            user.referralActivities.publishedServiceAt = new Date();
            await user.save();
            
            console.log(`📝 Service publish tracked for user ${userId}`);
            
            // Check if both conditions are now met
            await this.checkAndActivateReferral(userId);
        } catch (error) {
            console.error('Track Service Publish Error:', error);
        }
    },
    
    /**
     * Internal: Check if referral should be activated
     * Both conditions must be met: viewed service AND published service
     */
    async checkAndActivateReferral(userId) {
        try {
            const user = await User.findById(userId);
            
            if (!user || !user.referredBy || user.referralStatus !== 'pending') {
                return false;
            }
            
            const activities = user.referralActivities || {};
            
            // Both conditions must be met
            if (!activities.hasViewedService || !activities.hasPublishedService) {
                return false;
            }
            
            // Activate the referral
            user.referralStatus = 'active';
            user.referralActivities.activatedAt = new Date();
            await user.save();
            
            // NOW increment the referrer's count
            await User.findByIdAndUpdate(user.referredBy, { 
                $inc: { referralCount: 1 } 
            });
            
            const referrer = await User.findById(user.referredBy);
            console.log(`✅ Referral ACTIVATED: user ${referrer?._id} now has ${referrer?.referralCount} referrals`);
            
            return true;
        } catch (error) {
            console.error('Check And Activate Referral Error:', error);
            return false;
        }
    }
};

module.exports = ReferralController;
