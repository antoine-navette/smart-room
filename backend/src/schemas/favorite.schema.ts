import { z } from 'zod';

export const FavoriteDto = z
    .object({
        user_id: z.number().int(),
        room_id: z.number().int(),
    })
    .meta({ id: 'Favorite' });

export const CreateFavoriteBodyDto = z
    .object({
        room_id: z.number().int().positive(),
    })
    .meta({ id: 'CreateFavoriteBody' });

export const FavoriteUserIdParamsDto = z
    .object({ userId: z.coerce.number().int().positive() })
    .meta({ id: 'FavoriteUserIdParams' });

export const FavoriteUserRoomParamsDto = z
    .object({ userId: z.coerce.number().int().positive(), roomId: z.coerce.number().int().positive() })
    .meta({ id: 'FavoriteUserRoomParams' });
