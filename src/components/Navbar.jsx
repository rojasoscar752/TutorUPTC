import React from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Calendar, BarChart3, User, LogOut, LogIn, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, profile, logout } = useAuth();

  return (
    <>
      {/* Desktop Header Top Bar */}
      <header style={styles.desktopHeader}>
        <div style={styles.headerContainer}>
          <NavLink to="/" style={styles.logoGroup}>
            <div style={styles.logoSymbol}>T</div>
            <span style={styles.logoText}>Tutor<span style={{ color: 'var(--accent)' }}>UPTC</span></span>
          </NavLink>

          <nav style={styles.desktopNav}>
            <NavLink to="/" style={({ isActive }) => isActive ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
              <Search size={18} /> Explorar
            </NavLink>
            
            {user && (
              <>
                <NavLink to="/sessions" style={({ isActive }) => isActive ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
                  <Calendar size={18} /> Mis Tutorías
                </NavLink>
                <NavLink to="/student" style={({ isActive }) => isActive ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
                  <User size={18} /> Consola Estudiante
                </NavLink>
                
                {profile?.role === 'tutor' && (
                  <NavLink to="/dashboard" style={({ isActive }) => isActive ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
                    <BarChart3 size={18} /> Panel Tutor
                  </NavLink>
                )}
              </>
            )}
          </nav>

          <div style={styles.userActions}>
            {user ? (
              <div style={styles.profileBadge}>
                <NavLink to="/student" style={styles.profileLinkWrapper}>
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt={profile.displayName} style={styles.avatar} />
                  ) : (
                    <div style={styles.avatarFallback}>{profile?.displayName?.[0] || 'U'}</div>
                  )}
                  {profile?.isVerified && (
                    <span title="Verificado" style={styles.verifiedBadge}>
                      <Award size={14} color="var(--text-on-accent)" />
                    </span>
                  )}
                  <span style={styles.userName}>{profile?.displayName?.split(' ')[0]}</span>
                </NavLink>
                <button onClick={logout} style={styles.logoutBtn} title="Cerrar sesión">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <NavLink to="/login" className="btn btn-accent" style={styles.loginBtn}>
                <LogIn size={16} /> Acceder
              </NavLink>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (RNF-23) */}
      <nav style={styles.mobileNav}>
        <NavLink to="/" style={({ isActive }) => isActive ? { ...styles.mobileLink, ...styles.mobileLinkActive } : styles.mobileLink}>
          <Search size={22} />
          <span>Buscar</span>
        </NavLink>

        {user ? (
          <>
            <NavLink to="/sessions" style={({ isActive }) => isActive ? { ...styles.mobileLink, ...styles.mobileLinkActive } : styles.mobileLink}>
              <Calendar size={22} />
              <span>Clases</span>
            </NavLink>

            {profile?.role === 'tutor' ? (
              <NavLink to="/dashboard" style={({ isActive }) => isActive ? { ...styles.mobileLink, ...styles.mobileLinkActive } : styles.mobileLink}>
                <BarChart3 size={22} />
                <span>Tutor</span>
              </NavLink>
            ) : (
              <NavLink to="/student" style={({ isActive }) => isActive ? { ...styles.mobileLink, ...styles.mobileLinkActive } : styles.mobileLink}>
                <User size={22} />
                <span>Perfil</span>
              </NavLink>
            )}
            
            <button onClick={logout} style={styles.mobileLogoutBtn}>
              <LogOut size={22} />
              <span>Salir</span>
            </button>
          </>
        ) : (
          <NavLink to="/login" style={({ isActive }) => isActive ? { ...styles.mobileLink, ...styles.mobileLinkActive } : styles.mobileLink}>
            <LogIn size={22} />
            <span>Acceder</span>
          </NavLink>
        )}
      </nav>
    </>
  );
}

const styles = {
  desktopHeader: {
    backgroundColor: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border-glass)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    width: '100%',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'none' // Hidden on mobile, shown on desktop (handled in media queries below/via CSS fallback)
  },
  headerContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0.8rem 1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none'
  },
  logoSymbol: {
    width: '32px',
    height: '32px',
    backgroundColor: 'var(--primary-light)',
    border: '1px solid var(--accent)',
    borderRadius: '8px',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '1.1rem'
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em'
  },
  desktopNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    textDecoration: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    fontWeight: '600',
    padding: '0.5rem 0.8rem',
    borderRadius: 'var(--radius-sm)',
    transition: 'all 0.2s ease',
    minHeight: 'var(--touch-target)' // WCAG accessibility
  },
  navLinkActive: {
    color: 'var(--accent)',
    backgroundColor: 'hsla(45, 85%, 52%, 0.08)',
    borderBottom: '2px solid var(--accent)'
  },
  userActions: {
    display: 'flex',
    alignItems: 'center'
  },
  profileBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    backgroundColor: 'hsla(0, 0%, 100%, 0.04)',
    padding: '0.4rem 0.8rem',
    borderRadius: '9999px',
    border: '1px solid var(--border-glass)',
    position: 'relative'
  },
  profileLinkWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer'
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  avatarFallback: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-light)',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.8rem'
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: '-2px',
    left: '20px',
    backgroundColor: 'var(--accent)',
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--bg-surface)'
  },
  userName: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '0.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s ease'
  },
  loginBtn: {
    fontSize: '0.85rem',
    padding: '0.5rem 1rem',
    minHeight: '36px'
  },
  
  // Mobile Nav Styles
  mobileNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4rem',
    backgroundColor: 'var(--bg-surface)',
    borderTop: '1px solid var(--border-glass)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 1000,
    boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)'
  },
  mobileLink: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    textDecoration: 'none',
    fontSize: '0.7rem',
    fontWeight: '600',
    flex: 1,
    height: '100%',
    gap: '0.2rem',
    transition: 'color 0.2s ease',
    minWidth: '44px' // Accessibility
  },
  mobileLinkActive: {
    color: 'var(--accent)'
  },
  mobileLogoutBtn: {
    background: 'none',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.7rem',
    fontWeight: '600',
    flex: 1,
    height: '100%',
    gap: '0.2rem',
    cursor: 'pointer'
  }
};

// Add responsive media query styles directly into HTML head once via script
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    @media (min-width: 768px) {
      header[style*="display: none"] {
        display: block !important;
      }
      nav[style*="position: fixed"] {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(styleEl);
}

