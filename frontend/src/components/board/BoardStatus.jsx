
export const BoardLoading = () => (
  <div className="loading-container" role="status" aria-live="polite">
    <div className="loading-spinner" aria-hidden="true"></div>
    <p>게시글을 불러오는 중...</p>
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
      📝
    </div>
    <p>게시글이 없습니다.</p>
  </div>
);