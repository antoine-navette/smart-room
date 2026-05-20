import { z } from 'zod';

export const RoomDto = z
    .object({
        id: z.number().int(),
        name: z.string(),
        floor_id: z.number().int(),
        capacity: z.number().int(),
    })
    .meta({ id: 'Room' });

export const CreateRoomBodyDto = z
    .object({
        name: z.string().min(1).max(100),
        floor_id: z.number().int().positive(),
        capacity: z.number().int().positive(),
    })
    .meta({ id: 'CreateRoomBody' });

export const UpdateRoomBodyDto = z
    .object({
        name: z.string().min(1).max(100),
        floor_id: z.number().int().positive(),
        capacity: z.number().int().positive(),
    })
    .meta({ id: 'UpdateRoomBody' });

export const RoomIdParamsDto = z
    .object({
        id: z.coerce.number().int().positive(),
    })
    .meta({ id: 'RoomIdParams' });
