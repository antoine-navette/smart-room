import { z } from 'zod';

export const RoomUnavailabilityDto = z
    .object({
        id: z.number().int(),
        room_id: z.number().int(),
        from_time: z.date(),
        to_time: z.date(),
        reason: z.string(),
    })
    .meta({ id: 'RoomUnavailability' });

export const CreateRoomUnavailabilityBodyDto = z
    .object({
        room_id: z.number().int().positive(),
        from_time: z.coerce.date(),
        to_time: z.coerce.date(),
        reason: z.string().min(1).max(255),
    })
    .meta({ id: 'CreateRoomUnavailabilityBody' });

export const UpdateRoomUnavailabilityBodyDto = z
    .object({
        room_id: z.number().int().positive(),
        from_time: z.coerce.date(),
        to_time: z.coerce.date(),
        reason: z.string().min(1).max(255),
    })
    .meta({ id: 'UpdateRoomUnavailabilityBody' });

export const RoomUnavailabilityIdParamsDto = z
    .object({
        id: z.coerce.number().int().positive(),
    })
    .meta({ id: 'RoomUnavailabilityIdParams' });

export const RoomUnavailabilityRoomIdParamsDto = z
    .object({
        roomId: z.coerce.number().int().positive(),
    })
    .meta({ id: 'RoomUnavailabilityRoomIdParams' });
