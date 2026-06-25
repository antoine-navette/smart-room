export const API_URL = process.env.TEST_API_URL ?? 'http://localhost:3000';

export async function login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const cookie = res.headers.get('set-cookie')?.split(';')[0] ?? '';
    return { res, cookie };
}

export function authed(cookie: string): HeadersInit {
    return { Cookie: cookie };
}

export function authedJson(cookie: string): HeadersInit {
    return { Cookie: cookie, 'Content-Type': 'application/json' };
}
