import type { Pool } from 'pg';
import type { Room } from '../entities/room.entity.js';

export class RoomRepository {
    constructor(private readonly pool: Pool) {}

    async create(name: string, floorId: number, capacity: number): Promise<Room> {
        const res = await this.pool.query<Room>(
            'INSERT INTO rooms (name, floor_id, capacity) VALUES ($1, $2, $3) RETURNING id, name, floor_id, capacity',
            [name, floorId, capacity],
        );
        const row = res.rows[0];
        if (!row) throw new Error('Failed to create room');
        return row;
    }

    async findAll(): Promise<Room[]> {
        const res = await this.pool.query<Room>('SELECT id, name, floor_id, capacity FROM rooms ORDER BY id');
        return res.rows;
    }

    async findById(id: number): Promise<Room | null> {
        const res = await this.pool.query<Room>('SELECT id, name, floor_id, capacity FROM rooms WHERE id = $1', [id]);
        return res.rows[0] ?? null;
    }

    async findByNameAndFloorId(name: string, floorId: number): Promise<Room | null> {
        const res = await this.pool.query<Room>(
            'SELECT id, name, floor_id, capacity FROM rooms WHERE name = $1 AND floor_id = $2',
            [name, floorId],
        );
        return res.rows[0] ?? null;
    }

    async findAvailable(startTime: Date, endTime: Date): Promise<Room[]> {
        const res = await this.pool.query<Room>(
            `SELECT id, name, floor_id, capacity FROM rooms
             WHERE id NOT IN (
                 SELECT room_id FROM reservations
                 WHERE room_id IS NOT NULL
                 AND start_time < $2
                 AND end_time > $1
             )
             AND id NOT IN (
                 SELECT room_id FROM room_unavailabilities
                 WHERE from_time < $2
                 AND to_time > $1
             )
             ORDER BY id`,
            [startTime.toISOString(), endTime.toISOString()],
        );
        return res.rows;
    }

    async hasUnavailabilityOverlap(
        roomId: number,
        startTime: Date,
        endTime: Date,
        excludeId?: number,
    ): Promise<boolean> {
        const params: Array<number | string> = [roomId, startTime.toISOString(), endTime.toISOString()];
        const excludeClause = excludeId == null ? '' : ' AND id <> $4';
        if (excludeId != null) params.push(excludeId);

        const res = await this.pool.query<{ exists: boolean }>(
            `SELECT EXISTS (
                SELECT 1 FROM room_unavailabilities
                WHERE room_id = $1
                AND from_time < $3
                AND to_time > $2${excludeClause}
            ) AS exists`,
            params,
        );
        return res.rows[0]?.exists ?? false;
    }

    async save(room: Room): Promise<void> {
        await this.pool.query('UPDATE rooms SET name = $1, floor_id = $2, capacity = $3 WHERE id = $4', [
            room.name,
            room.floor_id,
            room.capacity,
            room.id,
        ]);
    }

    async delete(room: Room): Promise<void> {
        await this.pool.query('DELETE FROM rooms WHERE id = $1', [room.id]);
    }
}
