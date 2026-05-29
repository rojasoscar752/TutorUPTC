import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setAuthLoading(true);
    try {
      await login();
      // Redirect home after successful login
      navigate('/');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error al autenticar con Google. Inténtalo de nuevo.');
      setAuthLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div className="glass-card" style={styles.loginCard}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>T</div>
          <h2 style={styles.title}>Tutor<span style={{ color: 'var(--accent)' }}>UPTC</span></h2>
          <p style={styles.subtitle}>
            Portal de Tutorías Académicas entre Estudiantes
          </p>
          <span style={styles.institution}>
            Universidad Pedagógica y Tecnológica de Colombia
          </span>
        </div>

        {errorMsg && (
          <div style={styles.errorBox} className="animate-fade-in">
            <ShieldAlert size={18} color="var(--danger)" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div style={styles.actionsBox}>
          <p style={styles.introText}>
            Accede con tu **correo institucional de la UPTC** (@uptc.edu.co) para registrarte, explorar tutores calificados o inscribirte como colaborador.
          </p>

          <button 
            onClick={handleGoogleLogin} 
            className="btn btn-accent" 
            style={styles.googleBtn}
            disabled={authLoading}
          >
            <LogIn size={18} />
            <span>{authLoading ? 'Iniciando sesión...' : 'Ingresar con cuenta Google UPTC'}</span>
          </button>
        </div>

        <div style={styles.footer}>
          <p style={styles.disclaimer}>
            Al ingresar, aceptas los términos de convivencia de la institución. Tu perfil será administrado 
            bajo el control de la bitácora académica TutorUPTC v1.0.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '70vh',
    padding: '1rem'
  },
  loginCard: {
    width: '100%',
    maxWidth: '420px',
    padding: '2.5rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    boxShadow: 'var(--shadow-lg)',
    textAlign: 'center'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem'
  },
  logoBadge: {
    width: '56px',
    height: '56px',
    backgroundColor: 'var(--primary-light)',
    border: '2px solid var(--accent)',
    borderRadius: '16px',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '2rem',
    marginBottom: '0.5rem',
    boxShadow: '0 4px 12px rgba(15, 56, 22, 0.3)'
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '800',
    letterSpacing: '-0.02em'
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.3'
  },
  institution: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginTop: '0.2rem'
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'hsla(354, 70%, 54%, 0.15)',
    border: '1px solid var(--danger)',
    borderRadius: 'var(--radius-sm)',
    color: 'hsl(354, 90%, 75%)',
    padding: '0.75rem 1rem',
    fontSize: '0.8rem',
    textAlign: 'left',
    lineHeight: '1.4'
  },
  actionsBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    marginTop: '0.5rem'
  },
  introText: {
    fontSize: '0.85rem',
    lineHeight: '1.5',
    color: 'var(--text-secondary)'
  },
  googleBtn: {
    width: '100%',
    fontSize: '0.9rem',
    display: 'flex',
    gap: '0.75rem',
    padding: '0.8rem'
  },
  footer: {
    borderTop: '1px solid var(--border-glass)',
    paddingTop: '1rem',
    marginTop: '0.5rem'
  },
  disclaimer: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4'
  }
};

