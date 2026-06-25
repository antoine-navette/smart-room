import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createUser } from '../test/factories';
import { renderWithProviders } from '../test/renderWithProviders';
import Login from './Login';

const { mockLogin, mockNavigate, mockUseAuth } = vi.hoisted(() => ({
    mockLogin: vi.fn(),
    mockNavigate: vi.fn(),
    mockUseAuth: vi.fn(),
}));

vi.mock('../auth/AuthProvider', () => ({
    useAuth: mockUseAuth,
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const user = createUser({
    id: 1,
    first_name: 'Hugo',
    last_name: 'Martin',
    email: 'hugo@example.com',
    role: 'USER',
});

const admin = createUser({
    id: 2,
    first_name: 'Ada',
    last_name: 'Root',
    email: 'ada@example.com',
    role: 'ADMIN',
});

function setAnonymousAuth() {
    mockUseAuth.mockReturnValue({
        user: null,
        status: 'anonymous',
        login: mockLogin,
        logout: vi.fn(),
        refreshMe: vi.fn(),
    });
}

function renderLogin() {
    return renderWithProviders(<Login />, {
        route: '/login',
        withToastProvider: false,
    });
}

describe('Login', () => {
    beforeEach(() => {
        mockLogin.mockReset();
        mockNavigate.mockReset();
        mockUseAuth.mockReset();
        vi.spyOn(console, 'log').mockImplementation(() => {});
        setAnonymousAuth();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('redirige vers /dashboard si un user est deja authentifie', async () => {
        mockUseAuth.mockReturnValue({
            user,
            status: 'authenticated',
            login: mockLogin,
            logout: vi.fn(),
            refreshMe: vi.fn(),
        });

        renderLogin();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
        });
    });

    it('redirige vers /admin si un admin est deja authentifie', async () => {
        mockUseAuth.mockReturnValue({
            user: admin,
            status: 'authenticated',
            login: mockLogin,
            logout: vi.fn(),
            refreshMe: vi.fn(),
        });

        renderLogin();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true });
        });
    });

    it('soumet le formulaire puis redirige vers /dashboard apres un login reussi', async () => {
        mockLogin.mockResolvedValue(user);

        const { container } = renderLogin();

        const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;

        fireEvent.change(screen.getByPlaceholderText('jean.dupont@entreprise.com'), {
            target: { value: 'hugo@example.com' },
        });
        fireEvent.change(passwordInput, {
            target: { value: 'password123' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Se Connecter' }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                email: 'hugo@example.com',
                password: 'password123',
            });
        });

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
        });
    });

    it('affiche un message d erreur si le login echoue', async () => {
        mockLogin.mockRejectedValue(new Error('INVALID_CREDENTIALS'));

        const { container } = renderLogin();

        const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;

        fireEvent.change(screen.getByPlaceholderText('jean.dupont@entreprise.com'), {
            target: { value: 'hugo@example.com' },
        });
        fireEvent.change(passwordInput, {
            target: { value: 'wrong-password' },
        });

        fireEvent.click(screen.getByRole('button', { name: /Se Connecter/i }));

        expect(await screen.findByText('Identifiant ou mot de passe invalide.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Se Connecter/i })).toBeInTheDocument();
    });
});
