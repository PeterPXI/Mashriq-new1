/**
 * Fix: Clean up null googleId values and rebuild sparse index.
 * Sparse unique indexes skip documents where the field is ABSENT,
 * but NOT where it's explicitly set to null.
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function fix() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        const db = mongoose.connection.db;

        // Step 1: Drop the old index
        try {
            await db.collection('users').dropIndex('googleId_1');
            console.log('✅ Dropped googleId_1 index');
        } catch (e) {
            console.log('ℹ️  No index to drop:', e.message);
        }

        // Step 2: Remove null googleId from all documents (so they become "absent")
        const result = await db.collection('users').updateMany(
            { googleId: null },
            { $unset: { googleId: "" } }
        );
        console.log(`✅ Cleaned ${result.modifiedCount} documents with null googleId`);

        // Step 3: The sparse index will be recreated by Mongoose on next server start
        console.log('✅ Done! Start the server now.');
    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

fix();
