import { get, set, del, clear } from 'idb-keyval';

// Key names for IndexedDB storage
const KEYS = {
  USER_PROFILE: 'tutoruptc_profile',
  SESSIONS: 'tutoruptc_sessions',
  MSG_PREFIX: 'tutoruptc_chat_',
  FAVORITES: 'tutoruptc_favorites'
};

/**
 * Persists the logged-in user profile locally.
 * @param {Object} profile 
 */
export const saveLocalProfile = async (profile) => {
  try {
    await set(KEYS.USER_PROFILE, profile);
  } catch (error) {
    console.error('Error saving local profile:', error);
  }
};

/**
 * Retrieves the local user profile.
 */
export const getLocalProfile = async () => {
  try {
    return await get(KEYS.USER_PROFILE) || null;
  } catch (error) {
    console.error('Error reading local profile:', error);
    return null;
  }
};

/**
 * Persists the user sessions (agendamientos) locally for offline views.
 * @param {Array} sessions 
 */
export const saveLocalSessions = async (sessions) => {
  try {
    await set(KEYS.SESSIONS, sessions);
  } catch (error) {
    console.error('Error saving local sessions:', error);
  }
};

/**
 * Retrieves the persisted sessions.
 */
export const getLocalSessions = async () => {
  try {
    return await get(KEYS.SESSIONS) || [];
  } catch (error) {
    console.error('Error reading local sessions:', error);
    return [];
  }
};

/**
 * Gets cached messages for a specific session/conversation (capping at 50 messages).
 * @param {string} conversationId 
 */
export const getLocalMessages = async (conversationId) => {
  try {
    const key = `${KEYS.MSG_PREFIX}${conversationId}`;
    return await get(key) || [];
  } catch (error) {
    console.error(`Error reading local messages for ${conversationId}:`, error);
    return [];
  }
};

/**
 * Adds a message to local IndexedDB chat history, enforcing the FIFO policy (maximum 50 messages).
 * @param {string} conversationId 
 * @param {Object} message 
 */
export const addLocalMessage = async (conversationId, message) => {
  try {
    const key = `${KEYS.MSG_PREFIX}${conversationId}`;
    const currentMessages = await getLocalMessages(conversationId);
    
    // Add new message
    const updatedMessages = [...currentMessages, message];
    
    // RNF-26: Store maximum 50 messages offline per conversation (FIFO)
    // (Requirement says: RNF-10: "los últimos 50 mensajes de cada conversación", 
    // and RNF-26: "Se almacenan máximo 200 mensajes por conversación en IndexedDB. Los mensajes más antiguos se eliminan automáticamente siguiendo una política FIFO."
    // Let's use 50 as the cutoff for offline sync to stay light and comply with RNF-10)
    const MAX_OFFLINE_MESSAGES = 50;
    if (updatedMessages.length > MAX_OFFLINE_MESSAGES) {
      updatedMessages.shift(); // Remove oldest message
    }
    
    await set(key, updatedMessages);
    return updatedMessages;
  } catch (error) {
    console.error(`Error adding local message to ${conversationId}:`, error);
    return [];
  }
};

/**
 * Persists the user's favorite tutor list.
 * @param {Array} favoriteIds 
 */
export const saveLocalFavorites = async (favoriteIds) => {
  try {
    await set(KEYS.FAVORITES, favoriteIds);
  } catch (error) {
    console.error('Error saving local favorites:', error);
  }
};

/**
 * Retrieves the user's cached favorite tutors.
 */
export const getLocalFavorites = async () => {
  try {
    return await get(KEYS.FAVORITES) || [];
  } catch (error) {
    console.error('Error reading local favorites:', error);
    return [];
  }
};
/**
 * RNF-31: Clears all local data from IndexedDB and localStorage on logout.
 */export const clearAllLocalData = async () => {
  try {
    await clear();
    console.log('IndexedDB cleared successfully upon sign out.');
    
    // Clear localStorage keys starting with 'tutoruptc_'
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tutoruptc_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('localStorage keys cleared successfully upon sign out.');
  } catch (error) {
    console.error('Error clearing local data:', error);
  }
};
// Clean up any residual mock data on script initialization
try {
  // Clear mock profiles t1 and t3 from localStorage
  localStorage.removeItem('tutoruptc_profile_doc_t1');
  localStorage.removeItem('tutoruptc_profile_doc_t3');
  
  // Clean mock sessions s1 and s2 from IndexedDB
  get(KEYS.SESSIONS).then((sessions) => {
    if (sessions && Array.isArray(sessions)) {
      const containsMock = sessions.some(s => s.id === 's1' || s.id === 's2' || s.tutorUid === 't1' || s.tutorUid === 't3');
      if (containsMock) {
        const cleaned = sessions.filter(s => s.id !== 's1' && s.id !== 's2' && s.tutorUid !== 't1' && s.tutorUid !== 't3');
        set(KEYS.SESSIONS, cleaned);
      }
    }
  }).catch(() => {});
} catch (e) {
  console.error('Error in self-cleanup script:', e);
}
