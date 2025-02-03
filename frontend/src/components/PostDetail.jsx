import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './PostDetail.css';
import { API_BASE_URL } from '../config';

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/posts/${id}`);
        if (!res.ok) throw new Error('게시글 로딩 실패');
        const data = await res.json();
        setPost(data);
      } catch (error) {
        console.error(error);
      }
    }
    async function fetchComments() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/comments/${id}`);
        if (!res.ok) throw new Error('댓글 로딩 실패');
        const data = await res.json();
        setComments(data);
      } catch (error) {
        console.error(error);
      }
    }
    fetchPost();
    fetchComments();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/posts/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('게시글 삭제 실패');
        alert('게시글이 삭제되었습니다.');
        navigate('/');
      } catch (error) {
        console.error('게시글 삭제 실패:', error);
      }
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ postId: id, content: newComment }),
      });
      if (!res.ok) throw new Error('댓글 작성 실패');
      const data = await res.json();
      setComments([...comments, data]);
      setNewComment('');
    } catch (error) {
      console.error('댓글 작성 실패:', error);
    }
  };

  const handleCommentEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/comments/${editingCommentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: editingCommentContent }),
      });
      if (!res.ok) throw new Error('댓글 수정 실패');
      const data = await res.json();
      setComments(comments.map(comment => comment._id === editingCommentId ? data : comment));
      setEditingCommentId(null);
      setEditingCommentContent('');
    } catch (error) {
      console.error('댓글 수정 실패:', error);
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('댓글 삭제 실패');
        setComments(comments.filter(comment => comment._id !== commentId));
      } catch (error) {
        console.error('댓글 삭제 실패:', error);
      }
    }
  };

  if (!post) return <div>Loading...</div>;

  return (
    <div className="post-detail-container">
      <h2>{post.title}</h2>
      <p>작성자: {post.author}</p>
      <p>등록일: {new Date(post.createdAt).toLocaleDateString()}</p>
      <p>조회수: {post.viewCount}</p>
      <div className="post-content">{post.content}</div>
      {post.author === username && (
        <div className="post-actions">
          <button onClick={() => navigate(`/edit/${post._id}`)} className="edit-button">수정</button>
          <button onClick={handleDelete} className="delete-button">삭제</button>
        </div>
      )}
      <div className="comments-section">
        <h3>댓글</h3>
        {comments.map(comment => (
          <div key={comment._id} className="comment">
            <p><strong>{comment.author}</strong> {new Date(comment.createdAt).toLocaleDateString()}</p>
            {editingCommentId === comment._id ? (
              <form onSubmit={handleCommentEdit} className="comment-form">
                <textarea
                  value={editingCommentContent}
                  onChange={(e) => setEditingCommentContent(e.target.value)}
                  required
                />
                <button type="submit">수정 완료</button>
                <button type="button" onClick={() => setEditingCommentId(null)}>취소</button>
              </form>
            ) : (
              <>
                <p>{comment.content}</p>
                {comment.author === username && (
                  <div className="comment-actions">
                    <button onClick={() => {
                      setEditingCommentId(comment._id);
                      setEditingCommentContent(comment.content);
                    }}>수정</button>
                    <button onClick={() => handleCommentDelete(comment._id)}>삭제</button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {token ? (
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
              placeholder="댓글을 입력하세요"
            />
            <button type="submit">댓글 작성</button>
          </form>
        ) : (
          <p>댓글을 작성하려면 <Link to="/login">로그인</Link>하세요.</p>
        )}
      </div>
    </div>
  );
};

export default PostDetail;