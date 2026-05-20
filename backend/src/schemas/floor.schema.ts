import { z } from 'zod';

export const FloorDto = z
    .object({
        id: z.number().int(),
        name: z.string(),
        building_id: z.number().int(),
    })
    .meta({ id: 'Floor' });

export const CreateFloorBodyDto = z
    .object({
        name: z.string().min(1).max(100),
        building_id: z.number().int().positive(),
    })
    .meta({ id: 'CreateFloorBody' });

export const UpdateFloorBodyDto = z
    .object({
        name: z.string().min(1).max(100),
        building_id: z.number().int().positive(),
    })
    .meta({ id: 'UpdateFloorBody' });

export const FloorIdParamsDto = z
    .object({
        id: z.coerce.number().int().positive(),
    })
    .meta({ id: 'FloorIdParams' });
