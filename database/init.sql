-- ========== ENUMS ==========
CREATE TYPE role_enum AS ENUM ('USER', 'ADMIN');

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
    role role_enum NOT NULL DEFAULT 'USER',
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
