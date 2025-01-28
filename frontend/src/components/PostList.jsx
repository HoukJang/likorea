import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 백엔드 서버 주소
const BASE_URL = process.env.REACT_APP_API_URL;


function PostList() {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  // 페이지 로딩 시 목록 불러오기
  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const res = await fetch(BASE_URL);
      const data = await res.json();
      setPosts(data);
    } catch (error) {
      console.error('게시글 로딩 실패:', error);
    }
  }

  // 글 삭제
  async function handleDelete(id) {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('서버 오류');
      alert('삭제 완료!');
      // 다시 목록 로드
      fetchPosts();
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
    }
  }

  return (
    <div>
      <h2>게시글 목록</h2>
      {posts.map((post) => (
        <div key={post._id} className="post-item">
          <h3>{post.title}</h3>
          <p>
            작성자: {post.author || '익명'} /{' '}
            {new Date(post.createdAt).toLocaleString()}
          </p>
          <p>{post.content}</p>
          <button onClick={() => navigate(`/edit/${post._id}`)}>수정</button>
          <button onClick={() => handleDelete(post._id)}>삭제</button>
          <hr />
        </div>
      ))}
    </div>
  );
}

export default PostList;
