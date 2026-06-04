import { useState, useEffect } from 'react';

/**
 * Custom hook to monitor client network connectivity status.
 * Returns true if the client is offline, false if online.
 */
export function useOffline() {
  const [isOffline, setIsOffline] = useState(() => (
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  ));

  useEffect(() => {
    const updateNetworkStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    updateNetworkStatus();
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  return isOffline;
}
