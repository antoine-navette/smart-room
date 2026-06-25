import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { components } from '../api/schema.d.ts';
import { createBuilding, createFloor, createReservation, createRoom, createUser } from '../test/factories';
import { renderWithProviders } from '../test/renderWithProviders';
import Dashboard from './Dashboard';

const { mockDelete, mockGet, mockNavigate, mockPut, mockUseAuth } = vi.hoisted(() => ({
    mockDelete: vi.fn(),
    mockGet: vi.fn(),
    mockNavigate: vi.fn(),
    mockPut: vi.fn(),
    mockUseAuth: vi.fn(),
}));

vi.mock('../api/client', () => ({
    api: {
        DELETE: mockDelete,
        GET: mockGet,
        PUT: mockPut,
    },
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

type Room = components['schemas']['Room'];
type Floor = components['schemas']['Floor'];
type Building = components['schemas']['Building'];
type Reservation = components['schemas']['Reservation'];
type Favorite = components['schemas']['Favorite'];

function createFavorite(overrides: Partial<Favorite> = {}): Favorite {
    return {
        user_id: 1,
        room_id: 10,
        ...overrides,
    };
}

const user = createUser({ id: 1, first_name: 'Hugo', role: 'USER' });

const buildingA = createBuilding({ id: 1, name: 'Batiment A' });
const buildingB = createBuilding({ id: 2, name: 'Batiment B' });

const floorA2 = createFloor({
    id: 10,
    name: 'Etage 2',
    building_id: buildingA.id,
});

const floorB1 = createFloor({
    id: 20,
    name: 'Etage 1',
    building_id: buildingB.id,
});

const favoriteRoom = createRoom({
    id: 10,
    name: 'Salle Atlas',
    floor_id: floorA2.id,
    capacity: 8,
});

const futureRoom = createRoom({
    id: 20,
    name: 'Salle Orion',
    floor_id: floorB1.id,
    capacity: 12,
});

const pastRoom = createRoom({
    id: 30,
    name: 'Salle Nova',
    floor_id: floorA2.id,
    capacity: 6,
});

function toIsoWithOffsetMinutes(offsetMinutes: number) {
    return new Date(Date.now() + offsetMinutes * 60_000).toISOString();
}

function createFutureReservation(overrides: Partial<Reservation> = {}): Reservation {
    return createReservation({
        id: 201,
        room_id: futureRoom.id,
        user_id: user.id,
        start_time: toIsoWithOffsetMinutes(60),
        end_time: toIsoWithOffsetMinutes(120),
        ...overrides,
    });
}

function createPastReservation(overrides: Partial<Reservation> = {}): Reservation {
    return createReservation({
        id: 202,
        room_id: pastRoom.id,
        user_id: user.id,
        start_time: toIsoWithOffsetMinutes(-120),
        end_time: toIsoWithOffsetMinutes(-60),
        ...overrides,
    });
}

type DashboardApiConfig = {
    reservations?: Reservation[];
    rooms?: Room[];
    floors?: Floor[];
    buildings?: Building[];
    favorites?: Favorite[];
    failPrimary?: boolean;
    failFavorites?: boolean;
    unauthorizedReservations?: boolean;
};

function setAuthenticatedAuth() {
    mockUseAuth.mockReturnValue({
        user,
        status: 'authenticated',
        login: vi.fn(),
        logout: vi.fn(),
        refreshMe: vi.fn(),
    });
}

function setMissingUser() {
    mockUseAuth.mockReturnValue({
        user: null,
        status: 'anonymous',
        login: vi.fn(),
        logout: vi.fn(),
        refreshMe: vi.fn(),
    });
}

function setupDashboardApi({
    reservations = [],
    rooms = [favoriteRoom, futureRoom, pastRoom],
    floors = [floorA2, floorB1],
    buildings = [buildingA, buildingB],
    favorites = [createFavorite({ room_id: favoriteRoom.id })],
    failPrimary = false,
    failFavorites = false,
    unauthorizedReservations = false,
}: DashboardApiConfig = {}) {
    mockGet.mockImplementation(async (path: string) => {
        if (path === '/users/{userId}/reservations') {
            if (unauthorizedReservations) {
                return {
                    data: undefined,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Unauthorized',
                    },
                };
            }

            if (failPrimary) {
                return {
                    data: undefined,
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Boom',
                    },
                };
            }

            return { data: reservations, error: undefined };
        }

        if (path === '/rooms') {
            if (failPrimary) {
                return {
                    data: undefined,
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Boom',
                    },
                };
            }

            return { data: rooms, error: undefined };
        }

        if (path === '/floors') {
            if (failPrimary) {
                return {
                    data: undefined,
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Boom',
                    },
                };
            }

            return { data: floors, error: undefined };
        }

        if (path === '/buildings') {
            if (failPrimary) {
                return {
                    data: undefined,
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Boom',
                    },
                };
            }

            return { data: buildings, error: undefined };
        }

        if (path === '/users/{userId}/favorites') {
            if (failFavorites) {
                return {
                    data: undefined,
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Boom',
                    },
                };
            }

            return { data: favorites, error: undefined };
        }

        throw new Error(`Unhandled GET ${path}`);
    });

    mockDelete.mockImplementation(async (path: string) => {
        if (path === '/users/{userId}/favorites/{roomId}') {
            return { data: undefined, error: undefined };
        }

        if (path === '/reservations/{id}') {
            return { data: undefined, error: undefined };
        }

        throw new Error(`Unhandled DELETE ${path}`);
    });

    mockPut.mockResolvedValue({ data: undefined, error: undefined });
}

