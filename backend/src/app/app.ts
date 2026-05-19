import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import type { Env } from '../config/env.js';
import type { Logger } from 'pino';

export const createApp = (allowedOrigins: Env['allowedOrigins'], logger: Logger) => {
    const app = Fastify({ loggerInstance: logger, disableRequestLogging: true });

    app.register(cors, {
        origin: allowedOrigins,
        credentials: true,
    });

    app.register(cookie);

    app.get('/test', async (_request, reply) => {
        return reply.status(200).send('OK');
    });

    app.setNotFoundHandler(async (_request, reply) => {
        return reply.status(404).send('Route not found');
    });

    app.setErrorHandler(async (err, _request, reply) => {
        logger.error(err instanceof Error ? err.message : 'Unknown error');
        return reply.status(500).send({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    });

    return app;
};
