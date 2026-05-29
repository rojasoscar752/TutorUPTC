import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Calendar, Award, Upload, ShieldCheck, Clock, FileText, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLocalFavorites, getLocalSessions, saveLocalProfile } from '../db/localDb';
import { saveUserProfile } from '../db/firebase';

// Reusable mock tutors to resolve bookmark lists
const MOCK_TUTORS = [
  { uid: 't1', username: 'anderson-carvajal', displayName: 'Anderson Carvajal', discipline: 'Sistemas', photoURL: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', isVerified: true },
  { uid: 't2', username: 'oscar-rojas', displayName: 'Oscar Ivan Rojas', discipline: 'Matemáticas', photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', isVerified: true },
  { uid: 't3', username: 'tomas-useche', displayName: 'Tomas Useche', discipline: 'Física', photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', isVerified: false }
];

export function StudentConsole() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile_tab'); // 'profile_tab', 'classes', 'favorites', 'verify'
  const [favoriteTutors, setFavoriteTutors] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  
  // Verification states (RF-11)
  const [selectedFile, setSelectedFile] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('unsubmitted'); // 'unsubmitted', 'pending', 'approved'
  const [uploadProgress, setUploadProgress] = useState(false);

  useEffect(() => {
    const loadStudentData = async () => {
      // 1. Load favorites from IndexedDB
      const favIds = await getLocalFavorites();
      const favList = MOCK_TUTORS.filter(t => favIds.includes(t.uid));
      setFavoriteTutors(favList);

      // 2. Load active sessions
      const sessions = await getLocalSessions();
      const active = sessions.filter(s => s.status === 'scheduled');
      setActiveSessions(active);
    };
    
    loadStudentData();
  }, []);

  // RF-11: ID verification simulation
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadId = (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploadProgress(true);
    
    // Simulate upload delay
    setTimeout(() => {
      setUploadProgress(false);
      setVerificationStatus('pending');
      setSelectedFile(null);
    }, 2500);
  };

  // Simulate admin card approval for presentations (RF-11/RF-12 demo)
  const handleSimulateApproval = async () => {
    if (!profile) return;
    
    const updatedProfile = {
      ...profile,
      role: 'tutor',
      isVerified: true
    };
    
    try {
      await saveUserProfile(profile.uid, updatedProfile);
      await saveLocalProfile(updatedProfile);
      setVerificationStatus('approved');
      
      alert('¡Simulación Exitosa! El carné ha sido aprobado. Tu rol ahora es "Tutor" y estás verificado. La página se recargará para habilitar tu panel.');
      window.location.reload();
    } catch (err) {
      console.error('Error simulating approval:', err);
    }
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      <header style={styles.header}>
        <h1>Consola del Estudiante</h1>
        <p>Administra tu agenda de tutorías activas, consulta tus colaboradores favoritos y solicita tu verificación como tutor.</p>
      </header>

      {/* Tab bar */}
      <div style={styles.tabBar}>
        <button 
          style={{...styles.tabBtn, borderBottomColor: activeTab === 'profile_tab' ? 'var(--accent)' : 'transparent', color: activeTab === 'profile_tab' ? 'var(--accent)' : 'var(--text-secondary)'}}
          onClick={() => setActiveTab('profile_tab')}
        >
          <User size={16} /> Mi Perfil UPTC
        </button>
        <button 
          style={{...styles.tabBtn, borderBottomColor: activeTab === 'classes' ? 'var(--accent)' : 'transparent', color: activeTab === 'classes' ? 'var(--accent)' : 'var(--text-secondary)'}}
          onClick={() => setActiveTab('classes')}
        >
          <Calendar size={16} /> Tutorías Activas ({activeSessions.length})
        </button>
        <button 
          style={{...styles.tabBtn, borderBottomColor: activeTab === 'favorites' ? 'var(--accent)' : 'transparent', color: activeTab === 'favorites' ? 'var(--accent)' : 'var(--text-secondary)'}}
          onClick={() => setActiveTab('favorites')}
        >
          <Heart size={16} /> Mis Favoritos ({favoriteTutors.length})
        </button>
        <button 
          style={{...styles.tabBtn, borderBottomColor: activeTab === 'verify' ? 'var(--accent)' : 'transparent', color: activeTab === 'verify' ? 'var(--accent)' : 'var(--text-secondary)'}}
          onClick={() => setActiveTab('verify')}
        >
          <Award size={16} /> Registro de Tutor (Verificación)
        </button>
      </div>

      <div style={styles.tabContent}>
        {/* Tab 0: Mi Perfil UPTC */}
        {activeTab === 'profile_tab' && (
          <div className="glass-card animate-fade-in" style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
            <div style={styles.profileHeader}>
              <div style={styles.imageWrapper}>
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName} style={styles.profileAvatarLarge} />
                ) : (
                  <div style={styles.avatarFallbackLarge}>{profile?.displayName?.[0] || 'U'}</div>
                )}
                {profile?.isVerified && (
                  <span style={styles.verifiedBadgeLarge} title="Cuenta Verificada UPTC">
                    <Award size={20} />
                  </span>
                )}
              </div>
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{profile?.displayName}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{profile?.email}</p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <span className={`badge ${profile?.role === 'tutor' ? 'badge-accent' : 'badge-primary'}`}>
                    Rol: {profile?.role === 'tutor' ? 'Tutor Colaborador' : 'Estudiante'}
                  </span>
                  <span className={`badge ${profile?.isVerified ? 'badge-success' : 'badge-danger'}`}>
                    {profile?.isVerified ? 'Verificado' : 'No Verificado'}
                  </span>
                </div>
              </div>
            </div>

            <div style={styles.profileDetailsList}>
              <div style={styles.profileDetailItem}>
                <span style={styles.detailTitle}>Fecha de Registro:</span>
                <span>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              
              <div style={styles.profileDetailItem}>
                <span style={styles.detailTitle}>Biografía Académica:</span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                  {profile?.biography || 'Sin biografía registrada. Regístrate como tutor para definir tu descripción.'}
                </p>
              </div>

              {profile?.role === 'tutor' && (
                <div style={styles.profileDetailItem}>
                  <span style={styles.detailTitle}>Tarifa de Tutoría:</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                    ${profile?.hourlyRate ? profile.hourlyRate.toLocaleString() : '15,000'} COP / Hora
                  </span>
                </div>
              )}
            </div>
            
            {profile?.role === 'tutor' ? (
              <button 
                type="button"
                className="btn btn-secondary" 
                onClick={() => navigate('/dashboard')}
                style={{ alignSelf: 'stretch' }}
              >
                Ir a gestionar mi agenda
              </button>
            ) : (
              <button 
                type="button"
                className="btn btn-secondary" 
                onClick={() => setActiveTab('verify')}
                style={{ alignSelf: 'stretch' }}
              >
                Registrarme como Tutor (Subir Carné)
              </button>
            )}
          </div>
        )}
        {/* Tab 1: Current Tutoring Sessions */}
        {activeTab === 'classes' && (
          <div className="animate-fade-in" style={styles.cardsGrid}>
            {activeSessions.length === 0 ? (
              <div style={styles.emptyState}>
                <Calendar size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                <p>No tienes tutorías programadas pendientes.</p>
                <button className="btn btn-accent" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
                  Buscar un Tutor
                </button>
              </div>
            ) : (
              activeSessions.map(s => (
                <div key={s.id} className="glass-card" style={styles.sessionCard}>
                  <div style={styles.sessionHeader}>
                    <div>
                      <span className="badge badge-accent" style={{ marginBottom: '0.4rem' }}>{s.discipline}</span>
                      <h3 style={styles.cardTitle}>Clase con {s.tutorName}</h3>
                    </div>
                    <button className="btn btn-secondary" onClick={() => navigate('/sessions')} style={styles.actionBtn}>
                      Ir al chat <ChevronRight size={16} />
                    </button>
                  </div>
                  
                  <div style={styles.cardDetails}>
                    <div style={styles.detailRow}>
                      <Clock size={16} color="var(--text-muted)" />
                      <span>{s.date} a las {s.time} ({s.duration} mins)</span>
                    </div>
                    <div style={styles.detailRow}>
                      <FileText size={16} color="var(--text-muted)" />
                      <span style={{ textTransform: 'capitalize' }}>
                        Manual: {s.paymentStatus === 'executed' ? 'Abono verificado' : 'Abono pendiente'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Favorites (RF-13) */}
        {activeTab === 'favorites' && (
          <div className="animate-fade-in" style={styles.cardsGrid}>
            {favoriteTutors.length === 0 ? (
              <div style={styles.emptyState}>
                <Heart size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                <p>Aún no has agregado tutores a tu sección preferencial.</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Puedes marcarlos con el corazón en su ficha pública para tener un acceso directo aquí.
                </p>
              </div>
            ) : (
              favoriteTutors.map(t => (
                <div 
                  key={t.uid} 
                  className="glass-card" 
                  style={styles.tutorRowCard}
                  onClick={() => navigate(`/tutor/${t.username}`)}
                >
                  <img src={t.photoURL} alt={t.displayName} style={styles.rowAvatar} />
                  <div style={{ flex: 1 }}>
                    <div style={styles.nameRow}>
                      <h4 style={styles.rowName}>{t.displayName}</h4>
                      {t.isVerified && <Award size={16} color="var(--accent)" />}
                    </div>
                    <span className="badge badge-primary">{t.discipline}</span>
                  </div>
                  <ChevronRight size={20} color="var(--text-muted)" />
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Tutor Register & Institutional ID upload (RF-11) */}
        {activeTab === 'verify' && (
          <div className="glass-card animate-fade-in" style={{ padding: '1.5rem' }}>
            <h3 style={styles.sectionHeader}>Validación de Credenciales de Tutor</h3>
            <p style={{ marginBottom: '1.25rem' }}>
              Para habilitar tu perfil de tutor y figurar en el buscador público, exigimos cargar una fotografía
              legible de tu carné institucional vigente de la UPTC. Nuestro equipo administrativo validará tu identidad.
            </p>

            {verificationStatus === 'unsubmitted' && (
              <form onSubmit={handleUploadId} style={styles.uploadForm}>
                <div style={styles.dropZone}>
                  <Upload size={32} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
                  {selectedFile ? (
                    <div style={styles.fileDetails}>
                      <strong>Archivo seleccionado:</strong>
                      <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ) : (
                    <>
                      <span>Arrastra o selecciona la foto de tu carné</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Formatos soportados: JPG, PNG (máx 5MB)</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    style={styles.fileInput}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-accent" 
                  disabled={!selectedFile || uploadProgress}
                  style={styles.submitUploadBtn}
                >
                  {uploadProgress ? 'Cargando carné al servidor...' : 'Enviar para Validación'}
                </button>
              </form>
            )}

            {verificationStatus === 'pending' && (
              <div style={styles.statusBox} className="animate-fade-in">
                <Clock size={36} color="var(--warning)" style={{ marginBottom: '0.5rem' }} />
                <h4 style={{ color: 'var(--warning)' }}>Verificación Pendiente de Aprobación</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Hemos recibido la imagen de tu carné institucional. La administración de la UPTC se encuentra validando 
                  que pertenezcas al programa y cumplas los criterios de tutor. El proceso toma habitualmente 24 horas.
                </p>
                <div style={styles.badgePreviewBox}>
                  <span>Estado: <strong>Pendiente de revisión</strong></span>
                </div>
                
                {/* Simulation Button for University Demos */}
                <button 
                  type="button"
                  className="btn btn-accent" 
                  onClick={handleSimulateApproval}
                  style={{ marginTop: '1.25rem', width: '100%', maxWidth: '280px', fontSize: '0.85rem' }}
                >
                  Simular Aprobación (Sustentación / Demo)
                </button>
              </div>
            )}

            {verificationStatus === 'approved' && (
              <div style={styles.statusBox} className="animate-fade-in">
                <ShieldCheck size={36} color="var(--success)" style={{ marginBottom: '0.5rem' }} />
                <h4 style={{ color: 'var(--success)' }}>Perfil Verificado Exitosamente</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  ¡Felicidades! Tus credenciales institucionales han sido validadas. Ahora dispones del distintivo
                  <strong>"Verificado"</strong> en los resultados de búsqueda, optimizando tu captación de estudiantes.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  header: {
    textAlign: 'center'
  },
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid var(--border-glass)'
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '0.75rem 1.25rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    transition: 'all 0.2s ease',
    minHeight: 'var(--touch-target)'
  },
  tabContent: {
    marginTop: '0.5rem'
  },
  sectionHeader: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    borderLeft: '3px solid var(--accent)',
    paddingLeft: '0.6rem',
    marginBottom: '0.5rem'
  },
  cardsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 1.5rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  sessionCard: {
    padding: '1.25rem'
  },
  sessionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '0.75rem',
    marginBottom: '0.75rem'
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: '700'
  },
  actionBtn: {
    padding: '0.4rem 0.8rem',
    fontSize: '0.8rem',
    minHeight: '36px'
  },
  cardDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)'
  },
  
  // Favorites tab
  tutorRowCard: {
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    cursor: 'pointer'
  },
  rowAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    objectFit: 'cover',
    border: '1px solid var(--border-glass)'
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    marginBottom: '0.2rem'
  },
  rowName: {
    fontSize: '1rem',
    fontWeight: '700'
  },
  
  // Verification tab (RF-11)
  uploadForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1rem'
  },
  dropZone: {
    border: '2px dashed var(--border-glass)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'rgba(0,0,0,0.15)',
    padding: '2.5rem 1.5rem',
    textAlign: 'center',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease'
  },
  fileInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer'
  },
  fileDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    fontSize: '0.85rem'
  },
  submitUploadBtn: {
    alignSelf: 'flex-start'
  },
  statusBox: {
    textAlign: 'center',
    padding: '2.5rem 1.5rem',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.6rem'
  },
  badgePreviewBox: {
    marginTop: '0.75rem',
    padding: '0.4rem 0.8rem',
    backgroundColor: 'hsla(38, 92%, 50%, 0.15)',
    border: '1px solid var(--warning)',
    borderRadius: '4px',
    fontSize: '0.8rem',
    color: 'var(--warning)'
  },
  profileHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%'
  },
  profileAvatarLarge: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--accent)'
  },
  avatarFallbackLarge: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-light)',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '2.5rem'
  },
  profileDetailsList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    borderTop: '1px solid var(--border-glass)',
    paddingTop: '1.25rem'
  },
  profileDetailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    textAlign: 'left'
  },
  detailTitle: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: '0.02em'
  }
};

