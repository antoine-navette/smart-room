-- Up Migration

CREATE TABLE incidents (
    id SERIAL PRIMARY KEY,
    room_id INT REFERENCES rooms(id) ON DELETE SET NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP NOT NULL,
    resolved_at TIMESTAMP
);

-- Down Migration

DROP TABLE IF EXISTS incidents;