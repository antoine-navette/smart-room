import type { ComponentProps } from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RoomCard } from './RoomCard';
import { renderWithProviders } from '../../test/renderWithProviders';

function renderRoomCard(overrides: Partial<ComponentProps<typeof RoomCard>> = {}) {
    const props: ComponentProps<typeof RoomCard> = {
        id: 12,
        title: 'Salle Atlas',
        capacity: 8,
        location: 'Batiment A - Etage 2',
        imageUrl: 'https://example.com/room.jpg',
        equipmentNames: ['Ecran', 'Tableau'],
        actionLabel: 'Voir les details',
        actionLink: '/room/12',
        ...overrides,
    };

    return renderWithProviders(<RoomCard {...props} />);
}

describe('RoomCard', () => {
    it('n affiche aucun badge de statut si status n est pas fourni', () => {
        renderRoomCard();

        expect(screen.queryByText('Disponible')).not.toBeInTheDocument();
        expect(screen.queryByText('Occupee')).not.toBeInTheDocument();
        expect(screen.queryByText('A venir')).not.toBeInTheDocument();
    });

    it('affiche le badge disponible avec le libelle fourni', () => {
        renderRoomCard({
            status: 'available',
            statusLabel: 'Disponible sur ce creneau',
        });

        expect(screen.getByText('Disponible sur ce creneau')).toBeInTheDocument();
    });

    it('affiche les equipements et le compteur supplementaire', () => {
        renderRoomCard({
            id: 5,
            title: 'Salle Orion',
            capacity: 12,
            location: 'Batiment B - Etage 1',
            imageUrl: 'https://example.com/orion.jpg',
            equipmentNames: ['Projecteur', 'Visioconference', 'Tableau'],
            additionalEquipmentCount: 2,
            actionLink: '/room/5',
        });

        expect(screen.getByText('Projecteur, Visioconference, Tableau')).toBeInTheDocument();
        expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('affiche un lien quand actionLink est fourni', () => {
        renderRoomCard({
            id: 7,
            title: 'Salle Vega',
            capacity: 4,
            location: 'Batiment C - Etage 3',
            imageUrl: 'https://example.com/vega.jpg',
            equipmentNames: [],
            actionLink: '/room/7',
        });

        expect(screen.getByRole('link', { name: 'Voir les details' })).toHaveAttribute('href', '/room/7');
    });

    it('affiche un bouton quand actionLink n est pas fourni', () => {
        renderRoomCard({
            id: 9,
            title: 'Salle Nova',
            capacity: 6,
            location: 'Batiment D - Etage 4',
            imageUrl: 'https://example.com/nova.jpg',
            equipmentNames: [],
            actionLabel: 'Reserver',
            actionLink: undefined,
        });

        expect(screen.getByRole('button', { name: 'Reserver' })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Reserver' })).not.toBeInTheDocument();
    });
});
