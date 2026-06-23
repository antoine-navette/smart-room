import { z } from 'zod';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import type { AuthService } from '../services/auth.service.js';
import type { RoomResourceService } from '../services/room-resource.service.js';
import {
    RoomResourceDto,
    CreateRoomResourceBodyDto,
    UpdateRoomResourceBodyDto,
    RoomResourceIdParamsDto,
} from '../schemas/room-resource.schema.js';
import {
    ForbiddenErrorDto,
    InvalidBodyErrorDto,
    InvalidParamsErrorDto,
    InternalServerErrorDto,
    RoomResourceNameExistsErrorDto,
    RoomResourceNotFoundErrorDto,
    UnauthorizedErrorDto,
} from '../schemas/errors.schema.js';

type Options = {
    authService: AuthService;
    roomResourceService: RoomResourceService;
};

export const roomResourceRoutes: FastifyPluginAsyncZodOpenApi<Options> = async (
    app,
    { authService, roomResourceService },
) => {
    app.post(
        '/room-resources',
        {
            schema: {
                tags: ['RoomResources'],
                body: CreateRoomResourceBodyDto,
                response: {
                    201: RoomResourceDto,
                    400: InvalidBodyErrorDto,
                    401: UnauthorizedErrorDto,
                    403: ForbiddenErrorDto,
                    409: RoomResourceNameExistsErrorDto,
                    500: InternalServerErrorDto,
                },
            },
        },
        async (request, reply) => {
            const auth = await authService.authenticate(request.cookies['session_token']);
            if (!auth.success) {
                return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
            }

            const body = CreateRoomResourceBodyDto.safeParse(request.body);
            if (!body.success) {
                return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
            }

            const result = await roomResourceService.create(auth.user, body.data.name);
            if (!result.success) {
                if (result.code === 'FORBIDDEN') {
                    return reply
                        .status(403)
                        .send({ code: 'FORBIDDEN', message: 'You must be an admin to create a room resource' });
                }
                if (result.code === 'ROOM_RESOURCE_NAME_EXISTS') {
                    return reply
                        .status(409)
                        .send({ code: 'ROOM_RESOURCE_NAME_EXISTS', message: 'Room resource name already exists' });
                }
                result satisfies never;
            }

            return reply.status(201).send(result.roomResource);
        },
    );

    app.get(
        '/room-resources',
        {
            schema: {
                tags: ['RoomResources'],
                response: {
                    200: z.array(RoomResourceDto),
                    500: InternalServerErrorDto,
                },
            },
        },
        async (_request, reply) => {
            const roomResources = await roomResourceService.findAll();
            return reply.status(200).send(roomResources);
        },
    );

    app.get(
        '/room-resources/:id',
        {
            schema: {
                tags: ['RoomResources'],
                params: RoomResourceIdParamsDto,
                response: {
                    200: RoomResourceDto,
                    400: InvalidParamsErrorDto,
                    404: RoomResourceNotFoundErrorDto,
                    500: InternalServerErrorDto,
                },
            },
        },
        async (request, reply) => {
            const params = RoomResourceIdParamsDto.safeParse(request.params);
            if (!params.success) {
                return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
            }

            const result = await roomResourceService.findById(params.data.id);
            if (!result.success) {
                return reply.status(404).send({ code: 'ROOM_RESOURCE_NOT_FOUND', message: 'Room resource not found' });
            }

            return reply.status(200).send(result.roomResource);
        },
    );

    app.put(
        '/room-resources/:id',
        {
            schema: {
                tags: ['RoomResources'],
                params: RoomResourceIdParamsDto,
                body: UpdateRoomResourceBodyDto,
                response: {
                    200: RoomResourceDto,
                    400: z.union([InvalidParamsErrorDto, InvalidBodyErrorDto]),
                    401: UnauthorizedErrorDto,
                    403: ForbiddenErrorDto,
                    404: RoomResourceNotFoundErrorDto,
                    409: RoomResourceNameExistsErrorDto,
                    500: InternalServerErrorDto,
                },
            },
        },
        async (request, reply) => {
            const auth = await authService.authenticate(request.cookies['session_token']);
            if (!auth.success) {
                return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
            }

            const params = RoomResourceIdParamsDto.safeParse(request.params);
            if (!params.success) {
                return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
            }

            const body = UpdateRoomResourceBodyDto.safeParse(request.body);
            if (!body.success) {
                return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
            }

            const result = await roomResourceService.update(auth.user, params.data.id, body.data.name);
            if (!result.success) {
                if (result.code === 'FORBIDDEN') {
                    return reply
                        .status(403)
                        .send({ code: 'FORBIDDEN', message: 'You must be an admin to edit a room resource' });
                }
                if (result.code === 'ROOM_RESOURCE_NAME_EXISTS') {
                    return reply
                        .status(409)
                        .send({ code: 'ROOM_RESOURCE_NAME_EXISTS', message: 'Room resource name already exists' });
                }
                if (result.code === 'ROOM_RESOURCE_NOT_FOUND') {
                    return reply
                        .status(404)
                        .send({ code: 'ROOM_RESOURCE_NOT_FOUND', message: 'Room resource not found' });
                }
                result satisfies never;
            }

            return reply.status(200).send(result.roomResource);
        },
    );

    app.delete(
        '/room-resources/:id',
        {
            schema: {
                tags: ['RoomResources'],
                params: RoomResourceIdParamsDto,
                response: {
                    204: z.object({}),
                    400: InvalidParamsErrorDto,
                    401: UnauthorizedErrorDto,
                    403: ForbiddenErrorDto,
                    404: RoomResourceNotFoundErrorDto,
                    500: InternalServerErrorDto,
                },
            },
        },
        async (request, reply) => {
            const auth = await authService.authenticate(request.cookies['session_token']);
            if (!auth.success) {
                return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
            }

            const params = RoomResourceIdParamsDto.safeParse(request.params);
            if (!params.success) {
                return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
            }

            const result = await roomResourceService.delete(auth.user, params.data.id);
            if (!result.success) {
                if (result.code === 'FORBIDDEN') {
                    return reply
                        .status(403)
                        .send({ code: 'FORBIDDEN', message: 'You must be an admin to delete a room resource' });
                }
                if (result.code === 'ROOM_RESOURCE_NOT_FOUND') {
                    return reply
                        .status(404)
                        .send({ code: 'ROOM_RESOURCE_NOT_FOUND', message: 'Room resource not found' });
                }
                result satisfies never;
            }

            return reply.status(204).send({});
        },
    );
};
