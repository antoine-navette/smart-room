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
