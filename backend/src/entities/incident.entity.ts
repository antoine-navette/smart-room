export type Incident = {
    id: number;
    room_id: number | null;
    user_id: number | null;
    title: string;
    description: string | null;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
    created_at: Date;
    resolved_at: Date | null;
};
