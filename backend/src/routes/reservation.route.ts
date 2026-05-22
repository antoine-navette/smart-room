import { z } from 'zod';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import type { AuthService } from '../services/auth.service.js';
import type { ReservationService } from '../services/reservation.service.js';
import {
    ReservationDto,
    CreateReservationBodyDto,
    UpdateReservationBodyDto,
    ReservationIdParamsDto,
    ReservationUserIdParamsDto,
    ReservationRoomIdParamsDto,
} from '../schemas/reservation.schema.js';
import {
    ReservationNotFoundErrorDto,
    RoomNotFoundErrorDto,
    RoomNotAvailableErrorDto,
    InvalidBodyErrorDto,
    InvalidParamsErrorDto,
    InvalidDateRangeErrorDto,
    UnauthorizedErrorDto,
    ForbiddenErrorDto,
    InternalServerErrorDto,
} from '../schemas/errors.schema.js';

type Options = {
    authService: AuthService;
    reservationService: ReservationService;
};

const canAccessUserReservations = (user: { id: number; role: 'USER' | 'ADMIN' }, userId: number) => {
    return user.role === 'ADMIN' || user.id === userId;
};

const canManageReservation = (user: { id: number; role: 'USER' | 'ADMIN' }, reservationUserId: number | null) => {
    return user.role === 'ADMIN' || reservationUserId === user.id;
};

