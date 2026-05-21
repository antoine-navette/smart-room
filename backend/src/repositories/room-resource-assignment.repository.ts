import type { Pool } from 'pg';
import type { RoomResourceAssignment } from '../entities/room-resource-assignment.entity.js';

export class RoomResourceAssignmentRepository {
    constructor(private readonly pool: Pool) {}

    async findAllByRoomId(roomId: number): Promise<RoomResourceAssignment[]> {
        const res = await this.pool.query<RoomResourceAssignment>(
            `SELECT cr.room_id, cr.resource_id, cr.quantity, rr.name
             FROM contain_resources cr
             INNER JOIN room_resources rr ON rr.id = cr.resource_id
             WHERE cr.room_id = $1
             ORDER BY rr.id`,
            [roomId],
        );
        return res.rows;
    }

    async findByRoomAndResource(roomId: number, resourceId: number): Promise<RoomResourceAssignment | null> {
        const res = await this.pool.query<RoomResourceAssignment>(
            `SELECT cr.room_id, cr.resource_id, cr.quantity, rr.name
             FROM contain_resources cr
             INNER JOIN room_resources rr ON rr.id = cr.resource_id
             WHERE cr.room_id = $1 AND cr.resource_id = $2`,
            [roomId, resourceId],
        );
        return res.rows[0] ?? null;
    }

    async setQuantity(roomId: number, resourceId: number, quantity: number): Promise<RoomResourceAssignment> {
        await this.pool.query(
            `INSERT INTO contain_resources (room_id, resource_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (room_id, resource_id)
             DO UPDATE SET quantity = EXCLUDED.quantity`,
            [roomId, resourceId, quantity],
        );

        const row = await this.findByRoomAndResource(roomId, resourceId);
        if (!row) throw new Error('Failed to upsert room resource assignment');
        return row;
    }

    async delete(roomId: number, resourceId: number): Promise<void> {
        await this.pool.query('DELETE FROM contain_resources WHERE room_id = $1 AND resource_id = $2', [roomId, resourceId]);
    }
}