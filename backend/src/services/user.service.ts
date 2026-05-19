import { z } from 'zod';
import type { User } from '../entities/entities.js';
import type { UserCreate } from '../repositories/user.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { ReservationRepository } from '../repositories/reservation.repository.js';

const emailSchema = z.email();

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
        const parsedEmail = emailSchema.safeParse(data.email);
        if (!parsedEmail.success) {
            return { success: false, code: 'INVALID_EMAIL', issues: parsedEmail.error.issues } as const;
        }

        const existing = await this.repo.findByEmail(parsedEmail.data);
        if (existing) {
            return { success: false, code: 'EMAIL_ALREADY_EXISTS' } as const;
        }

        const user = await this.repo.create(data);
        if (!user) {
            return { success: false, code: 'USER_CREATE_FAILED' } as const;
        }

        return { success: true, user } as const;
    }

    async save(entity: User) {
        const parsedEmail = emailSchema.safeParse(entity.email);
        if (!parsedEmail.success) {
            return { success: false, code: 'INVALID_EMAIL', issues: parsedEmail.error.issues } as const;
        }

        const existing = await this.repo.findByEmail(parsedEmail.data);
        if (existing && existing.id !== entity.id) {
            return { success: false, code: 'EMAIL_ALREADY_EXISTS' } as const;
        }

        const user = await this.repo.save(entity);
        if (!user) {
            return { success: false, code: 'USER_SAVE_FAILED' } as const;
        }

        return { success: true, user } as const;
    }

    async deleteById(id: number) {
        const user = await this.repo.findById(id);
        if (!user) {
            return { success: false, code: 'USER_NOT_FOUND' } as const;
        }

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
