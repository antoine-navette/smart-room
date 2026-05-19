import { z } from 'zod';

export const ValidationErrorDto = z
    .object({
        code: z.literal('VALIDATION_ERROR'),
        message: z.string(),
        issues: z.unknown(),
    })
    .meta({ id: 'ValidationError' });

export const EmailAlreadyExistsErrorDto = z
    .object({
        code: z.literal('EMAIL_ALREADY_EXISTS'),
        message: z.string(),
    })
    .meta({ id: 'EmailAlreadyExistsError' });

export const InvalidCredentialsErrorDto = z
    .object({
        code: z.literal('INVALID_CREDENTIALS'),
        message: z.string(),
    })
    .meta({ id: 'InvalidCredentialsError' });

export const UnauthorizedErrorDto = z
    .object({
        code: z.literal('UNAUTHORIZED'),
        message: z.string(),
    })
    .meta({ id: 'UnauthorizedError' });

export const InternalServerErrorDto = z
    .object({
        code: z.literal('INTERNAL_SERVER_ERROR'),
        message: z.string(),
    })
    .meta({ id: 'InternalServerError' });
