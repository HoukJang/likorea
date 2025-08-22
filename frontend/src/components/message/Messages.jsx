import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MessageList from './MessageList';
import MessageCompose from './MessageCompose';
import MessageDetail from './MessageDetail';
import './Messages.css';

const Messages = () => {
  const location = useLocation();
  const [view, setView] = useState('inbox'); // inbox, sent, compose, detail
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);

  // URL 경로에 따라 view 설정
  useEffect(() => {
    if (location.pathname.endsWith('/compose')) {
      setView('compose');
    }
  }, [location.pathname]);

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    setView('detail');
  };

  const handleReply = (message) => {
    setReplyTo(message);
    setView('compose');
  };

  const handleComposeComplete = () => {
    setReplyTo(null);
    setView('inbox');
  };

  const handleBackToList = () => {
    setSelectedMessage(null);
    setView(view === 'detail' ? 'inbox' : view);
  };

  const renderContent = () => {
    switch (view) {
      case 'compose':
        return (
          <MessageCompose
            replyTo={replyTo}
            onComplete={handleComposeComplete}
            onCancel={() => {
              setReplyTo(null);
              setView('inbox');
            }}
          />
        );
      case 'detail':
        return selectedMessage ? (
          <MessageDetail
            messageId={selectedMessage._id}
            onReply={handleReply}
            onBack={handleBackToList}
          />
        ) : (
          <MessageList
            type="inbox"
            onMessageClick={handleMessageClick}
          />
        );
      default:
        return (
          <MessageList
            type={view}
            onMessageClick={handleMessageClick}
          />
        );
    }
  };

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h1 className="messages-title">쪽지함</h1>
        <div className="messages-actions">
          <button
            className="messages-compose-btn"
            onClick={() => setView('compose')}
          >
            ✉️ 쪽지 쓰기
          </button>
        </div>
      </div>

      <div className="messages-tabs">
        <button
          className={`messages-tab ${view === 'inbox' ? 'active' : ''}`}
          onClick={() => setView('inbox')}
        >
          받은 쪽지함
        </button>
        <button
          className={`messages-tab ${view === 'sent' ? 'active' : ''}`}
          onClick={() => setView('sent')}
        >
          보낸 쪽지함
        </button>
      </div>

      <div className="messages-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default Messages;