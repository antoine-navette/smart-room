import { z } from 'zod';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import type { AuthService } from '../services/auth.service.js';
import type { FavoriteService } from '../services/favorite.service.js';
import { FavoriteDto, CreateFavoriteBodyDto, FavoriteUserIdParamsDto, FavoriteUserRoomParamsDto } from '../schemas/favorite.schema.js';
import {
    ForbiddenErrorDto,
    InvalidBodyErrorDto,
    InvalidParamsErrorDto,
    InternalServerErrorDto,
    RoomNotFoundErrorDto,
    FavoriteNotFoundErrorDto,
    FavoriteAlreadyExistsErrorDto,
    UnauthorizedErrorDto,
} from '../schemas/errors.schema.js';

type Options = { authService: AuthService; favoriteService: FavoriteService };

export const favoriteRoutes: FastifyPluginAsyncZodOpenApi<Options> = async (app, { authService, favoriteService }) => {
    app.post('/favorites', {
        schema: {
            tags: ['Favorites'],
            body: CreateFavoriteBodyDto,
            response: {
                201: FavoriteDto,
                400: InvalidBodyErrorDto,
                401: UnauthorizedErrorDto,
                404: RoomNotFoundErrorDto,
                409: FavoriteAlreadyExistsErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });

        const body = CreateFavoriteBodyDto.safeParse(request.body);
        if (!body.success) return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });

        const result = await favoriteService.create(auth.user, body.data.room_id);
        if (!result.success) {
            if (result.code === 'ROOM_NOT_FOUND') return reply.status(404).send({ code: 'ROOM_NOT_FOUND', message: 'Room not found' });
            if (result.code === 'FAVORITE_ALREADY_EXISTS') return reply.status(409).send({ code: 'FAVORITE_ALREADY_EXISTS', message: 'Favorite already exists' });
            result satisfies never;
        }

        return reply.status(201).send(result.favorite);
    });

    app.get('/users/:userId/favorites', {
        schema: {
            tags: ['Favorites'],
            params: FavoriteUserIdParamsDto,
            response: {
                200: z.array(FavoriteDto),
                400: InvalidParamsErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const params = FavoriteUserIdParamsDto.safeParse(request.params);
        if (!params.success) return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });

        const favorites = await favoriteService.findByUserId(params.data.userId);
        return reply.status(200).send(favorites);
    });

    app.delete('/users/:userId/favorites/:roomId', {
        schema: {
            tags: ['Favorites'],
            params: FavoriteUserRoomParamsDto,
            response: {
                204: z.object({}),
                400: InvalidParamsErrorDto,
                401: UnauthorizedErrorDto,
                403: ForbiddenErrorDto,
                404: FavoriteNotFoundErrorDto,
                500: InternalServerErrorDto,
            },
        },
    }, async (request, reply) => {
        const auth = await authService.authenticate(request.cookies['session_token']);
        if (!auth.success) return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });

        const params = FavoriteUserRoomParamsDto.safeParse(request.params);
        if (!params.success) return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });

        if (auth.user.role !== 'ADMIN' && auth.user.id !== params.data.userId) {
            return reply.status(403).send({ code: 'FORBIDDEN', message: 'You can only delete your own favorites' });
        }

        const result = await favoriteService.delete(auth.user, params.data.userId, params.data.roomId);
        if (!result.success) {
            if (result.code === 'FORBIDDEN') return reply.status(403).send({ code: 'FORBIDDEN', message: 'You can only delete your own favorites' });
            if (result.code === 'FAVORITE_NOT_FOUND') return reply.status(404).send({ code: 'FAVORITE_NOT_FOUND', message: 'Favorite not found' });
            result satisfies never;
        }

        return reply.status(204).send({});
    });
};
