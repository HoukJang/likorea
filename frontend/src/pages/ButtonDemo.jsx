import React, { useState } from 'react';
import Button from '../components/ui/Button';
import '../styles/ButtonDemo.css';

const ButtonDemo = () => {
  const [loading, setLoading] = useState(false);

  const handleLoadingClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  // Icon components
  const ArrowRightIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const HeartIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 14C8 14 1 10 1 5.5C1 3 3 1 5.5 1C6.5 1 7.5 1.5 8 2C8.5 1.5 9.5 1 10.5 1C13 1 15 3 15 5.5C15 10 8 14 8 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div className="button-demo-container">
      <h1 className="demo-title">새로운 버튼 디자인 시스템</h1>
      <p className="demo-subtitle">미니멀하고 현대적인 버튼 컴포넌트</p>

      {/* Button Variants */}
      <section className="demo-section">
        <h2 className="section-title">버튼 종류 (Variants)</h2>
        <div className="button-grid">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="text">Text Button</Button>
          <Button variant="danger">Danger Button</Button>
        </div>
      </section>

      {/* Button Sizes */}
      <section className="demo-section">
        <h2 className="section-title">버튼 크기 (Sizes)</h2>
        <div className="button-grid">
          <Button size="small">Small Button</Button>
          <Button size="medium">Medium Button</Button>
          <Button size="large">Large Button</Button>
        </div>
      </section>

      {/* Button States */}
      <section className="demo-section">
        <h2 className="section-title">버튼 상태 (States)</h2>
        <div className="button-grid">
          <Button>Normal</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
          <Button onClick={handleLoadingClick} loading={loading}>
            {loading ? 'Processing...' : 'Click to Load'}
          </Button>
        </div>
      </section>

      {/* Buttons with Icons */}
      <section className="demo-section">
        <h2 className="section-title">아이콘 버튼 (With Icons)</h2>
        <div className="button-grid">
          <Button icon={<ArrowRightIcon />} iconPosition="right">
            Next Step
          </Button>
          <Button variant="secondary" icon={<HeartIcon />}>
            Like
          </Button>
          <Button variant="ghost" icon={<HeartIcon />} />
          <Button size="small" icon={<ArrowRightIcon />} iconPosition="right">
            Continue
          </Button>
        </div>
      </section>

      {/* Full Width Buttons */}
      <section className="demo-section">
        <h2 className="section-title">전체 너비 버튼 (Full Width)</h2>
        <div className="full-width-demo">
          <Button fullWidth variant="primary">
            로그인
          </Button>
          <Button fullWidth variant="secondary">
            회원가입
          </Button>
        </div>
      </section>

      {/* Real Login/Signup Example */}
      <section className="demo-section">
        <h2 className="section-title">실제 로그인/회원가입 예제</h2>
        <div className="auth-example">
          <div className="auth-buttons-demo">
            <Button variant="ghost" size="medium">
              로그인
            </Button>
            <Button variant="primary" size="medium">
              회원가입
            </Button>
          </div>
        </div>
      </section>

      {/* Dark Mode Preview */}
      <section className="demo-section dark-mode-section">
        <h2 className="section-title">다크 모드 (Dark Mode)</h2>
        <div className="button-grid">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="text">Text</Button>
        </div>
      </section>
    </div>
  );
};

export default ButtonDemo;