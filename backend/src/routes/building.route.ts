import { z } from 'zod';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import type { AuthService } from '../services/auth.service.js';
import type { BuildingService } from '../services/building.service.js';
import { BuildingDto, CreateBuildingBodyDto, UpdateBuildingBodyDto, BuildingIdParamsDto } from '../schemas/building.schema.js';
import {
    BuildingNotFoundErrorDto,
    BuildingNameExistsErrorDto,
    BuildingHasFloorsErrorDto,
    InvalidBodyErrorDto,
    InvalidParamsErrorDto,
    UnauthorizedErrorDto,
    InternalServerErrorDto,
} from '../schemas/errors.schema.js';

type Options = {
    authService: AuthService;
    buildingService: BuildingService;
};

export const buildingRoutes: FastifyPluginAsyncZodOpenApi<Options> = async (app, { authService, buildingService }) => {
    app.post('/buildings', {
        schema: {
            tags: ['Buildings'],
            body: CreateBuildingBodyDto,
            response: {
                201: BuildingDto,
                400: InvalidBodyErrorDto,
                401: UnauthorizedErrorDto,
                409: BuildingNameExistsErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const body = CreateBuildingBodyDto.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
        }

        const result = await buildingService.create(body.data.name);
        if (!result.success) {
            if (result.code === 'BUILDING_NAME_EXISTS') {
                return reply.status(409).send({ code: 'BUILDING_NAME_EXISTS', message: 'Building name already exists' });
            }
            result satisfies never;
        }

        return reply.status(201).send(result.building);
    });

    app.get('/buildings', {
        schema: {
            tags: ['Buildings'],
            response: {
                200: z.array(BuildingDto),
                500: InternalServerErrorDto,
            },
        },
    }, async (_request, reply) => {
        const buildings = await buildingService.findAll();
        return reply.status(200).send(buildings);
    });

    app.get('/buildings/:id', {
        schema: {
            tags: ['Buildings'],
            params: BuildingIdParamsDto,
            response: {
                200: BuildingDto,
                400: InvalidParamsErrorDto,
                404: BuildingNotFoundErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const params = BuildingIdParamsDto.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const result = await buildingService.findById(params.data.id);
        if (!result.success) {
            return reply.status(404).send({ code: 'BUILDING_NOT_FOUND', message: 'Building not found' });
        }

        return reply.status(200).send(result.building);
    });

    app.put('/buildings/:id', {
        schema: {
            tags: ['Buildings'],
            params: BuildingIdParamsDto,
            body: UpdateBuildingBodyDto,
            response: {
                200: BuildingDto,
                400: z.union([InvalidParamsErrorDto, InvalidBodyErrorDto]),
                401: UnauthorizedErrorDto,
                404: BuildingNotFoundErrorDto,
                409: BuildingNameExistsErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const params = BuildingIdParamsDto.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const body = UpdateBuildingBodyDto.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
        }

        const result = await buildingService.update(params.data.id, body.data.name);
        if (!result.success) {
            if (result.code === 'BUILDING_NAME_EXISTS') {
                return reply.status(409).send({ code: 'BUILDING_NAME_EXISTS', message: 'Building name already exists' });
            }
            if (result.code === 'BUILDING_NOT_FOUND') {
                return reply.status(404).send({ code: 'BUILDING_NOT_FOUND', message: 'Building not found' });
            }
            result satisfies never;
        }

        return reply.status(200).send(result.building);
    });

    app.delete('/buildings/:id', {
        schema: {
            tags: ['Buildings'],
            params: BuildingIdParamsDto,
            response: {
                204: z.object({}),
                400: InvalidParamsErrorDto,
                401: UnauthorizedErrorDto,
                404: BuildingNotFoundErrorDto,
                409: BuildingHasFloorsErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const params = BuildingIdParamsDto.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const result = await buildingService.delete(params.data.id);
        if (!result.success) {
            if (result.code === 'BUILDING_NOT_FOUND') {
                return reply.status(404).send({ code: 'BUILDING_NOT_FOUND', message: 'Building not found' });
            }
            if (result.code === 'BUILDING_HAS_FLOORS') {
                return reply.status(409).send({ code: 'BUILDING_HAS_FLOORS', message: 'Building still has floors' });
            }
            result satisfies never;
        }

        return reply.status(204).send({});
    });
};
