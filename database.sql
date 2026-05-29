-- ====================================================================
-- TutorUPTC - Relational Database Schema (English Version)
-- Version: 1.0
-- Universidad Pedagógica y Tecnológica de Colombia (UPTC)
-- Authors: Anderson Carvajal, Oscar Rojas, Tomas Useche
-- ====================================================================

-- 1. USERS TABLE (Registered students/collaborators)
CREATE TABLE users (
    uid VARCHAR(128) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    photo_url TEXT,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'tutor')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TUTORS TABLE (Extended profile for users with role 'tutor')
CREATE TABLE tutors (
    tutor_uid VARCHAR(128) PRIMARY KEY REFERENCES users(uid) ON DELETE CASCADE,
    biography VARCHAR(500),
    hourly_rate INTEGER NOT NULL CHECK (hourly_rate >= 0),
    has_free_intro BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    inactivity_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    institution_card_url TEXT -- Tutor student card photo URL (RF-11)
);

-- 3. AVAILABILITIES TABLE (Weekly availability blocks - RF-02)
CREATE TABLE availabilities (
    id SERIAL PRIMARY KEY,
    tutor_uid VARCHAR(128) REFERENCES tutors(tutor_uid) ON DELETE CASCADE,
    day_of_week VARCHAR(15) CHECK (day_of_week IN ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    UNIQUE (tutor_uid, day_of_week, start_time, end_time)
);

-- 4. FAVORITES TABLE (Favorites module - RF-13)
CREATE TABLE favorites (
    student_uid VARCHAR(128) REFERENCES users(uid) ON DELETE CASCADE,
    tutor_uid VARCHAR(128) REFERENCES tutors(tutor_uid) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_uid, tutor_uid)
);

-- 5. SESSIONS TABLE (Tutoring appointments - RF-04, RF-16)
CREATE TABLE sessions (
    id VARCHAR(128) PRIMARY KEY,
    tutor_uid VARCHAR(128) REFERENCES tutors(tutor_uid) ON DELETE RESTRICT,
    student_uid VARCHAR(128) REFERENCES users(uid) ON DELETE RESTRICT,
    discipline VARCHAR(100) NOT NULL,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (20, 60, 90, 120)), -- 20m is courtesy intro RF-18
    modality VARCHAR(15) NOT NULL CHECK (modality IN ('digital', 'physical')),
    meet_link TEXT, -- Online videoconference URL
    location_address TEXT, -- Physical campus address coordinates
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'executed')), -- Booking transaction log RF-07
    cancelled_late BOOLEAN DEFAULT FALSE, -- Audit trail for late cancellations RF-10
    cancel_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. REVIEWS TABLE (Ratings 1 to 5 and comments - RF-08, RF-14)
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(128) UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
    tutor_uid VARCHAR(128) REFERENCES tutors(tutor_uid) ON DELETE CASCADE,
    student_uid VARCHAR(128) REFERENCES users(uid) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment VARCHAR(300) NOT NULL, -- 300 character limit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. MESSAGES TABLE (Async messaging per session - RF-06)
CREATE TABLE messages (
    id VARCHAR(128) PRIMARY KEY,
    session_id VARCHAR(128) REFERENCES sessions(id) ON DELETE CASCADE,
    sender_uid VARCHAR(128) REFERENCES users(uid) ON DELETE SET NULL,
    message_text TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. CANCELLATION AUDITS TABLE (Audit trail log for cancellations - RF-10)
CREATE TABLE cancellation_audits (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(128) REFERENCES sessions(id) ON DELETE CASCADE,
    user_uid VARCHAR(128) REFERENCES users(uid) ON DELETE CASCADE,
    cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT
);

-- 9. DISPUTES TABLE (Reports for misconduct/absences - RF-12)
CREATE TABLE disputes (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(128) REFERENCES sessions(id) ON DELETE SET NULL,
    reporter_uid VARCHAR(128) REFERENCES users(uid) ON DELETE CASCADE,
    reported_uid VARCHAR(128) REFERENCES users(uid) ON DELETE CASCADE,
    reason VARCHAR(500) NOT NULL, -- Detailed explanation of issue
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optimization indexes for queries (RF-03)
CREATE INDEX idx_tutor_rate ON tutors(hourly_rate);
CREATE INDEX idx_session_date ON sessions(session_date);
CREATE INDEX idx_reviews_tutor ON reviews(tutor_uid);
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_disputes_reported ON disputes(reported_uid);
