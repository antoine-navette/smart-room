import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import { z } from 'zod';
import type { AuthService } from '../services/auth.service.js';
import type { UserService } from '../services/user.service.js';
import { UserDto, UserIdParamsDto, CreateUserBodyDto } from '../schemas/user.schema.js';
import {
    EmailAlreadyExistsErrorDto,
    ForbiddenErrorDto,
    InvalidBodyErrorDto,
    InvalidParamsErrorDto,
    UserNotFoundErrorDto,
    InternalServerErrorDto,
    UnauthorizedErrorDto,
} from '../schemas/errors.schema.js';

type Options = { authService: AuthService; userService: UserService };

export const userRoutes: FastifyPluginAsyncZodOpenApi<Options> = async (app, { authService, userService }) => {
    app.post(
        '/users',
        {
            schema: {
                tags: ['Users'],
                body: CreateUserBodyDto,
                response: {
                    201: UserDto,
                    400: InvalidBodyErrorDto,
                    401: UnauthorizedErrorDto,
                    403: ForbiddenErrorDto,
                    409: EmailAlreadyExistsErrorDto,
                    500: InternalServerErrorDto,
                },
            },
        },
        async (request, reply) => {
            const auth = await authService.authenticate(request.cookies['session_token']);
            if (!auth.success) {
                return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
            }

            if (auth.user.role !== 'ADMIN') {
                return reply.status(403).send({ code: 'FORBIDDEN', message: 'You must be an admin to create a user' });
            }

            const body = CreateUserBodyDto.safeParse(request.body);
            if (!body.success)
                return reply.status(400).send({ code: 'INVALID_BODY', issues: body.error.issues });

            const result = await userService.create(body.data.email, body.data.password, body.data.first_name, body.data.last_name);

            if (!result.success) {
                if (result.code === 'EMAIL_ALREADY_EXISTS')
                    return reply.status(409).send({ code: 'EMAIL_ALREADY_EXISTS', message: 'Email already in use' });
                result satisfies never;
            }

            const { password_hash, ...user } = result.user;
            return reply.status(201).send(user);
        },
    );

    app.get(
        '/users/me',
        {
            schema: {
                tags: ['Users'],
                response: {
                    200: UserDto,
                    401: UnauthorizedErrorDto,
                    500: InternalServerErrorDto,
                },
            },
        },
        async (request, reply) => {
            const auth = await authService.authenticate(request.cookies['session_token']);
            if (!auth.success) {
                return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
            }

            const { password_hash, ...user } = auth.user;
            return reply.status(200).send(user);
        },
    );

    app.get(
        '/users/:id',
        {
            schema: {
                tags: ['Users'],
                params: UserIdParamsDto,
                response: {
                    200: UserDto,
                    400: InvalidParamsErrorDto,
                    404: UserNotFoundErrorDto,
                    500: InternalServerErrorDto,
                },
            },
        },
        async (request, reply) => {
            const params = UserIdParamsDto.safeParse(request.params);
            if (!params.success) {
                return reply.status(400).send({ code: 'INVALID_PARAMS', issues: params.error.issues });
            }

            const result = await userService.findById(params.data.id);
            if (!result.success) {
                return reply.status(404).send({ code: 'USER_NOT_FOUND', message: 'User not found' });
            }

            const { password_hash, ...user } = result.user;
            return reply.status(200).send(user);
        },
    );
};
