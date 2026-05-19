-- ========== ENUMS ==========
CREATE TYPE gender_enum AS ENUM ('M', 'F', 'O');

-- ========== TABLE: buildings ==========
CREATE TABLE buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

-- ========== TABLE: floors ==========
CREATE TABLE floors (
    id SERIAL PRIMARY KEY,
    building_id INT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    name VARCHAR(20) NOT NULL,
    UNIQUE (building_id, name) -- Contrainte d'unicité par bâtiment
);

-- ========== TABLE: rooms ==========
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    floor_id INT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    name VARCHAR(20) NOT NULL,
    capacity INT NOT NULL
);

-- ========== TABLE: users ==========
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    last_name VARCHAR(20) NOT NULL,
    first_name VARCHAR(20) NOT NULL,
    gender gender_enum,
    email VARCHAR(40) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

-- ========== TABLE: reservations ==========
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    room_id INT NOT NULL REFERENCES rooms(id) ON DELETE SET NULL,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    CONSTRAINT chk_time CHECK (end_time > start_time)
);

-- ========== TABLE: sessions ==========
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL
);

-- ===========================
--  TEST DATA (Simplifiée)
-- ===========================

INSERT INTO buildings (name) VALUES
    ('Building A'),
    ('Building B');

INSERT INTO floors (building_id, name) VALUES
    (1, 'RDC'),
    (1, '1er étage'),
    (2, 'RDC');

INSERT INTO rooms (floor_id, name, capacity) VALUES
    (1, 'A0.01', 10),
    (1, 'A1.12', 15),
    (3, 'B0.05', 50);

INSERT INTO users (last_name, first_name, gender, email, password_hash) VALUES
    ('SCHENK', 'Hugo', 'M', 'hugo@example.com', 'pwd'),
    ('NAVETTE', 'Antoine', 'M', 'antoine@example.com', 'pwd'),
    ('KOLETZKI', 'Livia', 'F', 'livia@example.com', 'pwd');

INSERT INTO reservations (user_id, room_id, start_time, end_time) VALUES
    (1, 1, '2025-01-10 10:00', '2025-01-10 12:00'),
    (2, 2, '2025-01-11 14:00', '2025-01-11 16:00'),
    (3, 3, '2025-01-12 09:00', '2025-01-12 11:00');
