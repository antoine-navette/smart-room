import type { Pool } from 'pg';
import type { RoomResource } from '../entities/room-resource.entity.js';

export class RoomResourceRepository {
    constructor(private readonly pool: Pool) {}

    async create(name: string): Promise<RoomResource> {
        const res = await this.pool.query<RoomResource>(
            'INSERT INTO room_resources (name) VALUES ($1) RETURNING id, name',
            [name],
        );
        const row = res.rows[0];
        if (!row) throw new Error('Failed to create room resource');
        return row;
    }

    async findAll(): Promise<RoomResource[]> {
        const res = await this.pool.query<RoomResource>('SELECT id, name FROM room_resources ORDER BY id');
        return res.rows;
    }

    async findById(id: number): Promise<RoomResource | null> {
        const res = await this.pool.query<RoomResource>('SELECT id, name FROM room_resources WHERE id = $1', [id]);
        return res.rows[0] ?? null;
    }

    async findByName(name: string): Promise<RoomResource | null> {
        const res = await this.pool.query<RoomResource>('SELECT id, name FROM room_resources WHERE name = $1', [name]);
        return res.rows[0] ?? null;
    }

    async save(roomResource: RoomResource): Promise<void> {
        await this.pool.query('UPDATE room_resources SET name = $1 WHERE id = $2', [roomResource.name, roomResource.id]);
    }

    async delete(roomResource: RoomResource): Promise<void> {
        await this.pool.query('DELETE FROM room_resources WHERE id = $1', [roomResource.id]);
    }
}