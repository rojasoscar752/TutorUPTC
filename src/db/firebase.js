import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if credentials are valid (not undefined and not default template placeholders)
const isConfigValid = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'your_api_key_here' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'tutoruptc-firebase-id';

let auth = null;
let db = null;
let messaging = null;
let useMock = !isConfigValid;

if (!useMock) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    isSupported().then((supported) => {
      if (supported) messaging = getMessaging(app);
    });
    console.log('Firebase initialized successfully in PRODUCTION mode.');
  } catch (err) {
    console.error('Failed to initialize production Firebase. Switching to Demo Mode:', err);
    useMock = true;
  }
} else {
  console.warn('TutorUPTC: running in LOCAL DEMO MODE. Configure your Firebase credentials in .env to connect to production.');
}

// ==========================================
// MOCK DEMO IMPLEMENTATION
// ==========================================
let mockUser = null;
const MOCK_USER_STORAGE_KEY = 'tutoruptc_mock_auth_user';
const mockListeners = new Set();

// Load cached mock login on startup
try {
  const saved = localStorage.getItem(MOCK_USER_STORAGE_KEY);
  if (saved) {
    mockUser = JSON.parse(saved);
  }
} catch (e) {}

const triggerMockAuthChange = () => {
  mockListeners.forEach(callback => callback(mockUser));
};

// ==========================================
// EXPORTED UNIFIED API WRAPPERS
// ==========================================

/**
 * Subscribes to authentication state changes.
 * Supports both Firebase onAuthStateChanged and Mock triggers.
 */
export const subscribeToAuthChanges = (callback) => {
  if (useMock) {
    mockListeners.add(callback);
    // Trigger immediately with current state
    setTimeout(() => callback(mockUser), 10);
    return () => {
      mockListeners.delete(callback);
    };
  } else {
    return onAuthStateChanged(auth, callback);
  }
};

/**
 * Sign in using Google Single-Sign-On.
 * In mock mode, signs in as a pre-configured UPTC student/tutor.
 */
export const signInWithGoogle = async () => {
  if (useMock) {
    // Generate a default mock UPTC student profile
    const demoUser = {
      uid: 't2', // Matches Oscar Ivan Rojas in mock listings
      email: 'oscar.rojas01@uptc.edu.co',
      displayName: 'Oscar Ivan Rojas cuesta',
      photoURL: '/oscar.jpg',
      isAnonymous: false
    };
    
    mockUser = demoUser;
    localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(demoUser));
    triggerMockAuthChange();
    return demoUser;
  } else {
    const googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }
};

/**
 * Signs the user out. Purges mock state if running in demo mode.
 */
export const logOut = async () => {
  if (useMock) {
    mockUser = null;
    localStorage.removeItem(MOCK_USER_STORAGE_KEY);
    triggerMockAuthChange();
  } else {
    await signOut(auth);
  }
};

/**
 * Retrieves a user profile doc.
 * Reads from Firestore or local storage if in demo mode.
 */
export const fetchUserProfile = async (uid) => {
  if (useMock) {
    const localProfileKey = `tutoruptc_profile_doc_${uid}`;
    const localData = localStorage.getItem(localProfileKey);
    if (localData) {
      return JSON.parse(localData);
    }
    
    // If logging in for the first time, return a default mock tutor/student profile matching UID t2
    if (uid === 't2') {
      return {
        uid: 't2',
        email: 'oscar.rojas01@uptc.edu.co',
        displayName: 'Oscar Ivan Rojas cuesta',
        photoURL: '/oscar.jpg',
        role: 'tutor', // Logged in as tutor for testing dashboard
        isVerified: true,
        createdAt: new Date().toISOString(),
        biography: 'Tutor de cálculo diferencial, integral y álgebra lineal. Explicaciones paso a paso con metodología adaptable a cualquier nivel académico.'
      };
    }
    return null;
  } else {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  }
};

/**
 * Updates or creates a user profile doc.
 * Writes to Firestore or local storage if in demo mode.
 */
export const saveUserProfile = async (uid, data) => {
  if (useMock) {
    const localProfileKey = `tutoruptc_profile_doc_${uid}`;
    localStorage.setItem(localProfileKey, JSON.stringify(data));
  } else {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, data);
  }
};

export { auth, db, messaging, useMock };
