// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDknokXw153mCo8WQtScDs9kqFNH-PitJc",
  authDomain: "gestioncontact-bf5c4.firebaseapp.com",
  databaseURL: "https://gestioncontact-bf5c4-default-rtdb.firebaseio.com",
  projectId: "gestioncontact-bf5c4",
  storageBucket: "gestioncontact-bf5c4.firebasestorage.app",
  messagingSenderId: "184122774010",
  appId: "1:184122774010:web:cbdc76818b2fb3fdaad443",
  measurementId: "G-PWJGM575V9"
};

// Initialize Firebase with comprehensive error handling
let app = null;
let auth = null;
let database = null;
let initializationError = null;

try {
  console.log('🔥 Initializing Firebase...');
  
  // Validate configuration
  if (!firebaseConfig.apiKey) {
    throw new Error('Firebase API key is missing');
  }
  if (!firebaseConfig.authDomain) {
    throw new Error('Firebase auth domain is missing');
  }
  if (!firebaseConfig.databaseURL) {
    throw new Error('Firebase database URL is missing');
  }
  if (!firebaseConfig.projectId) {
    throw new Error('Firebase project ID is missing');
  }

  // Initialize Firebase app
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
  
  // Initialize Firebase Authentication
  auth = getAuth(app);
  if (auth) {
    console.log('✅ Firebase Auth initialized successfully');
  } else {
    throw new Error('Failed to initialize Firebase Auth');
  }
  
  // Initialize Realtime Database
  database = getDatabase(app);
  if (database) {
    console.log('✅ Firebase Database initialized successfully');
  } else {
    throw new Error('Failed to initialize Firebase Database');
  }
  
  console.log('🎉 All Firebase services initialized successfully');
  
} catch (error) {
  initializationError = error;
  console.error('❌ Firebase initialization failed:', {
    message: error.message,
    code: error.code || 'INIT_ERROR',
    stack: error.stack
  });
  
  // Set fallback values to prevent import errors
  auth = null;
  database = null;
  app = null;
}

// Export initialization status checker
export const getFirebaseStatus = () => ({
  isInitialized: !!app && !!auth && !!database,
  error: initializationError,
  services: {
    app: !!app,
    auth: !!auth,
    database: !!database
  }
});

// Export Firebase services
export { auth, database };
export default app;