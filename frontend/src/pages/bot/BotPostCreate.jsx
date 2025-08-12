import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getBots, createBotPost } from '../../api/bots';
import Loading from '../../components/common/Loading';
import '../../styles/BotPostCreate.css';

function BotPostCreate() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [bots, setBots] = useState([]);
  const [selectedBot, setSelectedBot] = useState('');
  const [selectedBotType, setSelectedBotType] = useState('');
  const [inputs, setInputs] = useState({
    address: '',
    newsKeywords: '',
    additionalRequests: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 권한 체크
  useEffect(() => {
    if (authLoading) {
      return;
    }
    
    if (!user || user.authority < 5) {
      alert('관리자 권한이 필요합니다.');
      navigate('/');
    }
  }, [user, navigate, authLoading]);

  // 봇 목록 로드
  const loadBots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getBots();

      if (response.bots) {
        setBots(response.bots);
      }
    } catch (err) {
      console.error('봇 목록 로드 실패:', err);
      setError('봇 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBots();
  }, [loadBots]);

  // 봇 선택 핸들러
  const handleBotSelect = (e) => {
    const botId = e.target.value;
    setSelectedBot(botId);

    // 선택된 봇의 타입 찾기
    const bot = bots.find(b => b._id === botId);
    if (bot) {
      setSelectedBotType(bot.type || '');
    }
  };

  // 입력 변경 핸들러
  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 작업 내용 생성
  const generateTaskContent = () => {
    switch (selectedBotType) {
      case 'restaurant':
        return inputs.address || '';
      case 'news':
        return inputs.newsKeywords || '';
      default:
        return '';
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedBot) {
      alert('봇을 선택해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const taskContent = generateTaskContent();

      const response = await createBotPost(
        selectedBot,
        taskContent,
        inputs.additionalRequests
      );

      if (response.success) {
        alert('봇 게시글 생성이 시작되었습니다. 잠시 후 목록에서 확인하세요.');
        console.log('봇 게시글 생성 응답:', response);
        navigate('/bot-board');
      } else {
        setError('게시글 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error('봇 게시글 생성 실패:', err);
      setError(err.message || '게시글 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 봇 타입별 입력 필드 렌더링
  const renderInputFields = () => {
    switch (selectedBotType) {
      case 'restaurant':
        return (
          <div className="input-group">
            <label htmlFor="address">레스토랑 주소 *</label>
            <input
              id="address"
              type="text"
              value={inputs.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="예: 123 Main St, Great Neck, NY 11021"
              required
            />
            <small>정확한 주소를 입력하면 더 좋은 리뷰를 생성할 수 있습니다.</small>
          </div>
        );

      case 'news':
        return (
          <div className="input-group">
            <label htmlFor="newsKeywords">뉴스 키워드 (선택사항)</label>
            <input
              id="newsKeywords"
              type="text"
              value={inputs.newsKeywords}
              onChange={(e) => handleInputChange('newsKeywords', e.target.value)}
              placeholder="예: Great Neck, 한인 커뮤니티"
            />
            <small>특정 키워드를 입력하면 관련 뉴스를 우선적으로 선택합니다.</small>
          </div>
        );

      default:
        return null;
    }
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  return (
    <div className="bot-post-create-container">
      <div className="bot-post-create-header">
        <h1>봇 글쓰기</h1>
        <p>봇을 선택하고 필요한 정보를 입력하면 자동으로 게시글을 생성합니다.</p>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bot-post-form">
        <div className="input-group">
          <label htmlFor="bot-select">봇 선택 *</label>
          <select
            id="bot-select"
            value={selectedBot}
            onChange={handleBotSelect}
            required
          >
            <option value="">봇을 선택하세요</option>
            {bots.map(bot => (
              <option key={bot._id} value={bot._id}>
                {bot.name} - {bot.description}
              </option>
            ))}
          </select>
        </div>

        {selectedBot && renderInputFields()}

        <div className="input-group">
          <label htmlFor="additional-requests">추가 요청사항</label>
          <textarea
            id="additional-requests"
            value={inputs.additionalRequests}
            onChange={(e) => handleInputChange('additionalRequests', e.target.value)}
            placeholder="봇에게 추가로 요청하고 싶은 내용을 입력하세요..."
            rows={5}
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate('/bot-board')}
            disabled={submitting}
          >
            취소
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={submitting || !selectedBot}
          >
            {submitting ? '생성 중...' : '글쓰기'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BotPostCreate;