import type { Pool } from 'pg';
import type { User } from '../entities/entities.js';

export type UserCreate = Omit<User, 'id'>;

export class UserRepository {
    constructor(private readonly pool: Pool) {}

    async findAll(): Promise<User[]> {
        const res = await this.pool.query<User>(
            'SELECT id, last_name, first_name, role, email, password_hash FROM users ORDER BY id',
        );
        return res.rows;
    }

    async findByEmail(email: string): Promise<User | null> {
        const res = await this.pool.query<User>(
            'SELECT id, last_name, first_name, role, email, password_hash FROM users WHERE email = $1',
            [email],
        );
        return res.rows[0] ?? null;
    }

    async findById(id: number): Promise<User | null> {
        const res = await this.pool.query<User>(
            'SELECT id, last_name, first_name, role, email, password_hash FROM users WHERE id = $1',
            [id],
        );
        return res.rows[0] ?? null;
    }

    async create(data: UserCreate): Promise<User> {
        const res = await this.pool.query<User>(
            'INSERT INTO users (last_name, first_name, role, email, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, last_name, first_name, role, email, password_hash',
            [data.last_name, data.first_name, data.role, data.email, data.password_hash],
        );
        const row = res.rows[0];
        if (!row) throw new Error('Failed to create user');
        return row;
    }

    async save(entity: User): Promise<User> {
        const res = await this.pool.query<User>(
            'UPDATE users SET last_name = $1, first_name = $2, role = $3, email = $4, password_hash = $5 WHERE id = $6 RETURNING id, last_name, first_name, role, email, password_hash',
            [entity.last_name, entity.first_name, entity.role, entity.email, entity.password_hash, entity.id],
        );
        const row = res.rows[0];
        if (!row) throw new Error('Failed to save user');
        return row;
    }

    async deleteById(id: number): Promise<boolean> {
        const result = await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
        return (result.rowCount ?? 0) > 0;
    }
}
