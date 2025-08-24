import React, { useState } from 'react';
import Button from '../components/common/Button';
import GlobalNavigation from '../components/GlobalNavigation';
import AlternativeNavigation from '../components/AlternativeNavigation';
import '../styles/design-system.css';

const DesignSystemPreview = () => {
  const [navStyle, setNavStyle] = useState('modern');
  
  return (
    <>
      {/* Navigation Style Showcase */}
      <div style={{ marginBottom: '60px' }}>
        <div style={{ background: '#f5f5f5', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '10px' }}>네비게이션 스타일 선택</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button 
              variant={navStyle === 'modern' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setNavStyle('modern')}
            >
              모던 링크 스타일
            </Button>
            <Button 
              variant={navStyle === 'minimal' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setNavStyle('minimal')}
            >
              울트라 미니멀
            </Button>
          </div>
        </div>
        
        {navStyle === 'modern' ? <GlobalNavigation /> : <AlternativeNavigation />}
      </div>
      
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '40px', color: 'var(--color-text-primary)' }}>
          Long Island Korea Design System Preview
        </h1>

      {/* Color Palette */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Color Palette</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          <ColorSwatch name="Primary" color="var(--color-primary)" />
          <ColorSwatch name="Primary Hover" color="var(--color-primary-hover)" />
          <ColorSwatch name="Success" color="var(--color-success)" />
          <ColorSwatch name="Warning" color="var(--color-warning)" />
          <ColorSwatch name="Danger" color="var(--color-danger)" />
          <ColorSwatch name="Background" color="var(--color-background)" />
          <ColorSwatch name="Surface" color="var(--color-surface)" />
          <ColorSwatch name="Border" color="var(--color-border)" />
          <ColorSwatch name="Text Primary" color="var(--color-text-primary)" />
          <ColorSwatch name="Text Secondary" color="var(--color-text-secondary)" />
        </div>
      </section>

      {/* Typography */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Typography</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
            Heading 1 - 32px Bold
          </div>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
            Heading 2 - 24px Semibold
          </div>
          <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-medium)' }}>
            Heading 3 - 18px Medium
          </div>
          <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-regular)' }}>
            Body Text - 16px Regular
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Small Text - 14px Secondary
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
            Extra Small - 12px Tertiary
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Buttons</h2>
        
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Variants</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="tertiary">Tertiary Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button variant="danger-tertiary">Danger Tertiary</Button>
        </div>

        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Sizes</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '32px' }}>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>

        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>States</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
          <Button>Normal</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </div>

        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>With Icons</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button icon="✏️">글쓰기</Button>
          <Button variant="danger" icon="🗑️" iconPosition="right">삭제</Button>
          <Button variant="secondary" icon="📌">스크랩</Button>
        </div>
      </section>

      {/* Cards */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Cards</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '12px' }}>Card Title</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              This is a card component with consistent styling and hover effects.
            </p>
            <Button variant="primary" size="sm">Action</Button>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: '12px' }}>Another Card</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Cards provide a clean way to group related content.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" size="sm">Cancel</Button>
              <Button variant="primary" size="sm">Confirm</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Tags */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Tags</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="tag tag-blue">사고팔고</span>
          <span className="tag tag-green">부동산</span>
          <span className="tag tag-purple">모임</span>
          <span className="tag tag-gray">문의</span>
          <span className="tag tag-red">Exit 42</span>
        </div>
      </section>

      {/* Form Elements */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Form Elements</h2>
        <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="text" 
            className="input" 
            placeholder="Text input" 
          />
          <textarea 
            className="textarea" 
            placeholder="Textarea for longer content" 
            rows="4"
          />
          <Button variant="primary" fullWidth>Submit</Button>
        </div>
      </section>

      {/* Spacing */}
      <section>
        <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Spacing Scale</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'].map(size => (
            <div key={size} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ width: '60px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {size}
              </span>
              <div 
                style={{ 
                  width: `var(--spacing-${size})`, 
                  height: '24px', 
                  backgroundColor: 'var(--color-primary)',
                  borderRadius: '4px'
                }} 
              />
              <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                var(--spacing-{size})
              </span>
            </div>
          ))}
        </div>
      </section>
      </div>
    </>
  );
};

// Color Swatch Component
const ColorSwatch = ({ name, color }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div 
        style={{ 
          width: '100%', 
          height: '80px', 
          backgroundColor: color,
          borderRadius: '8px',
          border: '1px solid var(--color-border)'
        }} 
      />
      <div>
        <div style={{ fontSize: '14px', fontWeight: '500' }}>{name}</div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{color}</div>
      </div>
    </div>
  );
};

export default DesignSystemPreview;