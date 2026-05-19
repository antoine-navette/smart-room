import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import type { AuthService } from '../services/auth.service.js';
import type { ReservationService } from '../services/reservation.service.js';

const reservationSchema = z.object({
    room_id: z.coerce.number().int().positive(),
    user_id: z.coerce.number().int().positive(),
    start_time: z.coerce.date(),
    end_time: z.coerce.date(),
});

const idSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const userIdSchema = z.object({
    userId: z.coerce.number().int().positive(),
});

const roomIdSchema = z.object({
    roomId: z.coerce.number().int().positive(),
});

type Options = {
    authService: AuthService;
    reservationService: ReservationService;
};

export const reservationRoutes: FastifyPluginAsync<Options> = async (app, { authService, reservationService }) => {
    // Get all reservations (public)
    app.get('/reservations', async (_request, reply) => {
        const reservations = await reservationService.findAll();
        return reply.status(200).send(reservations);
    });

    // Get reservation by id (public)
    app.get('/reservations/:id', async (request, reply) => {
        const params = idSchema.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const result = await reservationService.findById(params.data.id);
        if (!result.success) {
            return reply.status(404).send({ code: 'RESERVATION_NOT_FOUND', message: 'Reservation not found' });
        }

        return reply.status(200).send(result.reservation);
    });

    // Get reservations by user id (public)
    app.get('/reservations/user/:userId', async (request, reply) => {
        const params = userIdSchema.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const result = await reservationService.findByUserId(params.data.userId);
        if (!result.success) {
            return reply.status(200).send([]);
        }

        return reply.status(200).send(result.reservations);
    });

    // Get reservations by room id (public)
    app.get('/reservations/room/:roomId', async (request, reply) => {
        const params = roomIdSchema.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const result = await reservationService.findByRoomId(params.data.roomId);
        if (!result.success) {
            return reply.status(200).send([]);
        }

        return reply.status(200).send(result.reservations);
    });

    // Create a new reservation (private)
    app.post('/reservations', async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const body = reservationSchema.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
        }

        // Validate date range
        if (body.data.end_time <= body.data.start_time) {
            return reply.status(400).send({ code: 'INVALID_DATE_RANGE', message: 'End time must be after start time' });
        }

        const result = await reservationService.create(body.data);
        if (!result.success) {
            const code = result.code;
            if (code === 'ROOM_NOT_FOUND') {
                return reply.status(404).send({ code: 'ROOM_NOT_FOUND', message: 'Room not found' });
            }
            if (code === 'USER_NOT_FOUND') {
                return reply.status(404).send({ code: 'USER_NOT_FOUND', message: 'User not found' });
            }
            if (code === 'ROOM_NOT_AVAILABLE') {
                return reply.status(409).send({ code: 'ROOM_NOT_AVAILABLE', message: 'Room is not available for this time period' });
            }
            result satisfies never;
        }

        return reply.status(201).send(result.reservation);
    });

    // Update a reservation (private)
    app.put('/reservations/:id', async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const params = idSchema.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const body = reservationSchema.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
        }

        // Validate date range
        if (body.data.end_time <= body.data.start_time) {
            return reply.status(400).send({ code: 'INVALID_DATE_RANGE', message: 'End time must be after start time' });
        }

        const result = await reservationService.save({ id: params.data.id, ...body.data });
        if (!result.success) {
            const code = result.code;
            if (code === 'ROOM_NOT_FOUND') {
                return reply.status(404).send({ code: 'ROOM_NOT_FOUND', message: 'Room not found' });
            }
            if (code === 'ROOM_NOT_AVAILABLE') {
                return reply.status(409).send({ code: 'ROOM_NOT_AVAILABLE', message: 'Room is not available for this time period' });
            }
            result satisfies never;
        }

        return reply.status(200).send(result.reservation);
    });

    // Delete a reservation (private)
    app.delete('/reservations/:id', async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const params = idSchema.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const result = await reservationService.deleteById(params.data.id);
        if (!result.success) {
            if (result.code === 'RESERVATION_NOT_FOUND') {
                return reply.status(404).send({ code: 'RESERVATION_NOT_FOUND', message: 'Reservation not found' });
            }
            result satisfies never;
        }

        return reply.status(204).send();
    });
};
