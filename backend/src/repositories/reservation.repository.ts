import type { Pool, QueryResultRow } from 'pg';
import type { Reservation } from '../entities/entities.js';

export type ReservationCreate = Omit<Reservation, 'id'>;

export class ReservationRepository {
    constructor(private readonly pool: Pool) {}

    async findAll(): Promise<Reservation[]> {
        const res = await this.pool.query('SELECT id, user_id, room_id, start_time, end_time FROM reservations ORDER BY id ASC');

        return res.rows.map((r) => ({
            id: Number(r.id),
            user_id: Number(r.user_id),
            room_id: Number(r.room_id),
            start_time: new Date(r.start_time),
            end_time: new Date(r.end_time),
        }));
    }

    async findById(id: number): Promise<Reservation | null> {
        const res = await this.pool.query('SELECT id, user_id, room_id, start_time, end_time FROM reservations WHERE id = $1', [id]);
        const row = res.rows[0];

        if (!row) return null;

        return {
            id: Number(row.id),
            user_id: Number(row.user_id),
            room_id: Number(row.room_id),
            start_time: new Date(row.start_time),
            end_time: new Date(row.end_time),
        };
    }

    async create(data: ReservationCreate): Promise<Reservation> {
        const res = await this.pool.query(
            'INSERT INTO reservations (user_id, room_id, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING id, user_id, room_id, start_time, end_time',
            [data.user_id, data.room_id, data.start_time.toISOString(), data.end_time.toISOString()],
        );
        const row = res.rows[0];

        if (!row) throw new Error('Failed to create reservation');

        return {
            id: Number(row.id),
            user_id: Number(row.user_id),
            room_id: Number(row.room_id),
            start_time: new Date(row.start_time),
            end_time: new Date(row.end_time),
        };
    }

    async save(entity: Reservation): Promise<Reservation> {
        const res = await this.pool.query(
            'UPDATE reservations SET user_id = $1, room_id = $2, start_time = $3, end_time = $4 WHERE id = $5 RETURNING id, user_id, room_id, start_time, end_time',
            [entity.user_id, entity.room_id, entity.start_time.toISOString(), entity.end_time.toISOString(), entity.id],
        );

        const row = res.rows[0];
        if (!row) throw new Error('Failed to save reservation');

        return {
            id: Number(row.id),
            user_id: Number(row.user_id),
            room_id: Number(row.room_id),
            start_time: new Date(row.start_time),
            end_time: new Date(row.end_time),
        };
    }

    async deleteById(id: number): Promise<boolean> {
        const result = await this.pool.query('DELETE FROM reservations WHERE id = $1', [id]);

        return (result.rowCount ?? 0) > 0;
    }
}