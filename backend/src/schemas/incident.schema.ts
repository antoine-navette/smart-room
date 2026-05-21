import { z } from 'zod';

export const IncidentDto = z
    .object({
        id: z.number().int(),
        room_id: z.number().int().nullable(),
        user_id: z.number().int().nullable(),
        title: z.string(),
        description: z.string().nullable(),
        status: z.union([z.literal('OPEN'), z.literal('IN_PROGRESS'), z.literal('RESOLVED')]),
        created_at: z.date(),
        resolved_at: z.date().nullable(),
    })
    .meta({ id: 'Incident' });

export const CreateIncidentBodyDto = z
    .object({
        room_id: z.coerce.number().int().nullable(),
        title: z.string().min(1).max(200),
        description: z.string().optional(),
    })
    .meta({ id: 'CreateIncidentBody' });

export const UpdateIncidentBodyDto = z
    .object({
        title: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        status: z.union([z.literal('OPEN'), z.literal('IN_PROGRESS'), z.literal('RESOLVED')]).optional(),
    })
    .meta({ id: 'UpdateIncidentBody' });

export const IncidentIdParamsDto = z
    .object({ id: z.coerce.number().int().positive() })
    .meta({ id: 'IncidentIdParams' });

export const IncidentRoomIdParamsDto = z
    .object({ roomId: z.coerce.number().int().positive() })
    .meta({ id: 'IncidentRoomIdParams' });
