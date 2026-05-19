import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import type { AuthService } from '../services/auth.service.js';
import type { BuildingService } from '../services/building.service.js';

const buildingSchema = z.object({
	name: z.string().min(1).max(20),
});

const idSchema = z.object({
	id: z.coerce.number().int().positive(),
});

type Options = {
	authService: AuthService;
	buildingService: BuildingService;
};

export const buildingRoutes: FastifyPluginAsync<Options> = async (app, { authService, buildingService }) => {
    // Get all buildings (public)
	app.get('/buildings', async (_request, reply) => {
		const buildings = await buildingService.findAll();
		return reply.status(200).send(buildings);
	});

    // Get building by id (public)
	app.get('/buildings/:id', async (request, reply) => {
		const params = idSchema.safeParse(request.params);
		if (!params.success) {
			return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
		}

		const result = await buildingService.findById(params.data.id);
		if (!result.success) {
			return reply.status(404).send({ code: 'BUILDING_NOT_FOUND', message: 'Building not found' });
		}

		return reply.status(200).send(result.building);
	});

    // Create a new building (private)
	app.post('/buildings', async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
		if (!auth.success) {
			return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
		}

		const body = buildingSchema.safeParse(request.body);
		if (!body.success) {
			return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
		}

		const result = await buildingService.create(body.data);
		if (!result.success) {
			if (result.code === 'BUILDING_NAME_EXISTS') {
				return reply.status(409).send({ code: 'BUILDING_NAME_EXISTS', message: 'Building name already exists: ' + result.name });
			}
			result satisfies never;
		}

		return reply.status(201).send(result.building);
	});

    // Update a building (private)
	app.put('/buildings/:id', async (request, reply) => {
		const auth = await authService.authenticate(request.cookies['session_token']);
		if (!auth.success) {
			return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
		}

		const params = idSchema.safeParse(request.params);
		if (!params.success) {
			return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
		}

		const body = buildingSchema.safeParse(request.body);
		if (!body.success) {
			return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
		}

		const result = await buildingService.save({ id: params.data.id, ...body.data });
		if (!result.success) {
			if (result.code === 'BUILDING_NAME_EXISTS') {
				return reply.status(409).send({ code: 'BUILDING_NAME_EXISTS', message: 'Building name already exists: ' + result.name });
			}
			if (result.code === 'BUILDING_NOT_FOUND') {
				return reply.status(404).send({ code: 'BUILDING_NOT_FOUND', message: 'Building not found' });
			}
			result satisfies never;
		}

		return reply.status(200).send(result.building);
	});

    // Delete a building (private)
	app.delete('/buildings/:id', async (request, reply) => {
		const auth = await authService.authenticate(request.cookies['session_token']);
		if (!auth.success) {
			return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
		}

		const params = idSchema.safeParse(request.params);
		if (!params.success) {
			return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
		}

		const result = await buildingService.deleteById(params.data.id);
		if (!result.success) {
			if (result.code === 'BUILDING_NOT_FOUND') {
				return reply.status(404).send({ code: 'BUILDING_NOT_FOUND', message: 'Building not found' });
			}

			if (result.code === 'BUILDING_HAS_FLOORS') {
				return reply.status(409).send({ code: 'BUILDING_HAS_FLOORS', message: 'Building still has floors' });
			}

			result satisfies never;
		}

		return reply.status(204).send();
	});
};
