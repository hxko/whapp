// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAmaRKI89LYuqzBWVkPhpZZV14mx9poSHM",
  authDomain: "whappsapp-2.firebaseapp.com",
  projectId: "whappsapp-2",
  storageBucket: "whappsapp-2.appspot.com", // Corrected storage bucket URL
  messagingSenderId: "552032052369",
  appId: "1:552032052369:web:680759f13c299905cf4b30"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider(); // Create a Google Auth provider

// Export the instances
export { db, auth, provider };
