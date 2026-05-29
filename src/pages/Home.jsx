import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Star, MapPin, Video, BookOpen, Award, Sparkles } from 'lucide-react';

// Mock Tutors Data for demonstration
const MOCK_TUTORS = [
  {
    uid: 't1',
    username: 'anderson-carvajal',
    displayName: 'Anderson Carvajal',
    faculty: 'Ingeniería',
    discipline: 'Sistemas',
    biography: 'Estudiante de último semestre de Ingeniería de Sistemas. Dominio de algoritmos, estructuras de datos, React, Node y bases de datos relacionales. Apasionado por la enseñanza.',
    rating: 4.9,
    reviewCount: 24,
    hourlyRate: 15000,
    modality: 'digital', // 'digital', 'physical', or 'both'
    isVerified: true,
    hasFreeIntro: true,
    photoURL: '/anderson.png'
  },
  {
    uid: 't2',
    username: 'oscar-rojas',
    displayName: 'Oscar Ivan Rojas',
    faculty: 'Ciencias de la Educación',
    discipline: 'Matemáticas',
    biography: 'Tutor de cálculo diferencial, integral y álgebra lineal. Explicaciones paso a paso con metodología adaptable a cualquier nivel académico.',
    rating: 4.7,
    reviewCount: 18,
    hourlyRate: 12000,
    modality: 'both',
    isVerified: true,
    hasFreeIntro: false,
    photoURL: '/oscar.jpg'
  },
  {
    uid: 't3',
    username: 'tomas-useche',
    displayName: 'Tomas Useche',
    faculty: 'Ingeniería',
    discipline: 'Física',
    biography: 'Refuerzo de Física I, II y Mecánica Newtoniana. Resolución de ejercicios de talleres y preparación de exámenes parciales.',
    rating: 4.8,
    reviewCount: 15,
    hourlyRate: 18000,
    modality: 'physical',
    isVerified: false,
    hasFreeIntro: true,
    photoURL: '/tomas.jpg'
  }
];

