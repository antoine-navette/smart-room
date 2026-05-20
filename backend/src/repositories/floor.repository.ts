import type { Pool } from 'pg';
import type { Floor } from '../entities/floor.entity.js';

export class FloorRepository {
    constructor(private readonly pool: Pool) {}

    async create(name: string, buildingId: number): Promise<Floor> {
        const res = await this.pool.query<Floor>(
            'INSERT INTO floors (name, building_id) VALUES ($1, $2) RETURNING id, name, building_id',
            [name, buildingId],
        );
        const row = res.rows[0];
        if (!row) throw new Error('Failed to create floor');
        return row;
    }

    async findAll(): Promise<Floor[]> {
        const res = await this.pool.query<Floor>('SELECT id, name, building_id FROM floors ORDER BY id');
        return res.rows;
    }

    async findById(id: number): Promise<Floor | null> {
        const res = await this.pool.query<Floor>('SELECT id, name, building_id FROM floors WHERE id = $1', [id]);
        return res.rows[0] ?? null;
    }

    async findByNameAndBuildingId(name: string, buildingId: number): Promise<Floor | null> {
        const res = await this.pool.query<Floor>(
            'SELECT id, name, building_id FROM floors WHERE name = $1 AND building_id = $2',
            [name, buildingId],
        );
        return res.rows[0] ?? null;
    }

    async save(floor: Floor): Promise<void> {
        await this.pool.query('UPDATE floors SET name = $1, building_id = $2 WHERE id = $3', [
            floor.name,
            floor.building_id,
            floor.id,
        ]);
    }

    async delete(floor: Floor): Promise<void> {
        await this.pool.query('DELETE FROM floors WHERE id = $1', [floor.id]);
    }
}
