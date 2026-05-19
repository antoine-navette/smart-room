import type { Building } from '../entities/entities.js';
import type { BuildingCreate } from '../repositories/building.repository.js';
import { BuildingRepository } from '../repositories/building.repository.js';
import { FloorRepository } from '../repositories/floor.repository.js';

export class BuildingService {
    constructor(private readonly repo: BuildingRepository, private readonly floorRepo: FloorRepository) {}

    findAll(): Promise<Building[]> {
        return this.repo.findAll();
    }

    async findById(id: number) {
        const building = await this.repo.findById(id);
        if (!building) {
            return { success: false, code: 'BUILDING_NOT_FOUND' } as const;
        }

        return { success: true, building } as const;
    }

    async findByName(name: string) {
        const building = await this.repo.findByName(name);
        if (!building) {
            return { success: false, code: 'BUILDING_NOT_FOUND' } as const;
        }

        return { success: true, building } as const;
    }

    async create(data: BuildingCreate) {
        // Prevent creating a building with a duplicate name
        const existingName = await this.findByName(data.name);
        if (existingName.success) {
            return { success: false, code: 'BUILDING_NAME_EXISTS', name: data.name } as const;
        }

        return { success: true, building: await this.repo.create(data) } as const;
    }

    async save(entity: Building) {
        // Prevent saving a building with a duplicate name
        const existingName = await this.findByName(entity.name);
        if (existingName.success && existingName.building.id !== entity.id) {
            return { success: false, code: 'BUILDING_NAME_EXISTS', name: entity.name } as const;
        }

        return { success: true, building: await this.repo.save(entity) } as const;
    }

    async deleteById(id: number) {
        // Prevent deleting a building that still has floors
        const floors = await this.floorRepo.findAll();
        const hasFloors = floors.some((f) => f.building_id === id);
        if (hasFloors) {
            return { success: false, code: 'BUILDING_HAS_FLOORS' } as const;
        }

        await this.repo.deleteById(id);
        return { success: true } as const;
    }
}



