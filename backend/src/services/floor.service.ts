import type { Floor } from '../entities/floor.entity.js';
import type { FloorCreate } from '../repositories/floor.repository.js';
import { FloorRepository } from '../repositories/floor.repository.js';
import { BuildingRepository } from '../repositories/building.repository.js';
import { RoomRepository } from '../repositories/room.repository.js';

export class FloorService {
    constructor(
        private readonly repo: FloorRepository,
        private readonly buildingRepo: BuildingRepository,
        private readonly roomRepo: RoomRepository,
    ) {}

    findAll(): Promise<Floor[]> {
        return this.repo.findAll();
    }

    async findById(id: number) {
        const floor = await this.repo.findById(id);
        if (!floor) return { success: false, code: 'FLOOR_NOT_FOUND' } as const;

        return { success: true, floor } as const;
    }

    async findByNameAndBuildingId(name: string, buildingId: number) {
        const floor = await this.repo.findByNameAndBuildingId(name, buildingId);
        if (!floor) return { success: false, code: 'FLOOR_NOT_FOUND' } as const;

        return { success: true, floor } as const;
    }

    async create(data: FloorCreate) {
        // Ensure building exists before creating a floor
        const building = await this.buildingRepo.findById(data.building_id);
        if (!building) {
            return { success: false, code: 'BUILDING_NOT_FOUND' } as const;
        }

        // Prevent creating a floor with a duplicate name in the same building
        const existingName = await this.findByNameAndBuildingId(data.name, data.building_id);
        if (existingName.success) {
            return { success: false, code: 'FLOOR_NAME_EXISTS', name: data.name } as const;
        }

        return { success: true, floor: await this.repo.create(data) } as const;
    }

    async save(entity: Floor) {
        const current = await this.repo.findById(entity.id);
        if (!current) {
            return { success: false, code: 'FLOOR_NOT_FOUND' } as const;
        }

        if (entity.name !== current.name || entity.building_id !== current.building_id) {
            // Prevent saving a floor with a duplicate name in the same building
            const existingName = await this.findByNameAndBuildingId(entity.name, entity.building_id);
            if (existingName.success && existingName.floor.id !== entity.id) {
                return { success: false, code: 'FLOOR_NAME_EXISTS', name: entity.name } as const;
            }
            // Ensure building exists before saving a floor
            const building = await this.buildingRepo.findById(entity.building_id);
            if (!building) {
                return { success: false, code: 'BUILDING_NOT_FOUND' } as const;
            }
        }

        return { success: true, floor: await this.repo.save(entity) } as const;
    }

    async deleteById(id: number) {
        const current = await this.repo.findById(id);
        if (!current) {
            return { success: false, code: 'FLOOR_NOT_FOUND' } as const;
        }

        // Prevent deleting a floor that still has rooms
        const rooms = await this.roomRepo.findAll();
        const hasRooms = rooms.some((r) => r.floor_id === id);
        if (hasRooms) {
            return { success: false, code: 'FLOOR_HAS_ROOMS' } as const;
        }

        await this.repo.deleteById(id);
        return { success: true } as const;
    }
}
