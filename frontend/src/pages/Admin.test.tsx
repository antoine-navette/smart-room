import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { components } from '../api/schema.d.ts';
import { createBuilding, createFloor, createRoom, createUser } from '../test/factories';
import { renderWithProviders } from '../test/renderWithProviders';
import Admin from './Admin';

const { mockDelete, mockGet, mockNavigate, mockPost, mockPushToast, mockPut, mockUseAuth } = vi.hoisted(() => ({
    mockDelete: vi.fn(),
    mockGet: vi.fn(),
    mockNavigate: vi.fn(),
    mockPost: vi.fn(),
    mockPushToast: vi.fn(),
    mockPut: vi.fn(),
    mockUseAuth: vi.fn(),
}));

vi.mock('../api/client', () => ({
    api: {
        DELETE: mockDelete,
        GET: mockGet,
        POST: mockPost,
        PUT: mockPut,
    },
}));

vi.mock('../auth/AuthProvider', () => ({
    useAuth: mockUseAuth,
}));

vi.mock('../components/ui/ToastProvider', async () => {
    const actual = await vi.importActual<typeof import('../components/ui/ToastProvider')>(
        '../components/ui/ToastProvider',
    );

    return {
        ...actual,
        useToast: () => ({
            pushToast: mockPushToast,
        }),
    };
});

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

type RoomResource = components['schemas']['RoomResource'];
type RoomResourceAssignment = components['schemas']['RoomResourceAssignment'];
type RoomUnavailability = components['schemas']['RoomUnavailability'];
type Incident = components['schemas']['Incident'];

const adminUser = createUser({
    id: 99,
    first_name: 'Ada',
    last_name: 'Root',
    email: 'ada@example.com',
    role: 'ADMIN',
});

const buildingA = createBuilding({ id: 1, name: 'Batiment A' });
const buildingB = createBuilding({ id: 2, name: 'Batiment B' });

const floorA = createFloor({ id: 10, name: 'Etage A1', building_id: buildingA.id });
const floorB = createFloor({ id: 20, name: 'Etage B1', building_id: buildingB.id });

const roomA = createRoom({ id: 100, name: 'Salle Atlas', floor_id: floorA.id, capacity: 8 });
const roomB = createRoom({ id: 200, name: 'Salle Nova', floor_id: floorB.id, capacity: 12 });

const resourceProjecteur = {
    id: 1,
    name: 'Projecteur',
} as RoomResource;

const resourceTableau = {
    id: 2,
    name: 'Tableau blanc',
} as RoomResource;

const existingAssignment = {
    room_id: roomA.id,
    resource_id: resourceProjecteur.id,
    quantity: 1,
    name: resourceProjecteur.name,
} as RoomResourceAssignment;

const unavailability = {
    id: 1,
    room_id: roomA.id,
    from_time: '2099-06-26T08:00:00.000Z',
    to_time: '2099-06-26T10:00:00.000Z',
    reason: 'Maintenance',
} as RoomUnavailability;

const incident = {
    id: 1,
    room_id: roomA.id,
    user_id: 1,
    title: 'Projecteur defectueux',
    description: 'Image noire',
    status: 'OPEN',
    created_at: '2099-06-25T09:00:00.000Z',
    resolved_at: null,
} as Incident;

type AdminApiConfig = {
    failLoad?: boolean;
    createUserErrorCode?: string;
};

