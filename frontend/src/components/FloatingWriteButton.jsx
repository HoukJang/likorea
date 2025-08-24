import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/FloatingWriteButton.css';

const FloatingWriteButton = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Only show for logged-in users on mobile
  if (!user) return null;

  const handleWriteClick = () => {
    navigate('/boards/new');
  };

  return (
    <button 
      className="floating-write-button"
      onClick={handleWriteClick}
      aria-label="글쓰기"
    >
      <span className="write-icon">✏️</span>
    </button>
  );
};

export default FloatingWriteButton;