import type { Pool } from 'pg';
import type { Incident } from '../entities/incident.entity.js';

export class IncidentRepository {
    constructor(private readonly pool: Pool) {}

    async create(
        roomId: number | null,
        userId: number | null,
        title: string,
        description: string | null,
    ): Promise<Incident> {
        const res = await this.pool.query<Incident>(
            'INSERT INTO incidents (room_id, user_id, title, description, status, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, room_id, user_id, title, description, status, created_at, resolved_at',
            [roomId, userId, title, description, 'OPEN', new Date().toISOString()],
        );
        const row = res.rows[0];
        if (!row) throw new Error('Failed to create incident');
        return row;
    }

    async findAll(): Promise<Incident[]> {
        const res = await this.pool.query<Incident>(
            'SELECT id, room_id, user_id, title, description, status, created_at, resolved_at FROM incidents ORDER BY id',
        );
        return res.rows;
    }

    async findById(id: number): Promise<Incident | null> {
        const res = await this.pool.query<Incident>(
            'SELECT id, room_id, user_id, title, description, status, created_at, resolved_at FROM incidents WHERE id = $1',
            [id],
        );
        return res.rows[0] ?? null;
    }

    async findByRoomId(roomId: number): Promise<Incident[]> {
        const res = await this.pool.query<Incident>(
            'SELECT id, room_id, user_id, title, description, status, created_at, resolved_at FROM incidents WHERE room_id = $1 ORDER BY id',
            [roomId],
        );
        return res.rows;
    }

    async save(incident: Incident): Promise<void> {
        await this.pool.query(
            'UPDATE incidents SET room_id = $1, user_id = $2, title = $3, description = $4, status = $5, created_at = $6, resolved_at = $7 WHERE id = $8',
            [
                incident.room_id,
                incident.user_id,
                incident.title,
                incident.description,
                incident.status,
                incident.created_at.toISOString(),
                incident.resolved_at ? incident.resolved_at.toISOString() : null,
                incident.id,
            ],
        );
    }

    async delete(incident: Incident): Promise<void> {
        await this.pool.query('DELETE FROM incidents WHERE id = $1', [incident.id]);
    }
}
