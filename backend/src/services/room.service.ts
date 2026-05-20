import type { Room } from '../entities/room.entity.js';
import { RoomRepository } from '../repositories/room.repository.js';
import { FloorRepository } from '../repositories/floor.repository.js';

export class RoomService {
    constructor(
        private readonly repo: RoomRepository,
        private readonly floorRepo: FloorRepository,
    ) {}

    async create(name: string, floorId: number, capacity: number) {
        const floor = await this.floorRepo.findById(floorId);
        if (!floor) return { success: false, code: 'FLOOR_NOT_FOUND' } as const;

        const existing = await this.repo.findByNameAndFloorId(name, floorId);
        if (existing) return { success: false, code: 'ROOM_NAME_EXISTS' } as const;

        return { success: true, room: await this.repo.create(name, floorId, capacity) } as const;
    }

    findAll(): Promise<Room[]> {
        return this.repo.findAll();
    }

    async findById(id: number) {
        const room = await this.repo.findById(id);
        if (!room) return { success: false, code: 'ROOM_NOT_FOUND' } as const;
        return { success: true, room } as const;
    }

    async update(id: number, name: string, floorId: number, capacity: number) {
        const current = await this.repo.findById(id);
        if (!current) return { success: false, code: 'ROOM_NOT_FOUND' } as const;

        if (name !== current.name || floorId !== current.floor_id) {
            const existing = await this.repo.findByNameAndFloorId(name, floorId);
            if (existing && existing.id !== id)
                return { success: false, code: 'ROOM_NAME_EXISTS', name } as const;

            const floor = await this.floorRepo.findById(floorId);
            if (!floor) return { success: false, code: 'FLOOR_NOT_FOUND' } as const;
        }

        const updated = { ...current, name, floor_id: floorId, capacity };
        await this.repo.save(updated);
        return { success: true, room: updated } as const;
    }

    async delete(id: number) {
        const current = await this.repo.findById(id);
        if (!current) return { success: false, code: 'ROOM_NOT_FOUND' } as const;

        await this.repo.delete(current);
        return { success: true } as const;
    }
}
