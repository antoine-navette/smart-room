import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoomUnavailabilityService } from './room-unavailability.service.js';
import type { Reservation } from '../entities/reservation.entity.js';
import type { RoomUnavailability } from '../entities/room-unavailability.entity.js';
import type { User } from '../entities/user.entity.js';

const t = (h: number) => new Date(2024, 0, 1, h, 0, 0);

const admin: User = { id: 1, email: 'a@b.com', first_name: 'A', last_name: 'B', role: 'ADMIN', password_hash: '' };
const user: User = { ...admin, id: 2, role: 'USER' };
const room = { id: 1, name: 'Salle A', floor_id: 1, capacity: 10 };

const makeReservation = (id: number, userId: number, startH: number, endH: number): Reservation => ({
    id,
    user_id: userId,
    room_id: room.id,
    start_time: t(startH),
    end_time: t(endH),
});

const unavailability: RoomUnavailability = {
    id: 1,
    room_id: room.id,
    from_time: t(10),
    to_time: t(14),
    reason: 'Travaux',
};

const makeRepo = () => ({
    findById: vi.fn<() => Promise<RoomUnavailability | null>>(),
    findAll: vi.fn<() => Promise<RoomUnavailability[]>>(),
    findByRoomId: vi.fn<() => Promise<RoomUnavailability[]>>(),
    findOverlapping: vi.fn<() => Promise<RoomUnavailability[]>>().mockResolvedValue([]),
    create: vi.fn<() => Promise<RoomUnavailability>>().mockResolvedValue(unavailability),
    save: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    delete: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
});

const makeRoomRepo = () => ({
    findById: vi.fn().mockResolvedValue(room),
});

const makeReservationRepo = () => ({
    findByRoomId: vi.fn<() => Promise<Reservation[]>>().mockResolvedValue([]),
    delete: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
});

const makeUserRepo = () => ({
    findById: vi.fn().mockResolvedValue(user),
});

const makeMailer = () => ({
    sendRoomUnavailabilityNotification: vi.fn().mockResolvedValue(undefined),
});

describe('RoomUnavailabilityService', () => {
    let repo: ReturnType<typeof makeRepo>;
    let roomRepo: ReturnType<typeof makeRoomRepo>;
    let reservationRepo: ReturnType<typeof makeReservationRepo>;
    let userRepo: ReturnType<typeof makeUserRepo>;
    let mailer: ReturnType<typeof makeMailer>;
    let service: RoomUnavailabilityService;

    beforeEach(() => {
        repo = makeRepo();
        roomRepo = makeRoomRepo();
        reservationRepo = makeReservationRepo();
        userRepo = makeUserRepo();
        mailer = makeMailer();
        service = new RoomUnavailabilityService(
            repo as never,
            roomRepo as never,
            reservationRepo as never,
            userRepo as never,
            mailer as never,
        );
    });

    describe('create', () => {
        it('retourne FORBIDDEN pour un non-admin', async () => {
            expect(await service.create(user, room.id, t(10), t(14), 'X')).toEqual({
                success: false,
                code: 'FORBIDDEN',
            });
        });

        it('retourne ROOM_NOT_FOUND si la salle nexiste pas', async () => {
            roomRepo.findById.mockResolvedValue(null);
            expect(await service.create(admin, 99, t(10), t(14), 'X')).toEqual({
                success: false,
                code: 'ROOM_NOT_FOUND',
            });
        });

        it('retourne INVALID_DATE_RANGE si fromTime >= toTime', async () => {
            expect(await service.create(admin, room.id, t(14), t(10), 'X')).toEqual({
                success: false,
                code: 'INVALID_DATE_RANGE',
            });
            expect(await service.create(admin, room.id, t(10), t(10), 'X')).toEqual({
                success: false,
                code: 'INVALID_DATE_RANGE',
            });
        });

        it('retourne ROOM_UNAVAILABILITY_CONFLICT si une indispo existante chevauche', async () => {
            repo.findOverlapping.mockResolvedValue([unavailability]);
            expect(await service.create(admin, room.id, t(10), t(14), 'X')).toEqual({
                success: false,
                code: 'ROOM_UNAVAILABILITY_CONFLICT',
            });
        });

        it('crée lindisponibilité avec succès', async () => {
            expect(await service.create(admin, room.id, t(10), t(14), 'Travaux')).toMatchObject({ success: true });
        });

        it('annule les réservations qui chevauchent la période', async () => {
            const overlapping = makeReservation(1, user.id, 11, 13);
            const outside = makeReservation(2, user.id, 15, 17);
            reservationRepo.findByRoomId.mockResolvedValue([overlapping, outside]);

            await service.create(admin, room.id, t(10), t(14), 'Travaux');

            expect(reservationRepo.delete).toHaveBeenCalledWith(overlapping);
            expect(reservationRepo.delete).not.toHaveBeenCalledWith(outside);
        });

        it('nenvoie pas de notification pour les réservations sans utilisateur', async () => {
            const anon: Reservation = { id: 1, user_id: null, room_id: room.id, start_time: t(11), end_time: t(13) };
            reservationRepo.findByRoomId.mockResolvedValue([anon]);

            await service.create(admin, room.id, t(10), t(14), 'Travaux');

            expect(mailer.sendRoomUnavailabilityNotification).not.toHaveBeenCalled();
        });
    });
});
