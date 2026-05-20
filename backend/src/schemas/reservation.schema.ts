import { z } from 'zod';

export const ReservationDto = z
    .object({
        id: z.number().int(),
        room_id: z.number().int().nullable(),
        user_id: z.number().int().nullable(),
        start_time: z.date(),
        end_time: z.date(),
    })
    .meta({ id: 'Reservation' });

export const CreateReservationBodyDto = z
    .object({
        room_id: z.number().int().positive(),
        start_time: z.coerce.date(),
        end_time: z.coerce.date(),
    })
    .meta({ id: 'CreateReservationBody' });

export const UpdateReservationBodyDto = z
    .object({
        room_id: z.number().int().positive(),
        start_time: z.coerce.date(),
        end_time: z.coerce.date(),
    })
    .meta({ id: 'UpdateReservationBody' });

export const ReservationIdParamsDto = z
    .object({
        id: z.coerce.number().int().positive(),
    })
    .meta({ id: 'ReservationIdParams' });

export const ReservationUserIdParamsDto = z
    .object({
        userId: z.coerce.number().int().positive(),
    })
    .meta({ id: 'ReservationUserIdParams' });

export const ReservationRoomIdParamsDto = z
    .object({
        roomId: z.coerce.number().int().positive(),
    })
    .meta({ id: 'ReservationRoomIdParams' });
