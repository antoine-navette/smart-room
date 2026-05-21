import type { User } from '../entities/user.entity.js';
import type { RoomResourceAssignment } from '../entities/room-resource-assignment.entity.js';
import { RoomRepository } from '../repositories/room.repository.js';
import { RoomResourceRepository } from '../repositories/room-resource.repository.js';
import { RoomResourceAssignmentRepository } from '../repositories/room-resource-assignment.repository.js';

export class RoomResourceAssignmentService {
    constructor(
        private readonly repo: RoomResourceAssignmentRepository,
        private readonly roomRepo: RoomRepository,
        private readonly roomResourceRepo: RoomResourceRepository,
    ) {}

    async findByRoomId(roomId: number) {
        const room = await this.roomRepo.findById(roomId);
        if (!room) return { success: false, code: 'ROOM_NOT_FOUND' } as const;

        const resources = await this.repo.findAllByRoomId(roomId);
        return { success: true, resources } as const;
    }

    async setQuantity(user: User, roomId: number, resourceId: number, quantity: number) {
        if (user.role !== 'ADMIN') return { success: false, code: 'FORBIDDEN' } as const;

        const room = await this.roomRepo.findById(roomId);
        if (!room) return { success: false, code: 'ROOM_NOT_FOUND' } as const;

        const resource = await this.roomResourceRepo.findById(resourceId);
        if (!resource) return { success: false, code: 'ROOM_RESOURCE_NOT_FOUND' } as const;

        return { success: true, assignment: await this.repo.setQuantity(roomId, resourceId, quantity) } as const;
    }

    async delete(user: User, roomId: number, resourceId: number) {
        if (user.role !== 'ADMIN') return { success: false, code: 'FORBIDDEN' } as const;

        const room = await this.roomRepo.findById(roomId);
        if (!room) return { success: false, code: 'ROOM_NOT_FOUND' } as const;

        const resource = await this.roomResourceRepo.findById(resourceId);
        if (!resource) return { success: false, code: 'ROOM_RESOURCE_NOT_FOUND' } as const;

        const current = await this.repo.findByRoomAndResource(roomId, resourceId);
        if (!current) return { success: false, code: 'ROOM_RESOURCE_ASSIGNMENT_NOT_FOUND' } as const;

        await this.repo.delete(roomId, resourceId);
        return { success: true } as const;
    }
}