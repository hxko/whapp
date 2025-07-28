// Import necessary functions from Firebase SDK
import { initializeApp } from "firebase/app"; // Function to initialize Firebase app
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth"; // Functions for authentication
import { getFirestore } from "firebase/firestore"; // Function to access Firestore database

// Firebase configuration object containing your project's settings
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // API key for Firebase
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, // Auth domain for Firebase
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // Project ID for Firebase
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // Storage bucket for Firebase
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, // Sender ID for Firebase messaging
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID, // App ID for Firebase
};

// Initialize Firebase with the configuration object
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth services
const db = getFirestore(app); // Get Firestore instance
const auth = getAuth(app); // Get Auth instance
const googleProvider = new GoogleAuthProvider(); // Create a Google Auth provider for authentication
const githubProvider = new GithubAuthProvider(); // Create a GitHub Auth provider for authentication

export { db, auth, googleProvider, githubProvider };
