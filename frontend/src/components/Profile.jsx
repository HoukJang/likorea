import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUser, updateUser } from '../api/auth';
import Button from './common/Button';
import Input from './common/Input';
import '../styles/Profile.css';

function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading, authenticated } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 현재 사용자 정보 확인
  useEffect(() => {
    if (!authLoading) {
      if (!authenticated() || !user) {
        setMessage('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        fetchUserData(user.id);
      }
    }
  }, [authLoading, authenticated, user, navigate]);

  // 사용자 상세 정보 가져오기
  const fetchUserData = async userId => {
    try {
      setLoading(true);
      const data = await getUser(userId);
      setUserData(data);
      setEditForm({
        email: data.email || '',
        password: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setError('사용자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 프로필 수정
  const handleEdit = () => {
    setIsEditing(true);
    setMessage('');
  };

  // 수정 취소
  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      email: userData?.email || '',
      password: '',
      newPassword: '',
      confirmPassword: ''
    });
    setMessage('');
  };

  // 프로필 업데이트
  const handleUpdate = async e => {
    e.preventDefault();

    if (!editForm.password) {
      setMessage('현재 비밀번호를 입력해주세요.');
      return;
    }

    if (editForm.newPassword && editForm.newPassword !== editForm.confirmPassword) {
      setMessage('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      setLoading(true);
      const updateData = {
        email: editForm.email,
        password: editForm.password
      };

      if (editForm.newPassword) {
        updateData.newPassword = editForm.newPassword;
      }

      await updateUser(user.id, updateData);
      setMessage('프로필이 성공적으로 업데이트되었습니다.');
      setIsEditing(false);

      // 업데이트된 정보 다시 불러오기
      fetchUserData(user.id);
    } catch (error) {
      setMessage(error.message || '프로필 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userData) {
    return (
      <div className="profile-container">
        <div className="loading">사용자 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="error">오류: {error}</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        {!isEditing ? (
          <div className="profile-info">
            <div className="info-group">
              <label>사용자 ID:</label>
              <span>{userData?.id}</span>
            </div>
            <div className="info-group">
              <label>이메일:</label>
              <span>{userData?.email}</span>
            </div>
            <div className="info-group">
              <label>권한 레벨:</label>
              <span>Lv.{userData?.authority}</span>
            </div>
            <div className="info-group">
              <label>가입일:</label>
              <span>
                {userData?.createdAt
                  ? new Date(userData.createdAt).toLocaleDateString()
                  : '알 수 없음'}
              </span>
            </div>

            <div className="profile-actions">
              <Button onClick={handleEdit} variant="primary" size="medium">
                프로필 수정
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="profile-edit-form">
            <div className="form-group">
              <Input
                type="text"
                label="사용자 ID"
                value={userData?.id || ''}
                disabled
                placeholder="사용자 ID"
              />
            </div>

            <div className="form-group">
              <Input
                type="email"
                label="이메일"
                value={editForm.email}
                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                required
                placeholder="이메일 주소"
              />
            </div>

            <div className="form-group">
              <Input
                type="password"
                label="현재 비밀번호"
                value={editForm.password}
                onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                required
                placeholder="현재 비밀번호"
              />
            </div>

            <div className="form-group">
              <Input
                type="password"
                label="새 비밀번호 (선택사항)"
                value={editForm.newPassword}
                onChange={e => setEditForm({ ...editForm, newPassword: e.target.value })}
                placeholder="새 비밀번호"
              />
            </div>

            <div className="form-group">
              <Input
                type="password"
                label="새 비밀번호 확인"
                value={editForm.confirmPassword}
                onChange={e => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                placeholder="새 비밀번호 확인"
              />
            </div>

            <div className="form-actions">
              <Button
                type="submit"
                variant="primary"
                size="medium"
                loading={loading}
                disabled={loading}
              >
                저장
              </Button>
              <Button
                type="button"
                onClick={handleCancel}
                variant="secondary"
                size="medium"
                disabled={loading}
              >
                취소
              </Button>
            </div>
          </form>
        )}

        {message && (
          <div className={`message ${message.includes('성공') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
