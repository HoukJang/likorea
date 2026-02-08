import { Link } from 'react-router-dom';

export const BoardLoading = () => (
  <div role="status" aria-live="polite" aria-label="게시글을 불러오는 중">
    {/* Desktop skeleton */}
    <div className="skeleton-table" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="skeleton-row">
          <div className="skeleton-cell skeleton-cell--type" />
          <div className="skeleton-cell skeleton-cell--title" />
          <div className="skeleton-cell skeleton-cell--region" />
          <div className="skeleton-cell skeleton-cell--author" />
          <div className="skeleton-cell skeleton-cell--date" />
          <div className="skeleton-cell skeleton-cell--views" />
        </div>
      ))}
    </div>
    {/* Mobile skeleton */}
    <div className="skeleton-cards" aria-hidden="true">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-card-header">
            <div className="skeleton-cell skeleton-cell--badge" />
            <div className="skeleton-cell skeleton-cell--number" />
          </div>
          <div className="skeleton-cell skeleton-cell--card-title" />
          <div className="skeleton-card-footer">
            <div className="skeleton-cell skeleton-cell--meta" />
            <div className="skeleton-cell skeleton-cell--meta-short" />
          </div>
        </div>
      ))}
    </div>
    <span className="sr-only">게시글을 불러오는 중...</span>
  </div>
);

export const BoardError = ({ error }) => (
  <div className="error-container" role="alert" aria-live="assertive">
    <p>오류: {error}</p>
  </div>
);

export const BoardEmpty = () => (
  <div className="empty-state" role="status" aria-live="polite">
    <div className="empty-state-icon" aria-hidden="true">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="4" width="32" height="40" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
        <line x1="14" y1="14" x2="34" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="14" y1="22" x2="30" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="14" y1="30" x2="26" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
    <p>게시글이 없습니다.</p>
    <Link to="/boards/new" className="btn btn-primary" style={{ marginTop: '12px', display: 'inline-flex' }}>
      첫 글을 작성해보세요
    </Link>
  </div>
);
