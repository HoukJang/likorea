// src/components/CommentForm.jsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { addComment } from '../api/boards';
import '../styles/CommentForm.css'; // Import the CSS file

function CommentForm({ postId, parentComment, onCommentAdded }) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async e => {
    e.preventDefault();

    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsLoading(true);
    try {
      const commentData = {
        content,
        parentComment
      };

      await addComment(postId, commentData);
      alert('댓글 작성 성공!');
      setContent('');
      onCommentAdded(); // 부모에게 전달해 리스트 업데이트 요청
    } catch (error) {
      alert(error.message || '댓글 작성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">댓글:</label>
        <textarea
          className="comment-textarea"
          value={content}
          onChange={e => setContent(e.target.value)}
          required
          disabled={isLoading || !user}
          placeholder={!user ? '로그인이 필요합니다.' : '댓글을 입력하세요.'}
        />
      </div>
      <button
        type="submit"
        className="submit-button"
        disabled={isLoading || !user || !content.trim()}
      >
        {isLoading ? '작성 중...' : '댓글 작성'}
      </button>
    </form>
  );
}

export default CommentForm;
