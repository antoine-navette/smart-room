import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import type { AuthService } from '../services/auth.service.js';
import { UserDto } from '../schemas/user.schema.js';
import { InternalServerErrorDto, UnauthorizedErrorDto } from '../schemas/errors.schema.js';

type Options = { authService: AuthService };

export const userRoutes: FastifyPluginAsyncZodOpenApi<Options> = async (app, { authService }) => {
    app.get('/users/me', {
        schema: {
            tags: ['Users'],
            response: {
                200: UserDto,
                401: UnauthorizedErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const { password_hash, ...user } = auth.user;
        return reply.status(200).send(user);
    });
};
