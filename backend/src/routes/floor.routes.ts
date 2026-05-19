import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import type { AuthService } from '../services/auth.service.js';
import type { FloorService } from '../services/floor.service.js';

const floorSchema = z.object({
    name: z.string().min(1).max(20),
    building_id: z.coerce.number().int().positive(),
});

const idSchema = z.object({
    id: z.coerce.number().int().positive(),
});

type Options = {
    authService: AuthService;
    floorService: FloorService;
};

export const floorRoutes: FastifyPluginAsync<Options> = async (app, { authService, floorService }) => {
    // Get all floors (public)
    app.get('/floors', async (_request, reply) => {
        const floors = await floorService.findAll();
        return reply.status(200).send(floors);
    });

    // Get floor by id (public)
    app.get('/floors/:id', async (request, reply) => {
        const params = idSchema.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const result = await floorService.findById(params.data.id);
        if (!result.success) {
            return reply.status(404).send({ code: 'FLOOR_NOT_FOUND', message: 'Floor not found' });
        }

        return reply.status(200).send(result.floor);
    });

    // Create a new floor (private)
    app.post('/floors', async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
		if (!auth.success) {
			return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
		}

        const body = floorSchema.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
        }

        const result = await floorService.create(body.data);
        if (!result.success) {
            if (result.code === 'BUILDING_NOT_FOUND') {
                return reply.status(404).send({ code: 'BUILDING_NOT_FOUND', message: 'Building not found' });
            }
            if (result.code === 'FLOOR_NAME_EXISTS') {
                return reply.status(409).send({ code: 'FLOOR_NAME_EXISTS', message: 'Floor name already exists: ' + result.name });
            }
            result satisfies never;
        }

        return reply.status(201).send(result.floor);
    });

    // Update a floor (private)
    app.put('/floors/:id', async (request, reply) => {
		const auth = await authService.authenticate(request.cookies['session_token']);
		if (!auth.success) {
			return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
		}

        const params = idSchema.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const body = floorSchema.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
        }

        const result = await floorService.save({ id: params.data.id, ...body.data });
        if (!result.success) {
            if (result.code === 'FLOOR_NOT_FOUND') {
                return reply.status(404).send({ code: 'FLOOR_NOT_FOUND', message: 'Floor not found' });
            }
            if (result.code === 'FLOOR_NAME_EXISTS') {
                return reply.status(409).send({ code: 'FLOOR_NAME_EXISTS', message: 'Floor name already exists: ' + result.name });
            }
            if (result.code === 'BUILDING_NOT_FOUND') {
                return reply.status(404).send({ code: 'BUILDING_NOT_FOUND', message: 'Building not found' });
            }
            result satisfies never;
        }

        return reply.status(200).send(result.floor);
    });

    // Delete a floor (private)
    app.delete('/floors/:id', async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const params = idSchema.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const result = await floorService.deleteById(params.data.id);
        if (!result.success) {
            if (result.code === 'FLOOR_HAS_ROOMS') {
                return reply.status(409).send({ code: 'FLOOR_HAS_ROOMS', message: 'Floor still has rooms' });
            }
            if (result.code === 'FLOOR_NOT_FOUND') {
                return reply.status(404).send({ code: 'FLOOR_NOT_FOUND', message: 'Floor not found' });
            }
            result satisfies never;
        }

        return reply.status(204).send();
    });
};
