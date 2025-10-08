import { getAllPostsForAdmin } from './lib/firebase/blog';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './lib/firebase/config';
import * as fs from 'fs';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getFirestore(app);

async function inspectPosts() {
  console.log('Fetching all admin posts from Firestore...');
  try {
    const posts = await getAllPostsForAdmin();
    console.log(`Found ${posts.length} posts.`);
    
    const output = JSON.stringify(posts, (key, value) => {
      // Convert Firestore Timestamps to ISO strings
      if (value && typeof value === 'object' && value.hasOwnProperty('seconds') && value.hasOwnProperty('nanoseconds')) {
        return new Date(value.seconds * 1000 + value.nanoseconds / 1000000).toISOString();
      }
      return value;
    }, 2);

    fs.writeFileSync('analysis/posts-inspection.json', output);
    console.log('Inspection complete. Results saved to analysis/posts-inspection.json');

  } catch (error) {
    console.error('Failed to fetch posts:', error);
  }
}

inspectPosts();
