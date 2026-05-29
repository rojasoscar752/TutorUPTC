import { createContext, useContext } from 'react';
import { useOffline } from '../hooks/useOffline';

const OfflineContext = createContext({ isOffline: false });

export function OfflineProvider({ children }) {
  const isOffline = useOffline();

  return (
    <OfflineContext.Provider value={{ isOffline }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOfflineState() {
  return useContext(OfflineContext);
}
