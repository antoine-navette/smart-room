import type { Pool, QueryResultRow } from 'pg';
import type { Room } from '../entities/room.entity.js';

export type RoomCreate = Omit<Room, 'id'>;

export class RoomRepository {
    constructor(private readonly pool: Pool) {}

    async findAll(): Promise<Room[]> {
        const res = await this.pool.query('SELECT id, name, floor_id, capacity FROM rooms ORDER BY id ASC');

        return res.rows.map((r) => ({ id: Number(r.id), name: String(r.name), floor_id: Number(r.floor_id), capacity: Number(r.capacity) }));
    }

    async findById(id: number): Promise<Room | null> {
        const res = await this.pool.query('SELECT id, name, floor_id, capacity FROM rooms WHERE id = $1', [id]);
        const row = res.rows[0];

        if (!row) return null;

        return { id: Number(row.id), name: String(row.name), floor_id: Number(row.floor_id), capacity: Number(row.capacity) };
    }

    async findByNameAndFloorId(name: string, floor_id: number): Promise<Room | null> {
        const res = await this.pool.query('SELECT id, name, floor_id, capacity FROM rooms WHERE name = $1 AND floor_id = $2', [name, floor_id]);
        const row = res.rows[0];

        if (!row) return null;

        return { id: Number(row.id), name: String(row.name), floor_id: Number(row.floor_id), capacity: Number(row.capacity) };
    }

    async create(data: RoomCreate): Promise<Room> {
        const res = await this.pool.query(
            'INSERT INTO rooms (name, floor_id, capacity) VALUES ($1, $2, $3) RETURNING id, name, floor_id, capacity',
            [data.name, data.floor_id, data.capacity],
        );
        const row = res.rows[0];

        if (!row) throw new Error('Failed to create room');

        return { id: Number(row.id), name: String(row.name), floor_id: Number(row.floor_id), capacity: Number(row.capacity) };
    }

    async save(entity: Room): Promise<Room> {
        const res = await this.pool.query('UPDATE rooms SET name = $1, floor_id = $2, capacity = $3 WHERE id = $4 RETURNING id, name, floor_id, capacity', [
            entity.name,
            entity.floor_id,
            entity.capacity,
            entity.id,
        ]);

        const row = res.rows[0];
        if (!row) throw new Error('Failed to save room');
        
        return { id: Number(row.id), name: String(row.name), floor_id: Number(row.floor_id), capacity: Number(row.capacity) };
    }

    async deleteById(id: number): Promise<boolean> {
        const result = await this.pool.query('DELETE FROM rooms WHERE id = $1', [id]);

        return (result.rowCount ?? 0) > 0;
    }
}