import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInbox, getSentMessages, deleteMessage, getUnreadCount } from '../../api/message';
import Button from '../common/Button';
import Pagination from '../common/Pagination';
import '../../styles/Message.css';

function MessageList({ type = 'inbox', onMessageClick }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessages, setSelectedMessages] = useState([]);

  useEffect(() => {
    fetchMessages();
    if (type === 'inbox') {
      fetchUnreadCount();
    }
  }, [type, page]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = type === 'inbox'
        ? await getInbox({ page })
        : await getSentMessages({ page });

      setMessages(response.data.messages || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      setError(error.message || '메시지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('읽지 않은 메시지 수 조회 실패:', error);
    }
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm('이 메시지를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteMessage(messageId);
      await fetchMessages();
      if (type === 'inbox') {
        await fetchUnreadCount();
      }
    } catch (error) {
      alert(error.message || '메시지 삭제에 실패했습니다.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMessages.length === 0) {
      alert('삭제할 메시지를 선택해주세요.');
      return;
    }

    if (!window.confirm(`선택한 ${selectedMessages.length}개의 메시지를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await Promise.all(selectedMessages.map(id => deleteMessage(id)));
      setSelectedMessages([]);
      await fetchMessages();
      if (type === 'inbox') {
        await fetchUnreadCount();
      }
    } catch (error) {
      alert(error.message || '메시지 삭제에 실패했습니다.');
    }
  };

  const handleSelectMessage = (messageId) => {
    setSelectedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMessages.length === messages.length) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(messages.map(msg => msg._id));
    }
  };

  const handleViewMessage = (message) => {
    if (onMessageClick) {
      onMessageClick(message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}분 전`;
    } else if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))}시간 전`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return <div className="message-loading">메시지를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="message-error">오류: {error}</div>;
  }

  return (
    <div className="message-list-container">

      {messages.length > 0 && (
        <div className="message-actions">
          <label className="select-all">
            <input
              type="checkbox"
              checked={selectedMessages.length === messages.length}
              onChange={handleSelectAll}
            />
            전체 선택
          </label>
          <Button
            onClick={handleBulkDelete}
            variant="danger"
            size="small"
            disabled={selectedMessages.length === 0}
          >
            선택 삭제
          </Button>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="message-empty">
          <p>{type === 'inbox' ? '받은 쪽지가 없습니다.' : '보낸 쪽지가 없습니다.'}</p>
        </div>
      ) : (
        <>
          <div className="message-table-wrapper">
            <table className="message-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th style={{ width: '120px' }}>
                    {type === 'inbox' ? '보낸 사람' : '받는 사람'}
                  </th>
                  <th>내용</th>
                  <th style={{ width: '80px' }}>상태</th>
                  <th style={{ width: '100px' }}>날짜</th>
                  <th style={{ width: '80px' }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {messages.map(message => (
                  <tr
                    key={message._id}
                    className={`${!message.isRead ? 'unread' : ''}`}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedMessages.includes(message._id)}
                        onChange={() => handleSelectMessage(message._id)}
                      />
                    </td>
                    <td>
                      {type === 'inbox' ? message.sender?.id : message.receiver?.id}
                    </td>
                    <td
                      className="message-content-preview"
                      onClick={() => handleViewMessage(message)}
                    >
                      {message.content ? message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '') : '내용 없음'}
                    </td>
                    <td>
                      {message.isRead ? (
                        <span className="read-status">읽음</span>
                      ) : (
                        <span className="unread-status">{type === 'inbox' ? '안 읽음' : '안 읽음'}</span>
                      )}
                    </td>
                    <td>{formatDate(message.createdAt)}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(message._id)}
                        className="delete-link"
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
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}

export default MessageList;