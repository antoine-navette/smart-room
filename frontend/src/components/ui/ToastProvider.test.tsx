import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast } from './ToastProvider';

function ToastHarness() {
  const { pushToast } = useToast();

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          pushToast({
            type: 'success',
            title: 'Succes',
            message: 'Operation terminee',
            durationMs: 1000,
          })
        }
      >
        Afficher succes
      </button>

      <button
        type="button"
        onClick={() =>
          pushToast({
            type: 'error',
            message: 'Une erreur est survenue',
            durationMs: 1000,
          })
        }
      >
        Afficher erreur
      </button>

      <button
        type="button"
        onClick={() => {
          for (let index = 1; index <= 5; index += 1) {
            pushToast({
              type: 'info',
              message: `Toast ${index}`,
              durationMs: 5000,
            });
          }
        }}
      >
        Afficher cinq toasts
      </button>
    </div>
  );
}

function OutsideConsumer() {
  useToast();
  return null;
}

function renderToastHarness() {
  return render(
    <ToastProvider>
      <ToastHarness />
    </ToastProvider>,
  );
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('affiche une notification quand pushToast est appele', () => {
    renderToastHarness();

    fireEvent.click(screen.getByRole('button', { name: 'Afficher succes' }));

    expect(screen.getByRole('status')).toHaveTextContent('Succes');
    expect(screen.getByRole('status')).toHaveTextContent('Operation terminee');
  });

  it('ferme automatiquement la notification apres le delai', () => {
    renderToastHarness();

    fireEvent.click(screen.getByRole('button', { name: 'Afficher erreur' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Une erreur est survenue');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByText('Une erreur est survenue')).not.toBeInTheDocument();
  });

  it('permet de fermer manuellement une notification', () => {
    renderToastHarness();

    fireEvent.click(screen.getByRole('button', { name: 'Afficher succes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la notification' }));

    expect(screen.queryByText('Operation terminee')).not.toBeInTheDocument();
  });

  it('limite la pile a 4 notifications', () => {
    renderToastHarness();

    fireEvent.click(screen.getByRole('button', { name: 'Afficher cinq toasts' }));

    expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
    expect(screen.getByText('Toast 3')).toBeInTheDocument();
    expect(screen.getByText('Toast 4')).toBeInTheDocument();
    expect(screen.getByText('Toast 5')).toBeInTheDocument();
  });

  it('leve une erreur si useToast est utilise hors provider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      expect(() => render(<OutsideConsumer />)).toThrow(
        'useToast must be used within a ToastProvider',
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});