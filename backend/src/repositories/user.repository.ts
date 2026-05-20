import type { Pool } from 'pg';
import type { User, Role } from '../entities/user.entity.js';

export class UserRepository {
    constructor(private readonly pool: Pool) {}

    async create(email: string, passwordHash: string, firstName: string, lastName: string, role: Role): Promise<User> {
        const res = await this.pool.query<User>(
            'INSERT INTO users (last_name, first_name, role, email, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, last_name, first_name, role, email, password_hash',
            [lastName, firstName, role, email, passwordHash],
        );
        const row = res.rows[0];
        if (!row) throw new Error('Failed to create user');
        return row;
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
}
