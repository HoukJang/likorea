import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../hooks/useAuth';
import '../styles/Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 로그인된 사용자는 게시판으로 리다이렉트
  useEffect(() => {
    if (user) {
      navigate('/boards');
    }
  }, [user, navigate]);
  
  // Schema.org 구조화된 데이터
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': '롱아일랜드 한인 커뮤니티',
    'alternateName': 'Long Island Korea',
    'url': 'https://longislandkorea.com',
    'description': '뉴욕 롱아일랜드 한인들을 위한 생활정보, 부동산, 구인구직, 맛집 정보 커뮤니티',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': 'https://longislandkorea.com/boards?search={search_term_string}',
      'query-input': 'required name=search_term_string'
    },
    'areaServed': {
      '@type': 'Place',
      'name': 'Long Island, New York',
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': 40.7891,
        'longitude': -73.1350
      }
    }
  };

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': '롱아일랜드 한인 커뮤니티',
    'url': 'https://longislandkorea.com',
    'logo': 'https://longislandkorea.com/logo192.png',
    'sameAs': [
      'https://www.facebook.com/longislandkorea',
      'https://www.instagram.com/longislandkorea'
    ],
    'address': {
      '@type': 'PostalAddress',
      'addressRegion': 'NY',
      'addressCountry': 'US',
      'addressLocality': 'Long Island'
    }
  };

  useEffect(() => {
    // 페이지 스크롤 최상단으로
    window.scrollTo(0, 0);
  }, []);

  const regions = [
    {
      name: '롱시티, 플러싱',
      exits: '13-30',
      description: 'Queens 접경 지역',
      link: '/boards?region=%3C%3D30'
    },
    {
      name: '그레잇넥, 제리코, 샤요셋',
      exits: '31-41',
      description: 'Nassau County 서부',
      link: '/boards?region=31-41'
    },
    {
      name: '힉스빌, 플레인뷰, 멜빌',
      exits: '42-49',
      description: 'Nassau County 중부',
      link: '/boards?region=42-49'
    },
    {
      name: '딕스힐, 브렌트우드, 롱콩코마',
      exits: '50-58',
      description: 'Suffolk County 서부',
      link: '/boards?region=50-58'
    },
    {
      name: '스토니브룩, 시터켓, 패쵹, 얍행크',
      exits: '59-68',
      description: 'Suffolk County 중부',
      link: '/boards?region=59-68'
    },
    {
      name: '리버헤드',
      exits: '69+',
      description: 'Suffolk County 동부',
      link: '/boards?region=%3E69'
    }
  ];

  const services = [
    {
      icon: '📰',
      title: '지역뉴스',
      description: '롱아일랜드 지역의 최신 뉴스와 소식을 전해드립니다',
      link: '/boards?type=생활정보&subcategory=뉴스'
    },
    {
      icon: '🍽️',
      title: '맛집정보',
      description: '한인 운영 레스토랑과 현지 맛집 정보를 나눕니다',
      link: '/boards?type=생활정보&subcategory=맛집'
    },
    {
      icon: '📚',
      title: '정착가이드',
      description: '롱아일랜드 정착에 필요한 모든 정보를 제공합니다',
      link: '/boards?type=생활정보&subcategory=정착가이드'
    },
    {
      icon: '🛒',
      title: '사고팔고',
      description: '중고물품 거래와 개인 거래 정보를 공유합니다',
      link: '/boards?type=사고팔고'
    },
    {
      icon: '👥',
      title: '모임/이벤트',
      description: '지역 한인 모임과 이벤트 소식을 전해드립니다',
      link: '/boards?type=모임'  // 모임 전체를 보여줍니다 (번개, 정기, 이벤트 모두 포함)
    },
    {
      icon: '🏠',
      title: '부동산',
      description: '롱아일랜드 지역별 부동산 매매, 렌트 정보를 공유합니다',
      link: '/boards?type=부동산'
    }
  ];

  return (
    <>
      <Helmet>
        <title>롱아일랜드 한인 커뮤니티 | 뉴욕 롱아일랜드 한국인 생활정보</title>
        <meta name="description" content="뉴욕 롱아일랜드 한인들을 위한 생활정보 커뮤니티. 부동산, 구인구직, 맛집, 사고팔고, 모임 정보를 공유하고 한인들과 소통하세요. Great Neck, Manhasset, Melville 등 지역별 정보 제공." />
        <meta name="keywords" content="롱아일랜드 한인, Long Island Korean, 뉴욕 한인 커뮤니티, 롱아일랜드 부동산, 롱아일랜드 맛집, Great Neck 한인, Manhasset 한인, 뉴욕 한국 식당, 롱아일랜드 구인구직" />

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="롱아일랜드 한인 커뮤니티 | Long Island Korea" />
        <meta property="og:description" content="뉴욕 롱아일랜드 한인들을 위한 생활정보 커뮤니티. 부동산, 구인구직, 맛집 정보를 공유하세요." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://longislandkorea.com" />
        <meta property="og:image" content="https://longislandkorea.com/og-image.jpg" />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:site_name" content="Long Island Korea" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="롱아일랜드 한인 커뮤니티" />
        <meta name="twitter:description" content="뉴욕 롱아일랜드 한인들을 위한 생활정보 커뮤니티" />
        <meta name="twitter:image" content="https://longislandkorea.com/og-image.jpg" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://longislandkorea.com" />

        {/* Language Alternates */}
        <link rel="alternate" hrefLang="ko" href="https://longislandkorea.com" />
        <link rel="alternate" hrefLang="en" href="https://longislandkorea.com/en" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(localBusinessSchema)}
        </script>
      </Helmet>

      <main className="landing-page">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              롱아일랜드 한인 커뮤니티
              <span className="hero-subtitle">Long Island Korean Community</span>
            </h1>
            <p className="hero-description">
              뉴욕 롱아일랜드에 거주하는 한인들을 위한 생활정보 공유 플랫폼
            </p>
            <div className="hero-actions">
              <Link to="/boards" className="btn btn-primary">
                커뮤니티 시작하기
              </Link>
              <Link to="/signup" className="btn btn-secondary">
                회원가입
              </Link>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="services-section">
          <div className="container">
            <h2 className="section-title">주요 서비스</h2>
            <p className="section-description">
              롱아일랜드 한인들의 편리한 생활을 위한 다양한 정보를 제공합니다
            </p>
            <div className="services-grid">
              {services.map((service, index) => (
                <Link to={service.link} key={index} className="service-card">
                  <div className="service-icon">{service.icon}</div>
                  <h3 className="service-title">{service.title}</h3>
                  <p className="service-description">{service.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Areas Section */}
        <section className="areas-section">
          <div className="container">
            <h2 className="section-title">주요 지역 정보</h2>
            <p className="section-description">
              495번 고속도로 Exit 기준 한인 밀집 지역 정보
            </p>
            <div className="areas-grid">
              {regions.map((region, index) => (
                <div key={index} className="area-card">
                  <h3 className="area-exit">Exit {region.exits}</h3>
                  <h4 className="area-name">{region.name}</h4>
                  <p className="area-description">{region.description}</p>
                  <Link to={region.link} className="area-link">
                    지역 정보 보기 →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="container">
            <h2 className="section-title">커뮤니티 특징</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🌏</div>
                <h3>지역 기반 정보</h3>
                <p>495 Exit 번호로 세분화된 지역별 정보 제공</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🤝</div>
                <h3>한인 네트워크</h3>
                <p>롱아일랜드 한인들과의 활발한 교류와 정보 공유</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📱</div>
                <h3>모바일 최적화</h3>
                <p>언제 어디서나 편리하게 이용 가능한 반응형 디자인</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔒</div>
                <h3>안전한 거래</h3>
                <p>신뢰할 수 있는 한인 커뮤니티 내 안전한 정보 교환</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="container">
            <h2 className="cta-title">지금 바로 롱아일랜드 한인 커뮤니티에 참여하세요</h2>
            <p className="cta-description">
              함께 만들어가는 따뜻한 한인 커뮤니티
            </p>
            <Link to="/signup" className="btn btn-cta">
              무료 회원가입
            </Link>
          </div>
        </section>

        {/* SEO Content Section */}
        <section className="seo-content">
          <div className="container">
            <h2>뉴욕 롱아일랜드 한인 생활 가이드</h2>
            <div className="seo-text">
              <p>
                롱아일랜드(Long Island)는 뉴욕주에서 한인들이 많이 거주하는 지역 중 하나입니다.
                특히 Great Neck, Manhasset, Port Washington, Syosset 등의 지역은
                우수한 학군과 안전한 주거환경으로 많은 한인 가족들이 선호하는 지역입니다.
              </p>
              <p>
                저희 롱아일랜드 한인 커뮤니티는 이러한 지역에 거주하는 한인들을 위해
                부동산 정보, 학교 정보, 병원 및 의료 서비스, 한국 식품점, 한인 운영 비즈니스 등
                실생활에 필요한 모든 정보를 제공하고 있습니다.
              </p>
              <p>
                롱아일랜드 한인 커뮤니티를 통해 새로 이주하신 분들은 정착에 필요한 정보를 얻고,
                기존 거주자들은 일상생활에 유용한 정보를 공유하며,
                함께 더 나은 한인 커뮤니티를 만들어가고 있습니다.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Landing;