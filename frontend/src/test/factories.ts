import type { components } from '../api/schema.d.ts';

export type Reservation = components['schemas']['Reservation'];
export type Room = components['schemas']['Room'];
export type Floor = components['schemas']['Floor'];
export type Building = components['schemas']['Building'];
export type User = components['schemas']['User'];

export function createUser(overrides: Partial<User> = {}): User {
    return {
        id: 1,
        first_name: 'Hugo',
        last_name: 'Martin',
        email: 'hugo@example.com',
        role: 'USER',
        ...overrides,
    };
}

export function createBuilding(overrides: Partial<Building> = {}): Building {
    return {
        id: 30,
        name: 'Batiment A',
        ...overrides,
    };
}

export function createFloor(overrides: Partial<Floor> = {}): Floor {
    return {
        id: 20,
        name: 'Etage 2',
        building_id: 30,
        ...overrides,
    };
}

export function createRoom(overrides: Partial<Room> = {}): Room {
    return {
        id: 10,
        name: 'Salle Atlas',
        floor_id: 20,
        capacity: 8,
        ...overrides,
    };
}

export function createReservation(overrides: Partial<Reservation> = {}): Reservation {
    return {
        id: 99,
        room_id: 10,
        user_id: 1,
        start_time: '2099-06-26T10:00:00.000Z',
        end_time: '2099-06-26T11:00:00.000Z',
        ...overrides,
    };
}
