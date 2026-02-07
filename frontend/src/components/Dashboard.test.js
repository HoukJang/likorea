import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const mockUseAuth = jest.fn();
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth()
}));

jest.mock('../contexts/MessageContext', () => ({
  useMessage: () => ({ unreadCount: 3, refreshUnreadCount: jest.fn() })
}));

jest.mock('../../package.json', () => ({ version: '1.0.0' }), { virtual: true });

describe('Dashboard', () => {
  const renderDashboard = (authState, path = '/dashboard/profile') => {
    mockUseAuth.mockReturnValue(authState);
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/dashboard/*" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders user dashboard for regular user', () => {
    renderDashboard({ user: { id: 'testuser', authority: 3 }, loading: false });
    expect(screen.getByText('사용자 대시보드')).toBeInTheDocument();
    expect(screen.getByText('프로필 및 메시지 관리')).toBeInTheDocument();
  });

  test('renders admin dashboard for admin user', () => {
    renderDashboard({ user: { id: 'admin', authority: 5 }, loading: false });
    expect(screen.getByText('관리자 대시보드')).toBeInTheDocument();
    expect(screen.getByText('시스템 관리 및 모니터링')).toBeInTheDocument();
    expect(screen.getByText('관리자')).toBeInTheDocument();
    expect(screen.getByText('Level 5')).toBeInTheDocument();
  });

  test('shows common tabs for regular user', () => {
    renderDashboard({ user: { id: 'testuser', authority: 3 }, loading: false });
    expect(screen.getByText('프로필')).toBeInTheDocument();
    expect(screen.getByText('스크랩')).toBeInTheDocument();
    expect(screen.getByText('쪽지함')).toBeInTheDocument();
    expect(screen.queryByText('사용자 관리')).not.toBeInTheDocument();
    expect(screen.queryByText('통계')).not.toBeInTheDocument();
  });

  test('shows admin tabs for admin user', () => {
    renderDashboard({ user: { id: 'admin', authority: 5 }, loading: false });
    expect(screen.getByText('사용자 관리')).toBeInTheDocument();
    expect(screen.getByText('통계')).toBeInTheDocument();
    expect(screen.getByText('트래픽')).toBeInTheDocument();
    expect(screen.getByText('배너 관리')).toBeInTheDocument();
  });

  test('displays unread message badge', () => {
    renderDashboard({ user: { id: 'testuser', authority: 3 }, loading: false });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('navigates when tab is clicked', () => {
    renderDashboard({ user: { id: 'testuser', authority: 3 }, loading: false });
    fireEvent.click(screen.getByText('스크랩'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/scraps');
  });

  test('shows user id in footer', () => {
    renderDashboard({ user: { id: 'testuser', authority: 3 }, loading: false });
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('로그인 계정:')).toBeInTheDocument();
  });

  test('shows version in footer', () => {
    renderDashboard({ user: { id: 'testuser', authority: 3 }, loading: false });
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  test('highlights active tab based on URL path', () => {
    renderDashboard(
      { user: { id: 'testuser', authority: 3 }, loading: false },
      '/dashboard/messages'
    );
    const messagesTab = screen.getByRole('tab', { name: /쪽지함/ });
    expect(messagesTab).toHaveAttribute('aria-selected', 'true');
  });

  test('shows fallback when no user', () => {
    renderDashboard({ user: null, loading: false });
    expect(screen.getByText('알 수 없음')).toBeInTheDocument();
  });
});
