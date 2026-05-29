import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOfflineState } from '../context/OfflineContext';

export function OfflineBanner() {
  const { isOffline } = useOfflineState();

  if (!isOffline) return null;

  return (
    <div style={styles.bannerContainer} className="animate-fade-in" role="alert">
      <div style={styles.bannerContent}>
        <WifiOff size={18} style={styles.icon} />
        <span style={styles.text}>
          Sin conexión — algunos datos pueden estar desactualizados
        </span>
      </div>
    </div>
  );
}

const styles = {
  bannerContainer: {
    backgroundColor: 'hsla(38, 92%, 50%, 0.15)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderBottom: '1px solid hsla(38, 92%, 50%, 0.3)',
    color: 'hsl(38, 95%, 70%)',
    padding: '0.6rem 1rem',
    width: '100%',
    zIndex: 1100,
    position: 'sticky',
    top: 0,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  },
  bannerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  icon: {
    flexShrink: 0,
    animation: 'pulse 2s infinite ease-in-out'
  },
  text: {
    fontSize: '0.85rem',
    fontWeight: '600',
    letterSpacing: '0.01em',
    textAlign: 'center'
  }
};
