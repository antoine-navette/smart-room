import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { components } from '../api/schema.d.ts';
import { createBuilding, createFloor, createReservation, createRoom, createUser } from '../test/factories';
import { renderWithProviders } from '../test/renderWithProviders';
import RoomDetails from './RoomDetails';

const { mockDelete, mockGet, mockNavigate, mockPost, mockUseAuth } = vi.hoisted(() => ({
    mockDelete: vi.fn(),
    mockGet: vi.fn(),
    mockNavigate: vi.fn(),
    mockPost: vi.fn(),
    mockUseAuth: vi.fn(),
}));

vi.mock('../api/client', () => ({
    api: {
        DELETE: mockDelete,
        GET: mockGet,
        POST: mockPost,
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
type RoomResourceAssignment = components['schemas']['RoomResourceAssignment'];
type RoomUnavailability = components['schemas']['RoomUnavailability'];
type Incident = components['schemas']['Incident'];
type Favorite = components['schemas']['Favorite'];

function createResource(overrides: Partial<RoomResourceAssignment> = {}): RoomResourceAssignment {
    return {
        room_id: 10,
        resource_id: 1,
        quantity: 1,
        name: 'Ecran',
        ...overrides,
    };
}

function createIncident(overrides: Partial<Incident> = {}): Incident {
    return {
        id: 1,
        room_id: 10,
        user_id: 1,
        title: 'Projecteur defectueux',
        description: 'Image noire pendant les reunions.',
        status: 'OPEN',
        created_at: '2099-06-25T09:00:00.000Z',
        resolved_at: null,
        ...overrides,
    };
}

function createFavorite(overrides: Partial<Favorite> = {}): Favorite {
    return {
        user_id: 1,
        room_id: 10,
        ...overrides,
    };
}

const user = createUser({ id: 1, role: 'USER' });
const room = createRoom({ id: 10, name: 'Salle Atlas', floor_id: 20, capacity: 8 });
const floor = createFloor({ id: 20, name: 'Etage 2', building_id: 30 });
const building = createBuilding({ id: 30, name: 'Batiment A' });

type RoomDetailsApiConfig = {
    room?: Room;
    floors?: Floor[];
    buildings?: Building[];
    reservations?: Reservation[];
    resources?: RoomResourceAssignment[];
    unavailabilities?: RoomUnavailability[];
    incidents?: Incident[];
    favorites?: Favorite[];
    failRoom?: boolean;
    failPrimary?: boolean;
    failResources?: boolean;
    failUnavailabilities?: boolean;
    failIncidents?: boolean;
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

function setAnonymousAuth() {
    mockUseAuth.mockReturnValue({
        user: null,
        status: 'anonymous',
        login: vi.fn(),
        logout: vi.fn(),
        refreshMe: vi.fn(),
    });
}

function setupRoomDetailsApi({
    room: nextRoom = room,
    floors = [floor],
    buildings = [building],
    reservations = [],
    resources = [createResource()],
    unavailabilities = [],
    incidents = [createIncident()],
    favorites = [],
    failRoom = false,
    failPrimary = false,
    failResources = false,
    failUnavailabilities = false,
    failIncidents = false,
}: RoomDetailsApiConfig = {}) {
    mockGet.mockImplementation(async (path: string) => {
        if (path === '/rooms/{id}') {
            if (failRoom) {
                return {
                    data: undefined,
                    error: { code: 'ROOM_NOT_FOUND' },
                };
            }

            return {
                data: nextRoom,
                error: undefined,
            };
        }

        if (path === '/rooms/{roomId}/reservations') {
            if (failPrimary) {
                return {
                    data: undefined,
                    error: { code: 'INTERNAL_SERVER_ERROR' },
                };
            }

            return {
                data: reservations,
                error: undefined,
            };
        }

        if (path === '/floors') {
            if (failPrimary) {
                return {
                    data: undefined,
                    error: { code: 'INTERNAL_SERVER_ERROR' },
                };
            }

            return {
                data: floors,
                error: undefined,
            };
        }

        if (path === '/buildings') {
            if (failPrimary) {
                return {
                    data: undefined,
                    error: { code: 'INTERNAL_SERVER_ERROR' },
                };
            }

            return {
                data: buildings,
                error: undefined,
            };
        }

        if (path === '/rooms/{roomId}/resources') {
            if (failResources) {
                return {
                    data: undefined,
                    error: { code: 'INTERNAL_SERVER_ERROR' },
                };
            }

            return {
                data: resources,
                error: undefined,
            };
        }

        if (path === '/rooms/{roomId}/unavailabilities') {
            if (failUnavailabilities) {
                return {
                    data: undefined,
                    error: { code: 'INTERNAL_SERVER_ERROR' },
                };
            }

            return {
                data: unavailabilities,
                error: undefined,
            };
        }

        if (path === '/rooms/{roomId}/incidents') {
            if (failIncidents) {
                return {
                    data: undefined,
                    error: { code: 'INTERNAL_SERVER_ERROR' },
                };
            }

            return {
                data: incidents,
                error: undefined,
            };
        }

        if (path === '/users/{userId}/favorites') {
            return {
                data: favorites,
                error: undefined,
            };
        }

        throw new Error(`Unhandled GET ${path}`);
    });

    mockPost.mockImplementation(async (path: string, options?: { body?: unknown }) => {
        if (path === '/favorites') {
            return {
                error: undefined,
            };
        }

        if (path === '/reservations') {
            return {
                data: createReservation({
                    room_id: room.id,
                    user_id: user.id,
                }),
                error: undefined,
            };
        }

        if (path === '/incidents') {
            const body = options?.body as {
                room_id: number;
                title: string;
                description?: string;
            };

            return {
                data: createIncident({
                    id: 2,
                    room_id: body.room_id,
                    user_id: user.id,
                    title: body.title,
                    description: body.description ?? null,
                }),
                error: undefined,
            };
        }

        throw new Error(`Unhandled POST ${path}`);
    });

    mockDelete.mockImplementation(async (path: string) => {
        if (path === '/users/{userId}/favorites/{roomId}') {
            return {
                error: undefined,
            };
        }

        throw new Error(`Unhandled DELETE ${path}`);
    });
}

function renderRoomDetails(route = '/room/10') {
    return renderWithProviders(<RoomDetails />, {
        route,
        path: '/room/:id',
    });
}

async function waitForRoomToLoad() {
    await screen.findByRole('heading', { level: 1, name: /Salle Atlas/i });
}

describe('RoomDetails', () => {
    beforeEach(() => {
        mockDelete.mockReset();
        mockGet.mockReset();
        mockNavigate.mockReset();
        mockPost.mockReset();
        mockUseAuth.mockReset();
        setAuthenticatedAuth();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('charge les details de la salle et affiche les sections principales', async () => {
        setupRoomDetailsApi();

        renderRoomDetails();

        expect(screen.getByText('Chargement des détails de la salle...')).toBeInTheDocument();

        await waitForRoomToLoad();

        expect(screen.getByText('Batiment A, Etage 2')).toBeInTheDocument();
        expect(screen.getByText('Disponible maintenant')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Ajouter aux favoris' })).toBeInTheDocument();
        expect(screen.getByText('Ecran')).toBeInTheDocument();
        expect(screen.getByText('Projecteur defectueux')).toBeInTheDocument();
        expect(screen.getByText('Aucune réservation pour cette salle.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Réserver maintenant' })).toBeInTheDocument();
    });

    it('affiche une erreur si l identifiant de salle est invalide', async () => {
        setupRoomDetailsApi();

        renderRoomDetails('/room/abc');

        await waitFor(() => {
            expect(screen.getByText('Identifiant de salle invalide.')).toBeInTheDocument();
        });

        expect(mockGet).not.toHaveBeenCalled();
    });

    it('affiche un warning si les donnees secondaires ne peuvent pas etre chargees', async () => {
        setupRoomDetailsApi({
            failResources: true,
            failUnavailabilities: true,
            failIncidents: true,
        });

        renderRoomDetails();

        await waitForRoomToLoad();

        expect(
            screen.getByText(
                "Certaines informations secondaires n'ont pas pu être chargées : ressources, indisponibilités, incidents.",
            ),
        ).toBeInTheDocument();

        expect(screen.getByRole('heading', { level: 1, name: /Salle Atlas/i })).toBeInTheDocument();
    });

    it('ajoute la salle aux favoris', async () => {
        setupRoomDetailsApi({
            favorites: [],
        });

        renderRoomDetails();

        await waitForRoomToLoad();

        fireEvent.click(screen.getByRole('button', { name: 'Ajouter aux favoris' }));

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/favorites', {
                body: {
                    room_id: 10,
                },
            });
        });

        expect(await screen.findByText('Salle ajoutée aux favoris.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Dans vos favoris' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('ouvre la modale puis retire la salle des favoris', async () => {
        setupRoomDetailsApi({
            favorites: [createFavorite()],
        });

        renderRoomDetails();

        await waitForRoomToLoad();

        fireEvent.click(screen.getByRole('button', { name: 'Dans vos favoris' }));

        expect(screen.getByRole('dialog', { name: 'Retirer cette salle des favoris ?' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Retirer des favoris' }));

        await waitFor(() => {
            expect(mockDelete).toHaveBeenCalledWith('/users/{userId}/favorites/{roomId}', {
                params: {
                    path: {
                        userId: 1,
                        roomId: 10,
                    },
                },
            });
        });

        expect(await screen.findByText('Salle retirée des favoris.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Ajouter aux favoris' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('cree une reservation puis affiche le toast de succes', async () => {
        setupRoomDetailsApi({
            reservations: [],
        });

        const { container } = renderRoomDetails();

        await waitForRoomToLoad();

        const dateInputs = Array.from(container.querySelectorAll('input[type="datetime-local"]')) as HTMLInputElement[];

        expect(dateInputs).toHaveLength(2);

        const [startInput, endInput] = dateInputs;

        fireEvent.change(startInput, { target: { value: '2099-06-26T10:00' } });
        fireEvent.change(endInput, { target: { value: '2099-06-26T11:00' } });

        fireEvent.click(screen.getByRole('button', { name: 'Réserver maintenant' }));

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/reservations', {
                body: {
                    room_id: 10,
                    start_time: new Date('2099-06-26T10:00').toISOString(),
                    end_time: new Date('2099-06-26T11:00').toISOString(),
                },
            });
        });

        expect(await screen.findByText('Reservation créée avec succès.')).toBeInTheDocument();
    });

    it('cree un signalement puis affiche le toast de succes', async () => {
        setupRoomDetailsApi({
            incidents: [],
        });

        renderRoomDetails();

        await waitForRoomToLoad();

        expect(screen.getByText('Aucun incident signalé pour cette salle.')).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText('Projecteur défectueux'), {
            target: { value: 'Micro coupe' },
        });

        fireEvent.change(screen.getByPlaceholderText('Décrivez le problème constaté...'), {
            target: { value: 'Le son se coupe apres quelques minutes.' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Envoyer le signalement' }));

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/incidents', {
                body: {
                    room_id: 10,
                    title: 'Micro coupe',
                    description: 'Le son se coupe apres quelques minutes.',
                },
            });
        });

        expect(await screen.findByText('Signalement envoyé avec succès.')).toBeInTheDocument();
        expect(screen.getByText('Micro coupe')).toBeInTheDocument();
        expect(screen.queryByText('Aucun incident signale pour cette salle.')).not.toBeInTheDocument();

        expect(screen.getByPlaceholderText('Projecteur défectueux')).toHaveValue('');
        expect(screen.getByPlaceholderText('Décrivez le problème constaté...')).toHaveValue('');
    });

    it('redirige vers /login si un utilisateur anonyme tente d ajouter un favori', async () => {
        setAnonymousAuth();
        setupRoomDetailsApi();

        renderRoomDetails();

        await waitForRoomToLoad();

        fireEvent.click(screen.getByRole('button', { name: 'Ajouter aux favoris' }));

        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
});
