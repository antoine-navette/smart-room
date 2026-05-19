export type Gender = 'M' | 'F' | 'O';

export interface Building {
    id: number;
    name: string;
}

export interface Floor {
    id: number;
    name: string;
    building_id: number;
}

export interface Room {
    id: number;
    name: string;
    floor_id: number;
    capacity: number;
}

export interface User {
    id: number;
    last_name: string;
    first_name: string;
    gender: Gender;
    email: string;
    password_hash: string;
}

export interface Reservation {
    id: number;
    user_id: number | null;
    room_id: number | null;
    start_time: Date;
    end_time: Date;
}