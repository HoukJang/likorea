import '../styles/design-preview.css';

function DesignPreview() {
  return (
    <div className="design-preview">
      <div className="preview-section">
        <h2 className="preview-title">🎨 디자인 개선 미리보기</h2>

        {/* 버튼 비교 */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ marginBottom: '20px', color: '#374151' }}>현재 디자인 (기존)</h3>
          <div className="current-buttons">
            <button className="current-button current-primary">Primary Button</button>
            <button className="current-button current-danger">Danger Button</button>
            <button className="current-button current-success">Success Button</button>
          </div>

          <h3 style={{ marginBottom: '20px', color: '#374151', marginTop: '30px' }}>
            개선된 디자인 (새로운)
          </h3>
          <div className="improved-buttons">
            <button className="improved-button improved-primary">Primary Button</button>
            <button className="improved-button improved-success">Success Button</button>
            <button className="improved-button improved-danger">Danger Button</button>
            <button className="improved-button improved-secondary">Secondary Button</button>
          </div>
        </div>

        {/* 네비게이션 비교 */}
        <div className="nav-comparison">
          <div className="nav-section">
            <h3>현재 네비게이션</h3>
            <div className="nav-buttons">
              <button className="nav-button current-nav-main">메인으로</button>
              <button className="nav-button current-nav-write">✏️ 글쓰기</button>
              <button className="nav-button current-nav-logout">로그아웃</button>
            </div>
          </div>

          <div className="nav-section">
            <h3>개선된 네비게이션</h3>
            <div className="nav-buttons">
              <button className="nav-button improved-nav-main">메인으로</button>
              <button className="nav-button improved-nav-write">✏️ 글쓰기</button>
              <button className="nav-button improved-nav-logout">로그아웃</button>
            </div>
          </div>
        </div>

        {/* 색상 팔레트 비교 */}
        <div className="color-palette">
          <div className="color-group">
            <h4>현재 색상 팔레트</h4>
            <div className="color-swatch">
              <div className="color-box current-blue"></div>
              <span>Primary Blue: #2563eb</span>
            </div>
            <div className="color-swatch">
              <div className="color-box current-red"></div>
              <span>Accent Red: #dc2626</span>
            </div>
            <div className="color-swatch">
              <div className="color-box current-gray"></div>
              <span>Gray: #6b7280</span>
            </div>
          </div>

          <div className="color-group">
            <h4>개선된 색상 팔레트</h4>
            <div className="color-swatch">
              <div className="color-box improved-blue"></div>
              <span>Primary Blue: #3b82f6</span>
            </div>
            <div className="color-swatch">
              <div className="color-box improved-green"></div>
              <span>Success Green: #10b981</span>
            </div>
            <div className="color-swatch">
              <div className="color-box improved-gray"></div>
              <span>Gray: #6b7280</span>
            </div>
          </div>
        </div>

        {/* 개선 사항 설명 */}
        <div className="description">
          <h3>🎯 주요 개선 사항</h3>
          <ul>
            <li>
              <strong>색상 현대화:</strong> 빨간색 → 그린 계열로 변경하여 더 부드럽고 세련된 느낌
            </li>
            <li>
              <strong>그라데이션 효과:</strong> 단색에서 그라데이션으로 변경하여 시각적 깊이감 추가
            </li>
            <li>
              <strong>호버 효과 개선:</strong> 더 부드러운 애니메이션과 그림자 효과
            </li>
            <li>
              <strong>일관성 향상:</strong> 모든 버튼이 동일한 디자인 언어 사용
            </li>
            <li>
              <strong>접근성 개선:</strong> WCAG 2.1 AA 기준을 준수하는 색상 대비
            </li>
          </ul>
        </div>

        <div className="description" style={{ background: '#fef3c7', borderLeftColor: '#f59e0b' }}>
          <h3 style={{ color: '#92400e' }}>💡 변경 사항 요약</h3>
          <ul>
            <li>
              <strong>글쓰기 버튼:</strong> 빨간색(#dc2626) → 그린 계열(#10b981)
            </li>
            <li>
              <strong>Primary 버튼:</strong> 파란색(#2563eb) → 더 밝은 파란색(#3b82f6)
            </li>
            <li>
              <strong>그림자 효과:</strong> 더 부드럽고 현대적인 그림자
            </li>
            <li>
              <strong>애니메이션:</strong> 더 부드러운 cubic-bezier 곡선 사용
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DesignPreview;
