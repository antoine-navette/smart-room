import type { Pool } from 'pg';
import type { Building } from '../entities/building.entity.js';

export class BuildingRepository {
    constructor(private readonly pool: Pool) {}

    async create(name: string): Promise<Building> {
        const res = await this.pool.query<Building>(
            'INSERT INTO buildings (name) VALUES ($1) RETURNING id, name',
            [name],
        );
        const row = res.rows[0];
        if (!row) throw new Error('Failed to create building');
        return row;
    }

    async findAll(): Promise<Building[]> {
        const res = await this.pool.query<Building>('SELECT id, name FROM buildings ORDER BY id');
        return res.rows;
    }

    async findById(id: number): Promise<Building | null> {
        const res = await this.pool.query<Building>('SELECT id, name FROM buildings WHERE id = $1', [id]);
        return res.rows[0] ?? null;
    }

    async findByName(name: string): Promise<Building | null> {
        const res = await this.pool.query<Building>('SELECT id, name FROM buildings WHERE name = $1', [name]);
        return res.rows[0] ?? null;
    }

    async save(building: Building): Promise<void> {
        await this.pool.query('UPDATE buildings SET name = $1 WHERE id = $2', [building.name, building.id]);
    }

    async delete(building: Building): Promise<void> {
        await this.pool.query('DELETE FROM buildings WHERE id = $1', [building.id]);
    }
}
