import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { components } from '../api/schema.d.ts';
import { createBuilding, createFloor, createRoom } from '../test/factories';
import { renderWithProviders } from '../test/renderWithProviders';
import Home from './Home';

const { mockGet } = vi.hoisted(() => ({
    mockGet: vi.fn(),
}));

vi.mock('../api/client', () => ({
    api: {
        GET: mockGet,
    },
}));

type Room = components['schemas']['Room'];
type Floor = components['schemas']['Floor'];
type Building = components['schemas']['Building'];
type RoomResourceAssignment = components['schemas']['RoomResourceAssignment'];

function createRoomResourceAssignment(overrides: Partial<RoomResourceAssignment> = {}): RoomResourceAssignment {
    return {
        room_id: 100,
        resource_id: 1,
        quantity: 1,
        name: 'Ecran',
        ...overrides,
    };
}

const buildingA = createBuilding({ id: 1, name: 'Batiment A' });
const buildingB = createBuilding({ id: 2, name: 'Batiment B' });

const floorA2 = createFloor({ id: 10, name: 'Etage 2', building_id: buildingA.id });
const floorB1 = createFloor({ id: 20, name: 'Etage 1', building_id: buildingB.id });

const atlasRoom = createRoom({
    id: 100,
    name: 'Salle Atlas',
    floor_id: floorA2.id,
    capacity: 8,
});

const orionRoom = createRoom({
    id: 200,
    name: 'Salle Orion',
    floor_id: floorB1.id,
    capacity: 12,
});

type HomeApiConfig = {
    rooms?: Room[];
    availableRooms?: Room[];
    floors?: Floor[];
    buildings?: Building[];
    resourcesByRoomId?: Record<number, RoomResourceAssignment[]>;
    failReferenceData?: boolean;
    failRooms?: boolean;
};

