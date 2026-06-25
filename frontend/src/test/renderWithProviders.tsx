import type { PropsWithChildren, ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../components/ui/ToastProvider';

type Options = {
  route?: string;
  path?: string;
  withToastProvider?: boolean;
} & Omit<RenderOptions, 'wrapper'>;

export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    path,
    withToastProvider = true,
    ...renderOptions
  }: Options = {},
) {
  function Wrapper({ children }: PropsWithChildren) {
    const content = withToastProvider ? <ToastProvider>{children}</ToastProvider> : children;

    return <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>;
  }

  const routedUi = path ? (
    <Routes>
      <Route path={path} element={ui} />
    </Routes>
  ) : (
    ui
  );

  return render(routedUi, {
    wrapper: Wrapper,
    ...renderOptions,
  });
}