import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthGuard from '@/components/AuthGuard';

const { mockRouter, authState } = vi.hoisted(() => ({
  mockRouter: { replace: vi.fn() },
  authState: { user: null, loading: false, isAuthenticated: false },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

function ProtectedContent() {
  return <p>Protected content</p>;
}

describe('AuthGuard', () => {
  beforeEach(() => {
    mockRouter.replace.mockClear();
  });

  it('shows the loading fallback while auth resolves', () => {
    authState.loading = true;
    render(<AuthGuard><ProtectedContent /></AuthGuard>);
    expect(screen.getByText('Checking your access…')).toBeInTheDocument();
    authState.loading = false;
  });

  it('redirects unauthenticated users to /login', async () => {
    authState.user = null;
    authState.loading = false;
    authState.isAuthenticated = false;
    render(<AuthGuard><ProtectedContent /></AuthGuard>);
    expect(await screen.findByText('Checking your access…')).toBeInTheDocument();
    expect(mockRouter.replace).toHaveBeenCalledWith('/login');
  });

  it('renders children for a role in the allow-list', async () => {
    authState.user = { role: 'manager' };
    authState.loading = false;
    authState.isAuthenticated = true;
    render(<AuthGuard roles={['administrator', 'owner', 'manager']}><ProtectedContent /></AuthGuard>);
    expect(await screen.findByText('Protected content')).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('redirects a disallowed role to /dashboard', async () => {
    authState.user = { role: 'tenant' };
    authState.loading = false;
    authState.isAuthenticated = true;
    render(<AuthGuard roles={['administrator', 'owner', 'manager']}><ProtectedContent /></AuthGuard>);
    expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
  });

  it('opens the page to any authenticated user when roles are omitted', async () => {
    authState.user = { role: 'tenant' };
    authState.loading = false;
    authState.isAuthenticated = true;
    render(<AuthGuard><ProtectedContent /></AuthGuard>);
    expect(await screen.findByText('Protected content')).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});