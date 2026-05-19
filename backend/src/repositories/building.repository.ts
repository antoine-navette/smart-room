import type { Pool } from 'pg';
import type { Building } from '../entities/building.entity.js';

export type BuildingCreate = Omit<Building, 'id'>;

export class BuildingRepository {
    constructor(private readonly pool: Pool) {}

    async findAll(): Promise<Building[]> {
        const res = await this.pool.query('SELECT id, name FROM buildings ORDER BY id ASC');

        return res.rows.map((r) => ({ id: Number(r.id), name: String(r.name) }));
    }

    async findById(id: number): Promise<Building | null> {
        const res = await this.pool.query('SELECT id, name FROM buildings WHERE id = $1', [id]);
        const row = res.rows[0];

        if (!row) return null;

        return { id: Number(row.id), name: String(row.name) };
    }

    async findByName(name: string): Promise<Building | null> {
        const res = await this.pool.query('SELECT id, name FROM buildings WHERE name = $1', [name]);
        const row = res.rows[0];

        if (!row) return null;

        return { id: Number(row.id), name: String(row.name) };
    }

    async create(data: BuildingCreate): Promise<Building> {
        const res = await this.pool.query('INSERT INTO buildings (name) VALUES ($1) RETURNING id, name', [data.name]);
        const row = res.rows[0];

        if (!row) throw new Error('Failed to create building');

        return { id: Number(row.id), name: String(row.name) };
    }

    async save(entity: Building): Promise<Building> {
        // Explicitly list the columns of the aggregate to avoid accidental partial writes
        const res = await this.pool.query('UPDATE buildings SET name = $1 WHERE id = $2 RETURNING id, name', [
            entity.name,
            entity.id,
        ]);

        const row = res.rows[0];
        if (!row) throw new Error('Failed to save building');

        return { id: Number(row.id), name: String(row.name) };
    }

    async deleteById(id: number): Promise<boolean> {
        const result = await this.pool.query('DELETE FROM buildings WHERE id = $1', [id]);

        return (result.rowCount ?? 0) > 0;
    }
}
