import type { ComponentProps } from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { createBuilding, createFloor, createReservation, createRoom, createUser } from '../../test/factories';
import { ManageableReservationCard } from './ManageableReservationCard';

const { mockDelete, mockPut, mockNavigate } = vi.hoisted(() => ({
    mockDelete: vi.fn(),
    mockPut: vi.fn(),
    mockNavigate: vi.fn(),
}));

vi.mock('../../api/client', () => ({
    api: {
        DELETE: mockDelete,
        PUT: mockPut,
    },
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const room = createRoom();
const floor = createFloor({ id: room.floor_id, building_id: 30 });
const building = createBuilding({ id: floor.building_id });
const user = createUser();

function renderCard(overrides: Partial<ComponentProps<typeof ManageableReservationCard>> = {}) {
    const props: ComponentProps<typeof ManageableReservationCard> = {
        reservation: createReservation({ room_id: room.id }),
        rooms: [room],
        floorById: new Map([[floor.id, floor]]),
        buildingById: new Map([[building.id, building]]),
        user,
        allowManage: true,
        onUpdated: vi.fn(),
        onDeleted: vi.fn(),
        onFeedback: vi.fn(),
        ...overrides,
    };

    return {
        ...renderWithProviders(<ManageableReservationCard {...props} />),
        props,
    };
}

describe('ManageableReservationCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('affiche les informations principales de la reservation', () => {
        renderCard();

        expect(screen.getByText('Salle Atlas')).toBeInTheDocument();
        expect(screen.getByText('Batiment A - Etage 2')).toBeInTheDocument();
        expect(screen.getByText('Réservation #99')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Voir la salle' })).toHaveAttribute('href', '/room/10');
    });

    it('ouvre la modale de modification', () => {
        renderCard();

        fireEvent.click(screen.getByRole('button', { name: /^Modifier$/ }));

        expect(screen.getByRole('dialog', { name: 'Modifier la réservation' })).toBeInTheDocument();
        expect(
            screen.getByText('Vous pouvez ajuster la salle et le créneau tant que la réservation est encore à venir.'),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^Enregistrer les modifications$/ })).toBeInTheDocument();
    });

    it('annule une reservation et remonte le succes', async () => {
        const onDeleted = vi.fn();
        const onFeedback = vi.fn();

        vi.spyOn(window, 'confirm').mockReturnValue(true);
        mockDelete.mockResolvedValue({ error: undefined });

        renderCard({ onDeleted, onFeedback });

        fireEvent.click(screen.getByRole('button', { name: /^Annuler$/ }));

        expect(window.confirm).toHaveBeenCalledTimes(1);
        expect(mockDelete).toHaveBeenCalledWith('/reservations/{id}', {
            params: { path: { id: 99 } },
        });

        await waitFor(() => {
            expect(onDeleted).toHaveBeenCalledWith(99);
        });

        expect(onFeedback).toHaveBeenLastCalledWith('success', 'La réservation a bien été annulée.');
    });

    it('bloque la sauvegarde si le nouveau debut est dans le passe', async () => {
        const onFeedback = vi.fn();

        renderCard({ onFeedback });

        fireEvent.click(screen.getByRole('button', { name: /^Modifier$/ }));

        const dialog = screen.getByRole('dialog', { name: 'Modifier la réservation' });
        const dateInputs = Array.from(dialog.querySelectorAll('input[type="datetime-local"]')) as HTMLInputElement[];

        expect(dateInputs).toHaveLength(2);

        const [startInput, endInput] = dateInputs;

        fireEvent.change(startInput, { target: { value: '2000-01-01T09:00' } });
        fireEvent.change(endInput, { target: { value: '2000-01-01T10:00' } });

        fireEvent.click(screen.getByRole('button', { name: /^Enregistrer les modifications$/ }));

        await waitFor(() => {
            expect(onFeedback).toHaveBeenLastCalledWith(
                'error',
                'Le début de la réservation doit rester dans le futur.',
            );
        });

        expect(mockPut).not.toHaveBeenCalled();
    });

    it('sauvegarde une modification valide', async () => {
        const onUpdated = vi.fn();
        const onFeedback = vi.fn();

        const updatedReservation = createReservation({
            room_id: room.id,
            end_time: '2099-06-26T11:30:00.000Z',
        });

        mockPut.mockResolvedValue({
            data: updatedReservation,
            error: undefined,
        });

        renderCard({ onUpdated, onFeedback });

        fireEvent.click(screen.getByRole('button', { name: /^Modifier$/ }));
        fireEvent.click(screen.getByRole('button', { name: /^Enregistrer les modifications$/ }));

        await waitFor(() => {
            expect(onUpdated).toHaveBeenCalledWith(updatedReservation);
        });

        expect(mockPut).toHaveBeenCalledTimes(1);
        expect(onFeedback).toHaveBeenLastCalledWith('success', 'La réservation a bien été modifiée.');
    });
});
