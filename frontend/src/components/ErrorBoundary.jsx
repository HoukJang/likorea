import React from 'react';
import { getErrorInfo } from '../utils/errorHandler';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(_error) {
    // 에러가 발생하면 상태를 업데이트
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 에러 로깅
    getErrorInfo(error);

    this.setState({
      error,
      errorInfo
    });

    // 에러 추적 서비스로 전송 (선택적)
    // 예: Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#f8f9fa'
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              padding: '40px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}
          >
            <h1
              style={{
                color: '#dc3545',
                marginBottom: '20px',
                fontSize: '2rem'
              }}
            >
              🚨 오류가 발생했습니다
            </h1>

            <p
              style={{
                color: '#6c757d',
                marginBottom: '30px',
                fontSize: '1.1rem'
              }}
            >
              죄송합니다. 예상치 못한 오류가 발생했습니다.
            </p>

            <div style={{ marginBottom: '30px' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  marginRight: '10px'
                }}
              >
                페이지 새로고침
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                홈으로 이동
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details
                style={{
                  marginTop: '20px',
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    color: '#495057'
                  }}
                >
                  개발자 정보 (개발 환경에서만 표시)
                </summary>
                <div
                  style={{
                    marginTop: '10px',
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    color: '#6c757d'
                  }}
                >
                  <p>
                    <strong>에러 메시지:</strong> {this.state.error.message}
                  </p>
                  <p>
                    <strong>발생 시간:</strong> {new Date().toLocaleString()}
                  </p>
                  {this.state.errorInfo && (
                    <div>
                      <p>
                        <strong>컴포넌트 스택:</strong>
                      </p>
                      <pre
                        style={{
                          backgroundColor: '#e9ecef',
                          padding: '10px',
                          borderRadius: '4px',
                          overflow: 'auto',
                          fontSize: '0.8rem'
                        }}
                      >
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
