export type Role = 'USER' | 'ADMIN';

export type User = {
    id: number;
    last_name: string;
    first_name: string;
    role: Role;
    email: string;
    password_hash: string;
};
