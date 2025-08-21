import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMessage, deleteMessage, markAsRead } from '../../api/message';
import { getCurrentUser } from '../../api/auth';
import Button from '../common/Button';
import '../../styles/Message.css';

function MessageDetail({ messageId, onReply, onBack }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (messageId) {
      fetchMessage();
      fetchCurrentUser();
    }
  }, [messageId]);

  const fetchCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('현재 사용자 정보 조회 실패:', error);
    }
  };

  const fetchMessage = async () => {
    try {
      setLoading(true);
      const response = await getMessage(messageId);
      setMessage(response.data);
      
      // 받은 메시지이고 읽지 않은 경우 자동으로 읽음 처리
      if (response.data && !response.data.isRead && 
          currentUser && response.data.receiver._id === currentUser._id) {
        await markAsRead(messageId);
      }
    } catch (error) {
      setError(error.message || '메시지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('이 메시지를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteMessage(messageId);
      alert('메시지가 삭제되었습니다.');
      navigate('/messages');
    } catch (error) {
      alert(error.message || '메시지 삭제에 실패했습니다.');
    }
  };

  const handleReply = () => {
    const isReceiver = currentUser?._id === message?.receiver?._id;
    const replyToId = isReceiver ? message.sender.id : message.receiver.id;
    // 부모 컴포넌트의 handleReply 호출
    if (onReply) {
      onReply(message);
    } else {
      navigate(`/messages/compose/${replyToId}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="message-loading">메시지를 불러오는 중...</div>;
  }

  if (error) {
    return (
      <div className="message-error">
        <p>오류: {error}</p>
        <Button onClick={() => navigate('/messages')} variant="secondary">
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="message-not-found">
        <p>메시지를 찾을 수 없습니다.</p>
        <Button onClick={() => navigate('/messages')} variant="secondary">
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const isReceiver = currentUser?._id === message.receiver._id;

  return (
    <div className="message-detail-container">
      <div className="message-detail-header">
        <h3>쪽지 상세보기</h3>
        <div className="message-actions">
          <Button onClick={handleReply} variant="primary" size="small">
            답장
          </Button>
          <Button onClick={handleDelete} variant="danger" size="small">
            삭제
          </Button>
          <Button 
            onClick={onBack || (() => navigate('/messages'))} 
            variant="secondary" 
            size="small"
          >
            목록
          </Button>
        </div>
      </div>

      <div className="message-detail-content">
        <div className="message-info">
          <div className="info-row">
            <label>보낸 사람:</label>
            <span>{message.sender.id}</span>
          </div>
          <div className="info-row">
            <label>받는 사람:</label>
            <span>{message.receiver.id}</span>
          </div>
          <div className="info-row">
            <label>보낸 시간:</label>
            <span>{formatDate(message.createdAt)}</span>
          </div>
          {message.isRead && message.readAt && isReceiver && (
            <div className="info-row">
              <label>읽은 시간:</label>
              <span>{formatDate(message.readAt)}</span>
            </div>
          )}
        </div>

        <div className="message-body">
          <pre>{message.content}</pre>
        </div>
      </div>
    </div>
  );
}

export default MessageDetail;