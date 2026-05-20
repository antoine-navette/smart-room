import { z } from 'zod';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import type { AuthService } from '../services/auth.service.js';
import { LoginBodyDto } from '../schemas/auth.schema.js';
import { UserDto } from '../schemas/user.schema.js';
import {
    InvalidBodyErrorDto,
    InvalidCredentialsErrorDto,
    InternalServerErrorDto,
    UnauthorizedErrorDto,
} from '../schemas/errors.schema.js';

type Options = { authService: AuthService };

const sessionCookieOptions = (expiresAt: Date) => ({
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    path: '/',
    expires: expiresAt,
});

export const authRoutes: FastifyPluginAsyncZodOpenApi<Options> = async (app, { authService }) => {
    app.post(
        '/auth/login',
        {
            schema: {
                tags: ['Auth'],
                body: LoginBodyDto,
                response: {
                    200: UserDto,
                    400: InvalidBodyErrorDto,
                    401: InvalidCredentialsErrorDto,
                    500: InternalServerErrorDto,
                },
            },
        },
        async (request, reply) => {
            const body = LoginBodyDto.safeParse(request.body);
            if (!body.success)
                return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });

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
        },
    );

    app.post(
        '/auth/logout',
        {
            schema: {
                tags: ['Auth'],
                response: {
                    204: z.object({}),
                    401: UnauthorizedErrorDto,
                    500: InternalServerErrorDto,
                },
            },
        },
        async (request, reply) => {
            const auth = await authService.authenticate(request.cookies['session_token']);
            if (!auth.success) {
                return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
            }

            await authService.logout(auth);
            reply.clearCookie('session_token', { path: '/' });
            return reply.status(204).send({});
        },
    );

    app.post(
        '/auth/logout-all',
        {
            schema: {
                tags: ['Auth'],
                response: {
                    204: z.object({}),
                    401: UnauthorizedErrorDto,
                    500: InternalServerErrorDto,
                },
            },
        },
        async (request, reply) => {
            const auth = await authService.authenticate(request.cookies['session_token']);
            if (!auth.success) {
                return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
            }

            await authService.logoutAll(auth);
            reply.clearCookie('session_token', { path: '/' });
            return reply.status(204).send({});
        },
    );
};
