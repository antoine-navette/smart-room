import type { Env } from '../config/env.js';
import type { createApp } from './app.js';

export const startServer = async (app: ReturnType<typeof createApp>, port: Env['port']) => {
    await app.listen({ port, host: '0.0.0.0' });
};
