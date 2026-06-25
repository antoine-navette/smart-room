import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FavoriteRemovalModal } from './FavoriteRemovalModal';

function renderModal(overrides: Partial<ComponentProps<typeof FavoriteRemovalModal>> = {}) {
    const props: ComponentProps<typeof FavoriteRemovalModal> = {
        open: true,
        roomName: 'Salle Atlas',
        location: 'Batiment A - Etage 2',
        onClose: vi.fn(),
        onConfirm: vi.fn(),
        ...overrides,
    };

    return {
        ...render(<FavoriteRemovalModal {...props} />),
        props,
    };
}

describe('FavoriteRemovalModal', () => {
    it('affiche le contenu attendu quand la modale est ouverte', () => {
        renderModal();

        expect(screen.getByRole('dialog', { name: 'Retirer cette salle des favoris ?' })).toBeInTheDocument();
        expect(screen.getByText('Salle concernée')).toBeInTheDocument();
        expect(screen.getByText('Salle Atlas')).toBeInTheDocument();
        expect(screen.getByText('Batiment A - Etage 2')).toBeInTheDocument();
    });

    it('declenche onClose au clic sur le bouton d annulation', () => {
        const onClose = vi.fn();

        renderModal({ onClose });

        fireEvent.click(screen.getByRole('button', { name: /^Annuler$/ }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('declenche onConfirm au clic sur le bouton de suppression', () => {
        const onConfirm = vi.fn();

        renderModal({ onConfirm });

        fireEvent.click(screen.getByRole('button', { name: /^Retirer des favoris$/ }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('desactive les actions pendant la suppression', () => {
        renderModal({ isPending: true });

        expect(screen.getByRole('button', { name: /^Annuler$/ })).toBeDisabled();
        expect(screen.getByRole('button', { name: /^Suppression\.\.\.$/ })).toBeDisabled();
    });

    it('empeche la fermeture par overlay pendant une suppression en cours', () => {
        const onClose = vi.fn();

        renderModal({ isPending: true, onClose });

        fireEvent.click(screen.getByRole('button', { name: 'Fermer la fenetre' }));

        expect(onClose).not.toHaveBeenCalled();
    });
});
