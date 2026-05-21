import type { Pool } from 'pg';
import type { Favorite } from '../entities/favorite.entity.js';

export class FavoriteRepository {
    constructor(private readonly pool: Pool) {}

    async create(userId: number, roomId: number): Promise<Favorite> {
        const res = await this.pool.query<Favorite>(
            'INSERT INTO favorites (user_id, room_id) VALUES ($1, $2) RETURNING user_id, room_id',
            [userId, roomId],
        );
        const row = res.rows[0];
        if (!row) throw new Error('Failed to create favorite');
        return row;
    }

    async findByUserId(userId: number): Promise<Favorite[]> {
        const res = await this.pool.query<Favorite>('SELECT user_id, room_id FROM favorites WHERE user_id = $1 ORDER BY room_id', [userId]);
        return res.rows;
    }
    async findByUserAndRoom(userId: number, roomId: number): Promise<Favorite | null> {
        const res = await this.pool.query<Favorite>('SELECT user_id, room_id FROM favorites WHERE user_id = $1 AND room_id = $2', [userId, roomId]);
        return res.rows[0] ?? null;
    }

    async deleteByUserAndRoom(userId: number, roomId: number): Promise<void> {
        await this.pool.query('DELETE FROM favorites WHERE user_id = $1 AND room_id = $2', [userId, roomId]);
    }
}
