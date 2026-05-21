-- Up Migration

CREATE TABLE room_unavailabilities (
    id SERIAL PRIMARY KEY,
    room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    from_time TIMESTAMP NOT NULL,
    to_time TIMESTAMP NOT NULL,
    reason VARCHAR(255) NOT NULL,
    CONSTRAINT chk_room_unavailability_time CHECK (to_time > from_time)
);

CREATE INDEX idx_room_unavailabilities_room_id ON room_unavailabilities(room_id);

-- Down Migration

DROP INDEX IF EXISTS idx_room_unavailabilities_room_id;
DROP TABLE IF EXISTS room_unavailabilities;
