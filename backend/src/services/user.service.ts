import type { User } from '../entities/user.entity.js';
import type { UserCreate } from '../repositories/user.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { ReservationRepository } from '../repositories/reservation.repository.js';
import id from 'zod/v4/locales/id.js';

export class UserService {
    constructor(
        private readonly repo: UserRepository, 
        private readonly reservationRepo: ReservationRepository
    ) {}

    findAll(): Promise<User[]> {
        return this.repo.findAll();
    }

    async findById(id: number) {
        const user = await this.repo.findById(id);
        if (!user) {
            return { success: false, code: 'USER_NOT_FOUND' } as const;
        }

        return { success: true, user } as const;
    }

    async create(data: UserCreate) {
        const user = await this.repo.create(data);
        if (!user) {
            return { success: false, code: 'USER_CREATE_FAILED' } as const;
        }

        return { success: true, user } as const;
    }

    async save(entity: User) {
        const user = await this.repo.save(entity);
        if (!user) {
            return { success: false, code: 'USER_SAVE_FAILED' } as const;
        }

        return { success: true, user } as const;
    }

    async deleteById(id: number) {
        // Ensure user has no reservations before deleting
        const reservations = await this.reservationRepo.findAll();
        const hasReservations = reservations.some((r) => r.user_id === id);
        if (hasReservations) {
            return { success: false, code: 'USER_HAS_RESERVATIONS' } as const;
        }

        await this.repo.deleteById(id);
        return { success: true } as const;
    }

    // Need to add a "deactivated" flag in the database
    // async deactivateById(id: number): Promise<User> {
    //     return this.repo.findById(id).then((user) => {
    //         if (!user) throw new Error('User not found');
    //         user.deactivated = true;
    //         return this.repo.save(user);
    //     });
    // }
}
