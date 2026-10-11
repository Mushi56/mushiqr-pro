import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID'
];

// Runtime security validation: Check for missing environment variables
const missingVars = requiredEnvVars.filter(key => !import.meta.env[key]);
if (missingVars.length > 0) {
  if (import.meta.env.PROD) {
    console.error(`[CRITICAL CONFIG ALERT] Production build missing Firebase environment variables: ${missingVars.join(', ')}. Hard-coded fallback project credentials are in active use.`);
  } else {
    console.warn(`[Config Notice] Missing Firebase environment variables: ${missingVars.join(', ')}. Using default development configuration.`);
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyABHD4nD7iZJSRll6oClWInbFJuMxgg_KQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mushi-qr-pro.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mushi-qr-pro',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mushi-qr-pro.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1068457009199',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1068457009199:web:5b09d6a86f7ecd448966da'
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (e) {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
export const functions = getFunctions(app);


