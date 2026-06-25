import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service.js';
import type { Session } from '../entities/session.entity.js';
import type { User } from '../entities/user.entity.js';

const user: User = { id: 1, email: 'a@b.com', first_name: 'A', last_name: 'B', role: 'USER', password_hash: 'hash' };

const makeSession = (expiresAt: Date): Session => ({ id: 1, user_id: user.id, token: 'tok', expires_at: expiresAt });

const future = new Date(Date.now() + 3600_000);
const past = new Date(Date.now() - 3600_000);

const makeSessionRepo = () => ({
    findByTokenWithUser: vi.fn<() => Promise<{ session: Session; user: User } | null>>(),
    create: vi.fn<() => Promise<Session>>().mockResolvedValue(makeSession(future)),
    delete: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    deleteByUserId: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
});

const makeUserRepo = () => ({
    findByEmail: vi.fn<() => Promise<User | null>>(),
    findById: vi.fn<() => Promise<User | null>>(),
    create: vi.fn<() => Promise<User>>().mockResolvedValue(user),
});

const makeBcrypt = () => ({
    hash: vi.fn<() => Promise<string>>().mockResolvedValue('hashed'),
    verify: vi.fn<() => Promise<boolean>>(),
});

describe('AuthService', () => {
    let sessionRepo: ReturnType<typeof makeSessionRepo>;
    let userRepo: ReturnType<typeof makeUserRepo>;
    let bcrypt: ReturnType<typeof makeBcrypt>;
    let service: AuthService;

    beforeEach(() => {
        sessionRepo = makeSessionRepo();
        userRepo = makeUserRepo();
        bcrypt = makeBcrypt();
        service = new AuthService(sessionRepo as never, userRepo as never, bcrypt as never);
    });

    describe('authenticate', () => {
        it('retourne MISSING_TOKEN si le token est absent', async () => {
            expect(await service.authenticate(undefined)).toEqual({ success: false, code: 'MISSING_TOKEN' });
        });

        it('retourne SESSION_NOT_FOUND si le token est invalide', async () => {
            sessionRepo.findByTokenWithUser.mockResolvedValue(null);
            expect(await service.authenticate('invalid')).toEqual({ success: false, code: 'SESSION_NOT_FOUND' });
        });

        it('retourne SESSION_EXPIRED et supprime la session si elle est expirée', async () => {
            const session = makeSession(past);
            sessionRepo.findByTokenWithUser.mockResolvedValue({ session, user });
            const result = await service.authenticate('tok');
            expect(result).toEqual({ success: false, code: 'SESSION_EXPIRED' });
            expect(sessionRepo.delete).toHaveBeenCalledWith(session);
        });

        it('retourne la session et lutilisateur si tout est valide', async () => {
            const session = makeSession(future);
            sessionRepo.findByTokenWithUser.mockResolvedValue({ session, user });
            const result = await service.authenticate('tok');
            expect(result).toMatchObject({ success: true, session, user });
        });
    });

    describe('login', () => {
        it('retourne USER_NOT_FOUND si lemail nexiste pas', async () => {
            userRepo.findByEmail.mockResolvedValue(null);
            expect(await service.login('x@x.com', 'pass')).toEqual({ success: false, code: 'USER_NOT_FOUND' });
        });

        it('retourne INVALID_PASSWORD si le mot de passe est incorrect', async () => {
            userRepo.findByEmail.mockResolvedValue(user);
            bcrypt.verify.mockResolvedValue(false);
            expect(await service.login(user.email, 'wrong')).toEqual({ success: false, code: 'INVALID_PASSWORD' });
        });

        it('retourne la session à la connexion réussie', async () => {
            userRepo.findByEmail.mockResolvedValue(user);
            bcrypt.verify.mockResolvedValue(true);
            const result = await service.login(user.email, 'correct');
            expect(result).toMatchObject({ success: true, user });
        });
    });

    describe('register', () => {
        it('retourne EMAIL_ALREADY_EXISTS si lemail est déjà utilisé', async () => {
            userRepo.findByEmail.mockResolvedValue(user);
            expect(await service.register(user.email, 'pass', 'A', 'B')).toEqual({
                success: false,
                code: 'EMAIL_ALREADY_EXISTS',
            });
        });

        it('crée lutilisateur et une session à lenregistrement réussi', async () => {
            userRepo.findByEmail.mockResolvedValue(null);
            const result = await service.register('new@b.com', 'pass', 'A', 'B');
            expect(result).toMatchObject({ success: true, user });
            expect(bcrypt.hash).toHaveBeenCalledWith('pass');
        });
    });
});
