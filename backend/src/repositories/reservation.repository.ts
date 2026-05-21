import type { Pool } from 'pg';
import type { Reservation } from '../entities/reservation.entity.js';

export class ReservationRepository {
    constructor(private readonly pool: Pool) {}

    async create(roomId: number | null, userId: number | null, startTime: Date, endTime: Date): Promise<Reservation> {
        const res = await this.pool.query<Reservation>(
            'INSERT INTO reservations (user_id, room_id, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING id, user_id, room_id, start_time, end_time',
            [userId, roomId, startTime.toISOString(), endTime.toISOString()],
        );
        const row = res.rows[0];
        if (!row) throw new Error('Failed to create reservation');
        return row;
    }

    async findAll(): Promise<Reservation[]> {
        const res = await this.pool.query<Reservation>(
            'SELECT id, user_id, room_id, start_time, end_time FROM reservations ORDER BY id',
        );
        return res.rows;
    }

    async findByRoomId(roomId: number): Promise<Reservation[]> {
        const res = await this.pool.query<Reservation>(
            'SELECT id, user_id, room_id, start_time, end_time FROM reservations WHERE room_id = $1 ORDER BY id',
            [roomId],
        );
        return res.rows;
    }

    async findById(id: number): Promise<Reservation | null> {
        const res = await this.pool.query<Reservation>(
            'SELECT id, user_id, room_id, start_time, end_time FROM reservations WHERE id = $1',
            [id],
        );
        return res.rows[0] ?? null;
    }

    async save(reservation: Reservation): Promise<void> {
        await this.pool.query(
            'UPDATE reservations SET user_id = $1, room_id = $2, start_time = $3, end_time = $4 WHERE id = $5',
            [reservation.user_id, reservation.room_id, reservation.start_time.toISOString(), reservation.end_time.toISOString(), reservation.id],
        );
    }

    async delete(reservation: Reservation): Promise<void> {
        await this.pool.query('DELETE FROM reservations WHERE id = $1', [reservation.id]);
    }
}
