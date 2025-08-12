import { useState, useEffect } from 'react';
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
  },
  general: {
    system: `당신은 롱아일랜드 한인 커뮤니티의 활발한 회원입니다.
커뮤니티에 도움이 되는 유용한 정보와 따뜻한 이야기를 공유합니다.`,
    user: `{topic}에 대한 게시글을 작성해주세요.
추가 요청사항: {additionalRequests}`
  }
};

// 탭 정의
const TABS = [
  { id: 'basic', label: '기본 정보', icon: '📝' },
  { id: 'prompt', label: '프롬프트 설정', icon: '💬' },
  { id: 'persona', label: '페르소나', icon: '👤' },
  { id: 'api', label: 'API 설정', icon: '⚙️' },
  { id: 'schedule', label: '스케줄링', icon: '⏰' }
];

function BotConfigForm() {
  const { botId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isEdit = !!botId;

  const [activeTab, setActiveTab] = useState('basic');
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
    },
    settings: {
      autoPost: false,
      postInterval: 24, // 시간 단위로 변경 (기본 24시간)
      targetCategories: [],
      scheduleParams: {
        address: '',
        keywords: 'Long Island, NY', // 뉴스봇 기본 키워드
        topic: '',
        additionalRequests: ''
      }
    },
    apiSettings: {
      maxTokens: 800,
      temperature: 0.8,
      topP: 0.95,
      topK: 0,
      enableThinking: false,
      extractFullArticles: false,
      maxFullArticles: 7
    },
    aiModel: 'claude-3-haiku-20240307'
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // 권한 체크
  useEffect(() => {
    if (authLoading) return;

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
        setLoading(true);
        const response = await getBot(botId);

        if (response.bot) {
          const bot = response.bot;
          setFormData({
            name: bot.name || '',
            description: bot.description || '',
            type: bot.type || 'restaurant',
            systemPrompt: bot.prompt?.system || '',
            userPrompt: bot.prompt?.user || '',
            persona: bot.persona || {
              age: 30,
              gender: '여성',
              occupation: '직장인',
              interests: [],
              personality: '',
              location: '롱아일랜드'
            },
            settings: {
              autoPost: bot.settings?.autoPost || false,
              postInterval: bot.settings?.postInterval ? Math.round(bot.settings.postInterval / 3600000) : 24, // ms를 시간으로 변환
              targetCategories: bot.settings?.targetCategories || [],
              scheduleParams: bot.settings?.scheduleParams || {
                address: '',
                keywords: '',
                topic: '',
                additionalRequests: ''
              }
            },
            apiSettings: bot.apiSettings || {
              maxTokens: 800,
              temperature: 0.8,
              topP: 0.95,
              topK: 0,
              enableThinking: false,
              extractFullArticles: false,
              maxFullArticles: 7
            },
            aiModel: bot.aiModel || 'claude-3-haiku-20240307'
          });
        }
      } catch (err) {
        console.error('봇 정보 로드 실패:', err);
        setError('봇 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchBot();
  }, [botId, isEdit]);

  // 봇 타입 변경 시 프롬프트 템플릿 업데이트
  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setFormData({
      ...formData,
      type: newType,
      systemPrompt: DEFAULT_PROMPTS[newType]?.system || '',
      userPrompt: DEFAULT_PROMPTS[newType]?.user || '',
      settings: {
        ...formData.settings,
        scheduleParams: {
          ...formData.settings.scheduleParams,
          keywords: newType === 'news' ? 'Long Island, NY' : '',
          address: '',
          topic: ''
        }
      }
    });
  };

  // 저장 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const botData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        systemPrompt: formData.systemPrompt,
        userPrompt: formData.userPrompt,
        persona: formData.persona,
        settings: {
          ...formData.settings,
          postInterval: formData.settings.postInterval * 3600000 // 시간을 ms로 변환
        },
        apiSettings: formData.apiSettings,
        aiModel: formData.aiModel
      };

      if (isEdit) {
        await updateBot(botId, botData);
        alert('봇이 수정되었습니다.');
      } else {
        await createBot(botData);
        alert('봇이 생성되었습니다.');
      }

      navigate('/bot-board/manage');
    } catch (err) {
      console.error('봇 저장 실패:', err);
      setError(err.response?.data?.error || '봇 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 관심사 추가/제거
  const handleInterestAdd = () => {
    const interest = prompt('추가할 관심사를 입력하세요:');
    if (interest && !formData.persona.interests.includes(interest)) {
      setFormData({
        ...formData,
        persona: {
          ...formData.persona,
          interests: [...formData.persona.interests, interest]
        }
      });
    }
  };

  const handleInterestRemove = (interest) => {
    setFormData({
      ...formData,
      persona: {
        ...formData.persona,
        interests: formData.persona.interests.filter(i => i !== interest)
      }
    });
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (error && !saving) {
    return (
      <div className="bot-config-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/bot-board/manage')}>← 목록으로</button>
      </div>
    );
  }

  return (
    <div className="bot-config-container">
      <div className="bot-config-header">
        <h1>{isEdit ? '봇 수정' : '새 봇 만들기'}</h1>
        <p className="bot-config-description">
          봇의 정보와 동작을 설정합니다.
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bot-config-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bot-config-form">
        {/* 기본 정보 탭 */}
        {activeTab === 'basic' && (
          <div className="tab-content">
            <div className="form-group">
              <label htmlFor="name">봇 이름</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 맛집 리뷰어"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">봇 설명</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="이 봇이 하는 일을 설명해주세요"
                rows={3}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">봇 타입</label>
              <select
                id="type"
                value={formData.type}
                onChange={handleTypeChange}
              >
                <option value="restaurant">맛집 리뷰봇</option>
                <option value="news">뉴스 요약봇</option>
                <option value="general">일반 봇</option>
              </select>
            </div>
          </div>
        )}

        {/* 프롬프트 설정 탭 */}
        {activeTab === 'prompt' && (
          <div className="tab-content">
            <div className="prompt-templates">
              <h3>프롬프트 템플릿</h3>
              <div className="template-buttons">
                {Object.keys(DEFAULT_PROMPTS).map(type => (
                  <button
                    key={type}
                    type="button"
                    className="template-button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        systemPrompt: DEFAULT_PROMPTS[type].system,
                        userPrompt: DEFAULT_PROMPTS[type].user
                      });
                    }}
                  >
                    {type === 'restaurant' ? '맛집 템플릿' :
                     type === 'news' ? '뉴스 템플릿' : '일반 템플릿'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="systemPrompt">시스템 프롬프트</label>
              <textarea
                id="systemPrompt"
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                placeholder="봇의 역할과 성격을 정의하는 프롬프트"
                rows={6}
              />
              <p className="form-help">봇의 기본 성격과 역할을 정의합니다. 페르소나 정보가 자동으로 추가됩니다.</p>
            </div>

            <div className="form-group">
              <label htmlFor="userPrompt">사용자 프롬프트 템플릿</label>
              <textarea
                id="userPrompt"
                value={formData.userPrompt}
                onChange={(e) => setFormData({ ...formData, userPrompt: e.target.value })}
                placeholder="게시글 생성 시 사용할 프롬프트 템플릿"
                rows={4}
              />
              <p className="form-help">변수: {'{address}'}, {'{keywords}'}, {'{topic}'}, {'{additionalRequests}'}</p>
            </div>
          </div>
        )}

        {/* 페르소나 탭 */}
        {activeTab === 'persona' && (
          <div className="tab-content">
            <p className="persona-info">
              페르소나 정보는 봇의 시스템 프롬프트에 자동으로 추가되어 봇의 성격을 더욱 구체적으로 만듭니다.
            </p>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="age">나이</label>
                <input
                  id="age"
                  type="number"
                  value={formData.persona.age}
                  onChange={(e) => setFormData({
                    ...formData,
                    persona: { ...formData.persona, age: parseInt(e.target.value) || 30 }
                  })}
                  min="20"
                  max="80"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">성별</label>
                <select
                  id="gender"
                  value={formData.persona.gender}
                  onChange={(e) => setFormData({
                    ...formData,
                    persona: { ...formData.persona, gender: e.target.value }
                  })}
                >
                  <option value="여성">여성</option>
                  <option value="남성">남성</option>
                  <option value="기타">기타</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="occupation">직업</label>
              <input
                id="occupation"
                type="text"
                value={formData.persona.occupation}
                onChange={(e) => setFormData({
                  ...formData,
                  persona: { ...formData.persona, occupation: e.target.value }
                })}
                placeholder="예: 교사, 개발자, 주부"
              />
            </div>

            <div className="form-group">
              <label htmlFor="personality">성격</label>
              <input
                id="personality"
                type="text"
                value={formData.persona.personality}
                onChange={(e) => setFormData({
                  ...formData,
                  persona: { ...formData.persona, personality: e.target.value }
                })}
                placeholder="예: 친근한, 전문적인, 유머러스한"
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">거주지</label>
              <input
                id="location"
                type="text"
                value={formData.persona.location}
                onChange={(e) => setFormData({
                  ...formData,
                  persona: { ...formData.persona, location: e.target.value }
                })}
                placeholder="예: 롱아일랜드, 맨하탄"
              />
            </div>

            <div className="form-group">
              <label>관심사</label>
              <div className="interests-container">
                {formData.persona.interests.map((interest, index) => (
                  <span key={index} className="interest-tag">
                    {interest}
                    <button
                      type="button"
                      onClick={() => handleInterestRemove(interest)}
                      className="remove-interest"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={handleInterestAdd}
                  className="add-interest"
                >
                  + 추가
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API 설정 탭 */}
        {activeTab === 'api' && (
          <div className="tab-content">
            <div className="form-group">
              <label htmlFor="aiModel">AI 모델</label>
              <select
                id="aiModel"
                value={formData.aiModel}
                onChange={(e) => setFormData({ ...formData, aiModel: e.target.value })}
              >
                <option value="claude-3-haiku-20240307">Claude 3 Haiku (빠른 응답)</option>
                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                <option value="claude-3-7-sonnet">Claude 3.7 Sonnet (하이브리드)</option>
                <option value="claude-sonnet-4-20250514">Claude 4 Sonnet</option>
                <option value="claude-opus-4-20250514">Claude 4 Opus (최고 성능)</option>
              </select>
              <p className="form-help">응답 품질과 속도를 고려하여 선택하세요.</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="maxTokens">최대 토큰 수</label>
                <input
                  id="maxTokens"
                  type="number"
                  value={formData.apiSettings.maxTokens}
                  onChange={(e) => setFormData({
                    ...formData,
                    apiSettings: { ...formData.apiSettings, maxTokens: parseInt(e.target.value) || 800 }
                  })}
                  min="1"
                  max="200000"
                />
                <p className="form-help">생성할 최대 글자 수 (1-200000)</p>
              </div>

              <div className="form-group">
                <label htmlFor="temperature">Temperature</label>
                <input
                  id="temperature"
                  type="number"
                  value={formData.apiSettings.temperature}
                  onChange={(e) => setFormData({
                    ...formData,
                    apiSettings: { ...formData.apiSettings, temperature: parseFloat(e.target.value) || 0.8 }
                  })}
                  min="0"
                  max="1"
                  step="0.1"
                />
                <p className="form-help">창의성 수준 (0-1, 높을수록 창의적)</p>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="topP">Top P</label>
                <input
                  id="topP"
                  type="number"
                  value={formData.apiSettings.topP}
                  onChange={(e) => setFormData({
                    ...formData,
                    apiSettings: { ...formData.apiSettings, topP: parseFloat(e.target.value) || 0.95 }
                  })}
                  min="0"
                  max="1"
                  step="0.05"
                />
                <p className="form-help">샘플링 임계값 (0-1)</p>
              </div>

              <div className="form-group">
                <label htmlFor="topK">Top K</label>
                <input
                  id="topK"
                  type="number"
                  value={formData.apiSettings.topK}
                  onChange={(e) => setFormData({
                    ...formData,
                    apiSettings: { ...formData.apiSettings, topK: parseInt(e.target.value) || 0 }
                  })}
                  min="0"
                />
                <p className="form-help">샘플링할 토큰 수 (0=무제한)</p>
              </div>
            </div>

            {(formData.aiModel.includes('claude-sonnet-4') || formData.aiModel.includes('claude-opus-4')) && (
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.apiSettings.enableThinking}
                    onChange={(e) => setFormData({
                      ...formData,
                      apiSettings: { ...formData.apiSettings, enableThinking: e.target.checked }
                    })}
                  />
                  <span>확장된 사고 기능 활성화 (Claude 4 전용)</span>
                </label>
                <p className="form-help">더 깊은 사고 과정을 거쳐 응답을 생성합니다. 응답 시간이 길어질 수 있습니다.</p>
              </div>
            )}

            {formData.type === 'news' && (
              <div className="news-specific-settings">
                <h4>뉴스봇 전용 설정</h4>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.apiSettings.extractFullArticles}
                      onChange={(e) => setFormData({
                        ...formData,
                        apiSettings: { ...formData.apiSettings, extractFullArticles: e.target.checked }
                      })}
                    />
                    <span>전체 기사 내용 추출</span>
                  </label>
                  <p className="form-help">전체 기사 내용을 추출하여 더 상세한 요약을 제공합니다. (성능 주의)</p>
                </div>

                {formData.apiSettings.extractFullArticles && (
                  <div className="form-group">
                    <label htmlFor="maxFullArticles">최대 기사 추출 개수</label>
                    <input
                      id="maxFullArticles"
                      type="number"
                      value={formData.apiSettings.maxFullArticles}
                      onChange={(e) => setFormData({
                        ...formData,
                        apiSettings: { ...formData.apiSettings, maxFullArticles: parseInt(e.target.value) || 7 }
                      })}
                      min="1"
                      max="10"
                    />
                    <p className="form-help">전체 내용을 추출할 기사 개수 (1-10)</p>
                  </div>
                )}
              </div>
            )}

            <div className="api-settings-info">
              <h4>📌 API 설정 안내</h4>
              <ul>
                <li><strong>모델 선택:</strong> Haiku는 빠르고 저렴, Sonnet은 균형잡힌 성능, Opus는 최고 품질</li>
                <li><strong>Temperature:</strong> 0에 가까울수록 일관성 있는 응답, 1에 가까울수록 창의적인 응답</li>
                <li><strong>토큰:</strong> 1 토큰 ≈ 한글 0.5자, 영어 0.75단어</li>
                <li><strong>Claude 4 모델:</strong> 최신 모델로 더 높은 품질의 응답을 제공합니다</li>
              </ul>
            </div>
          </div>
        )}

        {/* 스케줄링 탭 */}
        {activeTab === 'schedule' && (
          <div className="tab-content">
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.settings.autoPost}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, autoPost: e.target.checked }
                  })}
                />
                <span>자동 게시 활성화</span>
              </label>
              <p className="form-help">활성화하면 설정된 주기에 따라 자동으로 게시글을 생성합니다.</p>
            </div>

            {formData.settings.autoPost && (
              <>
                <div className="form-group">
                  <label htmlFor="postInterval">게시 주기 (시간)</label>
                  <div className="interval-input">
                    <input
                      id="postInterval"
                      type="number"
                      value={formData.settings.postInterval}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings, postInterval: parseInt(e.target.value) || 24 }
                      })}
                      min="1"
                      max="168"
                    />
                    <span className="interval-unit">시간마다</span>
                  </div>
                  <p className="form-help">
                    {formData.settings.postInterval}시간마다 새로운 게시글이 생성됩니다.
                    (하루 = 24시간, 일주일 = 168시간)
                  </p>
                </div>

                <div className="schedule-params">
                  <h4>자동 게시 파라미터</h4>

                  {formData.type === 'restaurant' && (
                    <div className="form-group">
                      <label htmlFor="scheduleAddress">레스토랑 주소</label>
                      <input
                        id="scheduleAddress"
                        type="text"
                        value={formData.settings.scheduleParams.address}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            scheduleParams: {
                              ...formData.settings.scheduleParams,
                              address: e.target.value
                            }
                          }
                        })}
                        placeholder="예: 123 Main St, Syosset, NY 11791"
                      />
                      <p className="form-help">자동 게시 시 사용할 레스토랑 주소입니다. 비워두면 랜덤하게 선택됩니다.</p>
                    </div>
                  )}

                  {formData.type === 'news' && (
                    <div className="form-group">
                      <label htmlFor="scheduleKeywords">뉴스 키워드</label>
                      <input
                        id="scheduleKeywords"
                        type="text"
                        value={formData.settings.scheduleParams.keywords}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            scheduleParams: {
                              ...formData.settings.scheduleParams,
                              keywords: e.target.value
                            }
                          }
                        })}
                        placeholder="예: 롱아일랜드, 한인, 커뮤니티"
                      />
                      <p className="form-help">뉴스 검색에 사용할 키워드입니다. 콤마로 구분하세요.</p>
                    </div>
                  )}

                  {formData.type === 'general' && (
                    <div className="form-group">
                      <label htmlFor="scheduleTopic">주제</label>
                      <input
                        id="scheduleTopic"
                        type="text"
                        value={formData.settings.scheduleParams.topic}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            scheduleParams: {
                              ...formData.settings.scheduleParams,
                              topic: e.target.value
                            }
                          }
                        })}
                        placeholder="예: 계절별 생활 팁, 한인 행사 정보"
                      />
                      <p className="form-help">자동 게시할 글의 주제입니다.</p>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="scheduleAdditional">추가 요청사항</label>
                    <textarea
                      id="scheduleAdditional"
                      value={formData.settings.scheduleParams.additionalRequests}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          scheduleParams: {
                            ...formData.settings.scheduleParams,
                            additionalRequests: e.target.value
                          }
                        }
                      })}
                      placeholder="자동 게시 시 추가로 고려할 사항을 입력하세요"
                      rows={3}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="schedule-info">
              <h4>📌 스케줄링 안내</h4>
              <ul>
                <li><strong>중요:</strong> 자동 게시가 작동하려면 봇 관리 페이지에서 봇을 <strong>'활성화'</strong> 상태로 변경해야 합니다.</li>
                <li>자동 게시를 켜고 봇을 활성화하면, 설정된 주기마다 자동으로 게시글이 생성됩니다.</li>
                <li>생성된 게시글은 승인 대기 상태가 되며, 관리자가 검토 후 승인할 수 있습니다.</li>
                <li>파라미터를 비워두면 봇이 자동으로 적절한 내용을 선택합니다.</li>
              </ul>
            </div>
          </div>
        )}

        {/* 저장 버튼 */}
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
            className="btn-save"
            disabled={saving || !formData.name || !formData.description}
          >
            {saving ? '저장 중...' : (isEdit ? '수정 완료' : '봇 생성')}
          </button>
        </div>

        {error && (
          <div className="error-message" style={{ marginTop: '20px' }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}

export default BotConfigForm;