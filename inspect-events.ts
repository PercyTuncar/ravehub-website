import { getEventsForAdmin } from './lib/firebase/events';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './lib/firebase/config';
import * as fs from 'fs';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getFirestore(app);

async function inspectEvents() {
  console.log('Fetching all events from Firestore...');
  try {
    const events = await getEventsForAdmin();
    console.log(`Found ${events.length} events.`);

    events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.name} - Status: ${event.status} - StartDate: ${event.startDate}`);
    });

    const output = JSON.stringify(events, (key, value) => {
      // Convert Firestore Timestamps to ISO strings
      if (value && typeof value === 'object' && value.hasOwnProperty('seconds') && value.hasOwnProperty('nanoseconds')) {
        return new Date(value.seconds * 1000 + value.nanoseconds / 1000000).toISOString();
      }
      return value;
    }, 2);

    fs.writeFileSync('analysis/events-inspection.json', output);
    console.log('Inspection complete. Results saved to analysis/events-inspection.json');

  } catch (error) {
    console.error('Failed to fetch events:', error);
  }
}

inspectEvents();