const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// The service account key is expected to be in the root of the project.
// IMPORTANT: This file should be added to .gitignore and never be committed.
const serviceAccount = require('../google-credentials.json');

// Initialize the Firebase Admin SDK
try {
  initializeApp({
    credential: cert(serviceAccount)
  });
} catch (e) {
  // This can happen if the script is run multiple times in a hot-reload environment
  if (e.code !== 'app/duplicate-app') {
    console.error('Firebase Admin initialization error:', e);
    process.exit(1);
  }
}


const db = getFirestore();

async function inspectPosts() {
  console.log('Fetching all posts from Firestore using Admin SDK...');
  try {
    const postsCollection = db.collection('blog');
    const snapshot = await postsCollection.orderBy('updatedAt', 'desc').get();

    if (snapshot.empty) {
      console.log('No posts found in the "blog" collection.');
      return;
    }

    const posts = [];
    snapshot.forEach(doc => {
      posts.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Successfully fetched ${posts.length} posts.`);

    const fs = require('fs');
    const output = JSON.stringify(posts, (key, value) => {
      // Convert Firestore Timestamps to ISO strings for readability
      if (value && value._seconds !== undefined && value._nanoseconds !== undefined) {
        return new Date(value._seconds * 1000 + value._nanoseconds / 1000000).toISOString();
      }
      return value;
    }, 2);

    fs.writeFileSync('analysis/posts-inspection.json', output);
    console.log('Inspection complete. Results saved to analysis/posts-inspection.json');

  } catch (error) {
    console.error('Failed to fetch posts with Admin SDK:', error);
  }
}

inspectPosts();
