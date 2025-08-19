import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './NotFound.css';

const NotFound = () => {
  return (
    <>
      <Helmet>
        <title>404 - 페이지를 찾을 수 없습니다 | Long Island Korea</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="요청하신 페이지를 찾을 수 없습니다." />
      </Helmet>
      <div className="not-found-container">
      <div className="not-found-content">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">페이지를 찾을 수 없습니다</h2>
        <p className="not-found-description">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <div className="not-found-actions">
          <Link to="/" className="not-found-button primary">
            홈으로 돌아가기
          </Link>
          <Link to="/boards" className="not-found-button secondary">
            게시판 보기
          </Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default NotFound;