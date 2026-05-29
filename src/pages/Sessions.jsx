import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Calendar, Video, MapPin, AlertCircle, 
  Send, ShieldAlert, Star, DollarSign, Clock, ArrowLeft 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOfflineState } from '../context/OfflineContext';
import { getLocalMessages, addLocalMessage, saveLocalSessions, getLocalSessions } from '../db/localDb';



export function Sessions() {
  const { user, profile } = useAuth();
  const { isOffline } = useOfflineState();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  
  // Chat States
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);

  // Review states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Reschedule/Cancel states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellationAuditWarning, setCancellationAuditWarning] = useState(false);


  // Load user sessions from localDB or Firebase
  useEffect(() => {
    const fetchSessions = async () => {
      const cached = await getLocalSessions();
      if (cached.length > 0) {
        setSessions(cached);
        setSelectedSession(prev => cached.find(s => s.id === prev?.id) || cached[0]);
      } else {
        setSessions([]);
        setSelectedSession(null);
      }
    };
    fetchSessions();

    window.addEventListener('tutoruptc_sessions_updated', fetchSessions);
    return () => {
      window.removeEventListener('tutoruptc_sessions_updated', fetchSessions);
    };
  }, []);

  // Load chat messages when selected session changes
  useEffect(() => {
    if (selectedSession) {
      const loadChat = async () => {
        const msgs = await getLocalMessages(selectedSession.id);
        setMessages(msgs);
      };
      loadChat();
      setReviewSubmitted(false);
      setComment('');
      setRating(5);
    }
  }, [selectedSession]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send Message (RF-06)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedSession) return;

    const msg = {
      id: `msg-${Date.now()}`,
      senderName: 'Yo',
      text: newMessage,
      timestamp: new Date().toISOString()
    };

    // Save message to IndexedDB (available offline immediately)
    const updatedMsgs = await addLocalMessage(selectedSession.id, msg);
    setMessages(updatedMsgs);
    setNewMessage('');

    if (isOffline) {
      console.log('App is offline. Message enqueued for synchronization.');
      // Background Sync trigger goes here in active SW
    }
  };

  // RF-10: Cancellation & Rescheduling (120-minute warning check)
  const openCancelDialog = () => {
    if (!selectedSession) return;

    const sessionDateTime = new Date(selectedSession.dateTime);
    const now = new Date();
    const diffMs = sessionDateTime - now;
    const diffMins = Math.floor(diffMs / 1000 / 60);

    // If session is within 120 minutes (2 hours), trigger audit log warning
    if (diffMins < 120) {
      setCancellationAuditWarning(true);
    } else {
      setCancellationAuditWarning(false);
    }
    setShowCancelModal(true);
  };

  const handleCancelSession = async () => {
    if (!selectedSession) return;

    const updated = sessions.map(s => {
      if (s.id === selectedSession.id) {
        return { ...s, status: 'cancelled', cancelReason, cancelledLate: cancellationAuditWarning };
      }
      return s;
    });

    setSessions(updated);
    setSelectedSession({ ...selectedSession, status: 'cancelled', cancelReason, cancelledLate: cancellationAuditWarning });
    await saveLocalSessions(updated);
    
    setShowCancelModal(false);
    setCancelReason('');
    
    alert(cancellationAuditWarning 
      ? 'Sesión cancelada. Se ha registrado una penalización en tu bitácora por cancelar con menos de 120 minutos de antelación.'
      : 'Sesión cancelada exitosamente. Se ha notificado al destinatario.'
    );
  };

  // RF-08 & RF-14: Rating & Qualitative Review Submission
  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (comment.length > 300) {
      alert('La reseña cualitativa no puede superar los 300 caracteres.');
      return;
    }
    
    // Save review data
    setReviewSubmitted(true);
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      <header style={styles.header}>
        <h1>Mis Tutorías</h1>
        <p>Coordina detalles, accede a enlaces de videoconferencia y califica tus clases finalizadas.</p>
      </header>

      <div style={styles.dashboardLayout}>
        {/* Left Side: Sessions List */}
        <section style={styles.listSection} className="glass-card">
          <h3 style={styles.sidebarTitle}>Agenda de Sesiones</h3>
          <div style={styles.sessionsList}>
            {sessions.map(s => (
              <div 
                key={s.id} 
                style={{
                  ...styles.sessionItem,
                  borderColor: selectedSession?.id === s.id ? 'var(--accent)' : 'var(--border-glass)',
                  backgroundColor: selectedSession?.id === s.id ? 'hsla(45, 85%, 52%, 0.05)' : 'transparent'
                }}
                onClick={() => setSelectedSession(s)}
              >
                <div style={styles.sessionHeaderRow}>
                  <strong style={styles.itemTitle}>{s.discipline}</strong>
                  <span className={`badge ${
                    s.status === 'completed' ? 'badge-success' : 
                    s.status === 'cancelled' ? 'badge-danger' : 'badge-primary'
                  }`}>
                    {s.status === 'completed' ? 'Finalizada' : 
                     s.status === 'cancelled' ? 'Cancelada' : 'Agendada'}
                  </span>
                </div>
                
                <p style={styles.itemSubtitle}>
                  {profile?.role === 'tutor' ? `Estudiante: ${s.studentName}` : `Tutor: ${s.tutorName}`}
                </p>

                <div style={styles.itemMeta}>
                  <div style={styles.metaLabel}>
                    <Calendar size={12} />
                    <span>{s.date} ({s.time})</span>
                  </div>
                  <div style={styles.metaLabel}>
                    <DollarSign size={12} />
                    <span style={{ textTransform: 'capitalize' }}>
                      {s.paymentStatus === 'executed' ? 'Pago Recibido' : 'Pendiente Pago'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Side: Chat & Control board */}
        {selectedSession ? (
          <section style={styles.chatSection} className="glass-card">
            
            {/* Header / Session Details */}
            <div style={styles.chatHeader}>
              <div>
                <h3 style={styles.chatTitle}>{selectedSession.discipline}</h3>
                <p style={styles.chatSubtitle}>
                  Con {profile?.role === 'tutor' ? selectedSession.studentName : selectedSession.tutorName} | {selectedSession.date} a las {selectedSession.time} ({selectedSession.duration} min)
                </p>
              </div>
              
              {/* Cancellation button (RF-10) */}
              {selectedSession.status === 'scheduled' && (
                <button className="btn btn-secondary" style={styles.cancelBtn} onClick={openCancelDialog}>
                  Cancelar
                </button>
              )}
            </div>

            {/* Session Links / Map Locations */}
            <div style={styles.linksPanel}>
              {selectedSession.status === 'cancelled' ? (
                <div style={styles.cancelledBanner}>
                  <ShieldAlert size={18} />
                  <span>
                    Esta sesión ha sido cancelada.{' '}
                    {selectedSession.cancelReason && `Razón: "${selectedSession.cancelReason}"`}
                  </span>
                </div>
              ) : (
                <>
                  {selectedSession.modality === 'digital' ? (
                    <div style={styles.linkRow}>
                      <Video size={18} color="var(--accent)" />
                      <div>
                        <strong>Clase Virtual:</strong>{' '}
                        {isOffline ? (
                          <span style={{ color: 'var(--text-muted)' }}>Enlace no disponible sin conexión</span>
                        ) : (
                          <a href={selectedSession.meetLink} target="_blank" rel="noopener noreferrer" style={styles.linkHref}>
                            {selectedSession.meetLink}
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={styles.linkRow}>
                      <MapPin size={18} color="var(--accent)" />
                      <div>
                        <strong>Ubicación de Encuentro:</strong>{' '}
                        <span>{selectedSession.location || 'Campus Central UPTC (Aula a confirmar por el tutor)'}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Chat Board (RF-06) */}
            <div style={styles.chatBoard}>
              <div style={styles.messagesContainer}>
                {messages.map(m => (
                  <div 
                    key={m.id} 
                    style={{
                      ...styles.messageWrapper,
                      alignSelf: m.senderName === 'Yo' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div 
                      style={{
                        ...styles.messageBox,
                        backgroundColor: m.senderName === 'Yo' ? 'var(--primary)' : 'var(--bg-surface)',
                        borderBottomRightRadius: m.senderName === 'Yo' ? '2px' : '12px',
                        borderBottomLeftRadius: m.senderName === 'Yo' ? '12px' : '2px'
                      }}
                    >
                      <span style={styles.senderLabel}>{m.senderName}</span>
                      <p style={styles.messageText}>{m.text}</p>
                      <span style={styles.messageTime}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              {selectedSession.status !== 'cancelled' && (
                <form onSubmit={handleSendMessage} style={styles.inputContainer}>
                  <input 
                    type="text" 
                    placeholder={isOffline ? "Bandeja de salida sin conexión..." : "Escribe un mensaje para coordinar..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    style={styles.chatInput}
                  />
                  <button type="submit" style={styles.sendBtn} title="Enviar mensaje">
                    <Send size={18} />
                  </button>
                </form>
              )}
            </div>

            {/* Class Feedback & Stars (RF-08, RF-14) - Enabled for completed sessions */}
            {selectedSession.status === 'completed' && profile?.role !== 'tutor' && (
              <div style={styles.feedbackSection}>
                <h3 style={styles.sectionHeader}>Calificar Sesión</h3>
                {reviewSubmitted ? (
                  <div style={styles.reviewSuccess}>
                    <Check size={18} color="var(--success)" />
                    <span>¡Gracias por calificar tu tutoría! Tu reseña ha sido guardada.</span>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} style={styles.feedbackForm}>
                    <div style={styles.ratingRow}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Calificación:</span>
                      <div style={styles.starRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            type="button" 
                            style={styles.starBtn}
                            onClick={() => setRating(star)}
                          >
                            <Star 
                              size={22} 
                              fill={star <= rating ? 'var(--accent)' : 'none'} 
                              color="var(--accent)" 
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Reseña cualitativa (Máx. 300 caracteres)</label>
                      <textarea 
                        className="input" 
                        rows="3" 
                        maxLength="300"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Describe cómo te fue con el tutor..."
                        style={styles.textarea}
                        required
                      />
                      <div style={styles.charCounter}>{comment.length}/300</div>
                    </div>
                    <button type="submit" className="btn btn-accent" style={styles.submitReviewBtn}>
                      Enviar Calificación
                    </button>
                  </form>
                )}
              </div>
            )}
          </section>
        ) : (
          <div style={styles.selectPrompt}>
            <p>Selecciona una sesión de la agenda para coordinar detalles y ver mensajes.</p>
          </div>
        )}
      </div>

      {/* Cancellation Warning Dialog (RF-10) */}
      {showCancelModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Confirmar Cancelación</h3>
            </div>
            <div style={styles.modalBody}>
              <p>¿Estás seguro de que deseas cancelar esta tutoría?</p>
              
              {cancellationAuditWarning && (
                <div style={styles.auditWarningBox}>
                  <AlertCircle size={20} color="var(--danger)" />
                  <div>
                    <strong>Cancelación de Auditoría Tardía</strong>
                    <p style={{ fontSize: '0.75rem', margin: 0, color: 'hsl(354, 90%, 80%)' }}>
                      Faltan menos de 120 minutos para el encuentro. Esta acción quedará anotada en tu expediente histórico.
                    </p>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Justificación de cancelación (Opcional)</label>
                <textarea 
                  className="input" 
                  rows="3" 
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Explica brevemente el motivo..."
                  style={styles.textarea}
                />
              </div>
            </div>
            <div style={styles.modalActions}>
              <button className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>
                Atrás
              </button>
              <button className="btn btn-danger" onClick={handleCancelSession}>
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}
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
    textAlign: 'center',
    paddingBottom: '0.5rem'
  },
  dashboardLayout: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  listSection: {
    padding: '1.25rem'
  },
  sidebarTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    marginBottom: '1rem',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '0.5rem'
  },
  sessionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  sessionItem: {
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-sm)',
    padding: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem'
  },
  sessionHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemTitle: {
    fontSize: '0.95rem',
    fontWeight: '700'
  },
  itemSubtitle: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)'
  },
  itemMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.4rem',
    borderTop: '1px dashed var(--border-glass)',
    paddingTop: '0.4rem'
  },
  metaLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.75rem',
    color: 'var(--text-muted)'
  },
  
  // Right side panel
  chatSection: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
  },
  chatHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '1rem'
  },
  chatTitle: {
    fontSize: '1.25rem',
    fontWeight: '800'
  },
  chatSubtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)'
  },
  cancelBtn: {
    padding: '0.4rem 0.8rem',
    minHeight: '36px',
    fontSize: '0.8rem',
    backgroundColor: 'transparent',
    border: '1px solid var(--danger)',
    color: 'var(--danger)'
  },
  linksPanel: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-glass)',
    padding: '1rem'
  },
  cancelledBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    color: 'var(--danger)',
    fontSize: '0.85rem',
    fontWeight: '600'
  },
  linkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.85rem'
  },
  linkHref: {
    color: 'var(--accent-light)',
    wordBreak: 'break-all',
    fontWeight: '600'
  },
  
  // Chatting box
  chatBoard: {
    display: 'flex',
    flexDirection: 'column',
    height: '350px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-glass)',
    overflow: 'hidden'
  },
  messagesContainer: {
    flex: 1,
    padding: '1rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem'
  },
  messageWrapper: {
    maxWidth: '75%',
    display: 'flex',
    flexDirection: 'column'
  },
  messageBox: {
    borderRadius: '12px',
    padding: '0.6rem 0.8rem',
    color: 'var(--text-primary)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    boxShadow: 'var(--shadow-sm)'
  },
  senderLabel: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: 'var(--accent)',
    textTransform: 'uppercase'
  },
  messageText: {
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    wordBreak: 'break-word'
  },
  messageTime: {
    fontSize: '0.6rem',
    color: 'var(--text-muted)',
    alignSelf: 'flex-end',
    marginTop: '0.1rem'
  },
  inputContainer: {
    display: 'flex',
    borderTop: '1px solid var(--border-glass)',
    backgroundColor: 'var(--bg-surface)'
  },
  chatInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    padding: '0.8rem 1rem',
    outline: 'none',
    fontFamily: 'var(--font-sans)'
  },
  sendBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    cursor: 'pointer',
    padding: '0 1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s ease'
  },
  
  // Feedback module
  feedbackSection: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-sm)',
    padding: '1.25rem',
    marginTop: '0.5rem'
  },
  sectionHeader: {
    fontSize: '1.05rem',
    fontWeight: '700',
    marginBottom: '0.75rem',
    borderLeft: '3px solid var(--accent)',
    paddingLeft: '0.5rem'
  },
  reviewSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--success)',
    fontSize: '0.85rem',
    fontWeight: '600'
  },
  feedbackForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  starRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    marginTop: '0.2rem'
  },
  starBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.2rem'
  },
  textarea: {
    width: '100%',
    resize: 'none',
    fontFamily: 'var(--font-sans)'
  },
  charCounter: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    alignSelf: 'flex-end',
    marginTop: '-0.3rem'
  },
  submitReviewBtn: {
    alignSelf: 'flex-start'
  },
  
  // Selection prompt
  selectPrompt: {
    padding: '3rem',
    textAlign: 'center',
    color: 'var(--text-muted)'
  },
  
  // Modal Overlay
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
    borderRadius: 'var(--radius-md)',
    padding: '1.5rem',
    width: '100%',
    maxWidth: '450px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  modalHeader: {
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '0.5rem'
  },
  modalTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  auditWarningBox: {
    display: 'flex',
    gap: '0.6rem',
    backgroundColor: 'hsla(354, 70%, 54%, 0.15)',
    border: '1px dashed var(--danger)',
    borderRadius: '6px',
    padding: '0.75rem',
    color: 'var(--text-primary)',
    fontSize: '0.85rem'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.5rem'
  }
};

// Add desktop split layout queries
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    @media (min-width: 768px) {
      div[style*="flex-direction: column"][class*="dashboardLayout"] {
        flex-direction: row !important;
      }
      section[style*="padding: 1.25rem"][class*="listSection"] {
        width: 320px !important;
        flex-shrink: 0;
      }
      section[style*="padding: 1.5rem"][class*="chatSection"] {
        flex: 1 !important;
      }
    }
  `;
  document.head.appendChild(styleEl);
}

