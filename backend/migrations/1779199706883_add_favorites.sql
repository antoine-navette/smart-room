-- Up Migration

CREATE TABLE favorites (
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, room_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);

-- Down Migration

DROP INDEX IF EXISTS idx_favorites_user_id;
DROP TABLE IF EXISTS favorites;
