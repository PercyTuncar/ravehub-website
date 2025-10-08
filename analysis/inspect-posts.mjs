import { getAllPostsForAdmin } from '../lib/firebase/blog';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../lib/firebase/config';


// The admin SDK would be better, but this avoids extra setup.
// We need to manually initialize the app here for the script to work.
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


async function inspectPosts() {
  console.log('Fetching all admin posts from Firestore...');
  try {
    const posts = await getAllPostsForAdmin();
    console.log(`Found ${posts.length} posts.`);
    console.log('---');
    console.log(JSON.stringify(posts, null, 2));
    console.log('---');
    console.log('Inspection complete.');
  } catch (error) {
    console.error('Failed to fetch posts:', error);
  } finally {
    // Since we're running a script, we should exit explicitly.
    // In a real app, you don't do this.
    process.exit(0);
  }
}

inspectPosts();
