import React from 'react';

const BoardPagination = React.memo(({ currentPage, totalPages, onPageChange }) => {
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
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i}
          onClick={() => onPageChange(i + 1)}
          className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
          aria-label={`${i + 1}페이지로 이동`}
          aria-current={currentPage === i + 1 ? 'page' : undefined}
        >
          {i + 1}
        </button>
      ))}
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