import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Settings, Calendar, DollarSign, Star, 
  Download, AlertTriangle, CheckCircle, RefreshCw 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLocalSessions, saveLocalSessions, saveLocalProfile } from '../db/localDb';
import { saveUserProfile } from '../db/firebase';

export function TutorDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('stats'); // 'stats', 'profile', 'payments'
  
  // Dashboard Metrics
  const [sessions, setSessions] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [averageRating, setAverageRating] = useState(4.8);  // Profile Form states (RF-02)
  const [bio, setBio] = useState('');
  const [rate, setRate] = useState(15000);
  const [discipline, setDiscipline] = useState('');
  const [facultyState, setFacultyState] = useState('Ingeniería');
  const [monAvailability, setMonAvailability] = useState(true);
  const [tueAvailability, setTueAvailability] = useState(false);
  const [wedAvailability, setWedAvailability] = useState(true);
  const [thuAvailability, setThuAvailability] = useState(false);
  const [friAvailability, setFriAvailability] = useState(true);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Sync profile details when loaded
  useEffect(() => {
    if (profile) {
      setBio(profile.biography || '');
      setRate(profile.hourlyRate || 15000);
      setDiscipline(profile.discipline || '');
      setFacultyState(profile.faculty || 'Ingeniería');
      setMonAvailability(profile.availability?.includes('Lunes (8:00 - 12:00)') ?? true);
      setTueAvailability(profile.availability?.includes('Martes (14:00 - 18:00)') ?? false);
      setWedAvailability(profile.availability?.includes('Miércoles (8:00 - 12:00)') ?? true);
      setThuAvailability(profile.availability?.includes('Jueves (14:00 - 18:00)') ?? false);
      setFriAvailability(profile.availability?.includes('Viernes (8:00 - 12:00)') ?? true);
    }
  }, [profile]);

  useEffect(() => {
    const loadData = async () => {
      const list = await getLocalSessions();
      setSessions(list);

      // Calculate total accumulated revenue
      const executedTotal = list.reduce((accum, s) => {
        if (s.paymentStatus === 'executed' && s.status !== 'cancelled') {
          // Assume rate calculation: 15000/hr, calculate by session duration
          const hourRatio = s.duration / 60;
          return accum + (hourRatio * 15000);
        }
        return accum;
      }, 0);
      setTotalRevenue(executedTotal);
    };
    loadData();
  }, []);

  // Update Profile Biography / Availability (RF-02)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile) return;
    if (bio.length > 500) {
      alert('La biografía no puede superar los 500 caracteres.');
      return;
    }

    const availabilityArray = [];
    if (monAvailability) availabilityArray.push('Lunes (8:00 - 12:00)');
    if (tueAvailability) availabilityArray.push('Martes (14:00 - 18:00)');
    if (wedAvailability) availabilityArray.push('Miércoles (8:00 - 12:00)');
    if (thuAvailability) availabilityArray.push('Jueves (14:00 - 18:00)');
    if (friAvailability) availabilityArray.push('Viernes (8:00 - 12:00)');

    const slugUsername = profile.username || profile.displayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-');

    const updatedProfile = {
      ...profile,
      biography: bio,
      hourlyRate: rate,
      discipline: discipline,
      faculty: facultyState,
      availability: availabilityArray,
      username: slugUsername
    };
    try {
      await saveUserProfile(profile.uid, updatedProfile);
      await saveLocalProfile(updatedProfile);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
      
      alert('¡Perfil actualizado con éxito!');
      window.location.reload();
    } catch (err) {
      console.error('Error saving tutor profile:', err);
      alert('Hubo un error al actualizar el perfil.');
    }
  };

  // Toggle Transaction Status (RF-07)
  const togglePaymentStatus = async (sessionId) => {
    const updated = sessions.map(s => {
      if (s.id === sessionId) {
        const newStatus = s.paymentStatus === 'executed' ? 'pending' : 'executed';
        return { ...s, paymentStatus: newStatus };
      }
      return s;
    });

    setSessions(updated);
    await saveLocalSessions(updated);
    
    // Recalculate revenue
    const newTotal = updated.reduce((accum, s) => {
      if (s.paymentStatus === 'executed' && s.status !== 'cancelled') {
        const hourRatio = s.duration / 60;
        return accum + (hourRatio * 15000);
      }
      return accum;
    }, 0);
    setTotalRevenue(newTotal);
  };

  // Export CSV Report (RF-19)
  const handleExportCSV = () => {
    const headers = ['ID Sesion', 'Materia', 'Estudiante', 'Fecha', 'Hora', 'Duracion (Min)', 'Tarifa Cobrada', 'Estado Pago'];
    
    const rows = sessions.map(s => {
      const hourRatio = s.duration / 60;
      const charge = s.status === 'cancelled' ? 0 : hourRatio * 15000;
      return [
        s.id,
        s.discipline,
        s.studentName,
        s.date,
        s.time,
        s.duration,
        charge,
        s.paymentStatus === 'executed' ? 'EJECUTADO' : 'PENDIENTE'
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_ingresos_tutoruptc_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      {/* RNF-12 / RF-20: Inactivity and Verification Alert Banners */}
      <section style={styles.alertPanel}>
        <div style={styles.inactivityAlert}>
          <AlertTriangle size={18} color="var(--warning)" style={{ flexShrink: 0 }} />
          <span>
            <strong>Recordatorio de Actividad:</strong> Llevas 15 días sin actualizar tu agenda. Recuerda 
            mantener tu disponibilidad al día para no ser retirado de los resultados públicos (Límite 60 días, RF-20).
          </span>
        </div>
      </section>

      <header style={styles.header}>
        <h1>Panel del Tutor</h1>
        <p>Administra tu ficha académica, actualiza tu calendario semanal y lleva la bitácora contable de tus tutorías.</p>
      </header>

      {/* Quick Metrics (RF-09) */}
      <section className="grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="glass-card" style={styles.statCard}>
          <Star size={24} color="var(--accent)" fill="var(--accent)" />
          <div>
            <h4 style={styles.statVal}>{averageRating.toFixed(1)} / 5.0</h4>
            <p style={styles.statLabel}>Valoración Promedio</p>
          </div>
        </div>

        <div className="glass-card" style={styles.statCard}>
          <DollarSign size={24} color="var(--success)" />
          <div>
            <h4 style={styles.statVal}>${totalRevenue.toLocaleString()} COP</h4>
            <p style={styles.statLabel}>Total Acumulado</p>
          </div>
        </div>

        <div className="glass-card" style={styles.statCard}>
          <Calendar size={24} color="var(--accent-light)" />
          <div>
            <h4 style={styles.statVal}>
              {sessions.filter(s => s.status === 'scheduled').length} activas
            </h4>
            <p style={styles.statLabel}>Sesiones Agendadas</p>
          </div>
        </div>
      </section>

      {/* Tabs Controller */}
      <div style={styles.tabBar}>
        <button 
          style={{...styles.tabBtn, borderBottomColor: activeTab === 'stats' ? 'var(--accent)' : 'transparent', color: activeTab === 'stats' ? 'var(--accent)' : 'var(--text-secondary)'}}
          onClick={() => setActiveTab('stats')}
        >
          <BarChart3 size={16} /> Resumen
        </button>
        <button 
          style={{...styles.tabBtn, borderBottomColor: activeTab === 'profile' ? 'var(--accent)' : 'transparent', color: activeTab === 'profile' ? 'var(--accent)' : 'var(--text-secondary)'}}
          onClick={() => setActiveTab('profile')}
        >
          <Settings size={16} /> Ficha de Colaborador
        </button>
        <button 
          style={{...styles.tabBtn, borderBottomColor: activeTab === 'payments' ? 'var(--accent)' : 'transparent', color: activeTab === 'payments' ? 'var(--accent)' : 'var(--text-secondary)'}}
          onClick={() => setActiveTab('payments')}
        >
          <DollarSign size={16} /> Bitácora de Pagos
        </button>
      </div>

      {/* Tab Contents */}
      <div style={styles.tabContent}>
        {/* Tab 1: Stats summary */}
        {activeTab === 'stats' && (
          <div className="glass-card animate-fade-in" style={{ padding: '1.5rem' }}>
            <h3 style={styles.sectionHeader}>Historial de Tutorías</h3>
            <p style={{ marginBottom: '1rem' }}>Resumen de las últimas clases coordinadas en el sistema.</p>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tr}>
                    <th style={styles.th}>Estudiante</th>
                    <th style={styles.th}>Materia</th>
                    <th style={styles.th}>Fecha / Hora</th>
                    <th style={styles.th}>Estado</th>
                    <th style={styles.th}>Cobro</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => {
                    const hrRatio = s.duration / 60;
                    return (
                      <tr key={s.id} style={styles.trBody}>
                        <td style={styles.td}>{s.studentName}</td>
                        <td style={styles.td}>{s.discipline}</td>
                        <td style={styles.td}>{s.date} ({s.time})</td>
                        <td style={styles.td}>
                          <span className={`badge ${s.status === 'completed' ? 'badge-success' : s.status === 'cancelled' ? 'badge-danger' : 'badge-primary'}`}>
                            {s.status === 'completed' ? 'Realizada' : s.status === 'cancelled' ? 'Cancelada' : 'Agendada'}
                          </span>
                        </td>
                        <td style={styles.td} style={{ fontWeight: 'bold' }}>
                          ${s.status === 'cancelled' ? 0 : (hrRatio * 15000).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Profile configuration (RF-02) */}
        {activeTab === 'profile' && (
          <div className="glass-card animate-fade-in" style={{ padding: '1.5rem' }}>
            <h3 style={styles.sectionHeader}>Ficha Docente</h3>
            <p style={{ marginBottom: '1.25rem' }}>Actualiza tus datos públicos de enseñanza y horario de disponibilidad semanal.</p>
            
            {profileSuccess && (
              <div style={styles.successBanner}>
                <CheckCircle size={18} />
                <span>Ficha y disponibilidad actualizadas exitosamente en el servidor y cache.</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="form-group">
                  <label>Fotografía de Ficha</label>
                  <div style={styles.avatarEditor}>
                    <img 
                      src={profile?.photoURL || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'} 
                      alt="Avatar" 
                      style={styles.formAvatar} 
                    />
                    <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem', minHeight: '36px' }}>
                      Cargar Foto
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Materia / Especialidad (ej. Sistemas, Cálculo)</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value)}
                    required
                    placeholder="Materia que dictas..."
                  />
                </div>

                <div className="form-group">
                  <label>Facultad UPTC</label>
                  <select 
                    className="input" 
                    value={facultyState}
                    onChange={(e) => setFacultyState(e.target.value)}
                    style={{ width: '100%', height: '44px', boxSizing: 'border-box' }}
                    required
                  >
                    <option value="Ingeniería">Ingeniería</option>
                    <option value="Ciencias de la Educación">Ciencias de la Educación</option>
                    <option value="Ciencias">Ciencias</option>
                    <option value="Ciencias Económicas y Administrativas">Ciencias Económicas y Administrativas</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Tarifa Horaria ($ COP)</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    min="5000"
                    max="50000"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Reseña Biográfica de Tutor (Máx. 500 caracteres, RF-02)</label>
                <textarea 
                  className="input" 
                  rows="4" 
                  maxLength="500"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe tu trayectoria académica, temas de dominio y pedagogía..."
                  required
                  style={{ resize: 'none', fontFamily: 'var(--font-sans)' }}
                />
                <span style={styles.charCounter}>{bio.length}/500</span>
              </div>

              {/* Weekly Availability block setup */}
              <div style={styles.calendarConfigSection}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Configuración de Agenda Semanal</label>
                <div style={styles.checkboxGrid}>
                  <div style={styles.checkboxItem}>
                    <input 
                      type="checkbox" 
                      id="avail-mon" 
                      checked={monAvailability} 
                      onChange={(e) => setMonAvailability(e.target.checked)} 
                      style={styles.checkbox}
                    />
                    <label htmlFor="avail-mon" style={styles.checkboxLabel}>Lunes Jornada Mañana (8:00 - 12:00)</label>
                  </div>

                  <div style={styles.checkboxItem}>
                    <input 
                      type="checkbox" 
                      id="avail-tue" 
                      checked={tueAvailability} 
                      onChange={(e) => setTueAvailability(e.target.checked)} 
                      style={styles.checkbox}
                    />
                    <label htmlFor="avail-tue" style={styles.checkboxLabel}>Martes Jornada Tarde (14:00 - 18:00)</label>
                  </div>

                  <div style={styles.checkboxItem}>
                    <input 
                      type="checkbox" 
                      id="avail-wed" 
                      checked={wedAvailability} 
                      onChange={(e) => setWedAvailability(e.target.checked)} 
                      style={styles.checkbox}
                    />
                    <label htmlFor="avail-wed" style={styles.checkboxLabel}>Miércoles Jornada Mañana (8:00 - 12:00)</label>
                  </div>

                  <div style={styles.checkboxItem}>
                    <input 
                      type="checkbox" 
                      id="avail-thu" 
                      checked={thuAvailability} 
                      onChange={(e) => setThuAvailability(e.target.checked)} 
                      style={styles.checkbox}
                    />
                    <label htmlFor="avail-thu" style={styles.checkboxLabel}>Jueves Jornada Tarde (14:00 - 18:00)</label>
                  </div>

                  <div style={styles.checkboxItem}>
                    <input 
                      type="checkbox" 
                      id="avail-fri" 
                      checked={friAvailability} 
                      onChange={(e) => setFriAvailability(e.target.checked)} 
                      style={styles.checkbox}
                    />
                    <label htmlFor="avail-fri" style={styles.checkboxLabel}>Viernes Jornada Mañana (8:00 - 12:00)</label>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-accent" style={{ alignSelf: 'flex-start' }}>
                Actualizar Ficha
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Transaction logs and payments (RF-07, RF-19) */}
        {activeTab === 'payments' && (
          <div className="glass-card animate-fade-in" style={{ padding: '1.5rem' }}>
            <div style={styles.paymentsHeader}>
              <div>
                <h3 style={styles.sectionHeader}>Bitácora de Recaudo</h3>
                <p>Usa esta bitácora para registrar manualmente los aportes correspondientes a cada sesión.</p>
              </div>
              
              {/* CSV Downloader (RF-19) */}
              <button className="btn btn-primary" onClick={handleExportCSV} style={styles.csvBtn}>
                <Download size={16} /> Exportar CSV
              </button>
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tr}>
                    <th style={styles.th}>Estudiante</th>
                    <th style={styles.th}>Fecha</th>
                    <th style={styles.th}>Materia</th>
                    <th style={styles.th}>Estado Transaccional</th>
                    <th style={styles.th}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.filter(s => s.status !== 'cancelled').map(s => (
                    <tr key={s.id} style={styles.trBody}>
                      <td style={styles.td}>{s.studentName}</td>
                      <td style={styles.td}>{s.date}</td>
                      <td style={styles.td}>{s.discipline}</td>
                      <td style={styles.td}>
                        <span className={`badge ${s.paymentStatus === 'executed' ? 'badge-success' : 'badge-danger'}`}>
                          {s.paymentStatus === 'executed' ? 'Recibido' : 'Pendiente'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => togglePaymentStatus(s.id)}
                          style={styles.togglePaymentBtn}
                        >
                          <RefreshCw size={12} /> Cambiar Estado
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={styles.disclaimerBox}>
              <p>
                * Importante: TutorUPTC **no gestiona pasarelas de pago ni cobros electrónicos**. Este módulo 
                opera de naturaleza estrictamente declarativa para la bitácora contable personal del colaborador.
              </p>
            </div>
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
  alertPanel: {
    width: '100%'
  },
  inactivityAlert: {
    display: 'flex',
    gap: '0.75rem',
    backgroundColor: 'hsla(38, 92%, 50%, 0.1)',
    border: '1px solid var(--warning)',
    borderRadius: 'var(--radius-md)',
    padding: '1rem',
    color: 'var(--text-primary)',
    fontSize: '0.85rem',
    lineHeight: '1.45'
  },
  header: {
    textAlign: 'center'
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    padding: '1.5rem'
  },
  statVal: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: 'var(--text-primary)'
  },
  statLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.02em'
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
  tableWrapper: {
    width: '100%',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    marginTop: '0.5rem'
  },
  tr: {
    borderBottom: '1px solid var(--border-glass)'
  },
  th: {
    padding: '0.75rem 1rem',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontWeight: '700'
  },
  trBody: {
    borderBottom: '1px solid var(--border-glass)',
    transition: 'background-color 0.2s ease'
  },
  td: {
    padding: '1rem',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)'
  },
  
  // Profile Editor styles
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'hsla(145, 63%, 42%, 0.15)',
    border: '1px solid var(--success)',
    borderRadius: 'var(--radius-sm)',
    color: 'hsl(145, 80%, 75%)',
    padding: '0.75rem 1rem',
    fontSize: '0.85rem',
    marginBottom: '1rem'
  },
  avatarEditor: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  formAvatar: {
    width: '64px',
    height: '64px',
    borderRadius: 'var(--radius-sm)',
    objectFit: 'cover',
    border: '1px solid var(--border-glass)'
  },
  charCounter: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    alignSelf: 'flex-end',
    marginTop: '-0.3rem'
  },
  calendarConfigSection: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 'var(--radius-sm)',
    padding: '1.25rem',
    border: '1px solid var(--border-glass)'
  },
  checkboxGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '0.75rem'
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem'
  },
  checkbox: {
    width: '20px',
    height: '20px',
    accentColor: 'var(--accent)',
    cursor: 'pointer'
  },
  checkboxLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    textTransform: 'none',
    cursor: 'pointer',
    userSelect: 'none'
  },
  
  // Payments bitacora
  paymentsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    gap: '1rem'
  },
  csvBtn: {
    fontSize: '0.8rem',
    minHeight: '38px',
    padding: '0.5rem 1rem'
  },
  togglePaymentBtn: {
    fontSize: '0.75rem',
    padding: '0.3rem 0.6rem',
    minHeight: '32px'
  },
  disclaimerBox: {
    marginTop: '1.5rem',
    padding: '0.75rem',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: '6px',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-muted)',
    fontSize: '0.75rem',
    lineHeight: '1.4'
  }
};

// Add desktop table layouts override
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    @media (min-width: 768px) {
      tr[class*="trBody"]:hover {
        background-color: hsla(0, 0%, 100%, 0.02) !important;
      }
    }
  `;
  document.head.appendChild(styleEl);
}

