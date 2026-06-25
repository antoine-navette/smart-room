import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Navbar from './Navbar';
import { renderWithProviders } from '../../test/renderWithProviders';
import { createUser } from '../../test/factories';

const { mockNavigate, mockLogout, mockUseAuth } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockLogout: vi.fn(),
    mockUseAuth: vi.fn(),
}));

vi.mock('../../auth/AuthProvider', () => ({
    useAuth: mockUseAuth,
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

function renderNavbar(route = '/') {
    return renderWithProviders(<Navbar />, { route });
}

function setAnonymousAuth() {
    mockUseAuth.mockReturnValue({
        user: null,
        status: 'anonymous',
        logout: mockLogout,
        login: vi.fn(),
        refreshMe: vi.fn(),
    });
}

function setAuthenticatedAuth(role: 'USER' | 'ADMIN' = 'USER') {
    mockUseAuth.mockReturnValue({
        user: createUser({
            first_name: 'Alice',
            last_name: 'Brown',
            email: 'alice@example.com',
            role,
        }),
        status: 'authenticated',
        logout: mockLogout,
        login: vi.fn(),
        refreshMe: vi.fn(),
    });
}

describe('Navbar', () => {
    beforeEach(() => {
        mockNavigate.mockReset();
        mockLogout.mockReset();
        mockUseAuth.mockReset();
        mockLogout.mockResolvedValue(undefined);
        setAnonymousAuth();
    });

    it('affiche le lien de connexion quand l utilisateur est anonyme', () => {
        renderNavbar('/');

        expect(screen.getByRole('link', { name: 'Se connecter' })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Mes reservations' })).not.toBeInTheDocument();
    });

    it('marque le lien Salles comme actif sur une page room details', () => {
        renderNavbar('/room/7');

        expect(screen.getByRole('link', { name: 'Salles' })).toHaveClass('border-primary');
    });

    it('affiche le dashboard pour un utilisateur connecte et le marque actif', () => {
        setAuthenticatedAuth('USER');

        renderNavbar('/dashboard');

        expect(screen.getByRole('link', { name: 'Mes réservations' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Mes réservations' })).toHaveClass('border-primary');
    });

    it('affiche le lien admin pour un administrateur et le marque actif', () => {
        setAuthenticatedAuth('ADMIN');

        renderNavbar('/admin');

        expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Admin' })).toHaveClass('bg-primary-fixed');
    });

    it('ouvre le menu mobile et affiche les informations utilisateur', async () => {
        const user = userEvent.setup();
        setAuthenticatedAuth('USER');

        renderNavbar('/');

        await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));

        const mobileNavigation = document.getElementById('mobile-navigation');
        expect(mobileNavigation).not.toBeNull();

        const mobileMenu = within(mobileNavigation as HTMLElement);
        expect(mobileMenu.getByText('Alice Brown')).toBeInTheDocument();
        expect(mobileMenu.getByText('Utilisateur connecté')).toBeInTheDocument();
        expect(mobileMenu.getByRole('link', { name: 'Ouvrir mon espace' })).toBeInTheDocument();
    });

    it('ferme le menu mobile apres un clic sur un lien', async () => {
        const user = userEvent.setup();
        setAuthenticatedAuth('USER');

        renderNavbar('/');

        await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));

        const mobileNavigation = document.getElementById('mobile-navigation');
        expect(mobileNavigation).not.toBeNull();

        const mobileMenu = within(mobileNavigation as HTMLElement);
        await user.click(mobileMenu.getByRole('link', { name: 'Mes réservations' }));

        await waitFor(() => {
            expect(document.getElementById('mobile-navigation')).not.toBeInTheDocument();
        });
    });

    it('deconnecte l utilisateur puis redirige vers /login', async () => {
        const user = userEvent.setup();
        setAuthenticatedAuth('USER');

        renderNavbar('/dashboard');

        await user.click(screen.getByRole('button', { name: 'Se déconnecter' }));

        await waitFor(() => {
            expect(mockLogout).toHaveBeenCalledTimes(1);
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
        });
    });
});
