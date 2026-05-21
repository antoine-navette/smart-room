-- Up Migration

CREATE TYPE role_enum AS ENUM ('USER', 'ADMIN');

CREATE TABLE buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE floors (
    id SERIAL PRIMARY KEY,
    building_id INT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    UNIQUE (building_id, name)
);

CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    floor_id INT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL
);

CREATE TABLE room_resources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE contain_resources (
    room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    resource_id INT NOT NULL REFERENCES room_resources(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    PRIMARY KEY (room_id, resource_id)
);

CREATE INDEX idx_contain_resources_resource_id ON contain_resources(resource_id);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    last_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    role role_enum NOT NULL DEFAULT 'USER',
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    room_id INT REFERENCES rooms(id) ON DELETE SET NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    CONSTRAINT chk_time CHECK (end_time > start_time)
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL
);

-- Down Migration

DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS rooms;
DROP INDEX IF EXISTS idx_contain_resources_resource_id;
DROP TABLE IF EXISTS contain_resources;
DROP TABLE IF EXISTS room_resources;
DROP TABLE IF EXISTS floors;
DROP TABLE IF EXISTS buildings;
DROP TYPE IF EXISTS role_enum;