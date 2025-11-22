import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBPKjOwyW7wFYTtMeksndcY2jYIXLqk5BU",
  authDomain: "e4e-relief-app.firebaseapp.com",
  projectId: "e4e-relief-app",
  storageBucket: "e4e-relief-app.firebasestorage.app",
  messagingSenderId: "792696379717",
  appId: "1:792696379717:web:33d4ba71ad931dc398462c",
  measurementId: "G-R60LTYQ98D"
};

// Initialize Firebase.
// The `!getApps().length` check prevents re-initializing the app on every hot-reload
// in a development environment, which would otherwise cause errors.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get instances of the Firebase services we'll use throughout the app.
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export the initialized services for use in other parts of the application.
export { auth, db, storage };
