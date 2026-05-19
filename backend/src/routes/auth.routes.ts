import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import type { AuthService } from '../services/auth.service.js';

// const registerSchema = z.object({
//     email: z.email(),
//     password: z.string().min(8),
//     first_name: z.string().min(1),
//     last_name: z.string().min(1),
//     gender: z.enum(['M', 'F', 'O']),
// });

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
});

type Options = { authService: AuthService };

const sessionCookieOptions = (expiresAt: Date) => ({
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    path: '/',
    expires: expiresAt,
});

export const authRoutes: FastifyPluginAsync<Options> = async (app, { authService }) => {
    // app.post('/auth/register', async (request, reply) => {
    //     const body = registerSchema.safeParse(request.body);
    //     if (!body.success) {
    //         return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
    //     }

    //     const result = await authService.register(
    //         body.data.email,
    //         body.data.password,
    //         body.data.first_name,
    //         body.data.last_name,
    //         body.data.gender,
    //     );

    //     if (!result.success) {
    //         if (result.code === 'EMAIL_ALREADY_EXISTS') {
    //             return reply.status(409).send({ code: 'EMAIL_ALREADY_EXISTS', message: 'Email already in use' });
    //         }
    //         result satisfies never;
    //     }

    //     const { password_hash, ...user } = result.user;
    //     reply.setCookie('session_token', result.session.token, sessionCookieOptions(result.session.expires_at));
    //     return reply.status(201).send(user);
    // });

    app.post('/auth/login', async (request, reply) => {
        const body = loginSchema.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
        }

        const result = await authService.login(body.data.email, body.data.password);

        if (!result.success) {
            if (result.code === 'USER_NOT_FOUND' || result.code === 'INVALID_PASSWORD') {
                return reply.status(401).send({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
            }
            result satisfies never;
        }

        const { password_hash, ...user } = result.user;
        reply.setCookie('session_token', result.session.token, sessionCookieOptions(result.session.expires_at));
        return reply.status(200).send(user);
    });

    app.post('/auth/logout', async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        await authService.logout(auth);
        reply.clearCookie('session_token', { path: '/' });
        return reply.status(204).send();
    });

    app.post('/auth/logout-all', async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        await authService.logoutAll(auth);
        reply.clearCookie('session_token', { path: '/' });
        return reply.status(204).send();
    });
};
