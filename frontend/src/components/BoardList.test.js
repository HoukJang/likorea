import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import BoardList from './BoardList';

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'testuser', authority: 3 } })
}));

const mockGetBoards = jest.fn();
const mockGetAllTags = jest.fn();
const mockGetPendingPosts = jest.fn();
const mockGetUserScraps = jest.fn();

jest.mock('../api/boards', () => ({
  getBoards: (...args) => mockGetBoards(...args)
}));

jest.mock('../api/tags', () => ({
  getAllTags: (...args) => mockGetAllTags(...args)
}));

jest.mock('../api/approval', () => ({
  getPendingPosts: (...args) => mockGetPendingPosts(...args)
}));

jest.mock('../api/scrap', () => ({
  getUserScraps: (...args) => mockGetUserScraps(...args)
}));

jest.mock('./TagFilter', () => {
  return function MockTagFilter() {
    return <div data-testid="tag-filter">TagFilter</div>;
  };
});

jest.mock('./board/BoardTable', () => {
  return function MockBoardTable({ posts }) {
    return (
      <div data-testid="board-table">
        {posts.map((p, i) => (
          <div key={i} data-testid="board-row">{p.title}</div>
        ))}
      </div>
    );
  };
});

jest.mock('./board/BoardCards', () => {
  return function MockBoardCards() {
    return <div data-testid="board-cards" />;
  };
});

jest.mock('./board/BoardPagination', () => {
  return function MockBoardPagination({ currentPage, totalPages }) {
    return <div data-testid="board-pagination">Page {currentPage} of {totalPages}</div>;
  };
});

jest.mock('../utils/dataUtils', () => ({
  processPostsList: (posts) => posts
}));

const renderBoardList = (props = {}) => {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <BoardList {...props} />
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('BoardList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllTags.mockResolvedValue({ tags: [] });
    mockGetUserScraps.mockResolvedValue({ scraps: [] });
  });

  test('shows loading state initially', () => {
    mockGetBoards.mockReturnValue(new Promise(() => {}));
    renderBoardList();
    expect(screen.getByText('게시글을 불러오는 중...')).toBeInTheDocument();
  });

  test('renders posts after loading', async () => {
    const mockPosts = [
      { _id: '1', title: '첫번째 게시글', author: 'user1' },
      { _id: '2', title: '두번째 게시글', author: 'user2' }
    ];
    mockGetBoards.mockResolvedValue({ posts: mockPosts, totalPages: 1 });

    renderBoardList();

    await waitFor(() => {
      expect(screen.getByText('첫번째 게시글')).toBeInTheDocument();
      expect(screen.getByText('두번째 게시글')).toBeInTheDocument();
    });
  });

  test('shows error state on API failure', async () => {
    mockGetBoards.mockRejectedValue(new Error('서버 오류'));

    renderBoardList();

    await waitFor(() => {
      expect(screen.getByText('오류: 서버 오류')).toBeInTheDocument();
    });
  });

  test('shows empty state when no posts', async () => {
    mockGetBoards.mockResolvedValue({ posts: [], totalPages: 1 });

    renderBoardList();

    await waitFor(() => {
      expect(screen.getByText('게시글이 없습니다.')).toBeInTheDocument();
    });
  });

  test('renders TagFilter for normal mode', async () => {
    mockGetBoards.mockResolvedValue({ posts: [], totalPages: 1 });

    renderBoardList();

    await waitFor(() => {
      expect(screen.getByTestId('tag-filter')).toBeInTheDocument();
    });
  });

  test('hides TagFilter in pendingOnly mode', async () => {
    mockGetPendingPosts.mockResolvedValue({ posts: [], pagination: { pages: 1 } });

    renderBoardList({ pendingOnly: true });

    await waitFor(() => {
      expect(screen.queryByTestId('tag-filter')).not.toBeInTheDocument();
    });
  });

  test('renders pagination with correct page info', async () => {
    mockGetBoards.mockResolvedValue({
      posts: [{ _id: '1', title: 'Test' }],
      totalPages: 5
    });

    renderBoardList();

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
    });
  });

  test('uses getPendingPosts API in pendingOnly mode', async () => {
    mockGetPendingPosts.mockResolvedValue({ posts: [], pagination: { pages: 1 } });

    renderBoardList({ pendingOnly: true });

    await waitFor(() => {
      expect(mockGetPendingPosts).toHaveBeenCalled();
      expect(mockGetBoards).not.toHaveBeenCalled();
    });
  });
});
