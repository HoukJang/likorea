import React, { useMemo } from 'react';

const BoardPagination = React.memo(({ currentPage, totalPages, onPageChange }) => {
  const pages = useMemo(() => {
    if (totalPages <= 1) return [];
    const items = [];
    const delta = 2;

    items.push(1);

    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

    if (rangeStart > 2) {
      items.push('ellipsis-start');
    }

    for (let i = rangeStart; i <= rangeEnd; i++) {
      items.push(i);
    }

    if (rangeEnd < totalPages - 1) {
      items.push('ellipsis-end');
    }

    if (totalPages > 1) {
      items.push(totalPages);
    }

    return items;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" role="navigation" aria-label="페이지 네비게이션">
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="pagination-btn"
        aria-label="이전 페이지"
      >
        이전
      </button>
      {pages.map((page) => {
        if (typeof page === 'string') {
          return (
            <span key={page} className="pagination-ellipsis" aria-hidden="true">
              &hellip;
            </span>
          );
        }
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
            aria-label={`${page}페이지로 이동`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </button>
        );
      })}
      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="pagination-btn"
        aria-label="다음 페이지"
      >
        다음
      </button>
    </nav>
  );
});

BoardPagination.displayName = 'BoardPagination';

export default BoardPagination;
