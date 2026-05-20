import { z } from 'zod';

export const BuildingDto = z
    .object({
        id: z.number().int(),
        name: z.string(),
    })
    .meta({ id: 'Building' });

export const CreateBuildingBodyDto = z
    .object({
        name: z.string().min(1).max(100),
    })
    .meta({ id: 'CreateBuildingBody' });

export const UpdateBuildingBodyDto = z
    .object({
        name: z.string().min(1).max(100),
    })
    .meta({ id: 'UpdateBuildingBody' });

export const BuildingIdParamsDto = z
    .object({
        id: z.coerce.number().int().positive(),
    })
    .meta({ id: 'BuildingIdParams' });
