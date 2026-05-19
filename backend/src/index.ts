import { loadEnv, type Env } from './config/env.js';
import { connectToPostgres } from './config/postgres.js';
import { startServer } from './app/server.js';
import { createLogger } from './config/pino.js';
import { createApp } from './app/app.js';

const logger = createLogger(process.env.NODE_ENV as Env['nodeEnv']);

try {
    const env = loadEnv();
    logger.info('Environment loaded');

    const postgres = await connectToPostgres(env.postgresUrl);
    logger.info('Postgres connected');

    const app = createApp(env.allowedOrigins, logger);
    await startServer(app, env.port);
    logger.info('Server started');

    const shutdown = async (signal: NodeJS.Signals) => {
        logger.info(`Received ${signal}, shutting down`);
        await app.close();
        await postgres.pool.end();
        process.exit(0);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
} catch (err: unknown) {
    logger.fatal(err instanceof Error ? err.message : 'Unknown error');
    process.exit(1);
}