export function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [faculty, setFaculty] = useState('All');
  const [modality, setModality] = useState('All');
  const [sortBy, setSortBy] = useState('rating'); // 'rating' or 'price'
  const [maxPrice, setMaxPrice] = useState(25000);
  const [showFilters, setShowFilters] = useState(false);

  // Filters calculation
  const filteredTutors = MOCK_TUTORS.filter(tutor => {
    const matchesSearch = tutor.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tutor.discipline.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFaculty = faculty === 'All' || tutor.faculty === faculty;
    const matchesModality = modality === 'All' || tutor.modality === modality || tutor.modality === 'both';
    const matchesPrice = tutor.hourlyRate <= maxPrice;
    
    return matchesSearch && matchesFaculty && matchesModality && matchesPrice;
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'price') return a.hourlyRate - b.hourlyRate;
    return 0;
  });

  return (
    <div className="animate-fade-in" style={styles.container}>
      <header style={styles.header}>
        <h1>Encuentra tu Tutor UPTC</h1>
        <p>Aprende de compañeros destacados de tu facultad y supera tus metas académicas.</p>
      </header>

      {/* Search and Filters Bar */}
      <section style={styles.searchSection}>
        <div style={styles.searchBar}>
          <Search size={20} color="var(--text-muted)" style={{ marginLeft: '1rem' }} />
          <input 
            type="text" 
            placeholder="Buscar por materia (ej. Cálculo, React) o tutor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <button 
            style={styles.filterToggleBtn} 
            onClick={() => setShowFilters(!showFilters)}
            title="Filtros avanzados"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* Expandable Advanced Filters Drawer (RF-03) */}
        {showFilters && (
          <div style={styles.filtersPanel} className="animate-fade-in">
            <div className="grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              
              <div className="form-group">
                <label>Facultad</label>
                <select value={faculty} onChange={(e) => setFaculty(e.target.value)} className="input" style={styles.select}>
                  <option value="All">Todas las facultades</option>
                  <option value="Ingeniería">Ingeniería</option>
                  <option value="Ciencias de la Educación">Ciencias de la Educación</option>
                  <option value="Ciencias">Ciencias</option>
                </select>
              </div>

              <div className="form-group">
                <label>Modalidad</label>
                <select value={modality} onChange={(e) => setModality(e.target.value)} className="input" style={styles.select}>
                  <option value="All">Cualquier modalidad</option>
                  <option value="digital">Digital (Virtual)</option>
                  <option value="physical">Física (Presencial)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Precio Máximo por hora: ${maxPrice.toLocaleString()}</label>
                <input 
                  type="range" 
                  min="5000" 
                  max="30000" 
                  step="1000"
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  style={styles.rangeInput}
                />
              </div>

              <div className="form-group">
                <label>Ordenar Por</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input" style={styles.select}>
                  <option value="rating">Calificación promedio</option>
                  <option value="price">Menor tarifa horaria</option>
                </select>
              </div>

            </div>
          </div>
        )}
      </section>

      {/* Tutor Listings */}
      <section style={styles.listingsSection}>
        <h2 style={styles.sectionTitle}>
          Tutores Disponibles ({filteredTutors.length})
        </h2>
        
        {filteredTutors.length === 0 ? (
          <div style={styles.noResults}>
            <p>No encontramos tutores con los criterios seleccionados.</p>
          </div>
        ) : (
          <div className="grid-container">
            {filteredTutors.map(tutor => (
              <div 
                key={tutor.uid} 
                className="glass-card" 
                style={styles.tutorCard}
                onClick={() => navigate(`/tutor/${tutor.username}`)}
              >
                {/* Header info */}
                <div style={styles.cardHeader}>
                  <img src={tutor.photoURL} alt={tutor.displayName} style={styles.cardAvatar} />
                  <div style={styles.cardIdentity}>
                    <div style={styles.nameRow}>
                      <h3 style={styles.tutorName}>{tutor.displayName}</h3>
                      {tutor.isVerified && (
                        <span style={styles.verifiedBadge} title="Perfil Verificado">
                          <Award size={14} />
                        </span>
                      )}
                    </div>
                    <div style={styles.subjectRow}>
                      <span className="badge badge-primary">{tutor.discipline}</span>
                      <span style={styles.facultyText}>{tutor.faculty}</span>
                    </div>
                  </div>
                </div>

                {/* Bio text */}
                <p style={styles.biographyText}>
                  {tutor.biography.slice(0, 140)}...
                </p>

                {/* Footer specs */}
                <div style={styles.cardFooter}>
                  <div style={styles.statsCol}>
                    <div style={styles.ratingRow}>
                      <Star size={16} fill="var(--accent)" color="var(--accent)" />
                      <span>{tutor.rating.toFixed(1)}</span>
                      <span style={styles.reviewsText}>({tutor.reviewCount})</span>
                    </div>
                    <div style={styles.modalityRow}>
                      {tutor.modality === 'digital' || tutor.modality === 'both' ? (
                        <Video size={16} style={styles.modalityIcon} title="Disponible Virtual" />
                      ) : null}
                      {tutor.modality === 'physical' || tutor.modality === 'both' ? (
                        <MapPin size={16} style={styles.modalityIcon} title="Disponible Presencial" />
                      ) : null}
                      <span style={styles.modalityText}>
                        {tutor.modality === 'both' ? 'Mixta' : tutor.modality === 'digital' ? 'Virtual' : 'Presencial'}
                      </span>
                    </div>
                  </div>
                  <div style={styles.priceCol}>
                    <span style={styles.hourlyLabel}>Por hora</span>
                    <span style={styles.hourlyValue}>${tutor.hourlyRate.toLocaleString()}</span>
                  </div>
                </div>

                {/* Free Intro Promo Badge (RF-18) */}
                {tutor.hasFreeIntro && (
                  <div style={styles.promoBadge}>
                    <Sparkles size={12} />
                    <span>Intro Gratis (20m)</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  header: {
    textAlign: 'center',
    maxWidth: '700px',
    margin: '0 auto',
    padding: '1rem 0'
  },
  searchSection: {
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto'
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
    overflow: 'hidden',
    minHeight: 'var(--touch-target)'
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    padding: '0.75rem 1rem',
    outline: 'none',
    fontFamily: 'var(--font-sans)'
  },
  filterToggleBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '0.75rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s ease',
    borderLeft: '1px solid var(--border-glass)'
  },
  filtersPanel: {
    marginTop: '1rem',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-md)',
    padding: '1.25rem',
    boxShadow: 'var(--shadow-sm)'
  },
  select: {
    width: '100%',
    cursor: 'pointer'
  },
  rangeInput: {
    width: '100%',
    accentColor: 'var(--accent)',
    height: '6px',
    borderRadius: '3px',
    outline: 'none'
  },
  listingsSection: {
    marginTop: '1rem'
  },
  sectionTitle: {
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '0.5rem',
    marginBottom: '1.5rem',
    fontSize: '1.25rem'
  },
  noResults: {
    textAlign: 'center',
    padding: '3rem',
    color: 'var(--text-secondary)'
  },
  tutorCard: {
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '1.25rem'
  },
  cardHeader: {
    display: 'flex',
    gap: '1rem'
  },
  cardAvatar: {
    width: '56px',
    height: '56px',
    borderRadius: 'var(--radius-sm)',
    objectFit: 'cover',
    border: '1px solid var(--border-glass)'
  },
  cardIdentity: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem'
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem'
  },
  tutorName: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  verifiedBadge: {
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center'
  },
  subjectRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  facultyText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)'
  },
  biographyText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.45'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTop: '1px solid var(--border-glass)',
    paddingTop: '0.8rem',
    marginTop: 'auto'
  },
  statsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem'
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.85rem',
    fontWeight: '600'
  },
  reviewsText: {
    color: 'var(--text-muted)',
    fontSize: '0.75rem'
  },
  modalityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    color: 'var(--text-secondary)'
  },
  modalityIcon: {
    color: 'var(--text-muted)'
  },
  modalityText: {
    fontSize: '0.75rem'
  },
  priceCol: {
    textAlign: 'right'
  },
  hourlyLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    display: 'block',
    textTransform: 'uppercase'
  },
  hourlyValue: {
    fontSize: '1.15rem',
    fontWeight: '800',
    color: 'var(--accent)'
  },
  promoBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: 'hsla(45, 85%, 52%, 0.15)',
    border: '1px solid var(--accent)',
    borderRadius: '4px',
    padding: '0.15rem 0.4rem',
    fontSize: '0.65rem',
    fontWeight: '700',
    color: 'var(--accent-light)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.2rem',
    textTransform: 'uppercase'
  }
};

