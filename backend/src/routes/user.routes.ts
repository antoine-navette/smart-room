import type { FastifyPluginAsync } from 'fastify';
import type { AuthService } from '../services/auth.service.js';

type Options = { authService: AuthService };

export const userRoutes: FastifyPluginAsync<Options> = async (app, { authService }) => {
    app.get('/users/me', async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const { password_hash, ...user } = auth.user;
        return reply.status(200).send(user);
    });
};
