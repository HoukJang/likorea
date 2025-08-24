import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../hooks/useAuth';
import VersionDisplay from '../components/VersionDisplay';
import '../styles/Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // logout=true 파라미터가 있으면 URL 정리
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('logout') === 'true') {
      // URL에서 logout 파라미터 제거
      window.history.replaceState({}, '', '/');
    }
  }, []);

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
    'url': 'https://likorea.com',
    'description': '뉴욕 롱아일랜드 한인들을 위한 생활정보, 부동산, 구인구직, 맛집 정보 커뮤니티',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': 'https://likorea.com/boards?search={search_term_string}',
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
    'url': 'https://likorea.com',
    'logo': 'https://likorea.com/logo192.png',
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
      name: 'Flushing, Bayside, Little Neck',
      exits: '13-30',
      description: 'Queens Border Area',
      link: '/boards?region=%3C%3D30'
    },
    {
      name: 'Great Neck, Port Washington, Manhasset',
      exits: '31-41',
      description: 'Western Nassau County',
      link: '/boards?region=31-41'
    },
    {
      name: 'Syosset, Jericho, Plainview, Hicksville',
      exits: '42-49',
      description: 'Central Nassau County',
      link: '/boards?region=42-49'
    },
    {
      name: 'Melville, Dix Hills, Huntington',
      exits: '50-58',
      description: 'Western Suffolk County',
      link: '/boards?region=50-58'
    },
    {
      name: 'Stony Brook, Port Jefferson, Centereach',
      exits: '59-68',
      description: 'Central Suffolk County',
      link: '/boards?region=59-68'
    },
    {
      name: 'Riverhead, Calverton, Wading River',
      exits: '69+',
      description: 'Eastern Suffolk County',
      link: '/boards?region=%3E69'
    }
  ];

  const services = [
    {
      icon: '👶',
      title: '육아/교육',
      description: '학군 정보, 학원, 보육시설, 육아 팁을 공유합니다',
      link: '/boards?type=생활정보&subcategory=육아/교육'
    },
    {
      icon: '🍽️',
      title: '맛집정보',
      description: '롱아일랜드 현지 맛집과 레스토랑 정보를 나눕니다',
      link: '/boards?type=생활정보&subcategory=맛집'
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
      icon: '🎡',
      title: '여행/나들이',
      description: '롱아일랜드 주변 여행지와 나들이 정보를 공유합니다',
      link: '/boards?type=생활정보&subcategory=여행/나들이'
    },
    {
      icon: '📰',
      title: '지역뉴스',
      description: '롱아일랜드 지역의 최신 뉴스와 소식을 전해드립니다',
      link: '/boards?type=생활정보&subcategory=뉴스'
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
        <meta property="og:url" content="https://likorea.com" />
        <meta property="og:image" content="https://likorea.com/images/banner-desktop.png" />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:site_name" content="Long Island Korea" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="롱아일랜드 한인 커뮤니티" />
        <meta name="twitter:description" content="뉴욕 롱아일랜드 한인들을 위한 생활정보 커뮤니티" />
        <meta name="twitter:image" content="https://likorea.com/images/banner-desktop.png" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://likorea.com" />

        {/* Language Alternates */}
        <link rel="alternate" hrefLang="ko" href="https://likorea.com" />
        <link rel="alternate" hrefLang="en" href="https://likorea.com/en" />

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

      </main>
      <VersionDisplay position="bottom-right" showCodename={true} />
    </>
  );
};

export default Landing;