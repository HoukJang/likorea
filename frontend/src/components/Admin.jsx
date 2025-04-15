import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config';
import '../styles/Admin.css';

function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]); // 초기값을 빈 배열로 설정
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState('');

  // 권한 레벨 표시
  const getAuthorityLabel = (level) => {
    switch(parseInt(level)) {
      case 1: return '게스트';
      case 2: return '제한 사용자';
      case 3: return '일반 사용자';
      case 4: return '매니저';
      case 5: return '관리자';
      default: return '알 수 없음';
    }
  };

  // 사용자 권한 검증
  useEffect(() => {
    const userAuthority = parseInt(localStorage.getItem('userAuthority')) || 0;
    if (userAuthority < 5) {
      alert("관리자 권한이 필요합니다.");
      navigate('/');
    }
  }, [navigate]);

  // 사용자 목록 불러오기
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('authToken');
        // 관리자용 API 엔드포인트로 업데이트
        const response = await fetch(`${BACKEND_URL}/api/admin/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('사용자 목록을 불러오는데 실패했습니다');
        }
        
        const data = await response.json();
        
        // 응답 데이터가 배열인지 확인하고, 배열이 아니면 빈 배열로 설정
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (data && data.users && Array.isArray(data.users)) {
          // 만약 응답이 { users: [...] } 형식으로 온다면
          setUsers(data.users);
        } else {
          console.error('Unexpected API response format:', data);
          setUsers([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('API Error:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  // 사용자 편집 시작
  const handleEditClick = (user) => {
    setEditingUser({...user});
  };

  // 사용자 편집 취소
  const handleCancelEdit = () => {
    setEditingUser(null);
    setMessage('');
  };

  // 사용자 정보 수정 입력값 변경
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingUser(prev => ({
      ...prev,
      [name]: name === 'authority' ? parseInt(value) : value
    }));
  };

  // 사용자 정보 수정 저장
  const handleSaveUser = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${BACKEND_URL}/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: editingUser.email,
          authority: editingUser.authority
        })
      });
      
      if (!response.ok) {
        throw new Error('사용자 정보 수정에 실패했습니다');
      }
      
      const updatedUser = await response.json();
      
      // 목록에서 해당 사용자 업데이트
      setUsers(users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      
      setEditingUser(null);
      setMessage('사용자 정보가 성공적으로 업데이트되었습니다');
    } catch (err) {
      setMessage(`오류: ${err.message}`);
    }
  };

  if (loading) return <div className="admin-message">사용자 목록 로딩 중...</div>;
  if (error) return <div className="admin-message error">오류: {error}</div>;

  return (
    <div className="admin-container">
      <h1>관리자 페이지</h1>
      
      <section className="admin-section">
        <h2>사용자 관리</h2>
        
        {message && <div className="admin-message">{message}</div>}
        
        {editingUser ? (
          <div className="edit-user-form">
            <h3>사용자 정보 수정</h3>
            <div className="form-group">
              <label>아이디:</label>
              <input type="text" value={editingUser.id} disabled />
            </div>
            <div className="form-group">
              <label>이메일:</label>
              <input 
                type="email" 
                name="email" 
                value={editingUser.email} 
                onChange={handleEditChange} 
              />
            </div>
            <div className="form-group">
              <label>권한:</label>
              <select 
                name="authority" 
                value={editingUser.authority} 
                onChange={handleEditChange}
              >
                <option value={1}>게스트</option>
                <option value={2}>제한 사용자</option>
                <option value={3}>일반 사용자</option>
                <option value={4}>매니저</option>
                <option value={5}>관리자</option>
              </select>
            </div>
            <div className="button-group">
              <button onClick={handleSaveUser} className="save-btn">저장</button>
              <button onClick={handleCancelEdit} className="cancel-btn">취소</button>
            </div>
          </div>
        ) : (
          <>
            {Array.isArray(users) && users.length > 0 ? (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>아이디</th>
                    <th>이메일</th>
                    <th>권한</th>
                    <th>가입일</th>
                    <th>최종수정일</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id || Math.random()}>
                      <td>{user.id}</td>
                      <td>{user.email}</td>
                      <td>{getAuthorityLabel(user.authority)} ({user.authority})</td>
                      <td>{new Date(user.createdAt).toLocaleString()}</td>
                      <td>{new Date(user.updatedAt).toLocaleString()}</td>
                      <td>
                        <button 
                          onClick={() => handleEditClick(user)}
                          className="edit-user-btn"
                        >
                          수정
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>사용자 정보가 없습니다.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default Admin;
