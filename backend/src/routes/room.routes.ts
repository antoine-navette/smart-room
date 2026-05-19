import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import type { AuthService } from '../services/auth.service.js';
import type { RoomService } from '../services/room.service.js';

const roomSchema = z.object({
    name: z.string().min(1).max(20),
    floor_id: z.coerce.number().int().positive(),
    capacity: z.coerce.number().int().positive(),
});

const idSchema = z.object({
    id: z.coerce.number().int().positive(),
});

type Options = {
    authService: AuthService;
    roomService: RoomService;
};

export const roomRoutes: FastifyPluginAsync<Options> = async (app, { authService, roomService }) => {
    // Get all rooms (public)
    app.get('/rooms', async (_request, reply) => {
        const rooms = await roomService.findAll();
        return reply.status(200).send(rooms);
    });

    // Get room by id (public)
    app.get('/rooms/:id', async (request, reply) => {
        const params = idSchema.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const result = await roomService.findById(params.data.id);
        if (!result.success) {
            return reply.status(404).send({ code: 'ROOM_NOT_FOUND', message: 'Room not found' });
        }

        return reply.status(200).send(result.room);
    });

    // Create a new room (private)
    app.post('/rooms', async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const body = roomSchema.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
        }

        const result = await roomService.create(body.data);
        if (!result.success) {
            const code = result.code;
            if (code === 'FLOOR_NOT_FOUND') {
                return reply.status(404).send({ code: 'FLOOR_NOT_FOUND', message: 'Floor not found' });
            }
            if (code === 'ROOM_NAME_EXISTS') {
                return reply.status(409).send({ code: 'ROOM_NAME_EXISTS', message: 'Room name already exists: ' + result.name });
            }
            result satisfies never;
        }

        return reply.status(201).send(result.room);
    });

    // Update a room (private)
    app.put('/rooms/:id', async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const params = idSchema.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const body = roomSchema.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });
        }

        const result = await roomService.save({ id: params.data.id, ...body.data });
        if (!result.success) {
            if (result.code === 'ROOM_NAME_EXISTS') {
                return reply.status(409).send({ code: 'ROOM_NAME_EXISTS', message: 'Room name already exists: ' + result.name });
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

    // Delete a room (private)
    app.delete('/rooms/:id', async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) {
            return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        }

        const params = idSchema.safeParse(request.params);
        if (!params.success) {
            return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
        }

        const result = await roomService.deleteById(params.data.id);
        if (!result.success) {
            if (result.code === 'ROOM_HAS_RESERVATIONS') {
                return reply.status(409).send({ code: 'ROOM_HAS_RESERVATIONS', message: 'Room still has reservations' });
            }
            if (result.code === 'ROOM_NOT_FOUND') {
                return reply.status(404).send({ code: 'ROOM_NOT_FOUND', message: 'Room not found' });
            }
            result satisfies never;
        }

        return reply.status(204).send();
    });
};
