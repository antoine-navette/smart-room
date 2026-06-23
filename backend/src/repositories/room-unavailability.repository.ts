import type { Pool } from 'pg';
import type { RoomUnavailability } from '../entities/room-unavailability.entity.js';

export class RoomUnavailabilityRepository {
    constructor(private readonly pool: Pool) {}

    async create(roomId: number, fromTime: Date, toTime: Date, reason: string): Promise<RoomUnavailability> {
        const res = await this.pool.query<RoomUnavailability>(
            'INSERT INTO room_unavailabilities (room_id, from_time, to_time, reason) VALUES ($1, $2, $3, $4) RETURNING id, room_id, from_time, to_time, reason',
            [roomId, fromTime.toISOString(), toTime.toISOString(), reason],
        );
        const row = res.rows[0];
        if (!row) throw new Error('Failed to create room unavailability');
        return row;
    }

    async findAll(): Promise<RoomUnavailability[]> {
        const res = await this.pool.query<RoomUnavailability>(
            'SELECT id, room_id, from_time, to_time, reason FROM room_unavailabilities ORDER BY id',
        );
        return res.rows;
    }

    async findById(id: number): Promise<RoomUnavailability | null> {
        const res = await this.pool.query<RoomUnavailability>(
            'SELECT id, room_id, from_time, to_time, reason FROM room_unavailabilities WHERE id = $1',
            [id],
        );
        return res.rows[0] ?? null;
    }

    async findByRoomId(roomId: number): Promise<RoomUnavailability[]> {
        const res = await this.pool.query<RoomUnavailability>(
            'SELECT id, room_id, from_time, to_time, reason FROM room_unavailabilities WHERE room_id = $1 ORDER BY from_time, id',
            [roomId],
        );
        return res.rows;
    }

    async findOverlapping(
        roomId: number,
        fromTime: Date,
        toTime: Date,
        excludeId?: number,
    ): Promise<RoomUnavailability[]> {
        const params: Array<number | string> = [roomId, fromTime.toISOString(), toTime.toISOString()];
        const excludeClause = excludeId == null ? '' : ' AND id <> $4';
        if (excludeId != null) params.push(excludeId);

        const res = await this.pool.query<RoomUnavailability>(
            `SELECT id, room_id, from_time, to_time, reason FROM room_unavailabilities
             WHERE room_id = $1
             AND from_time < $3
             AND to_time > $2${excludeClause}`,
            params,
        );
        return res.rows;
    }

    async save(roomUnavailability: RoomUnavailability): Promise<void> {
        await this.pool.query(
            'UPDATE room_unavailabilities SET room_id = $1, from_time = $2, to_time = $3, reason = $4 WHERE id = $5',
            [
                roomUnavailability.room_id,
                roomUnavailability.from_time.toISOString(),
                roomUnavailability.to_time.toISOString(),
                roomUnavailability.reason,
                roomUnavailability.id,
            ],
        );
    }

    async delete(roomUnavailability: RoomUnavailability): Promise<void> {
        await this.pool.query('DELETE FROM room_unavailabilities WHERE id = $1', [roomUnavailability.id]);
    }
}
