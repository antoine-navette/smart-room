import { UserRepository } from '../repositories/user.repository.js';
import type { Bcrypt } from '../adapters/bcrypt.js';

export class UserService {
    constructor(
        private readonly repo: UserRepository,
        private readonly bcrypt: Bcrypt,
    ) {}

    async findById(id: number) {
        const user = await this.repo.findById(id);
        if (!user) return { success: false, code: 'USER_NOT_FOUND' } as const;
        return { success: true, user } as const;
    }

    async create(email: string, password: string, firstName: string, lastName: string) {
        const existing = await this.repo.findByEmail(email);
        if (existing) return { success: false, code: 'EMAIL_ALREADY_EXISTS' } as const;

        const user = await this.repo.create(email, await this.bcrypt.hash(password), firstName, lastName, 'USER');

        return { success: true, user } as const;
    }
}
