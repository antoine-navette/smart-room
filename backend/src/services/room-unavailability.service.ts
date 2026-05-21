import type { User } from '../entities/user.entity.js';
import type { RoomUnavailability } from '../entities/room-unavailability.entity.js';
import { RoomRepository } from '../repositories/room.repository.js';
import { ReservationRepository } from '../repositories/reservation.repository.js';
import { RoomUnavailabilityRepository } from '../repositories/room-unavailability.repository.js';

export class RoomUnavailabilityService {
    constructor(
        private readonly repo: RoomUnavailabilityRepository,
        private readonly roomRepo: RoomRepository,
        private readonly reservationRepo: ReservationRepository,
    ) {}

    private async cancelOverlappingReservations(roomId: number, fromTime: Date, toTime: Date) {
        const reservations = await this.reservationRepo.findByRoomId(roomId);
        await Promise.all(
            reservations
                .filter((reservation) => reservation.start_time.getTime() < toTime.getTime() && fromTime.getTime() < reservation.end_time.getTime())
                .map((reservation) => this.reservationRepo.delete(reservation)),
        );
    }

    async create(user: User, roomId: number, fromTime: Date, toTime: Date, reason: string) {
        if (user.role !== 'ADMIN') return { success: false, code: 'FORBIDDEN' } as const;

        const room = await this.roomRepo.findById(roomId);
        if (!room) return { success: false, code: 'ROOM_NOT_FOUND' } as const;

        if (fromTime >= toTime) return { success: false, code: 'INVALID_DATE_RANGE' } as const;

        const overlap = await this.repo.findOverlapping(roomId, fromTime, toTime);
        if (overlap.length > 0) return { success: false, code: 'ROOM_UNAVAILABILITY_CONFLICT' } as const;
        
        // Check for overlapping reservations and cancel them
        const roomUnavailability = await this.repo.create(roomId, fromTime, toTime, reason);
        await this.cancelOverlappingReservations(roomId, fromTime, toTime);
        return { success: true, roomUnavailability } as const;
    }

    findAll(): Promise<RoomUnavailability[]> {
        return this.repo.findAll();
    }

    async findById(id: number) {
        const roomUnavailability = await this.repo.findById(id);
        if (!roomUnavailability) return { success: false, code: 'ROOM_UNAVAILABILITY_NOT_FOUND' } as const;
        return { success: true, roomUnavailability } as const;
    }

    async findByRoomId(roomId: number) {
        const room = await this.roomRepo.findById(roomId);
        if (!room) return { success: false, code: 'ROOM_NOT_FOUND' } as const;

        const roomUnavailabilities = await this.repo.findByRoomId(roomId);
        return { success: true, roomUnavailabilities } as const;
    }

    async update(user: User, id: number, roomId: number, fromTime: Date, toTime: Date, reason: string) {
        if (user.role !== 'ADMIN') return { success: false, code: 'FORBIDDEN' } as const;

        const current = await this.repo.findById(id);
        if (!current) return { success: false, code: 'ROOM_UNAVAILABILITY_NOT_FOUND' } as const;

        const room = await this.roomRepo.findById(roomId);
        if (!room) return { success: false, code: 'ROOM_NOT_FOUND' } as const;

        if (fromTime >= toTime) return { success: false, code: 'INVALID_DATE_RANGE' } as const;

        const overlap = await this.repo.findOverlapping(roomId, fromTime, toTime, id);
        if (overlap.length > 0) return { success: false, code: 'ROOM_UNAVAILABILITY_CONFLICT' } as const;

        const updated: RoomUnavailability = { ...current, room_id: roomId, from_time: fromTime, to_time: toTime, reason };
        await this.repo.save(updated);
        await this.cancelOverlappingReservations(roomId, fromTime, toTime);
        return { success: true, roomUnavailability: updated } as const;
    }

    async delete(user: User, id: number) {
        if (user.role !== 'ADMIN') return { success: false, code: 'FORBIDDEN' } as const;

        const current = await this.repo.findById(id);
        if (!current) return { success: false, code: 'ROOM_UNAVAILABILITY_NOT_FOUND' } as const;

        await this.repo.delete(current);
        return { success: true } as const;
    }
}
