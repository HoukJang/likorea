import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllUsers, 
  getAdminStats, 
  updateUserAuthority, 
  updateUserInfo, 
  deleteUser,
  getUserDetails 
} from '../api/admin';
import Profile from './Profile';
import TrafficDashboard from './TrafficDashboard';
import '../styles/Admin.css';

function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

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
    if (userAuthority !== 5) {
      alert("관리자 권한이 필요합니다.");
      navigate('/');
    }
  }, [navigate]);

  // 사용자 목록 불러오기
  const fetchUsers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (search) {
        params.append('search', search);
      }
      
      const response = await getAllUsers(params.toString());
      console.log('사용자 목록 API 응답:', response);
      setUsers(response.users || []);
      setCurrentPage(response.currentPage || 1);
      setTotalPages(response.totalPages || 1);
      setLoading(false);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // 통계 불러오기
  const fetchStats = async () => {
    try {
      const response = await getAdminStats();
      setStats(response.stats);
    } catch (err) {
      console.error('Stats Error:', err);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  // 검색 처리
  const handleSearch = () => {
    fetchUsers(1, searchTerm);
  };

  // 페이지 변경
  const handlePageChange = (page) => {
    fetchUsers(page, searchTerm);
  };

  // 사용자 편집 시작
  const handleEditClick = (user) => {
    setEditingUser({...user});
    setSelectedUser(null);
  };

  // 사용자 상세 정보 보기
  const handleViewDetails = async (userId) => {
    try {
      const response = await getUserDetails(userId);
      setSelectedUser(response.user);
      setEditingUser(null);
    } catch (err) {
      setMessage(`오류: ${err.message}`);
    }
  };

  // 사용자 편집 취소
  const handleCancelEdit = () => {
    setEditingUser(null);
    setSelectedUser(null);
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
      await updateUserInfo(editingUser._id, {
        email: editingUser.email,
        authority: editingUser.authority
      });
      
      // 목록 새로고침
      fetchUsers(currentPage, searchTerm);
      setEditingUser(null);
      setMessage('사용자 정보가 성공적으로 업데이트되었습니다');
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`오류: ${err.message}`);
    }
  };

  // 사용자 삭제
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('정말로 이 사용자를 삭제하시겠습니까? 관련된 모든 게시글과 댓글도 함께 삭제됩니다.')) {
      return;
    }
    
    try {
      await deleteUser(userId);
      fetchUsers(currentPage, searchTerm);
      setMessage('사용자가 성공적으로 삭제되었습니다');
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`오류: ${err.message}`);
    }
  };

  // 권한만 변경
  const handleAuthorityChange = async (userId, newAuthority) => {
    try {
      await updateUserAuthority(userId, newAuthority);
      fetchUsers(currentPage, searchTerm);
      setMessage('권한이 성공적으로 변경되었습니다');
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`오류: ${err.message}`);
    }
  };

  if (loading && activeTab === 'users') return <div className="admin-message">로딩 중...</div>;
  if (error) return <div className="admin-message error">오류: {error}</div>;

  return (
    <div className="admin-container">
      <h1>관리자 페이지</h1>
      
      <div className="admin-tabs">
        <button 
          className={activeTab === 'users' ? 'active' : ''} 
          onClick={() => setActiveTab('users')}
        >
          사용자 관리
        </button>
        <button 
          className={activeTab === 'stats' ? 'active' : ''} 
          onClick={() => setActiveTab('stats')}
        >
          통계
        </button>
        <button 
          className={activeTab === 'traffic' ? 'active' : ''} 
          onClick={() => setActiveTab('traffic')}
        >
          트래픽 대시보드
        </button>
        <button 
          className={activeTab === 'profile' ? 'active' : ''} 
          onClick={() => setActiveTab('profile')}
        >
          프로필
        </button>
      </div>

      {message && <div className="admin-message">{message}</div>}

      {activeTab === 'traffic' && (
        <section className="admin-section">
          <TrafficDashboard />
        </section>
      )}

      {activeTab === 'profile' && (
        <section className="admin-section">
          <Profile />
        </section>
      )}

      {activeTab === 'users' && (
        <section className="admin-section">
          <h2>사용자 관리</h2>
          
          <div className="search-section">
            <input
              type="text"
              placeholder="아이디 또는 이메일로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>검색</button>
          </div>

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
                  <option value={1}>게스트 (1)</option>
                  <option value={2}>제한 사용자 (2)</option>
                  <option value={3}>일반 사용자 (3)</option>
                  <option value={4}>매니저 (4)</option>
                  <option value={5}>관리자 (5)</option>
                </select>
              </div>
              <div className="button-group">
                <button onClick={handleSaveUser} className="save-btn">저장</button>
                <button onClick={handleCancelEdit} className="cancel-btn">취소</button>
              </div>
            </div>
          ) : selectedUser ? (
            <div className="user-details">
              <h3>사용자 상세 정보</h3>
              <div className="detail-item">
                <strong>아이디:</strong> {selectedUser.id}
              </div>
              <div className="detail-item">
                <strong>이메일:</strong> {selectedUser.email}
              </div>
              <div className="detail-item">
                <strong>권한:</strong> {getAuthorityLabel(selectedUser.authority)} ({selectedUser.authority})
              </div>
              <div className="detail-item">
                <strong>가입일:</strong> {new Date(selectedUser.createdAt).toLocaleString()}
              </div>
              <div className="detail-item">
                <strong>최종수정일:</strong> {new Date(selectedUser.updatedAt).toLocaleString()}
              </div>
              <div className="detail-item">
                <strong>작성 게시글:</strong> {selectedUser.postCount}개
              </div>
              <div className="detail-item">
                <strong>작성 댓글:</strong> {selectedUser.commentCount}개
              </div>
            </div>
          ) : (
            <>
              {users.length > 0 ? (
                <>
                  <div className="table-responsive">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>아이디</th>
                          <th>이메일</th>
                          <th>권한</th>
                          <th>가입일</th>
                          <th>작업</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(user => (
                          <tr key={user._id}>
                            <td>{user.id}</td>
                            <td>{user.email}</td>
                            <td>
                              <select 
                                value={user.authority}
                                onChange={(e) => handleAuthorityChange(user._id, parseInt(e.target.value))}
                                disabled={user.authority === 5}
                              >
                                <option value={1}>게스트 (1)</option>
                                <option value={2}>제한 사용자 (2)</option>
                                <option value={3}>일반 사용자 (3)</option>
                                <option value={4}>매니저 (4)</option>
                                <option value={5}>관리자 (5)</option>
                              </select>
                            </td>
                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td>
                              <button 
                                onClick={() => handleViewDetails(user._id)}
                                className="view-btn"
                              >
                                상세보기
                              </button>
                              <button 
                                onClick={() => handleEditClick(user)}
                                className="edit-btn"
                              >
                                수정
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user._id)}
                                className="delete-btn"
                                disabled={user.authority === 5}
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="pagination">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={page === currentPage ? 'active' : ''}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p>사용자 정보가 없습니다.</p>
              )}
            </>
          )}
        </section>
      )}

      {activeTab === 'stats' && (
        <section className="admin-section">
          <h2>사이트 통계</h2>
          {stats ? (
            <div className="stats-grid">
              <div className="stat-card">
                <h3>전체 사용자</h3>
                <p>{stats.userCount}명</p>
              </div>
              <div className="stat-card">
                <h3>전체 게시글</h3>
                <p>{stats.postCount}개</p>
              </div>
              <div className="stat-card">
                <h3>전체 댓글</h3>
                <p>{stats.commentCount}개</p>
              </div>
              <div className="stat-card">
                <h3>최근 7일 게시글</h3>
                <p>{stats.lastWeekPosts}개</p>
              </div>
              <div className="stat-card">
                <h3>최근 7일 댓글</h3>
                <p>{stats.lastWeekComments}개</p>
              </div>
              
              <div className="stat-card authority-stats">
                <h3>권한별 사용자 수</h3>
                {stats.authorityStats && stats.authorityStats.map(stat => (
                  <div key={stat._id} className="authority-item">
                    <span>{getAuthorityLabel(stat._id)}:</span>
                    <span>{stat.count}명</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p>통계 정보를 불러오는 중...</p>
          )}
        </section>
      )}
    </div>
  );
}

export default Admin;
