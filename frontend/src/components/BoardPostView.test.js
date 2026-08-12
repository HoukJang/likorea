import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import BoardPostView from './BoardPostView';

let mockUser = null;
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser })
}));

const mockGetBoardPost = jest.fn();
const mockGetComments = jest.fn();
const mockGetAllTags = jest.fn();

jest.mock('../api/boards', () => ({
  getBoardPost: (...args) => mockGetBoardPost(...args),
  getComments: (...args) => mockGetComments(...args),
  deleteBoard: jest.fn(),
  addComment: jest.fn(),
  deleteComment: jest.fn(),
  updateComment: jest.fn()
}));

jest.mock('../api/tags', () => ({
  getAllTags: (...args) => mockGetAllTags(...args)
}));

jest.mock('../api/approval', () => ({
  getPendingPost: jest.fn(),
  approvePost: jest.fn(),
  rejectPost: jest.fn()
}));

jest.mock('../api/scrap', () => ({
  toggleScrap: jest.fn(),
  checkScrapStatus: jest.fn().mockResolvedValue({ success: true, isScrapped: false })
}));

jest.mock('../contexts/ToastContext', () => ({
  useToast: () => ({
    toast: { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() },
    confirm: jest.fn().mockResolvedValue(true),
    prompt: jest.fn()
  })
}));

jest.mock('./FloatingActionButtons', () => {
  return function MockFloatingActionButtons() {
    return <div data-testid="floating-actions" />;
  };
});

jest.mock('./PostActionBar', () => {
  return function MockPostActionBar() {
    return <div data-testid="post-action-bar" />;
  };
});

const AUTHOR = { _id: 'a1', id: 'likorea', authority: 5 };

const renderPostView = () =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/boards/post1']}>
        <Routes>
          <Route path="/boards/:postId" element={<BoardPostView />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );

describe('BoardPostView 수정/삭제 권한', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
    mockGetAllTags.mockResolvedValue({ success: true, tags: { type: [], region: [] } });
    mockGetBoardPost.mockResolvedValue({
      success: true,
      post: {
        _id: 'post1',
        title: '테스트 게시글',
        content: '<p>본문</p>',
        author: AUTHOR,
        tags: { type: '생활정보', region: '0' },
        viewCount: 1,
        createdAt: '2026-08-12T00:00:00.000Z',
        comments: []
      }
    });
    mockGetComments.mockResolvedValue({ success: true, comments: [] });
  });

  test('인증 정보가 게시글 로드보다 늦게 도착해도 작성자에게 삭제 버튼이 보인다', async () => {
    const { rerender } = renderPostView();

    // 게시글은 로드됐지만 user는 아직 null (verify 미완료 상태)
    await screen.findByText('테스트 게시글');
    expect(screen.queryByLabelText('게시글 삭제')).not.toBeInTheDocument();

    // 인증 완료가 뒤늦게 도착
    mockUser = { id: 'likorea', authority: 5 };
    rerender(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/boards/post1']}>
          <Routes>
            <Route path="/boards/:postId" element={<BoardPostView />} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('게시글 삭제')).toBeInTheDocument();
    });
  });

  test('작성자가 아닌 낮은 권한 사용자에게는 삭제 버튼이 없다', async () => {
    mockUser = { id: 'someone', authority: 3 };
    renderPostView();

    await screen.findByText('테스트 게시글');
    expect(screen.queryByLabelText('게시글 삭제')).not.toBeInTheDocument();
  });
});
