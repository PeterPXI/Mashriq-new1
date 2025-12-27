/**
 * Make User a Seller
 * Usage: node scripts/make-seller.js <email>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function makeSeller() {
    try {
        const email = process.argv[2];
        
        if (!email) {
            console.error('❌ Please provide an email address');
            console.log('Usage: node scripts/make-seller.js <email>');
            process.exit(1);
        }
        
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        
        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            console.error(`❌ User not found: ${email}`);
            process.exit(1);
        }
        
        console.log(`\n📊 Current User Info:`);
        console.log(`Username: ${user.username}`);
        console.log(`Email: ${user.email}`);
        console.log(`Current Role: ${user.role}`);
        
        // Update to seller
        if (user.role === 'seller') {
            console.log(`\n✅ User is already a seller!`);
        } else {
            user.role = 'seller';
            await user.save();
            console.log(`\n✅ Successfully updated user to SELLER!`);
            console.log(`New Role: ${user.role}`);
        }
        
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

makeSeller();
