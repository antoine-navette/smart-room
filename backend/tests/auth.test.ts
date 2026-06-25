import { describe, it, expect } from 'vitest';
import { API_URL, login } from './helpers.js';

describe('POST /auth/login', () => {
    it('retourne 401 avec de mauvaises credentials', async () => {
        const { res } = await login('admin@smart-room.fr', 'wrong');
        expect(res.status).toBe(401);
    });

    it('retourne 200 et un cookie de session avec de bonnes credentials', async () => {
        const { res, cookie } = await login('admin@smart-room.fr', 'password');
        expect(res.status).toBe(200);
        expect(cookie).toMatch(/^session_token=/);
    });
});

describe('GET /users/me', () => {
    it('retourne 401 sans cookie', async () => {
        const res = await fetch(`${API_URL}/users/me`);
        expect(res.status).toBe(401);
    });

    it('retourne 200 avec le cookie de session', async () => {
        const { cookie } = await login('admin@smart-room.fr', 'password');
        const res = await fetch(`${API_URL}/users/me`, { headers: { Cookie: cookie } });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toMatchObject({ email: 'admin@smart-room.fr', role: 'ADMIN' });
    });
});

describe('POST /auth/logout', () => {
    it('invalide la session', async () => {
        const { cookie } = await login('admin@smart-room.fr', 'password');
        await fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: { Cookie: cookie } });
        const res = await fetch(`${API_URL}/users/me`, { headers: { Cookie: cookie } });
        expect(res.status).toBe(401);
    });
});
