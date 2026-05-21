import { z } from 'zod';

export const InvalidBodyErrorDto = z
    .object({
        code: z.literal('INVALID_BODY'),
        issues: z.unknown(),
    })
    .meta({ id: 'InvalidBodyError' });

export const InvalidParamsErrorDto = z
    .object({
        code: z.literal('INVALID_PARAMS'),
        issues: z.unknown(),
    })
    .meta({ id: 'InvalidParamsError' });

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

export const ForbiddenErrorDto = z
    .object({
        code: z.literal('FORBIDDEN'),
        message: z.string(),
    })
    .meta({ id: 'ForbiddenError' });

export const InternalServerErrorDto = z
    .object({
        code: z.literal('INTERNAL_SERVER_ERROR'),
        message: z.string(),
    })
    .meta({ id: 'InternalServerError' });

export const BuildingNotFoundErrorDto = z
    .object({ code: z.literal('BUILDING_NOT_FOUND'), message: z.string() })
    .meta({ id: 'BuildingNotFoundError' });

export const FloorNotFoundErrorDto = z
    .object({ code: z.literal('FLOOR_NOT_FOUND'), message: z.string() })
    .meta({ id: 'FloorNotFoundError' });

export const RoomNotFoundErrorDto = z
    .object({ code: z.literal('ROOM_NOT_FOUND'), message: z.string() })
    .meta({ id: 'RoomNotFoundError' });

export const ReservationNotFoundErrorDto = z
    .object({ code: z.literal('RESERVATION_NOT_FOUND'), message: z.string() })
    .meta({ id: 'ReservationNotFoundError' });

export const UserNotFoundErrorDto = z
    .object({ code: z.literal('USER_NOT_FOUND'), message: z.string() })
    .meta({ id: 'UserNotFoundError' });

export const BuildingNameExistsErrorDto = z
    .object({ code: z.literal('BUILDING_NAME_EXISTS'), message: z.string() })
    .meta({ id: 'BuildingNameExistsError' });

export const FloorNameExistsErrorDto = z
    .object({ code: z.literal('FLOOR_NAME_EXISTS'), message: z.string() })
    .meta({ id: 'FloorNameExistsError' });

export const RoomNameExistsErrorDto = z
    .object({ code: z.literal('ROOM_NAME_EXISTS'), message: z.string() })
    .meta({ id: 'RoomNameExistsError' });

export const RoomResourceNotFoundErrorDto = z
    .object({ code: z.literal('ROOM_RESOURCE_NOT_FOUND'), message: z.string() })
    .meta({ id: 'RoomResourceNotFoundError' });

export const RoomResourceNameExistsErrorDto = z
    .object({ code: z.literal('ROOM_RESOURCE_NAME_EXISTS'), message: z.string() })
    .meta({ id: 'RoomResourceNameExistsError' });

export const RoomResourceAssignmentNotFoundErrorDto = z
    .object({ code: z.literal('ROOM_RESOURCE_ASSIGNMENT_NOT_FOUND'), message: z.string() })
    .meta({ id: 'RoomResourceAssignmentNotFoundError' });

export const BuildingHasFloorsErrorDto = z
    .object({ code: z.literal('BUILDING_HAS_FLOORS'), message: z.string() })
    .meta({ id: 'BuildingHasFloorsError' });

export const FloorHasRoomsErrorDto = z
    .object({ code: z.literal('FLOOR_HAS_ROOMS'), message: z.string() })
    .meta({ id: 'FloorHasRoomsError' });

export const RoomNotAvailableErrorDto = z
    .object({ code: z.literal('ROOM_NOT_AVAILABLE'), message: z.string() })
    .meta({ id: 'RoomNotAvailableError' });

export const InvalidDateRangeErrorDto = z
    .object({ code: z.literal('INVALID_DATE_RANGE'), message: z.string() })
    .meta({ id: 'InvalidDateRangeError' });

export const InvalidQueryErrorDto = z
    .object({
        code: z.literal('INVALID_QUERY'),
        issues: z.unknown(),
    })
    .meta({ id: 'InvalidQueryError' });
