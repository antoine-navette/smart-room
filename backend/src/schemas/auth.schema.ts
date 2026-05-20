import { z } from 'zod';

export const LoginBodyDto = z
    .object({
        email: z.email(),
        password: z.string().min(1),
    })
    .meta({ id: 'LoginBody' });
