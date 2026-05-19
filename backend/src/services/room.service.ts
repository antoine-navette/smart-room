import type { Room } from '../entities/room.entity.js';
import type { RoomCreate } from '../repositories/room.repository.js';
import { RoomRepository } from '../repositories/room.repository.js';
import { FloorRepository } from '../repositories/floor.repository.js';
import { ReservationRepository } from '../repositories/reservation.repository.js';

export class RoomService {
    constructor(
        private readonly repo: RoomRepository,
        private readonly floorRepo: FloorRepository,
        private readonly reservationRepo: ReservationRepository,
    ) {}

    findAll(): Promise<Room[]> {
        return this.repo.findAll();
    }

    async findById(id: number) {
        const room = await this.repo.findById(id);
        if (!room) {
            return { success: false, code: 'ROOM_NOT_FOUND' } as const;
        }
        return { success: true, room } as const;
    }

    async findByNameAndFloorId(name: string, floor_id: number) {
        const room = await this.repo.findByNameAndFloorId(name, floor_id);
        if (!room) {
            return { success: false, code: 'ROOM_NOT_FOUND' } as const;
        }
        return { success: true, room } as const;
    }

    async create(data: RoomCreate) {
        // Ensure floor exists
        const floor = await this.floorRepo.findById(data.floor_id);
        if (!floor) {
            return { success: false, code: 'FLOOR_NOT_FOUND' } as const;
        }

        // Prevent creating a room with a duplicate name in the same floor
        const existingName = await this.findByNameAndFloorId(data.name, data.floor_id);
        if (existingName.success) {
            return { success: false, code: 'ROOM_NAME_EXISTS', name: data.name } as const;
        }

        return { success: true, room: await this.repo.create(data) } as const;
    }

    async save(entity: Room) {
        const current = await this.repo.findById(entity.id);
        if (!current) {
            return { success: false, code: 'ROOM_NOT_FOUND' } as const;
        }

        if (entity.name !== current.name || entity.floor_id !== current.floor_id) {
            // Prevent saving a room with a duplicate name in the same floor
            const existingName = await this.findByNameAndFloorId(entity.name, entity.floor_id);
            if (existingName.success && existingName.room.id !== entity.id) {
                return { success: false, code: 'ROOM_NAME_EXISTS', name: entity.name } as const;
            }
            // Ensure floor exists before saving a room
            const floor = await this.floorRepo.findById(entity.floor_id);
            if (!floor) {
                return { success: false, code: 'FLOOR_NOT_FOUND' } as const;
            }
        }

        return { success: true, room: await this.repo.save(entity) } as const;
    }

    async deleteById(id: number) {
        const current = await this.repo.findById(id);
        if (!current) {
            return { success: false, code: 'ROOM_NOT_FOUND' } as const;
        }

        // Prevent deleting a room that has reservations
        const reservations = await this.reservationRepo.findAll();
        const hasReservations = reservations.some((r) => r.room_id === id);
        if (hasReservations) {
            return { success: false, code: 'ROOM_HAS_RESERVATIONS' } as const;
        }

        await this.repo.deleteById(id);
        return { success: true } as const;
    }
}
