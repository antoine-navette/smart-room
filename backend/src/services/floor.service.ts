import type { Floor } from '../entities/floor.entity.js';
import type { User } from '../entities/user.entity.js';
import { FloorRepository } from '../repositories/floor.repository.js';
import { BuildingRepository } from '../repositories/building.repository.js';
import { RoomRepository } from '../repositories/room.repository.js';

export class FloorService {
    constructor(
        private readonly repo: FloorRepository,
        private readonly buildingRepo: BuildingRepository,
        private readonly roomRepo: RoomRepository,
    ) {}

    async create(user: User, name: string, buildingId: number) {
        if (user.role !== 'ADMIN') return { success: false, code: 'FORBIDDEN' } as const;

        const building = await this.buildingRepo.findById(buildingId);
        if (!building) return { success: false, code: 'BUILDING_NOT_FOUND' } as const;

        const existing = await this.repo.findByNameAndBuildingId(name, buildingId);
        if (existing) return { success: false, code: 'FLOOR_NAME_EXISTS' } as const;

        return { success: true, floor: await this.repo.create(name, buildingId) } as const;
    }

    findAll(): Promise<Floor[]> {
        return this.repo.findAll();
    }

    async findById(id: number) {
        const floor = await this.repo.findById(id);
        if (!floor) return { success: false, code: 'FLOOR_NOT_FOUND' } as const;
        return { success: true, floor } as const;
    }

    async update(user: User, id: number, name: string, buildingId: number) {
        if (user.role !== 'ADMIN') return { success: false, code: 'FORBIDDEN' } as const;

        const current = await this.repo.findById(id);
        if (!current) return { success: false, code: 'FLOOR_NOT_FOUND' } as const;

        if (name !== current.name || buildingId !== current.building_id) {
            const existing = await this.repo.findByNameAndBuildingId(name, buildingId);
            if (existing && existing.id !== id) return { success: false, code: 'FLOOR_NAME_EXISTS', name } as const;

            const building = await this.buildingRepo.findById(buildingId);
            if (!building) return { success: false, code: 'BUILDING_NOT_FOUND' } as const;
        }

        const updated = { ...current, name, building_id: buildingId };
        await this.repo.save(updated);
        return { success: true, floor: updated } as const;
    }

    async delete(user: User, id: number) {
        if (user.role !== 'ADMIN') return { success: false, code: 'FORBIDDEN' } as const;

        const current = await this.repo.findById(id);
        if (!current) return { success: false, code: 'FLOOR_NOT_FOUND' } as const;

        const rooms = await this.roomRepo.findAll();
        if (rooms.some((r) => r.floor_id === id)) return { success: false, code: 'FLOOR_HAS_ROOMS' } as const;

        await this.repo.delete(current);
        return { success: true } as const;
    }
}
