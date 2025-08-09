import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock useAuth hook
const mockLogin = jest.fn();
const mockClearError = jest.fn();
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    loading: false,
    error: null,
    clearError: mockClearError
  })
}));

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  test('renders login form', () => {
    renderLogin();

    expect(screen.getByPlaceholderText('아이디 입력')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('비밀번호 입력')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  test('shows validation errors for empty fields', async () => {
    renderLogin();

    const submitButton = screen.getByRole('button', { name: '로그인' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('아이디와 비밀번호를 모두 입력해주세요.')).toBeInTheDocument();
    });
  });

  test('calls login with form data', async () => {
    mockLogin.mockResolvedValue();

    renderLogin();

    const idInput = screen.getByPlaceholderText('아이디 입력');
    const passwordInput = screen.getByPlaceholderText('비밀번호 입력');
    const submitButton = screen.getByRole('button', { name: '로그인' });

    fireEvent.change(idInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        id: 'testuser',
        password: 'password123'
      });
    });
  });

  test('navigates to home page after successful login', async () => {
    mockLogin.mockResolvedValue();

    renderLogin();

    const idInput = screen.getByPlaceholderText('아이디 입력');
    const passwordInput = screen.getByPlaceholderText('비밀번호 입력');
    const submitButton = screen.getByRole('button', { name: '로그인' });

    fireEvent.change(idInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('displays error message on login failure', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    renderLogin();

    const idInput = screen.getByPlaceholderText('아이디 입력');
    const passwordInput = screen.getByPlaceholderText('비밀번호 입력');
    const submitButton = screen.getByRole('button', { name: '로그인' });

    fireEvent.change(idInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/)).toBeInTheDocument();
    });
  });
});