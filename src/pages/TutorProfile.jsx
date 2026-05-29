import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Share2, Award, Star, Video, MapPin, Calendar, Clock, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLocalFavorites, saveLocalFavorites } from '../db/localDb';
import { fetchTutorByUsername, saveSession } from '../db/firebase';

export function TutorProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Booking Form State
  const [bookMode, setBookMode] = useState('digital');
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('');
  const [bookDuration, setBookDuration] = useState('60'); // minutes
  const [isPromoBooking, setIsPromoBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const loadTutor = async () => {
      setLoading(true);
      try {
        const foundTutor = await fetchTutorByUsername(username);
        if (foundTutor) {
          const normalized = {
            ...foundTutor,
            rating: foundTutor.rating ?? 5.0,
            reviews: foundTutor.reviews ?? [],
            modality: foundTutor.modality ?? 'both',
            faculty: foundTutor.faculty ?? 'Ingeniería',
            discipline: foundTutor.discipline ?? 'Sistemas',
            availability: foundTutor.availability ?? []
          };
          setTutor(normalized);
          setBookMode(normalized.modality === 'both' ? 'digital' : normalized.modality);
          
          const favs = await getLocalFavorites();
          setIsFavorite(favs.includes(normalized.uid));
        } else {
          setTutor(null);
        }
      } catch (err) {
        console.error('Error fetching tutor profile:', err);
        setTutor(null);
      } finally {
        setLoading(false);
      }
    };
    loadTutor();
  }, [username]);
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        <h2>Cargando perfil...</h2>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>Tutor no encontrado</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} /> Volver a buscar
        </button>
      </div>
    );
  }
  // Favorite toggle (RF-13)
  const toggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const favs = await getLocalFavorites();
    let updatedFavs;
    if (isFavorite) {
      updatedFavs = favs.filter(id => id !== tutor.uid);
      setIsFavorite(false);
    } else {
      updatedFavs = [...favs, tutor.uid];
      setIsFavorite(true);
    }
    await saveLocalFavorites(updatedFavs);
  };

  // Copy Profile Link (RF-17)
  const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/tutor/${tutor.username}`;
    navigator.clipboard.writeText(profileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Submit Booking Request (RF-04)
  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!bookDate || !bookTime) {
      alert('Por favor selecciona fecha y hora.');
      return;
    }

    const sessionId = `session_${Date.now()}`;
    const newSession = {
      id: sessionId,
      tutorUid: tutor.uid,
      tutorName: tutor.displayName,
      studentUid: user.uid,
      studentName: user.displayName || 'Estudiante UPTC',
      discipline: tutor.discipline || 'Sistemas',
      date: bookDate,
      time: bookTime,
      dateTime: `${bookDate}T${bookTime}:00`,
      duration: Number(bookDuration),
      modality: bookMode,
      meetLink: bookMode === 'digital' ? 'https://meet.google.com/abc-defg-hij' : '',
      location: bookMode === 'physical' ? 'Campus Central UPTC' : '',
      status: 'scheduled',
      paymentStatus: 'pending'
    };

    try {
      await saveSession(newSession);
      setBookingSuccess(true);
    } catch (err) {
      console.error('Error creating booking:', err);
      alert('Hubo un error al registrar la tutoría. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      {/* Back button */}
      <button style={styles.backBtn} onClick={() => navigate('/')}>
        <ArrowLeft size={18} /> Volver al explorador
      </button>

      <div style={styles.profileLayout}>
        {/* Left Column: Tutor Identity Badge */}
        <section style={styles.profileSidebar} className="glass-card">
          <div style={styles.imageWrapper}>
            <img src={tutor.photoURL} alt={tutor.displayName} style={styles.profileAvatar} />
            {tutor.isVerified && (
              <span style={styles.verifiedBadgeLarge} title="Colaborador Verificado">
                <Award size={20} />
              </span>
            )}
          </div>

          <h2 style={styles.profileName}>{tutor.displayName}</h2>
          <span className="badge badge-primary" style={{ alignSelf: 'center', marginBottom: '0.5rem' }}>
            {tutor.discipline}
          </span>
          <p style={styles.facultySub}>{tutor.faculty}</p>

          <div style={styles.ratingSection}>
            <Star size={18} fill="var(--accent)" color="var(--accent)" />
            <span style={styles.ratingVal}>{tutor.rating.toFixed(1)}</span>
            <span style={styles.reviewsLabel}>({tutor.reviews.length} reseñas)</span>
          </div>

          <div style={styles.rateContainer}>
            <span style={styles.rateLabel}>Tarifa por hora</span>
            <span style={styles.rateVal}>${tutor.hourlyRate.toLocaleString()} COP</span>
          </div>

          {/* Quick Actions (Favorites & Sharing) */}
          <div style={styles.actionsGrid}>
            <button 
              onClick={toggleFavorite} 
              style={{
                ...styles.actionBtn,
                color: isFavorite ? 'var(--danger)' : 'var(--text-primary)',
                borderColor: isFavorite ? 'var(--danger)' : 'var(--border-glass)'
              }}
              title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
            >
              <Heart size={18} fill={isFavorite ? 'var(--danger)' : 'none'} /> 
              {isFavorite ? 'Favorito' : 'Favorito'}
            </button>
            <button onClick={copyProfileLink} style={styles.actionBtn}>
              {copiedLink ? <Check size={18} color="var(--success)" /> : <Share2 size={18} />}
              {copiedLink ? 'Copiado!' : 'Compartir'}
            </button>
          </div>

          {/* Profile promotional URL display (RF-17) */}
          <div style={styles.customUrlBox}>
            <span style={styles.urlLabel}>Enlace personalizado:</span>
            <code style={styles.urlValue}>/tutor/{tutor.username}</code>
          </div>
        </section>

        {/* Right Column: Bio & Booking calendar */}
        <section style={styles.profileMain}>
          {/* Biography Card */}
          <div className="glass-card" style={styles.bioCard}>
            <h3 style={styles.sectionHeader}>Reseña Biográfica</h3>
            {/* Biography limited to 500 chars as per RF-02 */}
            <p style={styles.bioText}>{tutor.biography}</p>
            
            <h3 style={styles.sectionHeader} style={{ marginTop: '1.5rem' }}>Disponibilidad Semanal</h3>
            <div style={styles.availabilityGrid}>
              {tutor.availability.map((slot, i) => (
                <div key={i} style={styles.availSlot}>
                  <Clock size={14} color="var(--accent)" />
                  <span>{slot}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Booking Form Card (RF-04) */}
          <div className="glass-card" style={styles.bookingCard}>
            <h3 style={styles.sectionHeader}>Agendar Sesión</h3>
            
            {bookingSuccess ? (
              <div style={styles.bookingSuccessBox} className="animate-fade-in">
                <div style={styles.successIcon}>✓</div>
                <h4>¡Solicitud enviada!</h4>
                <p>
                  Hemos notificado a {tutor.displayName}. Una vez sea aceptada la solicitud, 
                  recibirás una confirmación por notificación push y correo electrónico.
                </p>
                <button className="btn btn-secondary" onClick={() => setBookingSuccess(false)}>
                  Agendar otra sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleBooking} style={styles.form}>
                
                {/* Free Intro Promo Toggle (RF-18) */}
                {tutor.hasFreeIntro && (
                  <div style={styles.promoOfferBox}>
                    <div style={styles.promoOfferLeft}>
                      <Sparkles size={18} color="var(--accent)" />
                      <div>
                        <strong>Introducción Gratis</strong>
                        <p style={{ fontSize: '0.75rem', margin: 0 }}>Agenda una sesión inicial de cortesía de 20 min.</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      id="promo-check"
                      checked={isPromoBooking} 
                      onChange={(e) => {
                        setIsPromoBooking(e.target.checked);
                        if (e.target.checked) setBookDuration('20');
                        else setBookDuration('60');
                      }}
                      style={styles.checkbox}
                    />
                  </div>
                )}

                <div className="grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Modalidad de Clase</label>
                    <select 
                      value={bookMode} 
                      onChange={(e) => setBookMode(e.target.value)} 
                      className="input"
                      disabled={tutor.modality !== 'both'}
                    >
                      {tutor.modality === 'digital' || tutor.modality === 'both' ? (
                        <option value="digital">Digital (Video conferencia)</option>
                      ) : null}
                      {tutor.modality === 'physical' || tutor.modality === 'both' ? (
                        <option value="physical">Físico (Presencial en UPTC)</option>
                      ) : null}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Duración</label>
                    <select 
                      value={bookDuration} 
                      onChange={(e) => setBookDuration(e.target.value)} 
                      className="input"
                      disabled={isPromoBooking}
                    >
                      {isPromoBooking ? (
                        <option value="20">20 Minutos (Cortesía)</option>
                      ) : (
                        <>
                          <option value="60">1 Hora</option>
                          <option value="90">1.5 Horas</option>
                          <option value="120">2 Horas</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Fecha</label>
                    <input 
                      type="date" 
                      value={bookDate} 
                      onChange={(e) => setBookDate(e.target.value)} 
                      className="input"
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Hora</label>
                    <input 
                      type="time" 
                      value={bookTime} 
                      onChange={(e) => setBookTime(e.target.value)} 
                      className="input"
                      required
                    />
                  </div>
                </div>

                {bookMode === 'physical' && (
                  <div style={styles.physicalNote}>
                    <MapPin size={16} color="var(--text-muted)" />
                    <span>
                      * Para encuentros físicos, el colaborador especificará la ubicación geográfica exacta en el campus (ej. Edificio Central, Biblioteca) tras la validación de la cita.
                    </span>
                  </div>
                )}
                {bookMode === 'digital' && (
                  <div style={styles.physicalNote}>
                    <Video size={16} color="var(--text-muted)" />
                    <span>
                      * Para encuentros digitales, se habilitará un enlace de videoconferencia (Meet/Teams) dentro de la mensajería asíncrona una vez aceptado.
                    </span>
                  </div>
                )}

                <button type="submit" className="btn btn-accent" style={styles.submitBtn}>
                  {isPromoBooking ? 'Agendar Intro Gratuita' : 'Confirmar Reserva'}
                </button>
              </form>
            )}
          </div>

          {/* Qualitative Reviews (RF-14) */}
          <div className="glass-card" style={styles.reviewsCard}>
            <h3 style={styles.sectionHeader}>Reseñas Cualitativas ({tutor.reviews.length})</h3>
            <div style={styles.reviewList}>
              {tutor.reviews.map(review => (
                <div key={review.id} style={styles.reviewItem}>
                  <div style={styles.reviewHeader}>
                    <strong style={styles.reviewAuthor}>{review.author}</strong>
                    <span style={styles.reviewDate}>{review.date}</span>
                  </div>
                  <div style={styles.reviewRating}>
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={12} 
                        fill={i < Math.floor(review.rating) ? 'var(--accent)' : 'none'} 
                        color="var(--accent)" 
                      />
                    ))}
                    <span style={{ fontSize: '0.75rem', marginLeft: '0.3rem', color: 'var(--text-muted)' }}>
                      {review.rating} / 5
                    </span>
                  </div>
                  <p style={styles.reviewComment}>{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  backBtn: {
    alignSelf: 'flex-start',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    padding: '0.5rem 0',
    minHeight: 'var(--touch-target)'
  },
  profileLayout: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  profileSidebar: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center',
    padding: '2rem 1.5rem',
    gap: '0.5rem'
  },
  imageWrapper: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: '1rem'
  },
  profileAvatar: {
    width: '120px',
    height: '120px',
    borderRadius: 'var(--radius-md)',
    objectFit: 'cover',
    border: '2px solid var(--accent)'
  },
  verifiedBadgeLarge: {
    position: 'absolute',
    bottom: '-8px',
    right: '-8px',
    backgroundColor: 'var(--accent)',
    color: 'var(--text-on-accent)',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid var(--bg-surface)'
  },
  profileName: {
    fontSize: '1.5rem',
    fontWeight: '800'
  },
  facultySub: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)'
  },
  ratingSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    marginTop: '0.5rem'
  },
  ratingVal: {
    fontWeight: '700',
    fontSize: '1rem'
  },
  reviewsLabel: {
    color: 'var(--text-muted)',
    fontSize: '0.85rem'
  },
  rateContainer: {
    backgroundColor: 'hsla(0, 0%, 100%, 0.04)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.75rem',
    marginTop: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem'
  },
  rateLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase'
  },
  rateVal: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: 'var(--accent)'
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
    marginTop: '1rem'
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
    minHeight: 'var(--touch-target)',
    transition: 'all 0.2s ease'
  },
  customUrlBox: {
    marginTop: '1rem',
    padding: '0.6rem',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: '6px',
    border: '1px solid var(--border-glass)',
    fontSize: '0.75rem',
    textAlign: 'left'
  },
  urlLabel: {
    color: 'var(--text-muted)',
    display: 'block',
    marginBottom: '0.2rem'
  },
  urlValue: {
    color: 'var(--accent-light)',
    fontFamily: 'monospace',
    fontWeight: '600'
  },
  
  // Right Column styles
  profileMain: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  bioCard: {
    padding: '1.5rem'
  },
  sectionHeader: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    borderLeft: '3px solid var(--accent)',
    paddingLeft: '0.6rem',
    marginBottom: '1rem'
  },
  bioText: {
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: 'var(--text-secondary)'
  },
  availabilityGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    marginTop: '0.5rem'
  },
  availSlot: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: 'hsla(var(--primary-hue), 50%, 20%, 0.25)',
    border: '1px solid hsla(var(--primary-hue), 50%, 30%, 0.3)',
    borderRadius: '6px',
    padding: '0.4rem 0.8rem',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)'
  },
  bookingCard: {
    padding: '1.5rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  promoOfferBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'hsla(45, 85%, 52%, 0.08)',
    border: '1px dashed var(--accent)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.75rem 1rem',
    marginBottom: '1rem'
  },
  promoOfferLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    color: 'var(--text-primary)',
    fontSize: '0.85rem'
  },
  checkbox: {
    width: '20px',
    height: '20px',
    accentColor: 'var(--accent)',
    cursor: 'pointer'
  },
  physicalNote: {
    display: 'flex',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
    padding: '0.5rem',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: '6px',
    marginBottom: '0.5rem'
  },
  submitBtn: {
    marginTop: '0.5rem',
    alignSelf: 'stretch'
  },
  
  // Booking Success View
  bookingSuccessBox: {
    textAlign: 'center',
    padding: '2rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem'
  },
  successIcon: {
    width: '56px',
    height: '56px',
    backgroundColor: 'var(--success)',
    color: 'var(--text-on-primary)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.75rem',
    fontWeight: 'bold',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
  },
  
  // Reviews List Styles
  reviewsCard: {
    padding: '1.5rem'
  },
  reviewList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  reviewItem: {
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem'
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  reviewAuthor: {
    fontSize: '0.9rem',
    fontWeight: '600'
  },
  reviewDate: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)'
  },
  reviewRating: {
    display: 'flex',
    alignItems: 'center'
  },
  reviewComment: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.45'
  }
};

// Add desktop media query styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    @media (min-width: 768px) {
      div[style*="flex-direction: column"][class*="profileLayout"] {
        flex-direction: row !important;
      }
      section[style*="display: flex"][class*="profileSidebar"] {
        width: 320px !important;
        flex-shrink: 0;
      }
    }
  `;
  document.head.appendChild(styleEl);
}

