import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getBot, createBot, updateBot } from '../../api/bots';
import Loading from '../../components/common/Loading';
import '../../styles/BotConfigForm.css';

// 기본 프롬프트 템플릿
const DEFAULT_PROMPTS = {
  restaurant: {
    system: `당신은 롱아일랜드 한인 커뮤니티를 위한 맛집 리뷰 전문가입니다.
실제 레스토랑 정보를 바탕으로 생생하고 유용한 리뷰를 작성합니다.
한국어로 친근하게 작성하며, 가격, 맛, 분위기, 서비스를 종합적으로 평가합니다.`,
    user: `다음 레스토랑에 대한 리뷰를 작성해주세요:
주소: {address}
추가 요청사항: {additionalRequests}`
  },
  news: {
    system: `당신은 롱아일랜드 한인 커뮤니티를 위한 뉴스 요약 전문가입니다.
실제 뉴스를 바탕으로 정확하고 신뢰할 수 있는 정보만 전달합니다.
한인 커뮤니티에 중요한 뉴스를 선별하여 요약합니다.`,
    user: `다음 키워드와 관련된 최신 뉴스를 요약해주세요:
키워드: {keywords}
추가 요청사항: {additionalRequests}`
  }
};

function BotConfigForm() {
  const { botId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isEdit = !!botId;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'restaurant',
    systemPrompt: DEFAULT_PROMPTS.restaurant.system,
    userPrompt: DEFAULT_PROMPTS.restaurant.user,
    persona: {
      age: 30,
      gender: '여성',
      occupation: '직장인',
      interests: [],
      personality: '',
      location: '롱아일랜드'
    }
  });

  const [loading, setLoading] = useState(isEdit); // 편집 모드일 때만 초기 로딩 true
  const [saving, setSaving] = useState(false);
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

  // 편집 모드일 때 봇 정보 로드
  useEffect(() => {
    if (!isEdit || !botId) {
      setLoading(false);
      return;
    }

    const fetchBot = async () => {
      try {
        console.log('봇 정보 로드 시작, botId:', botId);
        setLoading(true);
        const response = await getBot(botId);
        console.log('봇 정보 응답:', response);

        if (response.bot) {
          setFormData({
            name: response.bot.name || '',
            description: response.bot.description || '',
            type: response.bot.type || 'restaurant',
            systemPrompt: response.bot.prompt?.system || '',
            userPrompt: response.bot.prompt?.user || '',
            persona: response.bot.persona || {
              age: 30,
              gender: '여성',
              occupation: '직장인',
              interests: [],
              personality: '',
              location: '롱아일랜드'
            }
          });
        }
      } catch (err) {
        console.error('봇 정보 로드 실패:', err);
        setError('봇 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
        console.log('로딩 완료, 로딩 상태:', false);
      }
    };

    fetchBot();
  }, [botId, isEdit]);

  // 봇 타입 변경 핸들러
  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      type,
      systemPrompt: DEFAULT_PROMPTS[type].system,
      userPrompt: DEFAULT_PROMPTS[type].user
    }));
  };

  // 입력 변경 핸들러
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 페르소나 변경 핸들러
  const handlePersonaChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      persona: {
        ...prev.persona,
        [field]: value
      }
    }));
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      alert('봇 이름과 설명은 필수입니다.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...formData,
        aiModel: 'claude-3-haiku-20240307', // 기본 모델 사용
        status: 'active'
      };

      if (isEdit) {
        await updateBot(botId, payload);
        alert('봇이 수정되었습니다.');
      } else {
        await createBot(payload);
        alert('봇이 생성되었습니다.');
      }

      navigate('/bot-board/manage');
    } catch (err) {
      console.error('봇 저장 실패:', err);
      setError(err.message || '봇 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    console.log('로딩 상태:', { authLoading, loading, isEdit });
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        width: '100%'
      }}>
        <Loading />
      </div>
    );
  }

  return (
    <div className="bot-config-form-container">
      <div className="bot-config-form-header">
        <h1>{isEdit ? '봇 수정' : '새 봇 만들기'}</h1>
        <p>봇의 기본 정보와 동작 방식을 설정합니다.</p>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bot-config-form">
        <section className="form-section">
          <h2>기본 정보</h2>

          <div className="input-group">
            <label htmlFor="name">봇 이름 *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="예: 지수 맛집봇"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="description">봇 설명 *</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="봇의 역할과 특징을 설명해주세요..."
              rows={3}
              required
            />
          </div>

          <div className="input-group">
            <label>봇 타입 *</label>
            <div className="bot-type-selector">
              <button
                type="button"
                className={`type-option ${formData.type === 'restaurant' ? 'active' : ''}`}
                onClick={() => handleTypeChange('restaurant')}
              >
                🍽️ 맛집봇
              </button>
              <button
                type="button"
                className={`type-option ${formData.type === 'news' ? 'active' : ''}`}
                onClick={() => handleTypeChange('news')}
              >
                📰 뉴스봇
              </button>
            </div>
          </div>
        </section>

        <section className="form-section">
          <h2>페르소나 설정</h2>

          <div className="input-group-row">
            <div className="input-group">
              <label htmlFor="age">나이</label>
              <input
                id="age"
                type="number"
                value={formData.persona.age}
                onChange={(e) => handlePersonaChange('age', parseInt(e.target.value))}
                min="20"
                max="70"
              />
            </div>

            <div className="input-group">
              <label htmlFor="gender">성별</label>
              <select
                id="gender"
                value={formData.persona.gender}
                onChange={(e) => handlePersonaChange('gender', e.target.value)}
              >
                <option value="여성">여성</option>
                <option value="남성">남성</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="occupation">직업</label>
            <input
              id="occupation"
              type="text"
              value={formData.persona.occupation}
              onChange={(e) => handlePersonaChange('occupation', e.target.value)}
              placeholder="예: 대학생, 직장인, 주부"
            />
          </div>

          <div className="input-group">
            <label htmlFor="personality">성격</label>
            <input
              id="personality"
              type="text"
              value={formData.persona.personality}
              onChange={(e) => handlePersonaChange('personality', e.target.value)}
              placeholder="예: 친근하고 활발한 성격"
            />
          </div>
        </section>

        <section className="form-section">
          <h2>프롬프트 설정</h2>

          <div className="input-group">
            <label htmlFor="systemPrompt">시스템 프롬프트</label>
            <textarea
              id="systemPrompt"
              value={formData.systemPrompt}
              onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
              placeholder="봇의 역할과 행동 지침을 입력하세요..."
              rows={6}
            />
            <small>봇의 기본 성격과 역할을 정의합니다.</small>
          </div>

          <div className="input-group">
            <label htmlFor="userPrompt">사용자 프롬프트 템플릿</label>
            <textarea
              id="userPrompt"
              value={formData.userPrompt}
              onChange={(e) => handleInputChange('userPrompt', e.target.value)}
              placeholder="사용자 입력을 처리할 템플릿을 작성하세요..."
              rows={6}
            />
            <small>
              변수 사용: {'{address}'}, {'{keywords}'}, {'{additionalRequests}'}
            </small>
          </div>
        </section>

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate('/bot-board/manage')}
            disabled={saving}
          >
            취소
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={saving}
          >
            {saving ? '저장 중...' : (isEdit ? '수정' : '생성')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BotConfigForm;