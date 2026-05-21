import { loadEnv, type Env } from './config/env.js';
import { connectToPostgres } from './config/postgres.js';
import { startServer } from './app/server.js';
import { createLogger } from './config/pino.js';
import { createApp } from './app/app.js';
import { Bcrypt } from './libs/bcrypt.js';
import { BuildingRepository } from './repositories/building.repository.js';
import { FloorRepository } from './repositories/floor.repository.js';
import { ReservationRepository } from './repositories/reservation.repository.js';
import { RoomResourceRepository } from './repositories/room-resource.repository.js';
import { RoomResourceAssignmentRepository } from './repositories/room-resource-assignment.repository.js';
import { IncidentRepository } from './repositories/incident.repository.js';
import { RoomUnavailabilityRepository } from './repositories/room-unavailability.repository.js';
import { RoomRepository } from './repositories/room.repository.js';
import { SessionRepository } from './repositories/session.repository.js';
import { UserRepository } from './repositories/user.repository.js';
import { AuthService } from './services/auth.service.js';
import { BuildingService } from './services/building.service.js';
import { FloorService } from './services/floor.service.js';
import { ReservationService } from './services/reservation.service.js';
import { RoomResourceAssignmentService } from './services/room-resource-assignment.service.js';
import { RoomResourceService } from './services/room-resource.service.js';
import { IncidentService } from './services/incident.service.js';
import { RoomUnavailabilityService } from './services/room-unavailability.service.js';
import { UserService } from './services/user.service.js';
import { RoomService } from './services/room.service.js';

const logger = createLogger(process.env.NODE_ENV as Env['nodeEnv']);

try {
    const env = loadEnv();
    logger.info('Environment loaded');

    const postgres = await connectToPostgres(env.postgresUrl);
    logger.info('Postgres connected');

    const sessionRepo = new SessionRepository(postgres.pool);
    const userRepo = new UserRepository(postgres.pool);
    const buildingRepo = new BuildingRepository(postgres.pool);
    const floorRepo = new FloorRepository(postgres.pool);
    const reservationRepo = new ReservationRepository(postgres.pool);
    const roomResourceRepo = new RoomResourceRepository(postgres.pool);
    const roomResourceAssignmentRepo = new RoomResourceAssignmentRepository(postgres.pool);
    const roomRepo = new RoomRepository(postgres.pool);
    const roomUnavailabilityRepo = new RoomUnavailabilityRepository(postgres.pool);
    const bcrypt = new Bcrypt();
    const authService = new AuthService(sessionRepo, userRepo, bcrypt);
    const buildingService = new BuildingService(buildingRepo, floorRepo);
    const floorService = new FloorService(floorRepo, buildingRepo, roomRepo);
    const roomService = new RoomService(roomRepo, floorRepo);
    const reservationService = new ReservationService(reservationRepo, roomRepo);
    const roomResourceAssignmentService = new RoomResourceAssignmentService(roomResourceAssignmentRepo, roomRepo, roomResourceRepo);
    const roomResourceService = new RoomResourceService(roomResourceRepo);
    const incidentRepo = new IncidentRepository(postgres.pool);
    const incidentService = new IncidentService(incidentRepo, roomRepo);
    const roomUnavailabilityService = new RoomUnavailabilityService(roomUnavailabilityRepo, roomRepo, reservationRepo);
    const userService = new UserService(userRepo, bcrypt);

    const app = createApp(env.allowedOrigins, logger, {
        authService,
        buildingService,
        floorService,
        reservationService,
        roomResourceAssignmentService,
        roomResourceService,
        incidentService,
        roomUnavailabilityService,
        roomService,
        userService,
    });
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
