import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  getAllUsers,
  updateUserAuthority,
  updateUserInfo,
  deleteUser,
  getUserDetails
} from '../../api/admin';
import '../../styles/Admin.css';

function AdminUsers() {
  const { setMessage } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // 권한 레벨 표시
  const getAuthorityLabel = level => {
    switch (parseInt(level)) {
      case 1:
        return '게스트';
      case 2:
        return '제한 사용자';
      case 3:
        return '일반 사용자';
      case 4:
        return '매니저';
      case 5:
        return '관리자';
      default:
        return '알 수 없음';
    }
  };

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
      setUsers(response.users || []);
      setCurrentPage(response.currentPage || 1);
      setTotalPages(response.totalPages || 1);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchUsers();
  }, []);

  // 검색 처리
  const handleSearch = () => {
    fetchUsers(1, searchTerm);
  };

  // 페이지 변경
  const handlePageChange = page => {
    fetchUsers(page, searchTerm);
  };

  // 사용자 편집 시작
  const handleEditClick = user => {
    setEditingUser({
      ...user,
      newPassword: '',
      confirmPassword: ''
    });
    setSelectedUser(null);
  };

  // 사용자 상세 정보 보기
  const handleViewDetails = async userId => {
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
  const handleEditChange = e => {
    const { name, value } = e.target;
    setEditingUser(prev => ({
      ...prev,
      [name]: name === 'authority' ? parseInt(value) : value
    }));
  };

  // 사용자 정보 수정 저장
  const handleSaveUser = async () => {
    try {
      // 비밀번호 변경 유효성 검사
      if (editingUser.newPassword || editingUser.confirmPassword) {
        if (!editingUser.newPassword) {
          setMessage('새 비밀번호를 입력해주세요.');
          return;
        }

        if (editingUser.newPassword !== editingUser.confirmPassword) {
          setMessage('비밀번호가 일치하지 않습니다.');
          return;
        }

        if (editingUser.newPassword.length < 6) {
          setMessage('비밀번호는 최소 6자 이상이어야 합니다.');
          return;
        }
      }

      const updateData = {
        email: editingUser.email,
        authority: editingUser.authority
      };

      // 비밀번호가 입력된 경우에만 추가
      if (editingUser.newPassword) {
        updateData.password = editingUser.newPassword;
      }

      await updateUserInfo(editingUser._id, updateData);

      // 목록 새로고침
      fetchUsers(currentPage, searchTerm);
      setEditingUser(null);

      const successMessage = editingUser.newPassword
        ? '사용자 정보 및 비밀번호가 성공적으로 업데이트되었습니다'
        : '사용자 정보가 성공적으로 업데이트되었습니다';

      setMessage(successMessage);

      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`오류: ${err.message}`);
    }
  };

  // 사용자 삭제
  const handleDeleteUser = async userId => {
    if (
      !window.confirm(
        '정말로 이 사용자를 삭제하시겠습니까? 관련된 모든 게시글과 댓글도 함께 삭제됩니다.'
      )
    ) {
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

  if (loading) return <div className="admin-message">로딩 중...</div>;
  if (error) return <div className="admin-message error">오류: {error}</div>;

  return (
    <section
      className="admin-section"
      id="users-panel"
      role="tabpanel"
      aria-labelledby="users-tab"
    >
      <div className="section-header">
        <h2>사용자 관리</h2>
        <p className="section-description">등록된 사용자 조회, 수정, 삭제 및 권한 관리</p>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="아이디 또는 이메일로 검색..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSearch()}
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
            <select name="authority" value={editingUser.authority} onChange={handleEditChange}>
              <option key={1} value={1}>게스트 (1)</option>
              <option key={2} value={2}>제한 사용자 (2)</option>
              <option key={3} value={3}>일반 사용자 (3)</option>
              <option key={4} value={4}>매니저 (4)</option>
              <option key={5} value={5}>관리자 (5)</option>
            </select>
          </div>
          <div className="form-group">
            <label>새 비밀번호 (선택사항):</label>
            <input
              type="password"
              name="newPassword"
              value={editingUser.newPassword || ''}
              onChange={handleEditChange}
              placeholder="새 비밀번호 (6자 이상, 변경시에만 입력)"
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>비밀번호 확인:</label>
            <input
              type="password"
              name="confirmPassword"
              value={editingUser.confirmPassword || ''}
              onChange={handleEditChange}
              placeholder="비밀번호 확인"
            />
          </div>
          <div className="button-group">
            <button onClick={handleSaveUser} className="save-btn">
              저장
            </button>
            <button onClick={handleCancelEdit} className="cancel-btn">
              취소
            </button>
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
            <strong>권한:</strong> {getAuthorityLabel(selectedUser.authority)} (
            {selectedUser.authority})
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

          <div className="button-group">
            <button onClick={handleCancelEdit} className="back-btn">
              목록으로 돌아가기
            </button>
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
                            onChange={e =>
                              handleAuthorityChange(user._id, parseInt(e.target.value))
                            }
                            disabled={user.authority === 5}
                          >
                            <option key={1} value={1}>게스트 (1)</option>
                            <option key={2} value={2}>제한 사용자 (2)</option>
                            <option key={3} value={3}>일반 사용자 (3)</option>
                            <option key={4} value={4}>매니저 (4)</option>
                            <option key={5} value={5}>관리자 (5)</option>
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
                          <button onClick={() => handleEditClick(user)} className="edit-btn">
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

              {/* 모바일용 카드 레이아웃 */}
              <div className="users-cards">
                {users.map(user => (
                  <div key={user._id} className="user-card">
                    <div className="user-card-header">
                      <span className="user-card-id">{user.id}</span>
                      <span className="user-card-authority">
                        {getAuthorityLabel(user.authority)}
                      </span>
                    </div>
                    <div className="user-card-body">
                      <div className="user-card-info">
                        <label>이메일:</label>
                        <span>{user.email}</span>
                      </div>
                      <div className="user-card-info">
                        <label>가입일:</label>
                        <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="user-card-actions">
                      <select
                        value={user.authority}
                        onChange={e =>
                          handleAuthorityChange(user._id, parseInt(e.target.value))
                        }
                        disabled={user.authority === 5}
                      >
                        <option key={1} value={1}>게스트 (1)</option>
                        <option key={2} value={2}>제한 사용자 (2)</option>
                        <option key={3} value={3}>일반 사용자 (3)</option>
                        <option key={4} value={4}>매니저 (4)</option>
                        <option key={5} value={5}>관리자 (5)</option>
                      </select>
                      <button
                        onClick={() => handleViewDetails(user._id)}
                        className="view-btn"
                      >
                        상세
                      </button>
                      <button onClick={() => handleEditClick(user)} className="edit-btn">
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="delete-btn"
                        disabled={user.authority === 5}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
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
  );
}

export default AdminUsers;