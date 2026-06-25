import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from './AuthProvider';
import { createUser } from '../test/factories';
import { renderWithProviders } from '../test/renderWithProviders';

const { mockGet, mockPost } = vi.hoisted(() => ({
    mockGet: vi.fn(),
    mockPost: vi.fn(),
}));

vi.mock('../api/client', () => ({
    api: {
        GET: mockGet,
        POST: mockPost,
    },
}));

const authUser = createUser({
    id: 1,
    first_name: 'Hugo',
    last_name: 'Martin',
    email: 'hugo@example.com',
    role: 'USER',
});

type AuthApiConfig = {
    meUser?: typeof authUser | null;
    loginUser?: typeof authUser | null;
    loginFails?: boolean;
};

function setupAuthApi({ meUser = null, loginUser = authUser, loginFails = false }: AuthApiConfig = {}) {
    mockGet.mockImplementation(async (path: string) => {
        if (path === '/users/me') {
            if (!meUser) {
                return {
                    data: undefined,
                    error: { code: 'UNAUTHORIZED' },
                };
            }

            return {
                data: meUser,
                error: undefined,
            };
        }

        throw new Error(`Unhandled GET ${path}`);
    });

    mockPost.mockImplementation(async (path: string) => {
        if (path === '/auth/login') {
            if (loginFails || !loginUser) {
                return {
                    data: undefined,
                    error: { code: 'INVALID_CREDENTIALS' },
                };
            }

            return {
                data: loginUser,
                error: undefined,
            };
        }

        if (path === '/auth/logout') {
            return {
                data: undefined,
                error: undefined,
            };
        }

        throw new Error(`Unhandled POST ${path}`);
    });
}

function AuthHarness() {
    const { user, status, login, logout } = useAuth();
    const [error, setError] = useState('');

    return (
        <div>
            <div data-testid="status">{status}</div>
            <div data-testid="email">{user?.email ?? 'none'}</div>
            <div data-testid="error">{error}</div>

            <button
                type="button"
                onClick={() => {
                    void login({ email: 'hugo@example.com', password: 'password123' }).catch(() => {
                        setError('LOGIN_ERROR');
                    });
                }}
            >
                login
            </button>

            <button type="button" onClick={() => void logout()}>
                logout
            </button>
        </div>
    );
}

function renderAuthProvider() {
    return renderWithProviders(
        <AuthProvider>
            <AuthHarness />
        </AuthProvider>,
        { withToastProvider: false },
    );
}

describe('AuthProvider', () => {
    beforeEach(() => {
        mockGet.mockReset();
        mockPost.mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('passe en authenticated au montage quand /users/me repond avec un utilisateur', async () => {
        setupAuthApi({
            meUser: authUser,
        });

        renderAuthProvider();

        await waitFor(() => {
            expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
        });

        expect(screen.getByTestId('email')).toHaveTextContent('hugo@example.com');
    });

    it('passe en anonymous au montage quand /users/me echoue', async () => {
        setupAuthApi({
            meUser: null,
        });

        renderAuthProvider();

        await waitFor(() => {
            expect(screen.getByTestId('status')).toHaveTextContent('anonymous');
        });

        expect(screen.getByTestId('email')).toHaveTextContent('none');
    });

    it('met a jour le contexte apres un login reussi', async () => {
        setupAuthApi({
            meUser: null,
            loginUser: authUser,
        });

        renderAuthProvider();

        await waitFor(() => {
            expect(screen.getByTestId('status')).toHaveTextContent('anonymous');
        });

        fireEvent.click(screen.getByRole('button', { name: 'login' }));

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/auth/login', {
                body: {
                    email: 'hugo@example.com',
                    password: 'password123',
                },
            });
        });

        await waitFor(() => {
            expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
        });

        expect(screen.getByTestId('email')).toHaveTextContent('hugo@example.com');
    });

    it('remonte une erreur quand le login echoue', async () => {
        setupAuthApi({
            meUser: null,
            loginFails: true,
        });

        renderAuthProvider();

        await waitFor(() => {
            expect(screen.getByTestId('status')).toHaveTextContent('anonymous');
        });

        fireEvent.click(screen.getByRole('button', { name: 'login' }));

        await waitFor(() => {
            expect(screen.getByTestId('error')).toHaveTextContent('LOGIN_ERROR');
        });

        expect(screen.getByTestId('status')).toHaveTextContent('anonymous');
    });

    it('repasse en anonymous apres logout', async () => {
        setupAuthApi({
            meUser: authUser,
        });

        renderAuthProvider();

        await waitFor(() => {
            expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
        });

        fireEvent.click(screen.getByRole('button', { name: 'logout' }));

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/auth/logout');
        });

        await waitFor(() => {
            expect(screen.getByTestId('status')).toHaveTextContent('anonymous');
        });

        expect(screen.getByTestId('email')).toHaveTextContent('none');
    });
});
