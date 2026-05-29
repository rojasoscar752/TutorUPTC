import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, doc, getDoc, setDoc,
  collection, query, where, getDocs, onSnapshot 
} from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getLocalSessions, saveLocalSessions } from './localDb';

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
    
    // If logging in for the first time, return a default mock student profile matching UID t2
    if (uid === 't2') {
      return {
        uid: 't2',
        email: 'oscar.rojas01@uptc.edu.co',
        displayName: 'Oscar Ivan Rojas cuesta',
        photoURL: '/oscar.jpg',
        role: 'student',
        isVerified: false,
        createdAt: new Date().toISOString(),
        biography: 'Estudiante UPTC.'
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
 * Fetches a single user/tutor profile by their UID.
 */
export const fetchTutorById = async (uid) => {
  if (useMock) {
    const localProfileKey = `tutoruptc_profile_doc_${uid}`;
    const localData = localStorage.getItem(localProfileKey);
    return localData ? JSON.parse(localData) : null;
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

/**
 * Fetches all verified tutors from the database (Firestore or LocalMock).
 */
export const fetchTutorsList = async () => {
  if (useMock) {
    const list = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('tutoruptc_profile_doc_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.role === 'tutor' && data.isVerified) {
            list.push(data);
          }
        } catch (e) {}
      }
    }
    return list;
  } else {
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'tutor'), 
      where('isVerified', '==', true)
    );
    const querySnapshot = await getDocs(q);
    const list = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data());
    });
    return list;
  }
};

/**
 * Fetches a single tutor profile by their slug username from the database.
 */
export const fetchTutorByUsername = async (username) => {
  if (useMock) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('tutoruptc_profile_doc_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.username === username) {
            return data;
          }
        } catch (e) {}
      }
    }
    return null;
  } else {
    const q = query(
      collection(db, 'users'), 
      where('username', '==', username)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
    return null;
  }
};

/**
 * Saves a new tutoring session to Firestore or localStorage depending on mode.
 */
export const saveSession = async (sessionData) => {
  if (useMock) {
    const currentSessions = await getLocalSessions();
    const updated = [...currentSessions, sessionData];
    await saveLocalSessions(updated);
  } else {
    // Write to Firestore collection 'sessions'
    const docRef = doc(db, 'sessions', sessionData.id);
    await setDoc(docRef, sessionData);
    
    // Also save locally for offline access (sync cache)
    const currentSessions = await getLocalSessions();
    const updated = [...currentSessions, sessionData];
    await saveLocalSessions(updated);
  }
};

/**
 * Listens to real-time session updates where the user is either the tutor or student.
 */
export const subscribeToSessions = (uid, role, callback) => {
  if (useMock) {
    return () => {};
  } else {
    const field = role === 'tutor' ? 'tutorUid' : 'studentUid';
    const q = query(
      collection(db, 'sessions'),
      where(field, '==', uid)
    );
    
    return onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      callback(list);
    });
  }
};

export { auth, db, messaging, useMock };
