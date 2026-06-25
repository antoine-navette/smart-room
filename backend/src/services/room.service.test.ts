import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoomService } from './room.service.js';
import type { Room } from '../entities/room.entity.js';
import type { User } from '../entities/user.entity.js';

const admin: User = { id: 1, email: 'a@b.com', first_name: 'A', last_name: 'B', role: 'ADMIN', password_hash: '' };
const user: User = { ...admin, role: 'USER' };
const floor = { id: 1, name: 'RdC', building_id: 1 };
const room: Room = { id: 1, name: 'Salle A', floor_id: 1, capacity: 10 };

const makeRepo = () => ({
    findById: vi.fn<() => Promise<Room | null>>(),
    findByNameAndFloorId: vi.fn<() => Promise<Room | null>>(),
    findAll: vi.fn<() => Promise<Room[]>>(),
    findAvailable: vi.fn<() => Promise<Room[]>>(),
    create: vi.fn<() => Promise<Room>>().mockResolvedValue(room),
    save: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    delete: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    hasUnavailabilityOverlap: vi.fn(),
});

const makeFloorRepo = () => ({
    findById: vi.fn().mockResolvedValue(floor),
});

describe('RoomService', () => {
    let repo: ReturnType<typeof makeRepo>;
    let floorRepo: ReturnType<typeof makeFloorRepo>;
    let service: RoomService;

    beforeEach(() => {
        repo = makeRepo();
        floorRepo = makeFloorRepo();
        service = new RoomService(repo as never, floorRepo as never);
    });

    describe('create', () => {
        it('retourne FORBIDDEN pour un non-admin', async () => {
            expect(await service.create(user, 'Salle B', 1, 8)).toEqual({ success: false, code: 'FORBIDDEN' });
        });

        it('retourne FLOOR_NOT_FOUND si létage nexiste pas', async () => {
            floorRepo.findById.mockResolvedValue(null);
            expect(await service.create(admin, 'Salle B', 99, 8)).toEqual({ success: false, code: 'FLOOR_NOT_FOUND' });
        });

        it('retourne ROOM_NAME_EXISTS si le nom est déjà pris sur cet étage', async () => {
            repo.findByNameAndFloorId.mockResolvedValue(room);
            expect(await service.create(admin, 'Salle A', 1, 8)).toEqual({ success: false, code: 'ROOM_NAME_EXISTS' });
        });

        it('crée la salle avec succès', async () => {
            repo.findByNameAndFloorId.mockResolvedValue(null);
            expect(await service.create(admin, 'Salle B', 1, 8)).toMatchObject({ success: true, room });
        });
    });

    describe('update', () => {
        it('retourne FORBIDDEN pour un non-admin', async () => {
            expect(await service.update(user, 1, 'X', 1, 8)).toEqual({ success: false, code: 'FORBIDDEN' });
        });

        it('retourne ROOM_NOT_FOUND si la salle nexiste pas', async () => {
            repo.findById.mockResolvedValue(null);
            expect(await service.update(admin, 99, 'X', 1, 8)).toEqual({ success: false, code: 'ROOM_NOT_FOUND' });
        });

        it('ne vérifie pas le nom si nom et étage sont inchangés', async () => {
            repo.findById.mockResolvedValue(room);
            await service.update(admin, room.id, room.name, room.floor_id, 12);
            expect(repo.findByNameAndFloorId).not.toHaveBeenCalled();
        });

        it('retourne ROOM_NAME_EXISTS si le nouveau nom est déjà pris par une autre salle', async () => {
            const other: Room = { ...room, id: 2, name: 'Salle B' };
            repo.findById.mockResolvedValue(room);
            repo.findByNameAndFloorId.mockResolvedValue(other);
            expect(await service.update(admin, room.id, 'Salle B', 1, 10)).toEqual({
                success: false,
                code: 'ROOM_NAME_EXISTS',
                name: 'Salle B',
            });
        });

        it('autorise le renommage si le conflit est avec la salle elle-même', async () => {
            repo.findById.mockResolvedValue(room);
            repo.findByNameAndFloorId.mockResolvedValue(room);
            expect(await service.update(admin, room.id, room.name, room.floor_id, 12)).toMatchObject({ success: true });
        });
    });

    describe('delete', () => {
        it('retourne FORBIDDEN pour un non-admin', async () => {
            expect(await service.delete(user, 1)).toEqual({ success: false, code: 'FORBIDDEN' });
        });

        it('retourne ROOM_NOT_FOUND si la salle nexiste pas', async () => {
            repo.findById.mockResolvedValue(null);
            expect(await service.delete(admin, 99)).toEqual({ success: false, code: 'ROOM_NOT_FOUND' });
        });

        it('supprime avec succès', async () => {
            repo.findById.mockResolvedValue(room);
            expect(await service.delete(admin, room.id)).toEqual({ success: true });
        });
    });
});
