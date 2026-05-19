import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import type { AuthService } from '../services/auth.service.js';
import type { UserService } from '../services/user.service.js';

const registerSchema = z.object({
    email: z.email(),
    password: z.string().min(8),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    gender: z.enum(['M', 'F', 'O']),
});

const idSchema = z.object({
    id: z.coerce.number().int().positive(),
});

type Options = { authService: AuthService; userService: UserService };

const sanitizeUser = <T extends { password_hash: string }>(user: T) => {
    const { password_hash, ...safeUser } = user;
    return safeUser;
};

export const userRoutes: FastifyPluginAsync<Options> = async (app, { authService, userService }) => {
    // Create a new user (public)
    app.post('/users/create', async (request, reply) => {
        const body = registerSchema.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
        }

        const result = await userService.create({
            email: body.data.email,
            password_hash: body.data.password,
            first_name: body.data.first_name,
            last_name: body.data.last_name,
            gender: body.data.gender,
        });
        if (!result.success) {
            if (result.code === 'INVALID_EMAIL') {
                return reply.status(400).send({ code: 'INVALID_EMAIL', issues: result.issues, message: 'Email is invalid' });
            }
            if (result.code === 'EMAIL_ALREADY_EXISTS') {
                return reply.status(409).send({ code: 'EMAIL_ALREADY_EXISTS', message: 'Email already in use' });
            }
            if (result.code === 'USER_CREATE_FAILED') {
                return reply.status(500).send({ code: 'USER_CREATE_FAILED', message: 'Failed to create user' });
            }
            result satisfies never;
        }

        return reply.status(201).send(sanitizeUser(result.user));
    });

    // Get current user (public)
    app.get('/users/me', async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        return reply.status(200).send(sanitizeUser(auth.user));
    });

    // Update user (private)
    app.put('/users/:id', async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const params = idSchema.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const body = registerSchema.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
        }

        const current = await userService.findById(params.data.id);
        if (!current.success) {
            return reply.status(404).send({ code: 'USER_NOT_FOUND', message: 'User not found' });
        }

        const result = await userService.save({
            id: params.data.id,
            email: body.data.email,
            password_hash: current.user.password_hash,
            first_name: body.data.first_name,
            last_name: body.data.last_name,
            gender: body.data.gender,
        });

        if (!result.success) {
            if (result.code === 'INVALID_EMAIL') {
                return reply.status(400).send({ code: 'INVALID_EMAIL', issues: result.issues, message: 'Email is invalid' });
            }
            if (result.code === 'EMAIL_ALREADY_EXISTS') {
                return reply.status(409).send({ code: 'EMAIL_ALREADY_EXISTS', message: 'Email already in use' });
            }
            if (result.code === 'USER_SAVE_FAILED') {
                return reply.status(500).send({ code: 'USER_SAVE_FAILED', message: 'Failed to save user' });
            }
            result satisfies never;
        }

        return reply.status(200).send(sanitizeUser(result.user));
    });

    // Delete user (private)
    app.delete('/users/:id', async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const params = idSchema.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const result = await userService.deleteById(params.data.id);
        if (!result.success) {
            if (result.code === 'USER_NOT_FOUND') {
                return reply.status(404).send({ code: 'USER_NOT_FOUND', message: 'User not found' });
            }
            if (result.code === 'USER_HAS_RESERVATIONS') {
                return reply.status(409).send({ code: 'USER_HAS_RESERVATIONS', message: 'User still has reservations' });
            }
            result satisfies never;
        }

        return reply.status(204).send();
    });
};
