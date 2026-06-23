import type { User } from '../entities/user.entity.js';
import type { RoomResource } from '../entities/room-resource.entity.js';
import { RoomResourceRepository } from '../repositories/room-resource.repository.js';

export class RoomResourceService {
    constructor(private readonly repo: RoomResourceRepository) {}

    async create(user: User, name: string) {
        if (user.role !== 'ADMIN') return { success: false, code: 'FORBIDDEN' } as const;

        const existing = await this.repo.findByName(name);
        if (existing) return { success: false, code: 'ROOM_RESOURCE_NAME_EXISTS' } as const;

        return { success: true, roomResource: await this.repo.create(name) } as const;
    }

    findAll(): Promise<RoomResource[]> {
        return this.repo.findAll();
    }

    async findById(id: number) {
        const roomResource = await this.repo.findById(id);
        if (!roomResource) return { success: false, code: 'ROOM_RESOURCE_NOT_FOUND' } as const;
        return { success: true, roomResource } as const;
    }

    async update(user: User, id: number, name: string) {
        if (user.role !== 'ADMIN') return { success: false, code: 'FORBIDDEN' } as const;

        const current = await this.repo.findById(id);
        if (!current) return { success: false, code: 'ROOM_RESOURCE_NOT_FOUND' } as const;

        const existing = await this.repo.findByName(name);
        if (existing && existing.id !== id) return { success: false, code: 'ROOM_RESOURCE_NAME_EXISTS' } as const;

        const updated = { ...current, name };
        await this.repo.save(updated);
        return { success: true, roomResource: updated } as const;
    }

    async delete(user: User, id: number) {
        if (user.role !== 'ADMIN') return { success: false, code: 'FORBIDDEN' } as const;

        const current = await this.repo.findById(id);
        if (!current) return { success: false, code: 'ROOM_RESOURCE_NOT_FOUND' } as const;

        await this.repo.delete(current);
        return { success: true } as const;
    }
}
