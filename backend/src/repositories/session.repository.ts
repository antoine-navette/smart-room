import type { Pool } from 'pg';
import type { Session } from '../entities/session.entity.js';
import type { User } from '../entities/user.entity.js';

export class SessionRepository {
    constructor(private readonly pool: Pool) {}

    async create(userId: number, token: string, expiresAt: Date): Promise<Session> {
        const result = await this.pool.query<Session>(
            'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *',
            [userId, token, expiresAt],
        );
        const row = result.rows[0];
        if (!row) throw new Error('Failed to create session');
        return row;
    }

    async findByTokenWithUser(token: string): Promise<{ session: Session; user: User } | null> {
        type Row = Session & Omit<User, 'id'>;
        const result = await this.pool.query<Row>(
            `SELECT sessions.*, users.last_name, users.first_name, users.role, users.email, users.password_hash
             FROM sessions
             JOIN users ON sessions.user_id = users.id
             WHERE sessions.token = $1`,
            [token],
        );
        const row = result.rows[0];
        if (!row) return null;
        return {
            session: { id: row.id, user_id: row.user_id, token: row.token, expires_at: row.expires_at },
            user: {
                id: row.user_id,
                last_name: row.last_name,
                first_name: row.first_name,
                role: row.role,
                email: row.email,
                password_hash: row.password_hash,
            },
        };
    }

    async delete(session: Session): Promise<void> {
        await this.pool.query('DELETE FROM sessions WHERE id = $1', [session.id]);
    }

    async deleteByUserId(userId: number): Promise<void> {
        await this.pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    }
}
