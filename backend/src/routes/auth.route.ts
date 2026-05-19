import { z } from 'zod';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import type { AuthService } from '../services/auth.service.js';
import { RegisterBodyDto, LoginBodyDto } from '../schemas/auth.schema.js';
import { UserDto } from '../schemas/user.schema.js';
import {
    EmailAlreadyExistsErrorDto,
    InvalidCredentialsErrorDto,
    InternalServerErrorDto,
    UnauthorizedErrorDto,
    ValidationErrorDto,
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
        '/auth/register',
        {
            schema: {
                body: RegisterBodyDto,
                response: {
                    201: UserDto,
                    400: ValidationErrorDto,
                    409: EmailAlreadyExistsErrorDto,
                    500: InternalServerErrorDto,
                },
            },
        },
        async (request, reply) => {
            const body = RegisterBodyDto.safeParse(request.body);
            if (!body.success)
                return reply
                    .status(400)
                    .send({ code: 'VALIDATION_ERROR', message: 'Validation failed', issues: body.error.issues });

            const result = await authService.register(
                body.data.email,
                body.data.password,
                body.data.first_name,
                body.data.last_name,
            );

            if (!result.success) {
                if (result.code === 'EMAIL_ALREADY_EXISTS') {
                    return reply.status(409).send({ code: 'EMAIL_ALREADY_EXISTS', message: 'Email already in use' });
                }
                result satisfies never;
            }

            const { password_hash, ...user } = result.user;
            reply.setCookie('session_token', result.session.token, sessionCookieOptions(result.session.expires_at));
            return reply.status(201).send(user);
        },
    );

    app.post(
        '/auth/login',
        {
            schema: {
                body: LoginBodyDto,
                response: {
                    200: UserDto,
                    400: ValidationErrorDto,
                    401: InvalidCredentialsErrorDto,
                    500: InternalServerErrorDto,
                },
            },
        },
        async (request, reply) => {
            const body = LoginBodyDto.safeParse(request.body);
            if (!body.success)
                return reply
                    .status(400)
                    .send({ code: 'VALIDATION_ERROR', message: 'Validation failed', issues: body.error.issues });

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
