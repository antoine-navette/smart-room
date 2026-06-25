import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute';

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}));

vi.mock('./AuthProvider', () => ({
  useAuth: mockUseAuth,
}));

function renderProtectedRoute({
  route,
  requireAdmin = false,
}: {
  route: '/dashboard' | '/admin';
  requireAdmin?: boolean;
}) {
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/" element={<div>Home page</div>} />
        <Route path="/login" element={<div>Login page</div>} />

        <Route element={<ProtectedRoute requireAdmin={requireAdmin} />}>
          <Route path="/dashboard" element={<div>Dashboard page</div>} />
          <Route path="/admin" element={<div>Admin page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('affiche l etat de chargement quand le statut est loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      status: 'loading',
    });

    renderProtectedRoute({ route: '/dashboard' });

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('redirige vers /login quand l utilisateur est anonyme', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      status: 'anonymous',
    });

    renderProtectedRoute({ route: '/dashboard' });

    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });

  it('redirige vers / quand un utilisateur non admin tente d acceder a /admin', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, role: 'USER' },
      status: 'authenticated',
    });

    renderProtectedRoute({ route: '/admin', requireAdmin: true });

    expect(await screen.findByText('Home page')).toBeInTheDocument();
  });

  it('laisse passer un admin sur /admin', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, role: 'ADMIN' },
      status: 'authenticated',
    });

    renderProtectedRoute({ route: '/admin', requireAdmin: true });

    expect(await screen.findByText('Admin page')).toBeInTheDocument();
  });
});