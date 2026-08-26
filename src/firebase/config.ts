import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0829665348",
  appId: "1:761281725088:web:e0077c0860ef4a601fbfc5",
  apiKey: "AIzaSyBxVlPdAoUS1pPfOX3KLFNv17eQPR42jew",
  authDomain: "gen-lang-client-0829665348.firebaseapp.com",
  storageBucket: "gen-lang-client-0829665348.firebasestorage.app",
  messagingSenderId: "761281725088",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-eksuthautomatedb-11633c3c-efde-4345-bd5a-8516ed399d58");
