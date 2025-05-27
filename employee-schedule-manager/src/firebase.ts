import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_6Bx3JIa46sU0tG8L_a0npHpYRsl7r2Y",
  authDomain: "schedule-manager-496e0.firebaseapp.com",
  projectId: "schedule-manager-496e0",
  storageBucket: "schedule-manager-496e0.firebasestorage.app",
  messagingSenderId: "79587672632",
  appId: "1:79587672632:web:99ad6c998d78c04eac9ccd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };