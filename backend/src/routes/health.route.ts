import { z } from 'zod';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

export const healthRoutes: FastifyPluginAsyncZodOpenApi = async (app) => {
    app.get(
        '/health',
        { schema: { tags: ['Health'], response: { 204: z.object({}) } } },
        async (_request, reply) => reply.status(204).send({}),
    );
};
