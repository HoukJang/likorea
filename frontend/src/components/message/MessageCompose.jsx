import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sendMessage } from '../../api/message';
import { getUsers } from '../../api/auth';
import Button from '../common/Button';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import '../../styles/Message.css';

function MessageCompose({ replyTo = null, onComplete, onCancel }) {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [formData, setFormData] = useState({
    receiverId: replyTo ? replyTo.sender?.id : (userId || ''),
    content: ''
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserList, setShowUserList] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    try {
      setSearching(true);
      const response = await getUsers({ search: searchQuery, limit: 10 });
      setUsers(response.data || []);
      setShowUserList(true);
    } catch (error) {
      console.error('사용자 검색 실패:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.receiverId) {
      setError('받는 사람을 입력해주세요.');
      return;
    }
    
    if (!formData.content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }
    
    if (formData.content.length > 1000) {
      setError('내용은 1000자를 초과할 수 없습니다.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await sendMessage(formData);
      alert('메시지가 성공적으로 전송되었습니다.');
      if (onComplete) {
        onComplete();
      } else if (window.location.pathname.includes('/messages')) {
        navigate('/messages');
      } else {
        navigate(-1);
      }
    } catch (error) {
      setError(error.message || '메시지 전송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    setFormData({ ...formData, receiverId: user.id });
    setSearchQuery(user.id);
    setShowUserList(false);
  };

  const handleCancel = () => {
    if (formData.content) {
      if (window.confirm('작성 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
        if (onCancel) {
          onCancel();
        } else {
          navigate(-1);
        }
      }
    } else {
      if (onCancel) {
        onCancel();
      } else {
        navigate(-1);
      }
    }
  };

  return (
    <div className="message-compose-container">
      <div className="message-compose-header">
        <h3>쪽지 쓰기</h3>
      </div>

      <form onSubmit={handleSubmit} className="message-compose-form">
        <div className="form-group">
          <label htmlFor="receiver">받는 사람</label>
          <div className="receiver-input-wrapper">
            <Input
              id="receiver"
              type="text"
              value={searchQuery || formData.receiverId}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value === '') {
                  setFormData({ ...formData, receiverId: '' });
                }
              }}
              placeholder="사용자 ID를 입력하세요"
              required
              disabled={!!replyTo || !!userId}
            />
            {searching && <span className="searching-indicator">검색 중...</span>}
          </div>
          
          {showUserList && users.length > 0 && (
            <ul className="user-search-results">
              {users.map(user => (
                <li 
                  key={user.id} 
                  onClick={() => handleSelectUser(user)}
                  className="user-search-item"
                >
                  <span className="user-id">{user.id}</span>
                  {user.email && <span className="user-email">({user.email})</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="content">내용</label>
          <TextArea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="내용을 입력하세요"
            rows={10}
            maxLength={1000}
            required
          />
          <span className="char-count">{formData.content.length}/1000</span>
        </div>

        {error && (
          <div className="message-error">{error}</div>
        )}

        <div className="form-actions">
          <Button
            type="submit"
            variant="primary"
            size="medium"
            loading={loading}
            disabled={loading}
          >
            보내기
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="medium"
            onClick={handleCancel}
            disabled={loading}
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}

export default MessageCompose;