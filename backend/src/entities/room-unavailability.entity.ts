export type RoomUnavailability = {
    id: number;
    room_id: number;
    from_time: Date;
    to_time: Date;
    reason: string;
};
