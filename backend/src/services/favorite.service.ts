import type { User } from '../entities/user.entity.js';
import type { Favorite } from '../entities/favorite.entity.js';
import { FavoriteRepository } from '../repositories/favorite.repository.js';
import { RoomRepository } from '../repositories/room.repository.js';

export class FavoriteService {
    constructor(
        private readonly repo: FavoriteRepository,
        private readonly roomRepo: RoomRepository,
    ) {}

    async create(user: User, roomId: number) {
        const room = await this.roomRepo.findById(roomId);
        if (!room) return { success: false, code: 'ROOM_NOT_FOUND' } as const;

        const existing = await this.repo.findByUserAndRoom(user.id, roomId);
        if (existing) return { success: false, code: 'FAVORITE_ALREADY_EXISTS' } as const;

        const favorite = await this.repo.create(user.id, roomId);
        return { success: true, favorite } as const;
    }

    async findByUserId(userId: number) {
        const favorites = await this.repo.findByUserId(userId);
        return favorites;
    }

    async delete(currentUser: User, userId: number, roomId: number) {
        const fav = await this.repo.findByUserAndRoom(userId, roomId);
        if (!fav) return { success: false, code: 'FAVORITE_NOT_FOUND' } as const;

        if (currentUser.role !== 'ADMIN' && fav.user_id !== currentUser.id)
            return { success: false, code: 'FORBIDDEN' } as const;

        await this.repo.deleteByUserAndRoom(userId, roomId);
        return { success: true } as const;
    }
}
