import { z } from 'zod';

export const RoomResourceDto = z
    .object({
        id: z.number().int(),
        name: z.string(),
    })
    .meta({ id: 'RoomResource' });

export const CreateRoomResourceBodyDto = z
    .object({
        name: z.string().min(1).max(100),
    })
    .meta({ id: 'CreateRoomResourceBody' });

export const UpdateRoomResourceBodyDto = z
    .object({
        name: z.string().min(1).max(100),
    })
    .meta({ id: 'UpdateRoomResourceBody' });

export const RoomResourceIdParamsDto =
    z.object({
        id: z.coerce.number().int().positive(),
    })
        .meta({ id: 'RoomResourceIdParams' });