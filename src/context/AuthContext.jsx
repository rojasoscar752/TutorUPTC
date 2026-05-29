import { createContext, useContext, useState, useEffect } from 'react';
import { 
  subscribeToAuthChanges, 
  fetchUserProfile, 
  saveUserProfile, 
  signInWithGoogle, 
  logOut 
} from '../db/firebase';
import { 
  saveLocalProfile, 
  getLocalProfile, 
  clearAllLocalData 
} from '../db/localDb';
import { useOffline } from '../hooks/useOffline';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  login: async () => {},
  logout: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isOffline = useOffline();

  // Load profile when auth state changes
  useEffect(() => {
    let unsubscribe = () => {};

    if (!isOffline) {
      // ONLINE: Listen to Auth state changes via unified wrapper
      unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          
          try {
            // Check if profile exists using wrapper
            let userProfile = await fetchUserProfile(firebaseUser.uid);
            
            if (!userProfile) {
              // Create default profile for UPTC student
              userProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                role: 'student', // default role
                isVerified: false,
                createdAt: new Date().toISOString(),
                biography: 'Estudiante UPTC.'
              };
              await saveUserProfile(firebaseUser.uid, userProfile);
            }
            
            setProfile(userProfile);
            // RNF-27: Save profile locally for offline access
            await saveLocalProfile(userProfile);
          } catch (error) {
            console.error('Error fetching user profile:', error);
            // Fallback to local profile if fetch fails
            const cachedProfile = await getLocalProfile();
            if (cachedProfile) setProfile(cachedProfile);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });
    } else {
      // OFFLINE: Fallback to local cached profile immediately
      const loadCachedProfile = async () => {
        const cachedProfile = await getLocalProfile();
        if (cachedProfile) {
          // Mock an active user structure using cached details
          setUser({
            uid: cachedProfile.uid,
            email: cachedProfile.email,
            displayName: cachedProfile.displayName,
            photoURL: cachedProfile.photoURL,
            isAnonymous: false
          });
          setProfile(cachedProfile);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      };
      
      loadCachedProfile();
    }

    return () => unsubscribe();
  }, [isOffline]);

  // Login handler
  const login = async () => {
    if (isOffline) {
      throw new Error('No es posible iniciar sesión sin conexión a Internet.');
    }
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      return user;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Logout handler (RNF-31)
  const logout = async () => {
    try {
      // 1. Sign out (deletes mock or signs out from Firebase)
      await logOut();
      
      // 2. RNF-31: Clear IndexedDB local database
      await clearAllLocalData();
      
      // 3. RNF-31: Clear Service Worker cache
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
        console.log('Service Worker cache cleared successfully upon sign out.');
      }
      
      setUser(null);
      setProfile(null);
      
      // Force reload page to refresh service worker state cleanly
      window.location.replace('/');
    } catch (error) {
      console.error('Error during logout/cleanup:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
export { AuthContext };
