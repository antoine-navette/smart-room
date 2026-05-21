import { z } from 'zod';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import type { AuthService } from '../services/auth.service.js';
import type { RoomService } from '../services/room.service.js';
import { RoomDto, CreateRoomBodyDto, UpdateRoomBodyDto, RoomIdParamsDto, RoomAvailabilityQueryDto } from '../schemas/room.schema.js';
import {
    RoomNotFoundErrorDto,
    RoomNameExistsErrorDto,
    FloorNotFoundErrorDto,
    InvalidBodyErrorDto,
    InvalidParamsErrorDto,
    InvalidQueryErrorDto,
    InvalidDateRangeErrorDto,
    UnauthorizedErrorDto,
    InternalServerErrorDto,
} from '../schemas/errors.schema.js';

type Options = {
    authService: AuthService;
    roomService: RoomService;
};

export const roomRoutes: FastifyPluginAsyncZodOpenApi<Options> = async (app, { authService, roomService }) => {
    app.post('/rooms', {
        schema: {
            tags: ['Rooms'],
            body: CreateRoomBodyDto,
            response: {
                201: RoomDto,
                400: InvalidBodyErrorDto,
                401: UnauthorizedErrorDto,
                404: FloorNotFoundErrorDto,
                409: RoomNameExistsErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const body = CreateRoomBodyDto.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
        }

        const result = await roomService.create(body.data.name, body.data.floor_id, body.data.capacity);
        if (!result.success) {
            if (result.code === 'FLOOR_NOT_FOUND') {
                return reply.status(404).send({ code: 'FLOOR_NOT_FOUND', message: 'Floor not found' });
            }
            if (result.code === 'ROOM_NAME_EXISTS') {
                return reply.status(409).send({ code: 'ROOM_NAME_EXISTS', message: 'Room name already exists' });
            }
            result satisfies never;
        }

        return reply.status(201).send(result.room);
    });

    app.get('/rooms', {
        schema: {
            tags: ['Rooms'],
            response: {
                200: z.array(RoomDto),
                500: InternalServerErrorDto,
            },
        },
    }, async (_request, reply) => {
        const rooms = await roomService.findAll();
        return reply.status(200).send(rooms);
    });

    app.get('/rooms/available', {
        schema: {
            tags: ['Rooms'],
            querystring: RoomAvailabilityQueryDto,
            response: {
                200: z.array(RoomDto),
                400: z.union([InvalidQueryErrorDto, InvalidDateRangeErrorDto]),
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const query = RoomAvailabilityQueryDto.safeParse(request.query);
        if (!query.success) {
            return reply.status(400).send({ code: 'INVALID_QUERY', issues: query.error.issues });
        }

        const startTime = new Date(query.data.start);
        const endTime = new Date(query.data.end);

        if (startTime >= endTime) {
            return reply.status(400).send({ code: 'INVALID_DATE_RANGE', message: 'start must be before end' });
        }

        const rooms = await roomService.findAvailable(startTime, endTime);
        return reply.status(200).send(rooms);
    });

    app.get('/rooms/:id', {
        schema: {
            tags: ['Rooms'],
            params: RoomIdParamsDto,
            response: {
                200: RoomDto,
                400: InvalidParamsErrorDto,
                404: RoomNotFoundErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const params = RoomIdParamsDto.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const result = await roomService.findById(params.data.id);
        if (!result.success) {
            return reply.status(404).send({ code: 'ROOM_NOT_FOUND', message: 'Room not found' });
        }

        return reply.status(200).send(result.room);
    });

    app.put('/rooms/:id', {
        schema: {
            tags: ['Rooms'],
            params: RoomIdParamsDto,
            body: UpdateRoomBodyDto,
            response: {
                200: RoomDto,
                400: z.union([InvalidParamsErrorDto, InvalidBodyErrorDto]),
                401: UnauthorizedErrorDto,
                404: z.union([RoomNotFoundErrorDto, FloorNotFoundErrorDto]),
                409: RoomNameExistsErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const params = RoomIdParamsDto.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const body = UpdateRoomBodyDto.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
        }

        const result = await roomService.update(params.data.id, body.data.name, body.data.floor_id, body.data.capacity);
        if (!result.success) {
            if (result.code === 'ROOM_NAME_EXISTS') {
                return reply.status(409).send({ code: 'ROOM_NAME_EXISTS', message: 'Room name already exists' });
            }
            if (result.code === 'ROOM_NOT_FOUND') {
                return reply.status(404).send({ code: 'ROOM_NOT_FOUND', message: 'Room not found' });
            }
            if (result.code === 'FLOOR_NOT_FOUND') {
                return reply.status(404).send({ code: 'FLOOR_NOT_FOUND', message: 'Floor not found' });
            }
            result satisfies never;
        }

        return reply.status(200).send(result.room);
    });

    app.delete('/rooms/:id', {
        schema: {
            tags: ['Rooms'],
            params: RoomIdParamsDto,
            response: {
                204: z.object({}),
                400: InvalidParamsErrorDto,
                401: UnauthorizedErrorDto,
                404: RoomNotFoundErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const params = RoomIdParamsDto.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const result = await roomService.delete(params.data.id);
        if (!result.success) {
            if (result.code === 'ROOM_NOT_FOUND') {
                return reply.status(404).send({ code: 'ROOM_NOT_FOUND', message: 'Room not found' });
            }
            result satisfies never;
        }

        return reply.status(204).send({});
    });
};
