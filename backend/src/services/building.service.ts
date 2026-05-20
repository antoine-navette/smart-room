import type { Building } from '../entities/building.entity.js';
import { BuildingRepository } from '../repositories/building.repository.js';
import { FloorRepository } from '../repositories/floor.repository.js';

export class BuildingService {
    constructor(
        private readonly repo: BuildingRepository,
        private readonly floorRepo: FloorRepository,
    ) {}

    async create(name: string) {
        const existing = await this.repo.findByName(name);
        if (existing) return { success: false, code: 'BUILDING_NAME_EXISTS' } as const;

        return { success: true, building: await this.repo.create(name) } as const;
    }

    findAll(): Promise<Building[]> {
        return this.repo.findAll();
    }

    async findById(id: number) {
        const building = await this.repo.findById(id);
        if (!building) return { success: false, code: 'BUILDING_NOT_FOUND' } as const;
        return { success: true, building } as const;
    }

    async update(id: number, name: string) {
        const current = await this.repo.findById(id);
        if (!current) return { success: false, code: 'BUILDING_NOT_FOUND' } as const;

        const existing = await this.repo.findByName(name);
        if (existing && existing.id !== id) return { success: false, code: 'BUILDING_NAME_EXISTS' } as const;

        const updated = { ...current, name };
        await this.repo.save(updated);
        return { success: true, building: updated } as const;
    }

    async delete(id: number) {
        const current = await this.repo.findById(id);
        if (!current) return { success: false, code: 'BUILDING_NOT_FOUND' } as const;

        const floors = await this.floorRepo.findAll();
        if (floors.some((f) => f.building_id === id)) return { success: false, code: 'BUILDING_HAS_FLOORS' } as const;

        await this.repo.delete(current);
        return { success: true } as const;
    }
}
