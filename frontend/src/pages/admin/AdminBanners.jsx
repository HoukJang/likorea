import { useState, useEffect } from 'react';
import { 
  getAllBanners, 
  createBanner, 
  updateBanner, 
  deleteBanner, 
  toggleBannerStatus 
} from '../../api/banner';
import '../../styles/AdminBanners.css';

function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    message: '',
    type: 'info',
    icon: '📢',
    link: { url: '', text: '자세히 보기' },
    endDate: '',
    dismissible: true,
    priority: 0
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await getAllBanners();
      setBanners(response.data.banners);
    } catch (error) {
      setError('배너 목록을 불러오는데 실패했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const bannerData = {
        ...formData,
        link: formData.link.url ? formData.link : undefined
      };

      if (editingBanner) {
        await updateBanner(editingBanner._id, bannerData);
      } else {
        await createBanner(bannerData);
      }

      await fetchBanners();
      resetForm();
    } catch (error) {
      setError(error.response?.data?.message || '배너 저장에 실패했습니다.');
    }
  };

  const handleToggleStatus = async (bannerId) => {
    try {
      await toggleBannerStatus(bannerId);
      await fetchBanners();
    } catch (error) {
      setError('배너 상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (bannerId) => {
    if (window.confirm('정말로 이 배너를 삭제하시겠습니까?')) {
      try {
        await deleteBanner(bannerId);
        await fetchBanners();
      } catch (error) {
        setError('배너 삭제에 실패했습니다.');
      }
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      message: banner.message,
      type: banner.type,
      icon: banner.icon,
      link: banner.link || { url: '', text: '자세히 보기' },
      endDate: new Date(banner.endDate).toISOString().slice(0, 16),
      dismissible: banner.dismissible,
      priority: banner.priority
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      message: '',
      type: 'info',
      icon: '📢',
      link: { url: '', text: '자세히 보기' },
      endDate: '',
      dismissible: true,
      priority: 0
    });
    setEditingBanner(null);
    setShowForm(false);
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return now.toISOString().slice(0, 16);
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="admin-banners">
      <div className="admin-header">
        <h2>배너 관리</h2>
        <button 
          className="btn-create"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '취소' : '새 배너 만들기'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="banner-form" onSubmit={handleSubmit}>
          <h3>{editingBanner ? '배너 수정' : '새 배너 만들기'}</h3>
          
          <div className="form-group">
            <label>메시지 *</label>
            <input
              type="text"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              maxLength={200}
              required
              placeholder="배너에 표시할 메시지를 입력하세요"
            />
            <span className="char-count">{formData.message.length}/200</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>타입</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="info">정보 (파란색)</option>
                <option value="warning">경고 (노란색)</option>
                <option value="success">성공 (초록색)</option>
                <option value="event">이벤트 (빨간색)</option>
              </select>
            </div>

            <div className="form-group">
              <label>아이콘</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="이모지"
              />
            </div>

            <div className="form-group">
              <label>우선순위</label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label>링크 URL (선택)</label>
            <input
              type="url"
              value={formData.link.url}
              onChange={(e) => setFormData({ 
                ...formData, 
                link: { ...formData.link, url: e.target.value } 
              })}
              placeholder="https://example.com"
            />
          </div>

          {formData.link.url && (
            <div className="form-group">
              <label>링크 텍스트</label>
              <input
                type="text"
                value={formData.link.text}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  link: { ...formData.link, text: e.target.value } 
                })}
                placeholder="자세히 보기"
              />
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>종료일시 *</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={getMinDateTime()}
                required
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.dismissible}
                  onChange={(e) => setFormData({ ...formData, dismissible: e.target.checked })}
                />
                사용자가 닫을 수 있음
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-save">
              {editingBanner ? '수정' : '생성'}
            </button>
            <button type="button" className="btn-cancel" onClick={resetForm}>
              취소
            </button>
          </div>
        </form>
      )}

      <div className="banners-list">
        {banners.length === 0 ? (
          <div className="empty-state">생성된 배너가 없습니다.</div>
        ) : (
          banners.map((banner) => (
            <div key={banner._id} className={`banner-item ${!banner.isActive ? 'inactive' : ''}`}>
              <div className="banner-preview">
                <span className="banner-icon">{banner.icon}</span>
                <span className="banner-message">{banner.message}</span>
                {banner.link && banner.link.url && (
                  <a href={banner.link.url} target="_blank" rel="noopener noreferrer" className="banner-link">
                    {banner.link.text}
                  </a>
                )}
              </div>
              
              <div className="banner-info">
                <span className={`badge badge-${banner.type}`}>{banner.type}</span>
                <span className={`badge ${banner.isActive ? 'badge-active' : 'badge-inactive'}`}>
                  {banner.isActive ? '활성' : '비활성'}
                </span>
                <span className="date">
                  종료: {new Date(banner.endDate).toLocaleString()}
                </span>
                {banner.priority > 0 && (
                  <span className="priority">우선순위: {banner.priority}</span>
                )}
              </div>

              <div className="banner-actions">
                <button onClick={() => handleToggleStatus(banner._id)}>
                  {banner.isActive ? '비활성화' : '활성화'}
                </button>
                <button onClick={() => handleEdit(banner)}>수정</button>
                <button onClick={() => handleDelete(banner._id)} className="btn-delete">
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminBanners;