import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { fastifyZodOpenApiPlugin, fastifyZodOpenApiTransformers, serializerCompiler } from 'fastify-zod-openapi';
import type { Env } from '../config/env.js';
import type { Logger } from 'pino';
import type { AuthService } from '../services/auth.service.js';
import { healthRoutes } from '../routes/health.route.js';
import { authRoutes } from '../routes/auth.route.js';
import { userRoutes } from '../routes/user.route.js';
import type { BuildingService } from '../services/building.service.js';
import type { FloorService } from '../services/floor.service.js';
import type { ReservationService } from '../services/reservation.service.js';
import type { UserService } from '../services/user.service.js';
import type { RoomService } from '../services/room.service.js';
import { buildingRoutes } from '../routes/building.route.js';
import { floorRoutes } from '../routes/floor.route.js';
import { reservationRoutes } from '../routes/reservation.route.js';
import { roomRoutes } from '../routes/room.route.js';

type Services = {
    authService: AuthService;
    buildingService: BuildingService;
    floorService: FloorService;
    reservationService: ReservationService;
    userService: UserService;
    roomService: RoomService;
};

export const createApp = (allowedOrigins: Env['allowedOrigins'], logger: Logger, services: Services) => {
    const app = Fastify({ loggerInstance: logger, disableRequestLogging: true });

    app.setValidatorCompiler(() => (data) => ({ value: data }));
    app.setSerializerCompiler(serializerCompiler);

    app.register(cors, { origin: allowedOrigins, credentials: true });
    app.register(cookie);
    app.register(fastifyZodOpenApiPlugin);
    app.register(swagger, {
        openapi: { info: { title: 'Smart Room API', version: '1.0.0' } },
        ...fastifyZodOpenApiTransformers,
    });
    app.register(swaggerUi, { routePrefix: '/docs' });

    app.addHook('onRequest', async (request, _reply) => {
        request.log = request.log.child({
            method: request.method,
            url: request.url,
            route: request.routeOptions.url,
        });
    });

    app.register(authRoutes, { authService: services.authService });
    app.register(buildingRoutes, { authService: services.authService, buildingService: services.buildingService });
    app.register(floorRoutes, { authService: services.authService, floorService: services.floorService });
    app.register(healthRoutes);
    app.register(reservationRoutes, {
        authService: services.authService,
        reservationService: services.reservationService,
    });
    app.register(roomRoutes, { authService: services.authService, roomService: services.roomService });
    app.register(userRoutes, { authService: services.authService, userService: services.userService });

    app.setNotFoundHandler(async (request, reply) => {
        request.log.warn('Route not found');
        return reply.status(404).send({ code: 'NOT_FOUND', message: 'Route not found' });
    });

    app.setErrorHandler(async (err, request, reply) => {
        request.log.error(err instanceof Error ? err.message : 'Unknown error');
        return reply.status(500).send({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    });

    return app;
};
