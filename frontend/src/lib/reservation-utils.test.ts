import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    buildLocation,
    canCancelReservation,
    canManageReservation,
    canModifyReservation,
    getErrorCode,
    getReservationStatus,
    isSameMonth,
    sortReservations,
} from './reservation-utils';
import { createBuilding, createFloor, createReservation, createRoom, createUser } from '../test/factories';

function setCurrentTime(value: string) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(value));
}

describe('reservation-utils', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('sortReservations trie par date de debut croissante', () => {
        const reservations = [
            createReservation({ id: 2, start_time: '2026-06-25T12:00:00.000Z' }),
            createReservation({ id: 1, start_time: '2026-06-25T09:00:00.000Z' }),
            createReservation({ id: 3, start_time: '2026-06-25T10:30:00.000Z' }),
        ];

        const sorted = sortReservations(reservations);

        expect(sorted.map((reservation) => reservation.id)).toEqual([1, 3, 2]);
    });

    it('isSameMonth retourne true pour le meme mois et la meme annee', () => {
        expect(isSameMonth('2026-06-10T09:00:00.000Z', new Date('2026-06-25T12:00:00.000Z'))).toBe(true);
    });

    it('isSameMonth retourne false si le mois change', () => {
        expect(isSameMonth('2026-07-01T09:00:00.000Z', new Date('2026-06-25T12:00:00.000Z'))).toBe(false);
    });

    it('getReservationStatus retourne En cours pour une reservation active', () => {
        setCurrentTime('2026-06-25T10:30:00.000Z');

        const status = getReservationStatus(
            createReservation({
                start_time: '2026-06-25T10:00:00.000Z',
                end_time: '2026-06-25T11:00:00.000Z',
            }),
        );

        expect(status.label).toBe('En cours');
    });

    it('getReservationStatus retourne A venir pour une reservation future', () => {
        setCurrentTime('2026-06-25T09:00:00.000Z');

        const status = getReservationStatus(
            createReservation({
                start_time: '2026-06-25T10:00:00.000Z',
                end_time: '2026-06-25T11:00:00.000Z',
            }),
        );

        expect(status.label).toBe('A venir');
    });

    it('canCancelReservation et canModifyReservation retournent true si la reservation est future', () => {
        setCurrentTime('2026-06-25T09:00:00.000Z');

        const reservation = createReservation({
            start_time: '2026-06-25T10:00:00.000Z',
            end_time: '2026-06-25T11:00:00.000Z',
        });

        expect(canCancelReservation(reservation)).toBe(true);
        expect(canModifyReservation(reservation)).toBe(true);
    });

    it('canCancelReservation et canModifyReservation retournent false si la reservation a deja commence', () => {
        setCurrentTime('2026-06-25T10:15:00.000Z');

        const reservation = createReservation({
            start_time: '2026-06-25T10:00:00.000Z',
            end_time: '2026-06-25T11:00:00.000Z',
        });

        expect(canCancelReservation(reservation)).toBe(false);
        expect(canModifyReservation(reservation)).toBe(false);
    });

    it('canManageReservation retourne true pour le proprietaire et pour un admin', () => {
        const owner = createUser({ id: 1, role: 'USER' });
        const admin = createUser({ id: 2, role: 'ADMIN' });
        const reservation = createReservation({ user_id: 1 });

        expect(canManageReservation(owner, reservation)).toBe(true);
        expect(canManageReservation(admin, reservation)).toBe(true);
    });

    it('canManageReservation retourne false pour un autre utilisateur', () => {
        const user = createUser({ id: 2, role: 'USER' });
        const reservation = createReservation({ user_id: 1 });

        expect(canManageReservation(user, reservation)).toBe(false);
    });

    it('buildLocation construit le libelle complet quand tout est disponible', () => {
        const room = createRoom({ floor_id: 20 });
        const floor = createFloor({ id: 20, name: 'Etage 2', building_id: 30 });
        const building = createBuilding({ id: 30, name: 'Batiment A' });

        expect(buildLocation(room, new Map([[floor.id, floor]]), new Map([[building.id, building]]))).toBe(
            'Batiment A - Etage 2',
        );
    });

    it('buildLocation retourne un fallback si des informations manquent', () => {
        const room = createRoom({ floor_id: 20 });
        const floor = createFloor({ id: 20, name: 'Etage 2', building_id: 30 });

        expect(buildLocation(null, new Map(), new Map())).toBe('Emplacement inconnu');
        expect(buildLocation(room, new Map(), new Map())).toBe('Etage inconnu');
        expect(buildLocation(room, new Map([[floor.id, floor]]), new Map())).toBe('Etage 2');
    });

    it('getErrorCode retourne le code si present', () => {
        expect(getErrorCode({ code: 'ROOM_NOT_AVAILABLE' })).toBe('ROOM_NOT_AVAILABLE');
    });

    it('getErrorCode retourne une chaine vide si la forme est invalide', () => {
        expect(getErrorCode(null)).toBe('');
        expect(getErrorCode({})).toBe('');
        expect(getErrorCode('boom')).toBe('');
    });
});
