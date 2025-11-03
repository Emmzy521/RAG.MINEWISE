#!/usr/bin/env node

/**
 * Create or Update Admin User Script
 * 
 * Usage: node scripts/create-admin-user.js <email>
 * 
 * This script creates or updates a user document in Firestore to give them admin role.
 * The user must already exist in Firebase Authentication.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
try {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (serviceAccountPath && require('fs').existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    admin.initializeApp({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'minewise-ai-4a4da',
    });
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
  console.log('\nMake sure you have Firebase Admin SDK credentials set up.');
  process.exit(1);
}

const auth = admin.auth();
const db = admin.firestore();

async function createAdminUser(email) {
  if (!email) {
    console.error('❌ Error: Email is required');
    console.log('\nUsage: node scripts/create-admin-user.js <email>');
    process.exit(1);
  }

  try {
    console.log(`🔍 Looking up user with email: ${email}...`);
    
    // Find user by email
    const userRecord = await auth.getUserByEmail(email);
    const userId = userRecord.uid;

    console.log(`✅ Found user: ${userRecord.email} (UID: ${userId})`);

    // Create or update user document in Firestore
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    const userData = {
      email: userRecord.email,
      role: 'admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (userDoc.exists) {
      // Update existing document
      await userRef.update(userData);
      console.log('✅ Updated user document with admin role');
    } else {
      // Create new document
      await userRef.set({
        ...userData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('✅ Created user document with admin role');
    }

    console.log('\n✨ User is now an admin!');
    console.log(`   Email: ${email}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Role: admin`);
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ Error: No user found with email "${email}"`);
      console.log('\n💡 The user must first sign up through the app.');
      console.log('   After they create an account, run this script again.');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

const email = process.argv[2];
createAdminUser(email);

