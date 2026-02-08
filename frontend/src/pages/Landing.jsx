import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../hooks/useAuth';
import { getBoards } from '../api/boards';
import { timeAgo } from '../utils/dataUtils';
import VersionDisplay from '../components/VersionDisplay';
import '../styles/Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recentPosts, setRecentPosts] = useState([]);
  const [postsLoaded, setPostsLoaded] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('logout') === 'true') {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/boards');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const data = await getBoards({ limit: 5 });
        const posts = data.posts || data || [];
        setRecentPosts(posts.slice(0, 5));
      } catch {
        // silently fail
      } finally {
        setPostsLoaded(true);
      }
    };
    fetchRecentPosts();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  const regions = [
    {
      name: 'Queens Border',
      exits: '13-30',
      description: 'Flushing, Bayside, Little Neck',
      link: '/boards?region=%3C%3D30'
    },
    {
      name: 'Western Nassau',
      exits: '31-41',
      description: 'Great Neck, Port Washington, Manhasset',
      link: '/boards?region=31-41'
    },
    {
      name: 'Central Nassau',
      exits: '42-49',
      description: 'Syosset, Jericho, Plainview, Hicksville',
      link: '/boards?region=42-49'
    },
    {
      name: 'Western Suffolk',
      exits: '50-58',
      description: 'Melville, Dix Hills, Huntington',
      link: '/boards?region=50-58'
    },
    {
      name: 'Central Suffolk',
      exits: '59-68',
      description: 'Stony Brook, Port Jefferson, Centereach',
      link: '/boards?region=59-68'
    },
    {
      name: 'Eastern Suffolk',
      exits: '69+',
      description: 'Riverhead, Calverton, Wading River',
      link: '/boards?region=%3E69'
    }
  ];

  const getTypeBadgeClass = (type) => {
    const typeMap = {
      '사고팔고': 'badge-사고팔고',
      '부동산': 'badge-부동산',
      '모임': 'badge-모임',
      '문의': 'badge-문의',
      '잡담': 'badge-잡담',
      '생활정보': 'badge-생활정보',
      '공지': 'badge-공지',
      '기타': 'badge-기타'
    };
    return typeMap[type] || 'badge-기타';
  };

  return (
    <>
      <Helmet>
        <title>롱아일랜드 한인 커뮤니티 | 뉴욕 롱아일랜드 한국인 생활정보</title>
        <meta name="description" content="뉴욕 롱아일랜드 한인들을 위한 생활정보 커뮤니티. 부동산, 구인구직, 맛집, 사고팔고, 모임 정보를 공유하고 한인들과 소통하세요. Great Neck, Manhasset, Melville 등 지역별 정보 제공." />
        <meta name="keywords" content="롱아일랜드 한인, Long Island Korean, 뉴욕 한인 커뮤니티, 롱아일랜드 부동산, 롱아일랜드 맛집, Great Neck 한인, Manhasset 한인, 뉴욕 한국 식당, 롱아일랜드 구인구직" />
        <meta property="og:title" content="롱아일랜드 한인 커뮤니티 | Long Island Korea" />
        <meta property="og:description" content="뉴욕 롱아일랜드 한인들을 위한 생활정보 커뮤니티. 부동산, 구인구직, 맛집 정보를 공유하세요." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://likorea.com" />
        <meta property="og:image" content="https://likorea.com/images/banner-desktop.png" />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:site_name" content="Long Island Korea" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="롱아일랜드 한인 커뮤니티" />
        <meta name="twitter:description" content="뉴욕 롱아일랜드 한인들을 위한 생활정보 커뮤니티" />
        <meta name="twitter:image" content="https://likorea.com/images/banner-desktop.png" />
        <link rel="canonical" href="https://likorea.com" />
        <link rel="alternate" hrefLang="ko" href="https://likorea.com" />
        <link rel="alternate" hrefLang="en" href="https://likorea.com/en" />
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(localBusinessSchema)}
        </script>
      </Helmet>

      <main className="landing-page">
        {/* Hero */}
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
            </div>
          </div>
        </section>

        {/* Regions */}
        <section className="regions-section">
          <div className="container">
            <div className="regions-header">
              <h2 className="section-title">지역별 커뮤니티</h2>
              <span className="regions-badge">I-495 고속도로 출구 기준</span>
            </div>
            <div className="regions-row">
              {regions.map((region, index) => (
                <Link to={region.link} key={index} className="region-card">
                  <span className="region-exit">{region.exits}</span>
                  <h3 className="region-name">{region.name}</h3>
                  <p className="region-desc">{region.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="activity-section">
          <div className="container">
            <div className="activity-grid">
              <div className="recent-posts">
                <div className="recent-posts-header">
                  <h2 className="section-title">최근 게시글</h2>
                  <Link to="/boards" className="view-all-link">전체보기</Link>
                </div>
                {postsLoaded && recentPosts.length > 0 ? (
                  <ul className="post-list">
                    {recentPosts.map((post) => (
                      <li key={post._id || post.id} className="post-item">
                        <Link to={`/boards/${post._id || post.id}`} className="post-item-link">
                          {post.tags?.type && (
                            <span className={`post-badge ${getTypeBadgeClass(post.tags.type)}`}>
                              {post.tags.type}
                            </span>
                          )}
                          <span className="post-title">{post.title}</span>
                          <span className="post-time">{timeAgo(post.createdAt)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : postsLoaded ? (
                  <p className="no-posts">아직 게시글이 없습니다.</p>
                ) : (
                  <div className="posts-loading">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="post-skeleton" />
                    ))}
                  </div>
                )}
              </div>

              <div className="community-info">
                <h3 className="community-info-title">함께하는 커뮤니티</h3>
                <p className="community-info-text">
                  롱아일랜드에 거주하는 한인들을 위한 정보 공유와 소통의 공간입니다.
                  지역 소식, 생활 정보, 부동산, 중고거래 등 다양한 정보를 나눠보세요.
                </p>
                <Link to="/boards" className="btn btn-cta">
                  게시판 바로가기
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <VersionDisplay position="bottom-right" showCodename={true} />
    </>
  );
};

export default Landing;
