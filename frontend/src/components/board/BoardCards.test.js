import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BoardCards from './BoardCards';

jest.mock('../common/UserMenu', () => ({ username }) => (
  <span className="user-menu-container">
    <button type="button">{username}</button>
  </span>
));

const posts = [
  {
    _id: 'abc123',
    id: 'abc123',
    postNumber: 67,
    title: '플러싱 카페의 여름 마무리',
    author: { _id: 'u1', id: 'likorea' },
    viewCount: 12,
    commentCount: 2,
    createdAt: new Date().toISOString(),
    tags: { type: '생활정보', region: '0' }
  }
];

const renderCards = (props = {}) =>
  render(
    <MemoryRouter>
      <BoardCards posts={posts} tagList={{}} {...props} />
    </MemoryRouter>
  );

describe('BoardCards', () => {
  it('renders the title as a link to the post', () => {
    renderCards();

    const link = screen.getByRole('link', { name: /플러싱 카페의 여름 마무리/ });
    expect(link).toHaveAttribute('href', '/boards/abc123');
  });

  it('points the link at the edit route when pendingOnly', () => {
    renderCards({ pendingOnly: true });

    const link = screen.getByRole('link', { name: /플러싱 카페의 여름 마무리/ });
    expect(link).toHaveAttribute('href', '/boards/abc123/edit?pending=true');
  });

  it('keeps the author menu button outside the anchor', () => {
    const { container } = renderCards();

    expect(container.querySelector('a button')).toBeNull();
    expect(screen.getByRole('button', { name: 'likorea' })).toBeInTheDocument();
  });
});
