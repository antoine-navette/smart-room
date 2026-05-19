export type Reservation = {
    id: number;
    user_id: number | null;
    room_id: number | null;
    start_time: Date;
    end_time: Date;
};
