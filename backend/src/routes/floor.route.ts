import { z } from 'zod';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import type { AuthService } from '../services/auth.service.js';
import type { FloorService } from '../services/floor.service.js';
import { FloorDto, CreateFloorBodyDto, UpdateFloorBodyDto, FloorIdParamsDto } from '../schemas/floor.schema.js';
import {
    FloorNotFoundErrorDto,
    FloorNameExistsErrorDto,
    FloorHasRoomsErrorDto,
    BuildingNotFoundErrorDto,
    ForbiddenErrorDto,
    InvalidBodyErrorDto,
    InvalidParamsErrorDto,
    UnauthorizedErrorDto,
    InternalServerErrorDto,
} from '../schemas/errors.schema.js';

type Options = {
    authService: AuthService;
    floorService: FloorService;
};

export const floorRoutes: FastifyPluginAsyncZodOpenApi<Options> = async (app, { authService, floorService }) => {
    app.post('/floors', {
        schema: {
            tags: ['Floors'],
            body: CreateFloorBodyDto,
            response: {
                201: FloorDto,
                400: InvalidBodyErrorDto,
                401: UnauthorizedErrorDto,
                403: ForbiddenErrorDto,
                404: BuildingNotFoundErrorDto,
                409: FloorNameExistsErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const body = CreateFloorBodyDto.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
        }

        const result = await floorService.create(auth.user, body.data.name, body.data.building_id);
        if (!result.success) {
            if (result.code === 'FORBIDDEN') {
                return reply.status(403).send({ code: 'FORBIDDEN', message: 'You must be an admin to create a floor' });
            }
            if (result.code === 'BUILDING_NOT_FOUND') {
                return reply.status(404).send({ code: 'BUILDING_NOT_FOUND', message: 'Building not found' });
            }
            if (result.code === 'FLOOR_NAME_EXISTS') {
                return reply.status(409).send({ code: 'FLOOR_NAME_EXISTS', message: 'Floor name already exists' });
            }
            result satisfies never;
        }

        return reply.status(201).send(result.floor);
    });

    app.get('/floors', {
        schema: {
            tags: ['Floors'],
            response: {
                200: z.array(FloorDto),
                500: InternalServerErrorDto,
            },
        },
    }, async (_request, reply) => {
        const floors = await floorService.findAll();
        return reply.status(200).send(floors);
    });

    app.get('/floors/:id', {
        schema: {
            tags: ['Floors'],
            params: FloorIdParamsDto,
            response: {
                200: FloorDto,
                400: InvalidParamsErrorDto,
                404: FloorNotFoundErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const params = FloorIdParamsDto.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const result = await floorService.findById(params.data.id);
        if (!result.success) {
            return reply.status(404).send({ code: 'FLOOR_NOT_FOUND', message: 'Floor not found' });
        }

        return reply.status(200).send(result.floor);
    });

    app.put('/floors/:id', {
        schema: {
            tags: ['Floors'],
            params: FloorIdParamsDto,
            body: UpdateFloorBodyDto,
            response: {
                200: FloorDto,
                400: z.union([InvalidParamsErrorDto, InvalidBodyErrorDto]),
                401: UnauthorizedErrorDto,
                403: ForbiddenErrorDto,
                404: z.union([FloorNotFoundErrorDto, BuildingNotFoundErrorDto]),
                409: FloorNameExistsErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const params = FloorIdParamsDto.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const body = UpdateFloorBodyDto.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
        }

        const result = await floorService.update(auth.user, params.data.id, body.data.name, body.data.building_id);
        if (!result.success) {
            if (result.code === 'FORBIDDEN') {
                return reply.status(403).send({ code: 'FORBIDDEN', message: 'You must be an admin to edit a floor' });
            }
            if (result.code === 'FLOOR_NOT_FOUND') {
                return reply.status(404).send({ code: 'FLOOR_NOT_FOUND', message: 'Floor not found' });
            }
            if (result.code === 'FLOOR_NAME_EXISTS') {
                return reply.status(409).send({ code: 'FLOOR_NAME_EXISTS', message: 'Floor name already exists' });
            }
            if (result.code === 'BUILDING_NOT_FOUND') {
                return reply.status(404).send({ code: 'BUILDING_NOT_FOUND', message: 'Building not found' });
            }
            result satisfies never;
        }

        return reply.status(200).send(result.floor);
    });

    app.delete('/floors/:id', {
        schema: {
            tags: ['Floors'],
            params: FloorIdParamsDto,
            response: {
                204: z.object({}),
                400: InvalidParamsErrorDto,
                401: UnauthorizedErrorDto,
                403: ForbiddenErrorDto,
                404: FloorNotFoundErrorDto,
                409: FloorHasRoomsErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const params = FloorIdParamsDto.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const result = await floorService.delete(auth.user, params.data.id);
        if (!result.success) {
            if (result.code === 'FORBIDDEN') {
                return reply.status(403).send({ code: 'FORBIDDEN', message: 'You must be an admin to delete a floor' });
            }
            if (result.code === 'FLOOR_HAS_ROOMS') {
                return reply.status(409).send({ code: 'FLOOR_HAS_ROOMS', message: 'Floor still has rooms' });
            }
            if (result.code === 'FLOOR_NOT_FOUND') {
                return reply.status(404).send({ code: 'FLOOR_NOT_FOUND', message: 'Floor not found' });
            }
            result satisfies never;
        }

        return reply.status(204).send({});
    });
};
