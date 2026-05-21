import type { Incident } from '../entities/incident.entity.js';
import type { User } from '../entities/user.entity.js';
import { IncidentRepository } from '../repositories/incident.repository.js';
import { RoomRepository } from '../repositories/room.repository.js';
import { Mailer } from '../adapters/mailer.js';

export class IncidentService {
    constructor(
        private readonly repo: IncidentRepository,
        private readonly roomRepo: RoomRepository,
        private readonly emailService: Mailer,
    ) {}

    async create(user: User, roomId: number | null, title: string, description: string | undefined) {
        const room = roomId ? await this.roomRepo.findById(roomId) : null;
        if (roomId && !room) return { success: false, code: 'ROOM_NOT_FOUND' } as const;

        const incident = await this.repo.create(roomId, user.id, title, description ?? null);
        await this.emailService.sendIncidentReport(user, incident, room ?? null);
        return { success: true, incident } as const;
    }

    findAll(): Promise<Incident[]> {
        return this.repo.findAll();
    }

    async findById(id: number) {
        const incident = await this.repo.findById(id);
        if (!incident) return { success: false, code: 'INCIDENT_NOT_FOUND' } as const;
        return { success: true, incident } as const;
    }

    async findByRoomId(roomId: number) {
        const room = await this.roomRepo.findById(roomId);
        if (!room) return { success: false, code: 'ROOM_NOT_FOUND' } as const;
        const incidents = await this.repo.findByRoomId(roomId);
        return { success: true, incidents } as const;
    }

    async update(user: User, id: number, title: string | undefined, description: string | undefined, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | undefined) {
        if (user.role !== 'ADMIN') return { success: false, code: 'FORBIDDEN' } as const;

        const current = await this.repo.findById(id);
        if (!current) return { success: false, code: 'INCIDENT_NOT_FOUND' } as const;

        if (current.status === 'RESOLVED') {
            return { success: false, code: 'INCIDENT_ALREADY_RESOLVED' } as const;
        }

        if (current.status === 'IN_PROGRESS' && status === 'OPEN') {
            return { success: false, code: 'INCIDENT_INVALID_TRANSITION' } as const;
        }

        const updated: Incident = { ...current };
        if (title !== undefined) updated.title = title;
        if (description !== undefined) updated.description = description;
        if (status !== undefined) {
            updated.status = status;
            updated.resolved_at = status === 'RESOLVED' ? new Date() : null;
        }

        await this.repo.save(updated);
        return { success: true, incident: updated } as const;
    }

    async delete(user: User, id: number) {
        if (user.role !== 'ADMIN') return { success: false, code: 'FORBIDDEN' } as const;

        const current = await this.repo.findById(id);
        if (!current) return { success: false, code: 'INCIDENT_NOT_FOUND' } as const;

        await this.repo.delete(current);
        return { success: true } as const;
    }
}
