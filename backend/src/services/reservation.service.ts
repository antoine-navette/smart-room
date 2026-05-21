import type { Reservation } from '../entities/reservation.entity.js';
import type { Room } from '../entities/room.entity.js';
import type { User } from '../entities/user.entity.js';
import { ReservationRepository } from '../repositories/reservation.repository.js';
import { RoomRepository } from '../repositories/room.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { Mailer } from '../adapters/mailer.js';

export class ReservationService {
    constructor(
        private readonly repo: ReservationRepository,
        private readonly roomRepo: RoomRepository,
        private readonly userRepo: UserRepository,
        private readonly mailer: Mailer,
    ) {}

    private isAuthorized(reservation: Reservation, currentUser: User): boolean {
        return currentUser.role === 'ADMIN' || reservation.user_id === currentUser.id;
    }

    async create(roomId: number | null, user: User, startTime: Date, endTime: Date) {
        let room: Room | null = null;
        if (roomId != null) {
            room = await this.roomRepo.findById(roomId);
            if (!room) return { success: false, code: 'ROOM_NOT_FOUND' } as const;

            if (!(await this.checkAvailability(roomId, startTime, endTime)))
                return { success: false, code: 'ROOM_NOT_AVAILABLE' } as const;
        }

        const reservation = await this.repo.create(roomId, user.id, startTime, endTime);
        await this.mailer.sendReservationConfirmation(user, reservation, room);
        return { success: true, reservation } as const;
    }

    findAll(): Promise<Reservation[]> {
        return this.repo.findAll();
    }

    async findById(id: number) {
        const reservation = await this.repo.findById(id);
        if (!reservation) return { success: false, code: 'RESERVATION_NOT_FOUND' } as const;
        return { success: true, reservation } as const;
    }

    async findByRoomId(roomId: number): Promise<Reservation[]> {
        const reservations = await this.repo.findAll();
        return reservations.filter((r) => r.room_id === roomId);
    }

    async findByUserId(userId: number): Promise<Reservation[]> {
        const reservations = await this.repo.findAll();
        return reservations.filter((r) => r.user_id === userId);
    }

    async update(id: number, roomId: number | null, user: User, startTime: Date, endTime: Date, currentUser: User) {
        const current = await this.repo.findById(id);
        if (!current) return { success: false, code: 'RESERVATION_NOT_FOUND' } as const;

        if (!this.isAuthorized(current, currentUser)) return { success: false, code: 'FORBIDDEN' } as const;

        let room: Room | null = null;
        if (roomId != null) {
            room = await this.roomRepo.findById(roomId);
            if (!room) return { success: false, code: 'ROOM_NOT_FOUND' } as const;

            if (!(await this.checkAvailability(roomId, startTime, endTime, id)))
                return { success: false, code: 'ROOM_NOT_AVAILABLE' } as const;
        }

        const updated = { ...current, room_id: roomId, user_id: user.id, start_time: startTime, end_time: endTime };
        await this.repo.save(updated);
        await this.mailer.sendReservationUpdate(user, updated, room);
        return { success: true, reservation: updated } as const;
    }

    async delete(id: number, currentUser: User) {
        const current = await this.repo.findById(id);
        if (!current) return { success: false, code: 'RESERVATION_NOT_FOUND' } as const;

        if (!this.isAuthorized(current, currentUser)) return { success: false, code: 'FORBIDDEN' } as const;

        const owner =
            current.user_id === currentUser.id
                ? currentUser
                : current.user_id != null
                  ? await this.userRepo.findById(current.user_id)
                  : null;
        const room = current.room_id != null ? await this.roomRepo.findById(current.room_id) : null;

        await this.repo.delete(current);

        if (owner) await this.mailer.sendReservationCancellation(owner, current, room);
        return { success: true } as const;
    }

    private async checkAvailability(roomId: number, startTime: Date, endTime: Date, excludeId?: number) {
        const reservations = await this.findByRoomId(roomId);
        return (
            !reservations.some((r) => {
                if (excludeId != null && r.id === excludeId) return false;
                return startTime.getTime() < r.end_time.getTime() && r.start_time.getTime() < endTime.getTime();
            }) && !(await this.roomRepo.hasUnavailabilityOverlap(roomId, startTime, endTime, excludeId))
        );
    }
}
