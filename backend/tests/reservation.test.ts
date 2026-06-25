import { describe, it, expect, beforeAll } from 'vitest';
import { API_URL, login, authed } from './helpers.js';

const START = '2030-06-01T10:00:00.000Z';
const END = '2030-06-01T12:00:00.000Z';

describe('Reservations', () => {
    let cookie: string;

    beforeAll(async () => {
        ({ cookie } = await login('john.doe@smart-room.fr', 'password'));
    });

    it('GET /reservations retourne 401 sans auth', async () => {
        const res = await fetch(`${API_URL}/reservations`);
        expect(res.status).toBe(401);
    });

    it('GET /reservations retourne 200 avec auth', async () => {
        const res = await fetch(`${API_URL}/reservations`, { headers: authed(cookie) });
        expect(res.status).toBe(200);
        expect(await res.json()).toBeInstanceOf(Array);
    });

    it('POST /reservations crée une réservation', async () => {
        const res = await fetch(`${API_URL}/reservations`, {
            method: 'POST',
            headers: authed(cookie),
            body: JSON.stringify({ room_id: 1, start_time: START, end_time: END }),
        });
        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body).toMatchObject({ room_id: 1 });
    });

    it('POST /reservations retourne 409 sur un créneau déjà pris', async () => {
        const res = await fetch(`${API_URL}/reservations`, {
            method: 'POST',
            headers: authed(cookie),
            body: JSON.stringify({ room_id: 1, start_time: START, end_time: END }),
        });
        expect(res.status).toBe(409);
    });

    it('DELETE /reservations/:id supprime la réservation', async () => {
        const created = await fetch(`${API_URL}/reservations`, {
            method: 'POST',
            headers: authed(cookie),
            body: JSON.stringify({ room_id: 1, start_time: '2030-07-01T10:00:00.000Z', end_time: '2030-07-01T12:00:00.000Z' }),
        });
        const { id } = await created.json();
        const res = await fetch(`${API_URL}/reservations/${id}`, { method: 'DELETE', headers: authed(cookie) });
        expect(res.status).toBe(204);
    });
});
