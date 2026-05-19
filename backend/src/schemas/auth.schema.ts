import { z } from 'zod';

export const RegisterBodyDto = z
    .object({
        email: z.email(),
        password: z.string().min(8),
        first_name: z.string().min(1),
        last_name: z.string().min(1),
    })
    .meta({ id: 'RegisterBody' });

export const LoginBodyDto = z
    .object({
        email: z.email(),
        password: z.string().min(1),
    })
    .meta({ id: 'LoginBody' });
