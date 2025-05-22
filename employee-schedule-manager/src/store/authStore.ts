import { create } from 'zustand';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'employee';
  color?: string;
  passwordResetRequired?: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  login: async (username: string, password: string) => {
    try {
      const email = `${username}@employeeschedulemanager.com`; // Map username to email
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Fetch additional user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        throw new Error('User data not found in Firestore');
      }

      const userData = userDoc.data() as User;
      set({ user: { ...userData, id: firebaseUser.uid }, isLoading: false });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
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
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      useAuthStore.setState({ user: { ...userData, id: firebaseUser.uid }, isLoading: false });
    } else {
      useAuthStore.setState({ user: null, isLoading: false });
    }
  } else {
    useAuthStore.setState({ user: null, isLoading: false });
  }
});