export const reservationRoutes: FastifyPluginAsyncZodOpenApi<Options> = async (app, { authService, reservationService }) => {
    app.post('/reservations', {
        schema: {
            tags: ['Reservations'],
            body: CreateReservationBodyDto,
            response: {
                201: ReservationDto,
                400: z.union([InvalidBodyErrorDto, InvalidDateRangeErrorDto]),
                401: UnauthorizedErrorDto,
                404: RoomNotFoundErrorDto,
                409: RoomNotAvailableErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const body = CreateReservationBodyDto.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
        }

        if (body.data.end_time <= body.data.start_time) {
            return reply.status(400).send({ code: 'INVALID_DATE_RANGE', message: 'End time must be after start time' });
        }

        const result = await reservationService.create(body.data.room_id, auth.user, body.data.start_time, body.data.end_time);
        if (!result.success) {
            if (result.code === 'ROOM_NOT_FOUND') {
                return reply.status(404).send({ code: 'ROOM_NOT_FOUND', message: 'Room not found' });
            }
            if (result.code === 'ROOM_NOT_AVAILABLE') {
                return reply.status(409).send({ code: 'ROOM_NOT_AVAILABLE', message: 'Room is not available for this time period' });
            }
            result satisfies never;
        }

        return reply.status(201).send(result.reservation);
    });

    app.get('/reservations', {
        schema: {
            tags: ['Reservations'],
            response: {
                200: z.array(ReservationDto),
                401: UnauthorizedErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const reservations =
            auth.user.role === 'ADMIN'
                ? await reservationService.findAll()
                : await reservationService.findByUserId(auth.user.id);

        return reply.status(200).send(reservations);
    });

    app.get('/reservations/:id', {
        schema: {
            tags: ['Reservations'],
            params: ReservationIdParamsDto,
            response: {
                200: ReservationDto,
                400: InvalidParamsErrorDto,
                401: UnauthorizedErrorDto,
                403: ForbiddenErrorDto,
                404: ReservationNotFoundErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const params = ReservationIdParamsDto.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const result = await reservationService.findById(params.data.id);
        if (!result.success) {
            return reply.status(404).send({ code: 'RESERVATION_NOT_FOUND', message: 'Reservation not found' });
        }

        if (!canManageReservation(auth.user, result.reservation.user_id)) {
            return reply.status(403).send({ code: 'FORBIDDEN', message: 'Forbidden' });
        }

        return reply.status(200).send(result.reservation);
    });

    app.get('/users/:userId/reservations', {
        schema: {
            tags: ['Reservations'],
            params: ReservationUserIdParamsDto,
            response: {
                200: z.array(ReservationDto),
                400: InvalidParamsErrorDto,
                401: UnauthorizedErrorDto,
                403: ForbiddenErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const params = ReservationUserIdParamsDto.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        if (!canAccessUserReservations(auth.user, params.data.userId)) {
            return reply.status(403).send({ code: 'FORBIDDEN', message: 'Forbidden' });
        }

        const reservations = await reservationService.findByUserId(params.data.userId);
        return reply.status(200).send(reservations);
    });

    app.get('/rooms/:roomId/reservations', {
        schema: {
            tags: ['Reservations'],
            params: ReservationRoomIdParamsDto,
            response: {
                200: z.array(ReservationDto),
                400: InvalidParamsErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const params = ReservationRoomIdParamsDto.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const reservations = await reservationService.findByRoomId(params.data.roomId);
        return reply.status(200).send(reservations);
    });

    app.put('/reservations/:id', {
        schema: {
            tags: ['Reservations'],
            params: ReservationIdParamsDto,
            body: UpdateReservationBodyDto,
            response: {
                200: ReservationDto,
                400: z.union([InvalidParamsErrorDto, InvalidBodyErrorDto, InvalidDateRangeErrorDto]),
                401: UnauthorizedErrorDto,
                403: ForbiddenErrorDto,
                404: z.union([ReservationNotFoundErrorDto, RoomNotFoundErrorDto]),
                409: RoomNotAvailableErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const params = ReservationIdParamsDto.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const currentReservation = await reservationService.findById(params.data.id);
        if (!currentReservation.success) {
            return reply.status(404).send({ code: 'RESERVATION_NOT_FOUND', message: 'Reservation not found' });
        }

        if (!canManageReservation(auth.user, currentReservation.reservation.user_id)) {
            return reply.status(403).send({ code: 'FORBIDDEN', message: 'Forbidden' });
        }

        const body = UpdateReservationBodyDto.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
        }

        if (body.data.end_time <= body.data.start_time) {
            return reply.status(400).send({ code: 'INVALID_DATE_RANGE', message: 'End time must be after start time' });
        }

        const result = await reservationService.update(params.data.id, body.data.room_id, auth.user, body.data.start_time, body.data.end_time);
        if (!result.success) {
            if (result.code === 'RESERVATION_NOT_FOUND') {
                return reply.status(404).send({ code: 'RESERVATION_NOT_FOUND', message: 'Reservation not found' });
            }
            if (result.code === 'ROOM_NOT_FOUND') {
                return reply.status(404).send({ code: 'ROOM_NOT_FOUND', message: 'Room not found' });
            }
            if (result.code === 'ROOM_NOT_AVAILABLE') {
                return reply.status(409).send({ code: 'ROOM_NOT_AVAILABLE', message: 'Room is not available for this time period' });
            }
            result satisfies never;
        }

        return reply.status(200).send(result.reservation);
    });

    app.delete('/reservations/:id', {
        schema: {
            tags: ['Reservations'],
            params: ReservationIdParamsDto,
            response: {
                204: z.object({}),
                400: InvalidParamsErrorDto,
                401: UnauthorizedErrorDto,
                403: ForbiddenErrorDto,
                404: ReservationNotFoundErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const params = ReservationIdParamsDto.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const currentReservation = await reservationService.findById(params.data.id);
        if (!currentReservation.success) {
            return reply.status(404).send({ code: 'RESERVATION_NOT_FOUND', message: 'Reservation not found' });
        }

        if (!canManageReservation(auth.user, currentReservation.reservation.user_id)) {
            return reply.status(403).send({ code: 'FORBIDDEN', message: 'Forbidden' });
        }

        const result = await reservationService.delete(params.data.id);
        if (!result.success) {
            if (result.code === 'RESERVATION_NOT_FOUND') {
                return reply.status(404).send({ code: 'RESERVATION_NOT_FOUND', message: 'Reservation not found' });
            }
            result satisfies never;
        }

        return reply.status(204).send({});
    });
};