function setupAdminApi({ failLoad = false, createUserErrorCode = '' }: AdminApiConfig = {}) {
    mockGet.mockImplementation(async (path: string, options?: any) => {
        if (path === '/buildings') {
            return failLoad
                ? { data: undefined, error: { code: 'INTERNAL_SERVER_ERROR' } }
                : { data: [buildingA, buildingB], error: undefined };
        }

        if (path === '/floors') {
            return {
                data: [floorA, floorB],
                error: undefined,
            };
        }

        if (path === '/rooms') {
            return {
                data: [roomA, roomB],
                error: undefined,
            };
        }

        if (path === '/room-resources') {
            return {
                data: [resourceProjecteur, resourceTableau],
                error: undefined,
            };
        }

        if (path === '/room-unavailabilities') {
            return {
                data: [unavailability],
                error: undefined,
            };
        }

        if (path === '/incidents') {
            return {
                data: [incident],
                error: undefined,
            };
        }

        if (path === '/rooms/{roomId}/resources') {
            const roomId = options?.params?.path?.roomId as number;

            return {
                data: roomId === roomA.id ? [existingAssignment] : [],
                error: undefined,
            };
        }

        throw new Error(`Unhandled GET ${path}`);
    });

    mockPost.mockImplementation(async (path: string, options?: { body?: any }) => {
        if (path === '/users') {
            if (createUserErrorCode) {
                return {
                    data: undefined,
                    error: { code: createUserErrorCode },
                };
            }

            const body = options?.body as {
                first_name: string;
                last_name: string;
                email: string;
                password: string;
            };

            return {
                data: createUser({
                    id: 55,
                    first_name: body.first_name,
                    last_name: body.last_name,
                    email: body.email,
                    role: 'USER',
                }),
                error: undefined,
            };
        }

        if (path === '/buildings') {
            const body = options?.body as {
                name: string;
            };

            return {
                data: createBuilding({
                    id: 3,
                    name: body.name,
                }),
                error: undefined,
            };
        }

        if (path === '/floors') {
            const body = options?.body as {
                name: string;
                building_id: number;
            };

            return {
                data: createFloor({
                    id: 30,
                    name: body.name,
                    building_id: body.building_id,
                }),
                error: undefined,
            };
        }

        if (path === '/rooms') {
            const body = options?.body as {
                name: string;
                floor_id: number;
                capacity: number;
            };

            return {
                data: createRoom({
                    id: 300,
                    name: body.name,
                    floor_id: body.floor_id,
                    capacity: body.capacity,
                }),
                error: undefined,
            };
        }

        if (path === '/room-resources') {
            const body = options?.body as {
                name: string;
            };

            return {
                data: {
                    id: 3,
                    name: body.name,
                } as RoomResource,
                error: undefined,
            };
        }

        if (path === '/room-unavailabilities') {
            const body = options?.body as {
                room_id: number;
                from_time: string;
                to_time: string;
                reason: string;
            };

            return {
                data: {
                    id: 2,
                    room_id: body.room_id,
                    from_time: body.from_time,
                    to_time: body.to_time,
                    reason: body.reason,
                } as RoomUnavailability,
                error: undefined,
            };
        }

        throw new Error(`Unhandled POST ${path}`);
    });

    mockPut.mockImplementation(async (path: string, options?: { params?: any; body?: any }) => {
        if (path === '/rooms/{roomId}/resources/{resourceId}') {
            const roomId = options?.params?.path?.roomId as number;
            const resourceId = options?.params?.path?.resourceId as number;
            const quantity = (options?.body as { quantity: number }).quantity;

            const resourceName =
                [resourceProjecteur, resourceTableau].find((resource) => resource.id === resourceId)?.name ??
                `Ressource ${resourceId}`;

            return {
                data: {
                    room_id: roomId,
                    resource_id: resourceId,
                    quantity,
                    name: resourceName,
                } as RoomResourceAssignment,
                error: undefined,
            };
        }

        return {
            data: undefined,
            error: undefined,
        };
    });

    mockDelete.mockResolvedValue({ data: undefined, error: undefined });
}

function renderAdmin() {
    return renderWithProviders(<Admin />, {
        route: '/admin',
        withToastProvider: false,
    });
}

async function waitForAdminToLoad() {
    await screen.findByRole('heading', {
        level: 1,
        name: /Centre de commandes/i,
    });
}

