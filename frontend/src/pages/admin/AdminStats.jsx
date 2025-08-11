import { useState, useEffect } from 'react';
import { getAdminStats } from '../../api/admin';
import '../../styles/Admin.css';

function AdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // 권한 레벨 표시
  const getAuthorityLabel = level => {
    switch (parseInt(level)) {
      case 1:
        return '게스트';
      case 2:
        return '제한 사용자';
      case 3:
        return '일반 사용자';
      case 4:
        return '매니저';
      case 5:
        return '관리자';
      default:
        return '알 수 없음';
    }
  };

  // 통계 불러오기
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await getAdminStats();
      setStats(response.stats);
      setLoading(false);
    } catch (err) {
      // 통계 로드 실패는 조용히 처리
      setLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <section className="admin-section">
        <div className="section-header">
          <h2>사이트 통계</h2>
          <p className="section-description">사용자, 게시글, 댓글 등 전체 사이트 활동 통계</p>
        </div>
        <p>통계 정보를 불러오는 중...</p>
      </section>
    );
  }

  return (
    <section
      className="admin-section"
      id="stats-panel"
      role="tabpanel"
      aria-labelledby="stats-tab"
    >
      <div className="section-header">
        <h2>사이트 통계</h2>
        <p className="section-description">사용자, 게시글, 댓글 등 전체 사이트 활동 통계</p>
      </div>
      {stats ? (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>전체 사용자</h3>
            <p>{stats.userCount}명</p>
          </div>
          <div className="stat-card">
            <h3>전체 게시글</h3>
            <p>{stats.postCount}개</p>
          </div>
          <div className="stat-card">
            <h3>전체 댓글</h3>
            <p>{stats.commentCount}개</p>
          </div>
          <div className="stat-card">
            <h3>최근 7일 게시글</h3>
            <p>{stats.lastWeekPosts}개</p>
          </div>
          <div className="stat-card">
            <h3>최근 7일 댓글</h3>
            <p>{stats.lastWeekComments}개</p>
          </div>

          <div className="stat-card authority-stats">
            <h3>권한별 사용자 수</h3>
            {stats.authorityStats &&
              stats.authorityStats.map(stat => (
                <div key={stat._id} className="authority-item">
                  <span>{getAuthorityLabel(stat._id)}:</span>
                  <span>{stat.count}명</span>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <p>통계 정보를 불러올 수 없습니다.</p>
      )}
    </section>
  );
}

export default AdminStats;