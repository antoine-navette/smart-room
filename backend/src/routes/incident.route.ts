import { z } from 'zod';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import type { AuthService } from '../services/auth.service.js';
import type { IncidentService } from '../services/incident.service.js';
import {
    IncidentDto,
    CreateIncidentBodyDto,
    UpdateIncidentBodyDto,
    IncidentIdParamsDto,
    IncidentRoomIdParamsDto,
} from '../schemas/incident.schema.js';
import {
    ForbiddenErrorDto,
    InvalidBodyErrorDto,
    InvalidParamsErrorDto,
    InternalServerErrorDto,
    IncidentNotFoundErrorDto,
    IncidentAlreadyResolvedErrorDto,
    IncidentInvalidTransitionErrorDto,
    RoomNotFoundErrorDto,
    UnauthorizedErrorDto,
} from '../schemas/errors.schema.js';

type Options = {
    authService: AuthService;
    incidentService: IncidentService;
};

export const incidentRoutes: FastifyPluginAsyncZodOpenApi<Options> = async (app, { authService, incidentService }) => {
    app.post('/incidents', {
        schema: {
            tags: ['Incidents'],
            body: CreateIncidentBodyDto,
            response: {
                201: IncidentDto,
                400: InvalidBodyErrorDto,
                401: UnauthorizedErrorDto,
                404: RoomNotFoundErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });

        const body = CreateIncidentBodyDto.safeParse(request.body);
        if (!body.success) return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });

        const result = await incidentService.create(auth.user, body.data.room_id ?? null, body.data.title, body.data.description);
        if (!result.success) {
            if (result.code === 'ROOM_NOT_FOUND') return reply.status(404).send({ code: 'ROOM_NOT_FOUND', message: 'Room not found' });
            result satisfies never;
        }

        return reply.status(201).send(result.incident);
    });

    app.get('/incidents', {
        schema: {
            tags: ['Incidents'],
            response: {
                200: z.array(IncidentDto),
                500: InternalServerErrorDto,
            },
        },
    }, async (_request, reply) => {
        const incidents = await incidentService.findAll();
        return reply.status(200).send(incidents);
    });

    app.get('/incidents/:id', {
        schema: {
            tags: ['Incidents'],
            params: IncidentIdParamsDto,
            response: {
                200: IncidentDto,
                400: InvalidParamsErrorDto,
                404: IncidentNotFoundErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const params = IncidentIdParamsDto.safeParse(request.params);
        if (!params.success) return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });

        const result = await incidentService.findById(params.data.id);
        if (!result.success) return reply.status(404).send({ code: 'INCIDENT_NOT_FOUND', message: 'Incident not found' });

        return reply.status(200).send(result.incident);
    });

    app.get('/rooms/:roomId/incidents', {
        schema: {
            tags: ['Incidents'],
            params: IncidentRoomIdParamsDto,
            response: {
                200: z.array(IncidentDto),
                400: InvalidParamsErrorDto,
                404: RoomNotFoundErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const params = IncidentRoomIdParamsDto.safeParse(request.params);
        if (!params.success) return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });

        const result = await incidentService.findByRoomId(params.data.roomId);
        if (!result.success) return reply.status(404).send({ code: 'ROOM_NOT_FOUND', message: 'Room not found' });

        return reply.status(200).send(result.incidents);
    });

    app.put('/incidents/:id', {
        schema: {
            tags: ['Incidents'],
            params: IncidentIdParamsDto,
            body: UpdateIncidentBodyDto,
            response: {
                200: IncidentDto,
                400: z.union([InvalidParamsErrorDto, InvalidBodyErrorDto]),
                401: UnauthorizedErrorDto,
                403: ForbiddenErrorDto,
                404: IncidentNotFoundErrorDto,
                409: z.union([IncidentAlreadyResolvedErrorDto, IncidentInvalidTransitionErrorDto]),
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });

        const params = IncidentIdParamsDto.safeParse(request.params);
        if (!params.success) return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });

        const body = UpdateIncidentBodyDto.safeParse(request.body);
        if (!body.success) return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });

        const result = await incidentService.update(auth.user, params.data.id, body.data.title, body.data.description, body.data.status as any);
        if (!result.success) {
            if (result.code === 'FORBIDDEN') return reply.status(403).send({ code: 'FORBIDDEN', message: 'You must be an admin to update an incident' });
            if (result.code === 'INCIDENT_NOT_FOUND') return reply.status(404).send({ code: 'INCIDENT_NOT_FOUND', message: 'Incident not found' });
            if (result.code === 'INCIDENT_ALREADY_RESOLVED') return reply.status(409).send({ code: 'INCIDENT_ALREADY_RESOLVED', message: 'Resolved incidents cannot be updated' });
            if (result.code === 'INCIDENT_INVALID_TRANSITION') return reply.status(409).send({ code: 'INCIDENT_INVALID_TRANSITION', message: 'An incident in progress cannot be set back to OPEN' });
            result satisfies never;
        }

        return reply.status(200).send(result.incident);
    });

    app.delete('/incidents/:id', {
        schema: {
            tags: ['Incidents'],
            params: IncidentIdParamsDto,
            response: {
                204: z.object({}),
                400: InvalidParamsErrorDto,
                401: UnauthorizedErrorDto,
                403: ForbiddenErrorDto,
                404: IncidentNotFoundErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });

        const params = IncidentIdParamsDto.safeParse(request.params);
        if (!params.success) return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });

        const result = await incidentService.delete(auth.user, params.data.id);
        if (!result.success) {
            if (result.code === 'FORBIDDEN') return reply.status(403).send({ code: 'FORBIDDEN', message: 'You must be an admin to delete an incident' });
            if (result.code === 'INCIDENT_NOT_FOUND') return reply.status(404).send({ code: 'INCIDENT_NOT_FOUND', message: 'Incident not found' });
            result satisfies never;
        }

        return reply.status(204).send({});
    });
};