function renderDashboard() {
    return renderWithProviders(<Dashboard />, {
        route: '/dashboard',
    });
}

async function waitForDashboardToLoad() {
    await screen.findByRole('heading', {
        level: 1,
        name: /Bonjour,\s*Hugo/i,
    });
}

function expectStatCardToContain(label: string, value: string) {
    const labelElement = screen.getByText(label);
    const card = labelElement.parentElement;

    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByText(value)).toBeInTheDocument();
}

describe('Dashboard', () => {
    beforeEach(() => {
        mockDelete.mockReset();
        mockGet.mockReset();
        mockNavigate.mockReset();
        mockPut.mockReset();
        mockUseAuth.mockReset();
        setAuthenticatedAuth();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('charge le dashboard et affiche reservations, favoris et historique', async () => {
        const futureReservation = createFutureReservation();
        const pastReservation = createPastReservation();

        setupDashboardApi({
            reservations: [futureReservation, pastReservation],
        });

        renderDashboard();
        await waitForDashboardToLoad();

        expect(screen.getByText('Reservations a venir')).toBeInTheDocument();
        expect(screen.getByText('Salles favorites')).toBeInTheDocument();
        expect(screen.getByText('Historique recent')).toBeInTheDocument();

        expect(screen.getByText('Salle Orion')).toBeInTheDocument();
        expect(screen.getByText('Salle Atlas')).toBeInTheDocument();
        expect(screen.getByText('Salle Nova')).toBeInTheDocument();

        const reservationsThisMonth = [futureReservation, pastReservation].filter((reservation) => {
            const reservationDate = new Date(reservation.start_time);
            const now = new Date();

            return reservationDate.getMonth() === now.getMonth() && reservationDate.getFullYear() === now.getFullYear();
        }).length;

        expectStatCardToContain('Reservations ce mois-ci', String(reservationsThisMonth));
        expectStatCardToContain('Creneaux actifs ou a venir', '1');
    });

    it('redirige vers /login si la recuperation des reservations renvoie UNAUTHORIZED', async () => {
        setupDashboardApi({
            unauthorizedReservations: true,
        });

        renderDashboard();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
        });
    });

    it('affiche une erreur globale si les donnees principales echouent', async () => {
        setupDashboardApi({
            failPrimary: true,
        });

        renderDashboard();

        expect(
            await screen.findByText('Impossible de charger ton tableau de bord pour le moment.'),
        ).toBeInTheDocument();

        expect(screen.getByRole('button', { name: 'Reessayer' })).toBeInTheDocument();
    });

    it('affiche une erreur de favoris sans bloquer le reste du dashboard', async () => {
        setupDashboardApi({
            reservations: [createFutureReservation()],
            failFavorites: true,
        });

        renderDashboard();
        await waitForDashboardToLoad();

        expect(screen.getByText('Salle Orion')).toBeInTheDocument();
        expect(screen.getByText('Impossible de charger tes favoris pour le moment.')).toBeInTheDocument();
    });

    it('affiche un message si aucun utilisateur n est disponible', () => {
        setMissingUser();
        setupDashboardApi();

        renderDashboard();

        expect(screen.getByText('Utilisateur introuvable.')).toBeInTheDocument();
    });

    it('affiche l etat vide des reservations a venir quand il n y en a pas', async () => {
        setupDashboardApi({
            reservations: [createPastReservation()],
            favorites: [],
        });

        renderDashboard();
        await waitForDashboardToLoad();

        expect(screen.getByText('Aucune reservation a venir')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Trouver une salle' })).toBeInTheDocument();
    });

    it('ouvre la modale puis retire un favori', async () => {
        setupDashboardApi({
            favorites: [createFavorite({ room_id: favoriteRoom.id })],
        });

        renderDashboard();
        await waitForDashboardToLoad();

        fireEvent.click(
            screen.getByRole('button', {
                name: /Retirer Salle Atlas des favoris/i,
            }),
        );

        expect(screen.getByRole('heading', { name: 'Retirer cette salle des favoris ?' })).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retirer des favoris',
            }),
        );

        await waitFor(() => {
            expect(mockDelete).toHaveBeenCalledWith('/users/{userId}/favorites/{roomId}', {
                params: {
                    path: {
                        userId: user.id,
                        roomId: favoriteRoom.id,
                    },
                },
            });
        });

        await waitFor(() => {
            expect(screen.queryByText('Salle Atlas')).not.toBeInTheDocument();
        });
    });
});
