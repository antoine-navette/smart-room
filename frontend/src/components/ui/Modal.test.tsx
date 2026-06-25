import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

function renderModal(overrides: Partial<ComponentProps<typeof Modal>> = {}) {
    const props: ComponentProps<typeof Modal> = {
        open: true,
        title: 'Titre',
        onClose: vi.fn(),
        children: <p>Contenu</p>,
        ...overrides,
    };

    return {
        ...render(<Modal {...props} />),
        props,
    };
}

describe('Modal', () => {
    it('ne rend rien quand open vaut false', () => {
        renderModal({ open: false });

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.queryByText('Contenu')).not.toBeInTheDocument();
    });

    it('affiche le titre, la description, le contenu et le footer quand la modale est ouverte', () => {
        renderModal({
            title: 'Supprimer ce favori ?',
            description: 'Cette action peut etre annulee plus tard.',
            footer: <button type="button">Confirmer</button>,
            children: <p>Contenu de la modale</p>,
        });

        expect(screen.getByRole('dialog', { name: 'Supprimer ce favori ?' })).toBeInTheDocument();
        expect(screen.getByText('Cette action peut etre annulee plus tard.')).toBeInTheDocument();
        expect(screen.getByText('Contenu de la modale')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Confirmer' })).toBeInTheDocument();
    });

    it('appelle onClose quand on clique sur le fond', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        renderModal({ onClose });

        await user.click(screen.getByRole('button', { name: 'Fermer la fenetre' }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('n appelle pas onClose quand on clique dans le contenu', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        renderModal({ onClose });

        await user.click(screen.getByRole('dialog', { name: 'Titre' }));

        expect(onClose).not.toHaveBeenCalled();
    });

    it('appelle onClose quand on appuie sur Escape', () => {
        const onClose = vi.fn();

        renderModal({ onClose });

        fireEvent.keyDown(window, { key: 'Escape' });

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('verrouille le scroll du body puis restaure la valeur precedente au demontage', () => {
        document.body.style.overflow = 'auto';

        const { unmount } = renderModal();

        expect(document.body.style.overflow).toBe('hidden');

        unmount();

        expect(document.body.style.overflow).toBe('auto');
    });
});
