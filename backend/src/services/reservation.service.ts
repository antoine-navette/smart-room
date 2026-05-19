import { check } from 'zod';
import type { Reservation } from '../entities/reservation.entity.js';
import type { ReservationCreate } from '../repositories/reservation.repository.js';
import { ReservationRepository } from '../repositories/reservation.repository.js';
import { RoomRepository } from '../repositories/room.repository.js';
import { UserRepository } from '../repositories/user.repository.js';

export class ReservationService {
    constructor(
        private readonly repo: ReservationRepository,
        private readonly roomRepo: RoomRepository,
        private readonly userRepo: UserRepository,
    ) {}

    findAll(): Promise<Reservation[]> {
        return this.repo.findAll();
    }

    async findById(id: number) {
        const reservation = await this.repo.findById(id);
        if (!reservation) {
            return { success: false, code: 'RESERVATION_NOT_FOUND' } as const;
        }
        return { success: true, reservation } as const;
    }

    async findByRoomId(room_id: number) {
        const reservations = await this.repo.findAll();
        const filtered = reservations.filter((r) => r.room_id === room_id);
        if (filtered.length === 0) {
            return { success: false, code: 'RESERVATIONS_NOT_FOUND' } as const;
        }
        return { success: true, reservations: filtered } as const;
    }

    async create(data: ReservationCreate) {
        // Validate room exists
        if (data.room_id != null) {
            const room = await this.roomRepo.findById(data.room_id);
            if (!room) {
                return { success: false, code: 'ROOM_NOT_FOUND' } as const;
            }

            // Check availability: no overlapping reservation for the same room
            if ((await this.checkAvailability(data.room_id, data.start_time, data.end_time)) === false) {
                return { success: false, code: 'ROOM_NOT_AVAILABLE' } as const;
            }
        }

        // Validate user exists
        if (data.user_id != null) {
            const user = await this.userRepo.findById(data.user_id);
            if (!user) {
                return { success: false, code: 'USER_NOT_FOUND' } as const;
            }
        }

        return { success: true, reservation: await this.repo.create(data) } as const;
    }

    async save(entity: Reservation) {
        if (entity.room_id == null) {
            return { success: false, code: 'ROOM_NOT_FOUND' } as const;
        }
        
        // Check availability: no overlapping reservation for the new dates and room
        if ((await this.checkAvailability(entity.room_id, entity.start_time, entity.end_time, entity.id)) === false) {
            return { success: false, code: 'ROOM_NOT_AVAILABLE' } as const;
        }
        return { success: true, reservation: await this.repo.save(entity) } as const;
    }

    async deleteById(id: number) {
        // Check if reservation exists before deleting
        const reservation = await this.repo.findById(id);
        if (!reservation) {
            return { success: false, code: 'RESERVATION_NOT_FOUND' } as const;
        }

        await this.repo.deleteById(id);
        return { success: true } as const;
    }

    private async checkAvailability(room_id: number, start_time: Date, end_time: Date, exclude_reservation_id?: number) {
        // Get all reservations for the room
        const existing = await this.findByRoomId(room_id);
        if (!existing.success) {
            return false;
        }

        // Check for overlapping reservations, excluding the one being updated (if applicable)
        const overlap = existing.reservations.some((reservation) => {
            if (exclude_reservation_id != null && reservation.id === exclude_reservation_id) return false;

            const aStart = start_time.getTime();
            const aEnd = end_time.getTime();
            const bStart = reservation.start_time.getTime();
            const bEnd = reservation.end_time.getTime();
            return aStart < bEnd && bStart < aEnd;
        });

        return !overlap;
    }
}