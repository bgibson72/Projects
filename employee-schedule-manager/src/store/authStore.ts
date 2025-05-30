// NOTE: The 'role' field on the User object (from Firestore) is the sole source of truth for admin/employee access control throughout the app.
// Do NOT use 'addedByAdmin' for access checks. Only 'role' should be used to determine admin privileges.
// This ensures that only users with role === 'admin' can access admin-only features, regardless of how their account was created.

import { create } from 'zustand';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'employee';
  color?: string;
  passwordResetRequired?: boolean;
  // Add all employee fields for type safety
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  position?: string;
  photoUrl?: string; // Add this line for profile picture support
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  login: async (emailOrUsername: string, password: string) => {
    try {
      let email = emailOrUsername;
      // If input does not look like an email, treat as username and look up email
      if (!emailOrUsername.includes('@')) {
        const q = query(collection(db, 'employees'), where('username', '==', emailOrUsername));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const employee = snapshot.docs[0].data();
          email = employee.email;
        } else {
          throw new Error('No user found with that username.');
        }
      }
      console.log('[LOGIN] Attempting signInWithEmailAndPassword for', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      await firebaseUser.getIdToken(true);
      const idTokenResult = await firebaseUser.getIdTokenResult();
      console.log('[LOGIN] Custom claims:', idTokenResult.claims);
      console.log('[LOGIN] Firebase UID:', firebaseUser.uid);
      // Fetch additional user data from Firestore (employees collection)
      let userDoc = await getDoc(doc(db, 'employees', firebaseUser.uid));
      console.log('[LOGIN] Firestore getDoc by UID:', userDoc.exists());
      if (!userDoc.exists()) {
        // Try by email if not found by UID
        const q = query(collection(db, 'employees'), where('email', '==', firebaseUser.email));
        const snapshot = await getDocs(q);
        console.log('[LOGIN] Firestore getDocs by email:', snapshot.size);
        if (!snapshot.empty) {
          userDoc = snapshot.docs[0];
        }
      }
      if (!userDoc.exists()) {
        // If admin, allow login without employee record
        if (idTokenResult.claims.role === 'admin') {
          set({ user: {
            id: firebaseUser.uid,
            username: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email || '',
            role: 'admin',
            email: firebaseUser.email || '',
          }, isLoading: false });
          return;
        }
        console.error('[LOGIN] User data not found in employees collection for UID or email:', firebaseUser.uid, firebaseUser.email);
        throw new Error('User data not found in the employees database. Please contact your administrator.');
      }
      const userData = userDoc.data() as User;
      console.log('[LOGIN] Firestore user data loaded:', userData);
      set({ user: { ...userData, id: firebaseUser.uid }, isLoading: false });
    } catch (error: any) {
      let message = 'An unknown error occurred.';
      if (error.code === 'auth/user-not-found') {
        message = 'No user found with that username.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password.';
      } else if (error.message) {
        message = error.message;
      }
      console.error('[LOGIN] Error:', error);
      set({ isLoading: false });
      throw new Error(message);
    }
  },
  logout: async () => {
    await signOut(auth);
    set({ user: null, isLoading: false });
  },
  checkAuth: () => !!get().user,
}));

// Listen for auth state changes
onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
  if (firebaseUser) {
    let userDoc = await getDoc(doc(db, 'employees', firebaseUser.uid));
    if (!userDoc.exists()) {
      // Try by email if not found by UID
      const q = query(collection(db, 'employees'), where('email', '==', firebaseUser.email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        userDoc = snapshot.docs[0];
      }
    }
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      console.log('[AUTH STATE] Firestore user data loaded:', userData);
      useAuthStore.setState({ user: { ...userData, id: firebaseUser.uid }, isLoading: false });
    } else {
      // Check for admin via custom claims
      const idTokenResult = await firebaseUser.getIdTokenResult();
      if (idTokenResult.claims.role === 'admin') {
        useAuthStore.setState({ user: {
          id: firebaseUser.uid,
          username: firebaseUser.email || firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email || 'Admin',
          role: 'admin',
          email: firebaseUser.email || '',
        }, isLoading: false });
        return;
      }
      useAuthStore.setState({ user: null, isLoading: false });
    }
  } else {
    useAuthStore.setState({ user: null, isLoading: false });
  }
});