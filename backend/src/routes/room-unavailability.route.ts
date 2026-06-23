import { z } from 'zod';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import type { AuthService } from '../services/auth.service.js';
import type { RoomUnavailabilityService } from '../services/room-unavailability.service.js';
import {
    CreateRoomUnavailabilityBodyDto,
    RoomUnavailabilityDto,
    RoomUnavailabilityIdParamsDto,
    RoomUnavailabilityRoomIdParamsDto,
    UpdateRoomUnavailabilityBodyDto,
} from '../schemas/room-unavailability.schema.js';
import {
    ForbiddenErrorDto,
    InvalidBodyErrorDto,
    InvalidDateRangeErrorDto,
    InvalidParamsErrorDto,
    InternalServerErrorDto,
    RoomNotFoundErrorDto,
    RoomUnavailabilityConflictErrorDto,
    RoomUnavailabilityNotFoundErrorDto,
    UnauthorizedErrorDto,
} from '../schemas/errors.schema.js';

type Options = {
    authService: AuthService;
    roomUnavailabilityService: RoomUnavailabilityService;
};

export const roomUnavailabilityRoutes: FastifyPluginAsyncZodOpenApi<Options> = async (
    app,
    { authService, roomUnavailabilityService },
) => {
    app.post(
        '/room-unavailabilities',
        {
            schema: {
                tags: ['RoomUnavailabilities'],
                body: CreateRoomUnavailabilityBodyDto,
                response: {
                    201: RoomUnavailabilityDto,
                    400: z.union([InvalidBodyErrorDto, InvalidDateRangeErrorDto]),
                    401: UnauthorizedErrorDto,
                    403: ForbiddenErrorDto,
                    404: RoomNotFoundErrorDto,
                    409: RoomUnavailabilityConflictErrorDto,
                    500: InternalServerErrorDto,
                },
            },
        },
        async (request, reply) => {
            const auth = await authService.authenticate(request.cookies['session_token']);
            if (!auth.success) return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });

            const body = CreateRoomUnavailabilityBodyDto.safeParse(request.body);
            if (!body.success) return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });

            const result = await roomUnavailabilityService.create(
                auth.user,
                body.data.room_id,
                body.data.from_time,
                body.data.to_time,
                body.data.reason,
            );
            if (!result.success) {
                if (result.code === 'FORBIDDEN')
                    return reply
                        .status(403)
                        .send({ code: 'FORBIDDEN', message: 'You must be an admin to create a room unavailability' });
                if (result.code === 'ROOM_NOT_FOUND')
                    return reply.status(404).send({ code: 'ROOM_NOT_FOUND', message: 'Room not found' });
                if (result.code === 'INVALID_DATE_RANGE')
                    return reply
                        .status(400)
                        .send({ code: 'INVALID_DATE_RANGE', message: 'from_time must be before to_time' });
                if (result.code === 'ROOM_UNAVAILABILITY_CONFLICT')
                    return reply.status(409).send({
                        code: 'ROOM_UNAVAILABILITY_CONFLICT',
                        message: 'Room unavailability overlaps with an existing one',
                    });
                result satisfies never;
            }

            return reply.status(201).send(result.roomUnavailability);
        },
    );

    app.get(
        '/room-unavailabilities',
        {
            schema: {
                tags: ['RoomUnavailabilities'],
                response: {
                    200: z.array(RoomUnavailabilityDto),
                    500: InternalServerErrorDto,
                },
            },
        },
        async (_request, reply) => {
            const roomUnavailabilities = await roomUnavailabilityService.findAll();
            return reply.status(200).send(roomUnavailabilities);
        },
    );

    app.get(
        '/room-unavailabilities/:id',
        {
            schema: {
                tags: ['RoomUnavailabilities'],
                params: RoomUnavailabilityIdParamsDto,
                response: {
                    200: RoomUnavailabilityDto,
                    400: InvalidParamsErrorDto,
                    404: RoomUnavailabilityNotFoundErrorDto,
                    500: InternalServerErrorDto,
                },
            },
        },
        async (request, reply) => {
            const params = RoomUnavailabilityIdParamsDto.safeParse(request.params);
            if (!params.success) return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });

            const result = await roomUnavailabilityService.findById(params.data.id);
            if (!result.success)
                return reply
                    .status(404)
                    .send({ code: 'ROOM_UNAVAILABILITY_NOT_FOUND', message: 'Room unavailability not found' });

            return reply.status(200).send(result.roomUnavailability);
        },
    );

    app.get(
        '/rooms/:roomId/unavailabilities',
        {
            schema: {
                tags: ['RoomUnavailabilities'],
                params: RoomUnavailabilityRoomIdParamsDto,
                response: {
                    200: z.array(RoomUnavailabilityDto),
                    400: InvalidParamsErrorDto,
                    404: RoomNotFoundErrorDto,
                    500: InternalServerErrorDto,
                },
            },
        },
        async (request, reply) => {
            const params = RoomUnavailabilityRoomIdParamsDto.safeParse(request.params);
            if (!params.success) return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });

            const result = await roomUnavailabilityService.findByRoomId(params.data.roomId);
            if (!result.success) return reply.status(404).send({ code: 'ROOM_NOT_FOUND', message: 'Room not found' });

            return reply.status(200).send(result.roomUnavailabilities);
        },
    );

    app.put(
        '/room-unavailabilities/:id',
        {
            schema: {
                tags: ['RoomUnavailabilities'],
                params: RoomUnavailabilityIdParamsDto,
                body: UpdateRoomUnavailabilityBodyDto,
                response: {
                    200: RoomUnavailabilityDto,
                    400: z.union([InvalidParamsErrorDto, InvalidBodyErrorDto, InvalidDateRangeErrorDto]),
                    401: UnauthorizedErrorDto,
                    403: ForbiddenErrorDto,
                    404: z.union([RoomNotFoundErrorDto, RoomUnavailabilityNotFoundErrorDto]),
                    409: RoomUnavailabilityConflictErrorDto,
                    500: InternalServerErrorDto,
                },
            },
        },
        async (request, reply) => {
            const auth = await authService.authenticate(request.cookies['session_token']);
            if (!auth.success) return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });

            const params = RoomUnavailabilityIdParamsDto.safeParse(request.params);
            if (!params.success) return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });

            const body = UpdateRoomUnavailabilityBodyDto.safeParse(request.body);
            if (!body.success) return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });

            const result = await roomUnavailabilityService.update(
                auth.user,
                params.data.id,
                body.data.room_id,
                body.data.from_time,
                body.data.to_time,
                body.data.reason,
            );
            if (!result.success) {
                if (result.code === 'FORBIDDEN')
                    return reply
                        .status(403)
                        .send({ code: 'FORBIDDEN', message: 'You must be an admin to update a room unavailability' });
                if (result.code === 'ROOM_NOT_FOUND')
                    return reply.status(404).send({ code: 'ROOM_NOT_FOUND', message: 'Room not found' });
                if (result.code === 'ROOM_UNAVAILABILITY_NOT_FOUND')
                    return reply
                        .status(404)
                        .send({ code: 'ROOM_UNAVAILABILITY_NOT_FOUND', message: 'Room unavailability not found' });
                if (result.code === 'INVALID_DATE_RANGE')
                    return reply
                        .status(400)
                        .send({ code: 'INVALID_DATE_RANGE', message: 'from_time must be before to_time' });
                if (result.code === 'ROOM_UNAVAILABILITY_CONFLICT')
                    return reply.status(409).send({
                        code: 'ROOM_UNAVAILABILITY_CONFLICT',
                        message: 'Room unavailability overlaps with an existing one',
                    });
                result satisfies never;
            }

            return reply.status(200).send(result.roomUnavailability);
        },
    );

    app.delete(
        '/room-unavailabilities/:id',
        {
            schema: {
                tags: ['RoomUnavailabilities'],
                params: RoomUnavailabilityIdParamsDto,
                response: {
                    204: z.object({}),
                    400: InvalidParamsErrorDto,
                    401: UnauthorizedErrorDto,
                    403: ForbiddenErrorDto,
                    404: RoomUnavailabilityNotFoundErrorDto,
                    500: InternalServerErrorDto,
                },
            },
        },
        async (request, reply) => {
            const auth = await authService.authenticate(request.cookies['session_token']);
            if (!auth.success) return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });

            const params = RoomUnavailabilityIdParamsDto.safeParse(request.params);
            if (!params.success) return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });

            const result = await roomUnavailabilityService.delete(auth.user, params.data.id);
            if (!result.success) {
                if (result.code === 'FORBIDDEN')
                    return reply
                        .status(403)
                        .send({ code: 'FORBIDDEN', message: 'You must be an admin to delete a room unavailability' });
                if (result.code === 'ROOM_UNAVAILABILITY_NOT_FOUND')
                    return reply
                        .status(404)
                        .send({ code: 'ROOM_UNAVAILABILITY_NOT_FOUND', message: 'Room unavailability not found' });
                result satisfies never;
            }

            return reply.status(204).send({});
        },
    );
};
