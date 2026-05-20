import { randomBytes } from 'crypto';
import type { Session } from '../entities/session.entity.js';
import type { User } from '../entities/user.entity.js';
import type { Bcrypt } from '../libs/bcrypt.js';
import type { SessionRepository } from '../repositories/session.repository.js';
import type { UserRepository } from '../repositories/user.repository.js';

export type Context = {
    session: Session;
    user: User;
};

export class AuthService {
    constructor(
        private readonly sessionRepo: SessionRepository,
        private readonly userRepo: UserRepository,
        private readonly bcrypt: Bcrypt,
    ) {}

    async register(email: string, password: string, firstName: string, lastName: string) {
        const existing = await this.userRepo.findByEmail(email);
        if (existing) return { success: false, code: 'EMAIL_ALREADY_EXISTS' } as const;

        const user = await this.userRepo.create(email, await this.bcrypt.hash(password), firstName, lastName, 'USER');
        const session = await this.createSession(user.id);

        return { success: true, session, user } as const;
    }

    async login(email: string, password: string) {
        const user = await this.userRepo.findByEmail(email);
        if (!user) return { success: false, code: 'USER_NOT_FOUND' } as const;

        if (!(await this.bcrypt.verify(password, user.password_hash))) {
            return { success: false, code: 'INVALID_PASSWORD' } as const;
        }

        const session = await this.createSession(user.id);
        return { success: true, session, user } as const;
    }

    async logout(context: Context) {
        await this.sessionRepo.delete(context.session);
        return { success: true } as const;
    }

    async logoutAll(context: Context) {
        await this.sessionRepo.deleteByUserId(context.user.id);
        return { success: true } as const;
    }

    async authenticate(token: string | undefined) {
        if (!token) return { success: false, code: 'MISSING_TOKEN' } as const;

        const result = await this.sessionRepo.findByTokenWithUser(token);
        if (!result) return { success: false, code: 'SESSION_NOT_FOUND' } as const;

        if (result.session.expires_at < new Date()) {
            await this.sessionRepo.delete(result.session);
            return { success: false, code: 'SESSION_EXPIRED' } as const;
        }

        return { success: true, ...({ session: result.session, user: result.user } satisfies Context) } as const;
    }

    private async createSession(userId: number): Promise<Session> {
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return this.sessionRepo.create(userId, token, expiresAt);
    }
}