describe('Admin', () => {
    beforeEach(() => {
        mockDelete.mockReset();
        mockGet.mockReset();
        mockNavigate.mockReset();
        mockPost.mockReset();
        mockPushToast.mockReset();
        mockPut.mockReset();
        mockUseAuth.mockReset();

        mockUseAuth.mockReturnValue({
            user: adminUser,
            status: 'authenticated',
            login: vi.fn(),
            logout: vi.fn(),
            refreshMe: vi.fn(),
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('charge le centre d administration et affiche les sections principales', async () => {
        setupAdminApi();

        renderAdmin();

        expect(screen.getByText("Chargement du centre d'administration...")).toBeInTheDocument();

        await waitForAdminToLoad();

        expect(screen.getByText('Ajouter des utilisateurs')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Prénom')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Étage 1')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Salle 101')).toBeInTheDocument();
    });

    it('affiche une erreur globale si le chargement initial echoue', async () => {
        setupAdminApi({
            failLoad: true,
        });

        renderAdmin();

        expect(await screen.findByText("Impossible de charger le centre d'administration.")).toBeInTheDocument();

        expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
    });

    it('filtre l affichage des etages puis des salles selon les selects admin', async () => {
        setupAdminApi();

        renderAdmin();
        await waitForAdminToLoad();

        const floorNameInput = screen.getByPlaceholderText('Étage 1');
        const floorForm = floorNameInput.closest('form') as HTMLFormElement;
        const floorsSection = floorForm.parentElement as HTMLElement;
        const floorBuildingSelect = within(floorForm).getByRole('combobox') as HTMLSelectElement;

        fireEvent.change(floorBuildingSelect, {
            target: { value: String(buildingB.id) },
        });

        await waitFor(() => {
            expect(
                within(floorsSection).getByText(`Affichage limité au bâtiment ${buildingB.name}.`),
            ).toBeInTheDocument();
        });

        const visibleFloorTitles = within(floorsSection)
            .getAllByRole('heading', { level: 3 })
            .map((heading) => heading.textContent);

        expect(visibleFloorTitles).toEqual([floorB.name]);

        const roomNameInput = screen.getByPlaceholderText('Salle 101');
        const roomForm = roomNameInput.closest('form') as HTMLFormElement;
        const roomsSection = roomForm.parentElement as HTMLElement;
        const roomFloorSelect = within(roomForm).getByRole('combobox') as HTMLSelectElement;

        fireEvent.change(roomFloorSelect, {
            target: { value: String(floorB.id) },
        });

        await waitFor(() => {
            expect(
                within(roomsSection).getByText(`Affichage limité à l'étage ${floorB.name} (${buildingB.name}).`),
            ).toBeInTheDocument();
        });

        const visibleRoomTitles = within(roomsSection)
            .getAllByRole('heading', { level: 3 })
            .map((heading) => heading.textContent);

        expect(visibleRoomTitles).toEqual([roomB.name]);
    });

    it('cree un utilisateur via POST /users', async () => {
        setupAdminApi();

        renderAdmin();
        await waitForAdminToLoad();

        fireEvent.change(screen.getByPlaceholderText('Prénom'), {
            target: { value: 'Jeanne' },
        });
        fireEvent.change(screen.getByPlaceholderText('Nom'), {
            target: { value: 'Durand' },
        });
        fireEvent.change(screen.getByPlaceholderText('email@entreprise.com'), {
            target: { value: 'jeanne@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('Mot de passe (8 caractères min.)'), {
            target: { value: 'password123' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Créer le compte' }));

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/users', {
                body: {
                    first_name: 'Jeanne',
                    last_name: 'Durand',
                    email: 'jeanne@example.com',
                    password: 'password123',
                },
            });
        });

        expect(await screen.findByText('Dernier compte créé : Jeanne Durand - jeanne@example.com')).toBeInTheDocument();

        expect(mockPushToast).toHaveBeenCalledWith({
            type: 'success',
            message: 'Compte utilisateur créé avec succès.',
        });
    });

    it('affiche une erreur metier si l email existe deja', async () => {
        setupAdminApi({
            createUserErrorCode: 'EMAIL_ALREADY_EXISTS',
        });

        renderAdmin();
        await waitForAdminToLoad();

        fireEvent.change(screen.getByPlaceholderText('Prénom'), {
            target: { value: 'Jeanne' },
        });
        fireEvent.change(screen.getByPlaceholderText('Nom'), {
            target: { value: 'Durand' },
        });
        fireEvent.change(screen.getByPlaceholderText('email@entreprise.com'), {
            target: { value: 'jeanne@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('Mot de passe (8 caractères min.)'), {
            target: { value: 'password123' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Créer le compte' }));

        await waitFor(() => {
            expect(mockPushToast).toHaveBeenCalledWith({
                type: 'error',
                message: 'Cette adresse email existe déjà.',
            });
        });

        expect(screen.queryByText(/Dernier compte cree :/i)).not.toBeInTheDocument();
    });

    it('cree un batiment via POST /buildings', async () => {
        setupAdminApi();

        renderAdmin();
        await waitForAdminToLoad();

        const input = screen.getByPlaceholderText('Batiment A') as HTMLInputElement;

        fireEvent.change(input, {
            target: { value: 'Batiment C' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Ajouter le bâtiment' }));

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/buildings', {
                body: {
                    name: 'Batiment C',
                },
            });
        });

        expect(await screen.findByRole('heading', { level: 3, name: 'Batiment C' })).toBeInTheDocument();
        expect(input).toHaveValue('');

        expect(mockPushToast).toHaveBeenCalledWith({
            type: 'success',
            message: 'Bâtiment créé avec succès.',
        });
    });

    it('cree un etage via POST /floors', async () => {
        setupAdminApi();

        renderAdmin();
        await waitForAdminToLoad();

        const input = screen.getByPlaceholderText('Étage 1') as HTMLInputElement;
        const form = input.closest('form') as HTMLFormElement;
        const buildingSelect = within(form).getByRole('combobox') as HTMLSelectElement;

        fireEvent.change(buildingSelect, {
            target: { value: String(buildingB.id) },
        });

        fireEvent.change(input, {
            target: { value: 'Etage B2' },
        });

        fireEvent.click(within(form).getByRole('button', { name: "Ajouter l'étage" }));

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/floors', {
                body: {
                    name: 'Etage B2',
                    building_id: buildingB.id,
                },
            });
        });

        expect(await screen.findByRole('heading', { level: 3, name: 'Etage B2' })).toBeInTheDocument();
        expect(input).toHaveValue('');

        expect(mockPushToast).toHaveBeenCalledWith({
            type: 'success',
            message: 'Etage créé avec succès.',
        });
    });

    it('cree une salle via POST /rooms', async () => {
        setupAdminApi();

        renderAdmin();
        await waitForAdminToLoad();

        const nameInput = screen.getByPlaceholderText('Salle 101') as HTMLInputElement;
        const form = nameInput.closest('form') as HTMLFormElement;
        const floorSelect = within(form).getByRole('combobox') as HTMLSelectElement;
        const capacityInput = within(form).getByPlaceholderText('Capacité') as HTMLInputElement;

        fireEvent.change(floorSelect, {
            target: { value: String(floorB.id) },
        });

        fireEvent.change(nameInput, {
            target: { value: 'Salle Vega' },
        });

        fireEvent.change(capacityInput, {
            target: { value: '14' },
        });

        fireEvent.click(within(form).getByRole('button', { name: 'Ajouter la salle' }));

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/rooms', {
                body: {
                    name: 'Salle Vega',
                    floor_id: floorB.id,
                    capacity: 14,
                },
            });
        });

        expect(await screen.findByRole('heading', { level: 3, name: 'Salle Vega' })).toBeInTheDocument();
        expect(nameInput).toHaveValue('');
        expect(capacityInput).toHaveValue(null);

        expect(mockPushToast).toHaveBeenCalledWith({
            type: 'success',
            message: 'Salle créée avec succès.',
        });
    });

    it('cree une ressource via POST /room-resources', async () => {
        setupAdminApi();

        renderAdmin();
        await waitForAdminToLoad();

        const input = screen.getByPlaceholderText('Projecteur') as HTMLInputElement;

        fireEvent.change(input, {
            target: { value: 'Visioconference' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Ajouter la ressource' }));

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/room-resources', {
                body: {
                    name: 'Visioconference',
                },
            });
        });

        expect(await screen.findByRole('heading', { level: 3, name: 'Visioconference' })).toBeInTheDocument();
        expect(input).toHaveValue('');

        expect(mockPushToast).toHaveBeenCalledWith({
            type: 'success',
            message: 'Ressource créée avec succès.',
        });
    });

    it('affecte une ressource a une salle via PUT /rooms/{roomId}/resources/{resourceId}', async () => {
        setupAdminApi();

        renderAdmin();
        await waitForAdminToLoad();

        const assignButton = screen.getByRole('button', { name: 'Affecter' });
        const form = assignButton.closest('form') as HTMLFormElement;
        const assignmentSection = form.parentElement as HTMLElement;

        await waitFor(() => {
            expect(within(assignmentSection).queryByText('Chargement des affectations...')).not.toBeInTheDocument();
        });

        const [roomSelect, resourceSelect] = within(assignmentSection).getAllByRole('combobox') as HTMLSelectElement[];
        const quantityInput = within(form).getByRole('spinbutton') as HTMLInputElement;

        fireEvent.change(roomSelect, {
            target: { value: String(roomA.id) },
        });

        fireEvent.change(resourceSelect, {
            target: { value: String(resourceTableau.id) },
        });

        fireEvent.change(quantityInput, {
            target: { value: '3' },
        });

        fireEvent.click(assignButton);

        await waitFor(() => {
            expect(mockPut).toHaveBeenCalledWith('/rooms/{roomId}/resources/{resourceId}', {
                params: {
                    path: {
                        roomId: roomA.id,
                        resourceId: resourceTableau.id,
                    },
                },
                body: {
                    quantity: 3,
                },
            });
        });

        await waitFor(() => {
            const titles = within(assignmentSection)
                .getAllByRole('heading', { level: 3 })
                .map((heading) => heading.textContent);

            expect(titles).toContain('Tableau blanc');
        });

        expect(quantityInput).toHaveValue(1);

        expect(mockPushToast).toHaveBeenCalledWith({
            type: 'success',
            message: 'Ressource affectée à la salle.',
        });
    });

    it('cree une indisponibilite via POST /room-unavailabilities', async () => {
        setupAdminApi();

        renderAdmin();
        await waitForAdminToLoad();

        const submitButton = screen.getByRole('button', { name: 'Ajouter une indisponibilité' });
        const form = submitButton.closest('form') as HTMLFormElement;
        const roomSelect = within(form).getByRole('combobox') as HTMLSelectElement;
        const reasonInput = within(form).getByPlaceholderText('Maintenance, travaux...') as HTMLInputElement;
        const dateInputs = Array.from(form.querySelectorAll('input[type="datetime-local"]')) as HTMLInputElement[];

        expect(dateInputs).toHaveLength(2);

        const [fromInput, toInput] = dateInputs;

        fireEvent.change(roomSelect, {
            target: { value: String(roomB.id) },
        });

        fireEvent.change(fromInput, {
            target: { value: '2099-06-27T08:00' },
        });

        fireEvent.change(toInput, {
            target: { value: '2099-06-27T12:00' },
        });

        fireEvent.change(reasonInput, {
            target: { value: 'Travaux reseau' },
        });

        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/room-unavailabilities', {
                body: {
                    room_id: roomB.id,
                    from_time: new Date('2099-06-27T08:00').toISOString(),
                    to_time: new Date('2099-06-27T12:00').toISOString(),
                    reason: 'Travaux reseau',
                },
            });
        });

        expect(await screen.findByText('Travaux reseau')).toBeInTheDocument();
        expect(fromInput).toHaveValue('');
        expect(toInput).toHaveValue('');
        expect(reasonInput).toHaveValue('');

        expect(mockPushToast).toHaveBeenCalledWith({
            type: 'success',
            message: 'Indisponibilité créée. Les réservations en conflit ont pu être annulées.',
        });
    });
});
