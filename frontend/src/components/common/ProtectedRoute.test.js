import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

const mockUseAuth = jest.fn();
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth()
}));

describe('ProtectedRoute', () => {
  const renderWithRouter = (authState, props = {}, initialPath = '/protected') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute {...props}>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/dashboard/profile" element={<div>Profile Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows loading when auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    renderWithRouter();
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('redirects to /login when not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    renderWithRouter();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'testuser', authority: 3 }, loading: false });
    renderWithRouter();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('redirects to /dashboard/profile when authority too low', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'testuser', authority: 3 }, loading: false });
    renderWithRouter({}, { requiredAuthority: 5 });
    expect(screen.getByText('Profile Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('renders children when authority meets requirement', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'admin', authority: 5 }, loading: false });
    renderWithRouter({}, { requiredAuthority: 5 });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('redirects to /dashboard/profile when no user and authority required', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    renderWithRouter({}, { requiredAuth: false, requiredAuthority: 5 });
    expect(screen.getByText('Profile Page')).toBeInTheDocument();
  });

  test('allows access when requiredAuth is false and no user', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    renderWithRouter({}, { requiredAuth: false });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
