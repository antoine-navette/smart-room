import type { Pool } from 'pg';
import type { Floor } from '../entities/entities.js';

export type FloorCreate = Omit<Floor, 'id'>;

export class FloorRepository {
    constructor(private readonly pool: Pool) {}

    async findAll(): Promise<Floor[]> {
        const res = await this.pool.query('SELECT id, name, building_id FROM floors ORDER BY id ASC');

        return res.rows.map((r) => ({ id: Number(r.id), name: String(r.name), building_id: Number(r.building_id) }));
    }

    async findById(id: number): Promise<Floor | null> {
        const res = await this.pool.query('SELECT id, name, building_id FROM floors WHERE id = $1', [id]);
        const row = res.rows[0];

        if (!row) return null;

        return { id: Number(row.id), name: String(row.name), building_id: Number(row.building_id) };
    }

    async findByName(name: string): Promise<Floor | null> {
        const res = await this.pool.query('SELECT id, name, building_id FROM floors WHERE name = $1', [name]);
        const row = res.rows[0];

        if (!row) return null;

        return { id: Number(row.id), name: String(row.name), building_id: Number(row.building_id) };
    }

    async create(data: FloorCreate): Promise<Floor> {
        const res = await this.pool.query(
            'INSERT INTO floors (name, building_id) VALUES ($1, $2) RETURNING id, name, building_id',
            [data.name, data.building_id],
        );
        const row = res.rows[0];

        if (!row) throw new Error('Failed to create floor');
        return { id: Number(row.id), name: String(row.name), building_id: Number(row.building_id) };
    }

    async save(entity: Floor): Promise<Floor> {
        const res = await this.pool.query(
            'UPDATE floors SET name = $1, building_id = $2 WHERE id = $3 RETURNING id, name, building_id',
            [entity.name, entity.building_id, entity.id],
        );

        const row = res.rows[0];
        if (!row) throw new Error('Failed to save floor');

        return { id: Number(row.id), name: String(row.name), building_id: Number(row.building_id) };
    }

    async deleteById(id: number): Promise<boolean> {
        const result = await this.pool.query('DELETE FROM floors WHERE id = $1', [id]);

        return (result.rowCount ?? 0) > 0;
    }
}
