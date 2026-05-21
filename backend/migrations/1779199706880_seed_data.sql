-- Up Migration

-- Admin user
INSERT INTO public.users (id, last_name, first_name, role, email, password_hash) 
VALUES (1, 'Room', 'Smart', 'ADMIN', 'admin@smart-room.fr', '$2b$12$JQF1PPR.rQX2ppF2qX8tbuWnTkmJeQ3hC/YPtgg15VsyFrol.w.IW');

-- Users
INSERT INTO public.users (id, last_name, first_name, role, email, password_hash) 
VALUES (2, 'Doe', 'John', 'USER', 'john.doe@smart-room.fr', '$2b$12$JQF1PPR.rQX2ppF2qX8tbuWnTkmJeQ3hC/YPtgg15VsyFrol.w.IW'),
       (3, 'Smith', 'Jane', 'USER', 'jane.smith@smart-room.fr', '$2b$12$JQF1PPR.rQX2ppF2qX8tbuWnTkmJeQ3hC/YPtgg15VsyFrol.w.IW');

-- Buildings
INSERT INTO buildings (name) VALUES ('Batiment A'), ('Batiment B');

-- Floors (3 total)
INSERT INTO floors (building_id, name) VALUES
  ((SELECT id FROM buildings WHERE name = 'Batiment A'), 'RDC'),
  ((SELECT id FROM buildings WHERE name = 'Batiment A'), 'Etage 1'),
  ((SELECT id FROM buildings WHERE name = 'Batiment B'), 'RDC');

-- Rooms (5 total)
INSERT INTO rooms (floor_id, name, capacity) VALUES
  ((SELECT f.id FROM floors f JOIN buildings b ON f.building_id = b.id WHERE b.name = 'Batiment A' AND f.name = 'RDC'), 'Salle A01', 20),
  ((SELECT f.id FROM floors f JOIN buildings b ON f.building_id = b.id WHERE b.name = 'Batiment A' AND f.name = 'RDC'), 'Salle A02', 12),
  ((SELECT f.id FROM floors f JOIN buildings b ON f.building_id = b.id WHERE b.name = 'Batiment A' AND f.name = 'Etage 1'), 'Salle A03', 10),
  ((SELECT f.id FROM floors f JOIN buildings b ON f.building_id = b.id WHERE b.name = 'Batiment B' AND f.name = 'RDC'), 'Salle B01', 10),
  ((SELECT f.id FROM floors f JOIN buildings b ON f.building_id = b.id WHERE b.name = 'Batiment B' AND f.name = 'RDC'), 'Salle B02', 12);

-- Room resources (5 total)
INSERT INTO room_resources (name) VALUES
  ('Projector'),
  ('Whiteboard'),
  ('Blackboard'),
  ('Table'),
  ('Chair');

-- Assign some resources to rooms (contain_resources)
INSERT INTO contain_resources (room_id, resource_id, quantity) VALUES
  ((SELECT id FROM rooms WHERE name = 'Salle A01'), (SELECT id FROM room_resources WHERE name = 'Projector'), 1),
  ((SELECT id FROM rooms WHERE name = 'Salle A01'), (SELECT id FROM room_resources WHERE name = 'Whiteboard'), 1),
  ((SELECT id FROM rooms WHERE name = 'Salle A01'), (SELECT id FROM room_resources WHERE name = 'Table'), 10),
  ((SELECT id FROM rooms WHERE name = 'Salle A01'), (SELECT id FROM room_resources WHERE name = 'Chair'), 20),
  ((SELECT id FROM rooms WHERE name = 'Salle A02'), (SELECT id FROM room_resources WHERE name = 'Table'), 6),
  ((SELECT id FROM rooms WHERE name = 'Salle A02'), (SELECT id FROM room_resources WHERE name = 'Chair'), 12),
  ((SELECT id FROM rooms WHERE name = 'Salle A03'), (SELECT id FROM room_resources WHERE name = 'Table'), 5),
  ((SELECT id FROM rooms WHERE name = 'Salle A03'), (SELECT id FROM room_resources WHERE name = 'Chair'), 10),
  ((SELECT id FROM rooms WHERE name = 'Salle A03'), (SELECT id FROM room_resources WHERE name = 'Blackboard'), 1);

-- Down Migration

DELETE FROM public.users WHERE id = 1 AND email = 'admin@smart-room.fr';
DELETE FROM public.users WHERE id IN (2, 3) AND email IN ('john.doe@smart-room.fr', 'jane.smith@smart-room.fr');
DELETE FROM contain_resources WHERE room_id IN (SELECT id FROM rooms WHERE name IN ('Salle A01','Salle A02','Salle A03','Salle B01','Salle B02'))
  AND resource_id IN (SELECT id FROM room_resources WHERE name IN ('Projector','Whiteboard','Table','Chair','Blackboard'));
DELETE FROM room_resources WHERE name IN ('Projector','Whiteboard','Table','Chair','Blackboard');
DELETE FROM rooms WHERE name IN ('Salle A01','Salle A02','Salle A03','Salle B01','Salle B02');
DELETE FROM floors WHERE name IN ('RDC','Etage 1') AND building_id IN (SELECT id FROM buildings WHERE name IN ('Batiment A','Batiment B'));
DELETE FROM buildings WHERE name IN ('Batiment A','Batiment B');
