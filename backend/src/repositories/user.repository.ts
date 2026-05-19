import type { Pool, QueryResultRow } from 'pg';
import type { Gender, User } from '../entities/entities.js';

export type UserCreate = Omit<User, 'id'>;

export class UserRepository {
    constructor(private readonly pool: Pool) {}

    async findAll(): Promise<User[]> {
        const res = await this.pool.query(
            'SELECT id, last_name, first_name, gender, email, password_hash FROM users ORDER BY id ASC',
        );

        return res.rows.map((r) => ({
            id: Number(r.id),
            last_name: String(r.last_name),
            first_name: String(r.first_name),
            gender: String(r.gender) as Gender,
            email: String(r.email),
            password_hash: String(r.password_hash),
        }));
    }

    async findByEmail(email: string): Promise<User | null> {
        const res = await this.pool.query<User>(
            'SELECT id, last_name, first_name, gender, email, password_hash FROM users WHERE email = $1',
            [email],
        );
        return res.rows[0] ?? null;
    }

    async findById(id: number): Promise<User | null> {
        const res = await this.pool.query(
            'SELECT id, last_name, first_name, gender, email, password_hash FROM users WHERE id = $1',
            [id],
        );
        const row = res.rows[0];

        if (!row) return null;

        return {
            id: Number(row.id),
            last_name: String(row.last_name),
            first_name: String(row.first_name),
            gender: String(row.gender) as Gender,
            email: String(row.email),
            password_hash: String(row.password_hash),
        };
    }

    async create(data: UserCreate): Promise<User> {
        const res = await this.pool.query(
            'INSERT INTO users (last_name, first_name, gender, email, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, last_name, first_name, gender, email, password_hash',
            [data.last_name, data.first_name, data.gender, data.email, data.password_hash],
        );
        const row = res.rows[0];

        if (!row) throw new Error('Failed to create user');

        return {
            id: Number(row.id),
            last_name: String(row.last_name),
            first_name: String(row.first_name),
            gender: String(row.gender) as Gender,
            email: String(row.email),
            password_hash: String(row.password_hash),
        };
    }

    async save(entity: User): Promise<User> {
        const res = await this.pool.query(
            'UPDATE users SET last_name = $1, first_name = $2, gender = $3, email = $4, password_hash = $5 WHERE id = $6 RETURNING id, last_name, first_name, gender, email, password_hash',
            [entity.last_name, entity.first_name, entity.gender, entity.email, entity.password_hash, entity.id],
        );

        const row = res.rows[0];
        if (!row) throw new Error('Failed to save user');

        return {
            id: Number(row.id),
            last_name: String(row.last_name),
            first_name: String(row.first_name),
            gender: String(row.gender) as Gender,
            email: String(row.email),
            password_hash: String(row.password_hash),
        };
    }

    async deleteById(id: number): Promise<boolean> {
        const result = await this.pool.query('DELETE FROM users WHERE id = $1', [id]);

        return (result.rowCount ?? 0) > 0;
    }
}
