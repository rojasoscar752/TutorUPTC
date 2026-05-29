import React, { useState, useEffect } from 'react';
import { Download, Share, X, PlusSquare } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Check if the app is already running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          window.navigator.standalone === true;
    
    if (isStandalone) return;

    // 2. Listen to Android's beforeinstallprompt event (RNF-02)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 3. Detect iOS Safari UA (RNF-03)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const detectIOS = /iphone|ipad|ipod/.test(userAgent);
    const detectSafari = userAgent.includes('safari') && !userAgent.includes('crios') && !userAgent.includes('chrome');

    if (detectIOS && detectSafari) {
      setIsIOS(true);
      
      // Setup simple session counter to mimic "2 visits in 5 minutes" check or just show after a small delay
      const visitCount = parseInt(sessionStorage.getItem('tutoruptc_visits') || '0', 10);
      const newCount = visitCount + 1;
      sessionStorage.setItem('tutoruptc_visits', newCount.toString());
      
      if (newCount >= 1) { // Show on first visit for demonstrability, can be configured
        setShowPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    // Trigger the installation prompt
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleClose = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Installation Banner */}
      <div style={styles.promptContainer} className="animate-fade-in">
        <div style={styles.promptContent}>
          <div style={styles.appInfo}>
            <div style={styles.appIconPlaceholder}>T</div>
            <div>
              <h4 style={styles.appTitle}>TutorUPTC</h4>
              <p style={styles.appSub}>Instala la app para acceso rápido y offline.</p>
            </div>
          </div>
          <div style={styles.actionGroup}>
            <button className="btn btn-accent" style={styles.installBtn} onClick={handleInstallClick}>
              <Download size={16} /> Instalar
            </button>
            <button style={styles.closeBtn} onClick={handleClose} aria-label="Cerrar prompt">
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Manual Instructions Modal (RNF-03) */}
      {showIOSInstructions && (
        <div style={styles.modalOverlay} onClick={handleClose}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Instalar en tu iPhone / iPad</h3>
              <button style={styles.closeBtn} onClick={handleClose}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <p style={styles.instructionText}>
                Para agregar <strong>TutorUPTC</strong> a tu pantalla de inicio:
              </p>
              <ol style={styles.instructionList}>
                <li style={styles.listItem}>
                  Toca el botón de <strong>Compartir</strong> en la barra de navegación de Safari:
                  <div style={styles.iconVisual}><Share size={20} color="var(--accent)" /></div>
                </li>
                <li style={styles.listItem}>
                  Desplázate hacia abajo y selecciona <strong>"Agregar al inicio"</strong>:
                  <div style={styles.iconVisual}><PlusSquare size={20} color="var(--accent)" /></div>
                </li>
              </ol>
            </div>
            <button className="btn btn-primary" style={styles.gotItBtn} onClick={handleClose}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  promptContainer: {
    position: 'fixed',
    bottom: '4.5rem', // Offset above mobile navigation bar
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 2rem)',
    maxWidth: '500px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 1000,
    padding: '0.75rem 1rem',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)'
  },
  promptContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem'
  },
  appInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  appIconPlaceholder: {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--primary)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '1.25rem',
    border: '1px solid var(--accent)'
  },
  appTitle: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  appSub: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  },
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  installBtn: {
    padding: '0.4rem 0.8rem',
    fontSize: '0.8rem',
    minHeight: '36px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  // Modal styles for iOS instructions
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 1200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem'
  },
  modalContent: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    padding: '1.5rem',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  instructionText: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)'
  },
  instructionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingLeft: '1.25rem'
  },
  listItem: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    lineHeight: '1.4'
  },
  iconVisual: {
    display: 'inline-flex',
    verticalAlign: 'middle',
    marginLeft: '0.5rem',
    backgroundColor: 'hsla(0, 0%, 100%, 0.05)',
    padding: '0.2rem',
    borderRadius: '4px'
  },
  gotItBtn: {
    marginTop: '0.5rem',
    alignSelf: 'stretch'
  }
};
