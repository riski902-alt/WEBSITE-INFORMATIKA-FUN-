import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const metaEnv =
  (import.meta as { env?: Record<string, string | undefined> }).env || {};

const firebaseConfig = {
  apiKey:
    metaEnv.VITE_FIREBASE_API_KEY ||
    'AIzaSyB7bt1JBOXkh81nYk8sVkuFpSmuJ3kOj94',
  authDomain:
    metaEnv.VITE_FIREBASE_AUTH_DOMAIN ||
    'databasemateriinformatika.firebaseapp.com',
  projectId:
    metaEnv.VITE_FIREBASE_PROJECT_ID || 'databasemateriinformatika',
  storageBucket:
    metaEnv.VITE_FIREBASE_STORAGE_BUCKET ||
    'databasemateriinformatika.firebasestorage.app',
  messagingSenderId:
    metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '961327810612',
  appId:
    metaEnv.VITE_FIREBASE_APP_ID ||
    '1:961327810612:web:48e952f20159a5b932e261',
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || 'G-TDZQZ9L36B',
};

const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDb = getFirestore(firebaseApp);
export const firebaseStorage = getStorage(firebaseApp);
