import { z } from 'zod';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import type { AuthService } from '../services/auth.service.js';
import type { RoomResourceAssignmentService } from '../services/room-resource-assignment.service.js';
import {
    RoomResourceAssignmentDto,
    SetRoomResourceQuantityBodyDto,
    RoomResourceAssignmentParamsDto,
} from '../schemas/room-resource-assignment.schema.js';
import {
    ForbiddenErrorDto,
    InternalServerErrorDto,
    InvalidBodyErrorDto,
    InvalidParamsErrorDto,
    RoomNotFoundErrorDto,
    RoomResourceAssignmentNotFoundErrorDto,
    RoomResourceNotFoundErrorDto,
    UnauthorizedErrorDto,
} from '../schemas/errors.schema.js';

type Options = {
    authService: AuthService;
    roomResourceAssignmentService: RoomResourceAssignmentService;
};

export const roomResourceAssignmentRoutes: FastifyPluginAsyncZodOpenApi<Options> = async (
    app,
    { authService, roomResourceAssignmentService },
) => {
    app.get(
        '/rooms/:roomId/resources',
        {
            schema: {
                tags: ['Rooms'],
                params: z.object({ roomId: z.coerce.number().int().positive() }),
                response: {
                    200: z.array(RoomResourceAssignmentDto),
                    400: InvalidParamsErrorDto,
                    404: RoomNotFoundErrorDto,
                    500: InternalServerErrorDto,
                },
            },
        },
        async (request, reply) => {
            const params = z.object({ roomId: z.coerce.number().int().positive() }).safeParse(request.params);
            if (!params.success) {
                return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
            }

            const result = await roomResourceAssignmentService.findByRoomId(params.data.roomId);
            if (!result.success) {
                return reply.status(404).send({ code: 'ROOM_NOT_FOUND', message: 'Room not found' });
            }

            return reply.status(200).send(result.resources);
        },
    );

    app.put(
        '/rooms/:roomId/resources/:resourceId',
        {
            schema: {
                tags: ['Rooms'],
                params: RoomResourceAssignmentParamsDto,
                body: SetRoomResourceQuantityBodyDto,
                response: {
                    200: RoomResourceAssignmentDto,
                    400: z.union([InvalidParamsErrorDto, InvalidBodyErrorDto]),
                    401: UnauthorizedErrorDto,
                    403: ForbiddenErrorDto,
                    404: z.union([RoomNotFoundErrorDto, RoomResourceNotFoundErrorDto]),
                    500: InternalServerErrorDto,
                },
            },
        },
        async (request, reply) => {
            const auth = await authService.authenticate(request.cookies['session_token']);
            if (!auth.success) {
                return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
            }

            const params = RoomResourceAssignmentParamsDto.safeParse(request.params);
            if (!params.success) {
                return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
            }

            const body = SetRoomResourceQuantityBodyDto.safeParse(request.body);
            if (!body.success) {
                return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
            }

            const result = await roomResourceAssignmentService.setQuantity(
                auth.user,
                params.data.roomId,
                params.data.resourceId,
                body.data.quantity,
            );
            if (!result.success) {
                if (result.code === 'FORBIDDEN') {
                    return reply
                        .status(403)
                        .send({ code: 'FORBIDDEN', message: 'You must be an admin to update room resources' });
                }
                if (result.code === 'ROOM_NOT_FOUND') {
                    return reply.status(404).send({ code: 'ROOM_NOT_FOUND', message: 'Room not found' });
                }
                if (result.code === 'ROOM_RESOURCE_NOT_FOUND') {
                    return reply
                        .status(404)
                        .send({ code: 'ROOM_RESOURCE_NOT_FOUND', message: 'Room resource not found' });
                }
                result satisfies never;
            }

            return reply.status(200).send(result.assignment);
        },
    );

    app.delete(
        '/rooms/:roomId/resources/:resourceId',
        {
            schema: {
                tags: ['Rooms'],
                params: RoomResourceAssignmentParamsDto,
                response: {
                    204: z.object({}),
                    400: InvalidParamsErrorDto,
                    401: UnauthorizedErrorDto,
                    403: ForbiddenErrorDto,
                    404: z.union([
                        RoomNotFoundErrorDto,
                        RoomResourceNotFoundErrorDto,
                        RoomResourceAssignmentNotFoundErrorDto,
                    ]),
                    500: InternalServerErrorDto,
                },
            },
        },
        async (request, reply) => {
            const auth = await authService.authenticate(request.cookies['session_token']);
            if (!auth.success) {
                return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
            }

            const params = RoomResourceAssignmentParamsDto.safeParse(request.params);
            if (!params.success) {
                return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
            }

            const result = await roomResourceAssignmentService.delete(
                auth.user,
                params.data.roomId,
                params.data.resourceId,
            );
            if (!result.success) {
                if (result.code === 'FORBIDDEN') {
                    return reply
                        .status(403)
                        .send({ code: 'FORBIDDEN', message: 'You must be an admin to delete room resources' });
                }
                if (result.code === 'ROOM_NOT_FOUND') {
                    return reply.status(404).send({ code: 'ROOM_NOT_FOUND', message: 'Room not found' });
                }
                if (result.code === 'ROOM_RESOURCE_NOT_FOUND') {
                    return reply
                        .status(404)
                        .send({ code: 'ROOM_RESOURCE_NOT_FOUND', message: 'Room resource not found' });
                }
                if (result.code === 'ROOM_RESOURCE_ASSIGNMENT_NOT_FOUND') {
                    return reply
                        .status(404)
                        .send({
                            code: 'ROOM_RESOURCE_ASSIGNMENT_NOT_FOUND',
                            message: 'Room resource assignment not found',
                        });
                }
                result satisfies never;
            }

            return reply.status(204).send({});
        },
    );
};
