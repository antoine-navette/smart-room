import { z } from 'zod';

export const GenderSchema = z.enum(['M', 'F', 'O']).meta({ id: 'Gender' });

export const UserDto = z
    .object({
        id: z.number().int(),
        last_name: z.string(),
        first_name: z.string(),
        gender: GenderSchema,
        email: z.email(),
    })
    .meta({ id: 'User' });
