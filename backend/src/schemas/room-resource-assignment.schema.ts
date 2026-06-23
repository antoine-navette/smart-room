import { z } from 'zod';

export const RoomResourceAssignmentDto = z
    .object({
        room_id: z.number().int(),
        resource_id: z.number().int(),
        quantity: z.number().int().positive(),
        name: z.string(),
    })
    .meta({ id: 'RoomResourceAssignment' });

export const SetRoomResourceQuantityBodyDto = z
    .object({
        quantity: z.number().int().positive(),
    })
    .meta({ id: 'SetRoomResourceQuantityBody' });

export const RoomResourceAssignmentParamsDto = z
    .object({
        roomId: z.coerce.number().int().positive(),
        resourceId: z.coerce.number().int().positive(),
    })
    .meta({ id: 'RoomResourceAssignmentParams' });
