import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReservationService } from './reservation.service.js';
import type { Reservation } from '../entities/reservation.entity.js';
import type { User } from '../entities/user.entity.js';

const t = (h: number) => new Date(2030, 0, 1, h, 0, 0);

const user: User = { id: 1, email: 'a@b.com', first_name: 'A', last_name: 'B', role: 'USER', password_hash: '' };
const admin: User = { ...user, id: 2, role: 'ADMIN' };

const makeReservation = (id: number, startH: number, endH: number): Reservation => ({
    id,
    user_id: user.id,
    room_id: 1,
    start_time: t(startH),
    end_time: t(endH),
});

const makeRepo = () => ({
    findById: vi.fn<(id: number) => Promise<Reservation | null>>(),
    findAll: vi.fn<() => Promise<Reservation[]>>(),
    create: vi.fn<() => Promise<Reservation>>(),
    save: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    delete: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
});

const makeRoomRepo = () => ({
    findById: vi.fn().mockResolvedValue({ id: 1, name: 'Salle A' }),
    hasUnavailabilityOverlap: vi.fn().mockResolvedValue(false),
});

const makeMailer = () => ({
    sendReservationConfirmation: vi.fn().mockResolvedValue(undefined),
    sendReservationUpdate: vi.fn().mockResolvedValue(undefined),
    sendReservationCancellation: vi.fn().mockResolvedValue(undefined),
});

describe('ReservationService', () => {
    let repo: ReturnType<typeof makeRepo>;
    let roomRepo: ReturnType<typeof makeRoomRepo>;
    let mailer: ReturnType<typeof makeMailer>;
    let service: ReservationService;

    beforeEach(() => {
        repo = makeRepo();
        roomRepo = makeRoomRepo();
        mailer = makeMailer();
        service = new ReservationService(
            repo as never,
            roomRepo as never,
            { findById: vi.fn() } as never,
            mailer as never,
        );
    });

    describe('create', () => {
        it('retourne ROOM_NOT_FOUND si la salle nexiste pas', async () => {
            roomRepo.findById.mockResolvedValue(null);
            const result = await service.create(99, user, t(10), t(12));
            expect(result).toEqual({ success: false, code: 'ROOM_NOT_FOUND' });
        });

        it('retourne ROOM_NOT_AVAILABLE si le créneau chevauche une réservation existante', async () => {
            repo.findAll.mockResolvedValue([makeReservation(1, 10, 14)]);
            const result = await service.create(1, user, t(12), t(16));
            expect(result).toEqual({ success: false, code: 'ROOM_NOT_AVAILABLE' });
        });

        it('crée la réservation si le créneau est libre', async () => {
            repo.findAll.mockResolvedValue([makeReservation(1, 10, 12)]);
            repo.create.mockResolvedValue(makeReservation(2, 14, 16));
            const result = await service.create(1, user, t(14), t(16));
            expect(result).toMatchObject({ success: true });
        });
    });

    describe('checkAvailability (via create)', () => {
        beforeEach(() => {
            repo.create.mockResolvedValue(makeReservation(99, 0, 0));
        });

        it('chevauchement partiel au début', async () => {
            repo.findAll.mockResolvedValue([makeReservation(1, 10, 14)]);
            expect(await service.create(1, user, t(8), t(11))).toMatchObject({ code: 'ROOM_NOT_AVAILABLE' });
        });

        it('chevauchement partiel à la fin', async () => {
            repo.findAll.mockResolvedValue([makeReservation(1, 10, 14)]);
            expect(await service.create(1, user, t(12), t(16))).toMatchObject({ code: 'ROOM_NOT_AVAILABLE' });
        });

        it('nouvelle réservation contenue dans une existante', async () => {
            repo.findAll.mockResolvedValue([makeReservation(1, 10, 14)]);
            expect(await service.create(1, user, t(11), t(13))).toMatchObject({ code: 'ROOM_NOT_AVAILABLE' });
        });

        it('nouvelle réservation contient une existante', async () => {
            repo.findAll.mockResolvedValue([makeReservation(1, 11, 13)]);
            expect(await service.create(1, user, t(10), t(14))).toMatchObject({ code: 'ROOM_NOT_AVAILABLE' });
        });

        it('créneau adjacent après — pas de chevauchement', async () => {
            repo.findAll.mockResolvedValue([makeReservation(1, 10, 12)]);
            expect(await service.create(1, user, t(12), t(14))).toMatchObject({ success: true });
        });

        it('créneau adjacent avant — pas de chevauchement', async () => {
            repo.findAll.mockResolvedValue([makeReservation(1, 12, 14)]);
            expect(await service.create(1, user, t(10), t(12))).toMatchObject({ success: true });
        });
    });

    describe('update', () => {
        it('retourne RESERVATION_NOT_FOUND si la réservation nexiste pas', async () => {
            repo.findById.mockResolvedValue(null);
            const result = await service.update(99, 1, user, t(10), t(12), user);
            expect(result).toEqual({ success: false, code: 'RESERVATION_NOT_FOUND' });
        });

        it('retourne FORBIDDEN si lutilisateur nest pas le propriétaire', async () => {
            const other: User = { ...user, id: 99 };
            repo.findById.mockResolvedValue(makeReservation(1, 10, 12));
            const result = await service.update(1, 1, user, t(10), t(12), other);
            expect(result).toEqual({ success: false, code: 'FORBIDDEN' });
        });

        it('un admin peut modifier la réservation de quelquun dautre', async () => {
            repo.findById.mockResolvedValue(makeReservation(1, 10, 12));
            repo.findAll.mockResolvedValue([makeReservation(1, 10, 12)]);
            const result = await service.update(1, 1, user, t(14), t(16), admin);
            expect(result).toMatchObject({ success: true });
        });

        it('exclut sa propre réservation du check de disponibilité', async () => {
            repo.findById.mockResolvedValue(makeReservation(1, 10, 12));
            repo.findAll.mockResolvedValue([makeReservation(1, 10, 12)]);
            const result = await service.update(1, 1, user, t(10), t(12), user);
            expect(result).toMatchObject({ success: true });
        });
    });

    describe('delete', () => {
        it('retourne RESERVATION_NOT_FOUND si la réservation nexiste pas', async () => {
            repo.findById.mockResolvedValue(null);
            expect(await service.delete(99, user)).toEqual({ success: false, code: 'RESERVATION_NOT_FOUND' });
        });

        it('retourne FORBIDDEN si lutilisateur nest pas le propriétaire', async () => {
            const other: User = { ...user, id: 99 };
            repo.findById.mockResolvedValue(makeReservation(1, 10, 12));
            expect(await service.delete(1, other)).toEqual({ success: false, code: 'FORBIDDEN' });
        });

        it('supprime avec succès', async () => {
            repo.findById.mockResolvedValue(makeReservation(1, 10, 12));
            expect(await service.delete(1, user)).toEqual({ success: true });
        });
    });
});
