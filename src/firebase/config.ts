import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

export const firebaseConfig = {
  projectId: "gen-lang-client-0829665348",
  appId: "1:761281725088:web:e0077c0860ef4a601fbfc5",
  apiKey: "AIzaSyBxVlPdAoUS1pPfOX3KLFNv17eQPR42jew",
  authDomain: "gen-lang-client-0829665348.firebaseapp.com",
  storageBucket: "gen-lang-client-0829665348.firebasestorage.app",
  messagingSenderId: "761281725088",
};

// Initialize Firebase securely (preventing multiple instances during HMR)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
export const auth = getAuth(app);
// Initialize Firestore with offline persistence
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  }, "ai-studio-eksuthautomatedb-11633c3c-efde-4345-bd5a-8516ed399d58");
} catch (e) {
  dbInstance = getFirestore(app, "ai-studio-eksuthautomatedb-11633c3c-efde-4345-bd5a-8516ed399d58");
}
export const db = dbInstance;

export const getCollectionName = (name: string) => {
  const isDemo = localStorage.getItem('demo_mode') === 'true';
  return isDemo ? `demo_${name}` : name;
};
