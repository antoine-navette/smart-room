import { z } from 'zod';

export const RoleSchema = z.enum(['USER', 'ADMIN']).meta({ id: 'Role' });

export const UserDto = z
    .object({
        id: z.number().int(),
        last_name: z.string(),
        first_name: z.string(),
        role: RoleSchema,
        email: z.email(),
    })
    .meta({ id: 'User' });

export const UserIdParamsDto = z
    .object({
        id: z.coerce.number().int().positive(),
    })
    .meta({ id: 'UserIdParams' });

export const CreateUserBodyDto = z
    .object({
        email: z.email(),
        password: z.string().min(8),
        first_name: z.string().min(1).max(100),
        last_name: z.string().min(1).max(100),
    })
    .meta({ id: 'CreateUserBody' });