function setupHomeApi({
    rooms = [atlasRoom, orionRoom],
    availableRooms = [orionRoom],
    floors = [floorA2, floorB1],
    buildings = [buildingA, buildingB],
    resourcesByRoomId = {
        [atlasRoom.id]: [
            createRoomResourceAssignment({
                room_id: atlasRoom.id,
                resource_id: 1,
                quantity: 1,
                name: 'Ecran',
            }),
            createRoomResourceAssignment({
                room_id: atlasRoom.id,
                resource_id: 2,
                quantity: 1,
                name: 'Tableau',
            }),
        ],
        [orionRoom.id]: [
            createRoomResourceAssignment({
                room_id: orionRoom.id,
                resource_id: 3,
                quantity: 2,
                name: 'Projecteur',
            }),
            createRoomResourceAssignment({
                room_id: orionRoom.id,
                resource_id: 4,
                quantity: 1,
                name: 'Visioconference',
            }),
        ],
    },
    failReferenceData = false,
    failRooms = false,
}: HomeApiConfig = {}) {
    mockGet.mockImplementation(async (path: string, options?: any) => {
        if (path === '/floors') {
            if (failReferenceData) {
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
            return {
                data: buildings,
                error: undefined,
            };
        }

        if (path === '/rooms') {
            if (failRooms) {
                return {
                    data: undefined,
                    error: { code: 'INTERNAL_SERVER_ERROR' },
                };
            }

            return {
                data: rooms,
                error: undefined,
            };
        }

        if (path === '/rooms/available') {
            return {
                data: availableRooms,
                error: undefined,
            };
        }

        if (path === '/rooms/{roomId}/resources') {
            const roomId = options?.params?.path?.roomId as number;

            return {
                data: resourcesByRoomId[roomId] ?? [],
                error: undefined,
            };
        }

        throw new Error(`Unhandled GET ${path}`);
    });
}

function renderHome() {
    return renderWithProviders(<Home />);
}

async function waitForInitialRooms() {
    await screen.findByRole('heading', { name: 'Salle Atlas' });
}

function getHeroControls(container: HTMLElement) {
    const queryInput = screen.getByPlaceholderText('Salle, bâtiment, étage...');
    const [buildingSelect, floorSelect, capacitySelect] = screen.getAllByRole('combobox') as HTMLSelectElement[];
    const dateInputs = Array.from(container.querySelectorAll('input[type="datetime-local"]')) as HTMLInputElement[];

    expect(dateInputs).toHaveLength(2);

    return {
        queryInput,
        buildingSelect,
        floorSelect,
        capacitySelect,
        startInput: dateInputs[0],
        endInput: dateInputs[1],
    };
}

describe('Home', () => {
    beforeEach(() => {
        mockGet.mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('charge les references, les salles et affiche les cartes sans badge de disponibilite au chargement initial', async () => {
        setupHomeApi();

        renderHome();

        expect(screen.getByText('Chargement des salles...')).toBeInTheDocument();

        await waitForInitialRooms();

        expect(screen.getByRole('heading', { name: 'Salle Orion' })).toBeInTheDocument();
        expect(screen.queryByText('Disponible sur ce créneau')).not.toBeInTheDocument();
        expect(screen.getByText('Ecran, Tableau')).toBeInTheDocument();

        expect(mockGet.mock.calls.filter(([path]) => path === '/rooms')).toHaveLength(1);
        expect(mockGet.mock.calls.filter(([path]) => path === '/rooms/{roomId}/resources')).toHaveLength(2);
    });

    it('utilise /rooms/available quand un creneau valide est recherche', async () => {
        setupHomeApi({
            availableRooms: [orionRoom],
        });

        const { container } = renderHome();

        await waitForInitialRooms();

        const { startInput, endInput } = getHeroControls(container);

        fireEvent.change(startInput, { target: { value: '2099-06-26T10:00' } });
        fireEvent.change(endInput, { target: { value: '2099-06-26T11:00' } });

        fireEvent.click(screen.getByRole('button', { name: 'Rechercher' }));

        await waitFor(() => {
            expect(screen.getByText('Disponible sur ce créneau')).toBeInTheDocument();
        });

        expect(screen.getByRole('heading', { name: 'Salle Orion' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Salle Atlas' })).not.toBeInTheDocument();

        expect(mockGet).toHaveBeenCalledWith('/rooms/available', {
            params: {
                query: {
                    start: new Date('2099-06-26T10:00').toISOString(),
                    end: new Date('2099-06-26T11:00').toISOString(),
                },
            },
        });
    });

    it('affiche un toast d erreur si un seul champ de creneau est renseigne', async () => {
        setupHomeApi();

        const { container } = renderHome();

        await waitForInitialRooms();
        mockGet.mockClear();

        const { startInput } = getHeroControls(container);

        fireEvent.change(startInput, { target: { value: '2099-06-26T10:00' } });
        fireEvent.click(screen.getByRole('button', { name: 'Rechercher' }));

        const alert = await screen.findByRole('alert');

        expect(alert).toHaveTextContent('Filtres invalides');
        expect(alert).toHaveTextContent(
            'Renseignez une date de début et une date de fin pour filtrer la disponibilité.',
        );
        expect(mockGet).not.toHaveBeenCalled();
    });

    it('reinitialise les filtres et recharge /rooms sans badge de disponibilite', async () => {
        setupHomeApi({
            availableRooms: [orionRoom],
        });

        const { container } = renderHome();

        await waitForInitialRooms();

        const { startInput, endInput } = getHeroControls(container);

        fireEvent.change(startInput, { target: { value: '2099-06-26T10:00' } });
        fireEvent.change(endInput, { target: { value: '2099-06-26T11:00' } });
        fireEvent.click(screen.getByRole('button', { name: 'Rechercher' }));

        await screen.findByText('Disponible sur ce créneau');

        fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }));

        await waitFor(() => {
            expect(screen.queryByText('Disponible sur ce créneau')).not.toBeInTheDocument();
        });

        expect(screen.getByRole('heading', { name: 'Salle Atlas' })).toBeInTheDocument();
        expect(mockGet.mock.calls.filter(([path]) => path === '/rooms')).toHaveLength(2);
    });

    it('affiche un message d erreur si le chargement initial echoue', async () => {
        setupHomeApi({
            failReferenceData: true,
        });

        renderHome();

        await waitFor(() => {
            expect(screen.getByText('Impossible de charger les salles pour le moment.')).toBeInTheDocument();
        });

        expect(screen.queryByRole('heading', { name: 'Salle Atlas' })).not.toBeInTheDocument();
    });
});
