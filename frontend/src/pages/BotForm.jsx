import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  FormHelperText,
  Slider,
  FormControlLabel,
  Checkbox,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Stack
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TuneIcon from '@mui/icons-material/Tune';
import { useAuth } from '../hooks/useAuth';
import { 
  createBot, 
  getBot, 
  updateBot, 
  getClaudeModels 
} from '../api/bots';
import '../styles/BotForm.css';

export default function BotForm() {
  const { botId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isEdit = !!botId;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: `당신은 롱아일랜드 한인 커뮤니티를 위한 뉴스 요약 전문가입니다.
실제 뉴스를 바탕으로 정확하고 신뢰할 수 있는 정보만 전달합니다.

응답 형식:
제목: [게시글 제목]
내용: [게시글 내용]`,
    userPrompt: '',
    aiModel: 'claude-3-haiku-20240307',
    type: 'news',  // 뉴스봇 고정
    status: 'inactive',
    apiSettings: {
      maxTokens: 2000,  // 뉴스봇은 더 많은 토큰 필요
      temperature: 0.8,
      topP: 0.95,
      topK: 0,
      enableThinking: false
    }
  });

  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [accountInfo, setAccountInfo] = useState(null);

  // 관리자 권한 확인
  useEffect(() => {
    console.log('BotForm - Auth loading:', authLoading);
    console.log('BotForm - User:', user);
    console.log('BotForm - User authority:', user?.authority);
    
    // 인증 로딩 중이면 대기
    if (authLoading) {
      return;
    }
    
    if (!user || user.authority < 5) {
      console.log('BotForm - Redirecting due to insufficient permissions');
      navigate('/admin');
    }
  }, [user, authLoading, navigate]);

  // 모델 목록 로드
  useEffect(() => {
    loadModels();
    if (isEdit) {
      loadBot();
    }
  }, [isEdit, botId]);

  const loadModels = async () => {
    try {
      console.log('모델 목록 로드 시작...');
      const response = await getClaudeModels();
      console.log('모델 API 응답:', response);
      setModels(response.models || []);
      console.log('설정된 모델 목록:', response.models || []);
    } catch (err) {
      console.error('모델 목록 로드 실패:', err);
    }
  };

  const loadBot = async () => {
    try {
      setLoading(true);
      const response = await getBot(botId);
      const bot = response.bot;
      setFormData({
        name: bot.name || '',
        description: bot.description || '',
        systemPrompt: bot.prompt?.system || `당신은 롱아일랜드 한인 커뮤니티의 활발한 회원입니다.

응답 형식:
제목: [게시글 제목]
내용: [게시글 내용]`,
        userPrompt: bot.prompt?.user || '',
        aiModel: bot.aiModel || 'claude-3-haiku-20240307',
        type: bot.type || 'news',
        status: bot.status || 'inactive',
        apiSettings: {
          maxTokens: bot.apiSettings?.maxTokens || 2000,  // 뉴스봇 기본값 증가
          temperature: bot.apiSettings?.temperature || 0.8,
          topP: bot.apiSettings?.topP || 0.95,
          topK: bot.apiSettings?.topK || 0,
          enableThinking: bot.apiSettings?.enableThinking || false
        }
      });
    } catch (err) {
      console.error('봇 정보 로드 실패:', err);
      setError('봇 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApiSettingChange = (setting, value) => {
    setFormData(prev => ({
      ...prev,
      apiSettings: {
        ...prev.apiSettings,
        [setting]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setLoading(true);
      
      if (isEdit) {
        await updateBot(botId, formData);
        setSuccess('봇이 성공적으로 수정되었습니다.');
        setTimeout(() => navigate('/bot-management'), 2000);
      } else {
        const response = await createBot(formData);
        setSuccess('봇이 성공적으로 생성되었습니다.');
        
        // 생성된 봇의 계정 정보 표시
        if (response.bot?.accountInfo) {
          setAccountInfo(response.bot.accountInfo);
        }
      }
    } catch (err) {
      console.error('봇 저장 실패:', err);
      setError(err.response?.data?.error || '봇 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/bot-management');
  };

  // 인증 로딩 중이거나 봇 데이터 로딩 중일 때 로딩 표시
  if (authLoading || (loading && isEdit)) {
    return (
      <div className="bot-form-container">
        <Container>
          <Box className="loading-container">
            <CircularProgress size={48} />
            <Typography variant="body1" className="loading-text">
              로딩 중...
            </Typography>
          </Box>
        </Container>
      </div>
    );
  }

  return (
    <div className="bot-form-container">
      <Container maxWidth="md">
        <Paper>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEdit ? '봇 수정' : '새 봇 만들기'}
        </Typography>

        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success">
            {success}
          </Alert>
        )}

        {accountInfo && (
          <Card className="bot-account-info">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                봇 계정 정보 (초기 비밀번호는 한 번만 표시됩니다)
              </Typography>
              <Box className="account-details">
                <Typography><strong>아이디:</strong> {accountInfo.username}</Typography>
                <Typography><strong>이메일:</strong> {accountInfo.email}</Typography>
                <Typography><strong>임시 비밀번호:</strong> {accountInfo.temporaryPassword}</Typography>
              </Box>
              <Alert severity="warning">
                이 정보를 안전한 곳에 저장하세요. 창을 닫으면 다시 볼 수 없습니다.
              </Alert>
            </CardContent>
          </Card>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="봇 이름"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading || (isEdit && success)}
          />

          <TextField
            fullWidth
            label="설명"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            multiline
            rows={3}
            disabled={loading || (isEdit && success)}
          />

          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>
            프롬프트 설정
          </Typography>

          <TextField
            fullWidth
            label="시스템 프롬프트"
            name="systemPrompt"
            value={formData.systemPrompt}
            onChange={handleChange}
            multiline
            rows={6}
            helperText="봇의 기본 성격과 역할, 응답 형식을 정의합니다. (항상 적용)"
            disabled={loading || (isEdit && success)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="유저 프롬프트 (선택적)"
            name="userPrompt"
            value={formData.userPrompt}
            onChange={handleChange}
            multiline
            rows={4}
            helperText="추가적인 컨텍스트나 지시사항. 게시글 작성 시 주제와 함께 전달됩니다."
            disabled={loading || (isEdit && success)}
          />

          <FormControl fullWidth>
            <InputLabel>AI 모델</InputLabel>
            <Select
              name="aiModel"
              value={formData.aiModel}
              onChange={handleChange}
              disabled={loading || (isEdit && success)}
            >
              {models.map((model) => (
                <MenuItem key={model.id} value={model.id}>
                  <Box className="model-item">
                    <span>{model.name}</span>
                    <Chip 
                      label={`입력: $${model.costPer1kTokens.input}/1k`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {models.find(m => m.id === formData.aiModel)?.description}
            </FormHelperText>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>봇 유형</InputLabel>
            <Select
              name="type"
              value={formData.type}
              onChange={handleChange}
              disabled={true}  // 뉴스봇만 사용 가능
            >
              <MenuItem value="news">뉴스 봇 (실제 뉴스 크롤링)</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, mb: 2, display: 'block' }}>
            * 뉴스봇은 Google News RSS에서 실제 뉴스를 크롤링하여 요약합니다
          </Typography>

          {isEdit && (
            <FormControl fullWidth>
              <InputLabel>상태</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading || success}
              >
                <MenuItem value="active">활성</MenuItem>
                <MenuItem value="inactive">비활성</MenuItem>
                <MenuItem value="maintenance">유지보수</MenuItem>
              </Select>
            </FormControl>
          )}

          <Accordion sx={{ mt: 3, mb: 2 }} defaultExpanded={false}>
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ 
                backgroundColor: 'rgba(59, 130, 246, 0.04)',
                '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.08)' }
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <TuneIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                <Typography fontWeight={600}>고급 API 설정</Typography>
                <Chip 
                  label="선택사항" 
                  size="small" 
                  sx={{ 
                    height: 20, 
                    fontSize: '0.7rem',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6'
                  }} 
                />
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 3 }}>
              <Grid container spacing={3}>
                {/* 첫 번째 행: 최대 토큰과 Temperature */}
                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight={600}>
                        최대 토큰
                      </Typography>
                      <Chip 
                        label={formData.apiSettings.maxTokens} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </Box>
                    <Slider
                      value={formData.apiSettings.maxTokens}
                      onChange={(e, value) => handleApiSettingChange('maxTokens', value)}
                      min={100}
                      max={8000}
                      step={100}
                      marks={[
                        { value: 800, label: '기본' },
                        { value: 4000, label: '4K' },
                        { value: 8000, label: '8K' }
                      ]}
                      disabled={loading || (isEdit && success)}
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      응답 길이 제한 (토큰 단위)
                    </Typography>
                  </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight={600}>
                        Temperature
                      </Typography>
                      <Chip 
                        label={formData.apiSettings.temperature.toFixed(2)} 
                        size="small" 
                        color={formData.apiSettings.temperature > 0.8 ? 'warning' : 'primary'}
                        variant="outlined"
                      />
                    </Box>
                    <Slider
                      value={formData.apiSettings.temperature}
                      onChange={(e, value) => handleApiSettingChange('temperature', value)}
                      min={0}
                      max={1}
                      step={0.05}
                      marks={[
                        { value: 0, label: '정확' },
                        { value: 0.8, label: '기본' },
                        { value: 1, label: '창의' }
                      ]}
                      disabled={loading || (isEdit && success)}
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      낮음: 일관성 | 높음: 창의성
                    </Typography>
                  </Stack>
                </Grid>

                {/* 두 번째 행: Top P와 Top K */}
                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight={600}>
                        Top P (누적 확률)
                      </Typography>
                      <Chip 
                        label={formData.apiSettings.topP.toFixed(2)} 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                    <Slider
                      value={formData.apiSettings.topP}
                      onChange={(e, value) => handleApiSettingChange('topP', value)}
                      min={0}
                      max={1}
                      step={0.05}
                      marks={[
                        { value: 0.5, label: '0.5' },
                        { value: 0.95, label: '기본' }
                      ]}
                      disabled={loading || (isEdit && success)}
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      단어 선택 다양성 (기본값 권장)
                    </Typography>
                  </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight={600}>
                        Top K (상위 K개)
                      </Typography>
                      <Chip 
                        label={formData.apiSettings.topK === 0 ? '비활성' : formData.apiSettings.topK} 
                        size="small" 
                        variant="outlined"
                        color={formData.apiSettings.topK > 0 ? 'primary' : 'default'}
                      />
                    </Box>
                    <Slider
                      value={formData.apiSettings.topK}
                      onChange={(e, value) => handleApiSettingChange('topK', value)}
                      min={0}
                      max={100}
                      step={5}
                      marks={[
                        { value: 0, label: 'OFF' },
                        { value: 50, label: '50' },
                        { value: 100, label: '100' }
                      ]}
                      disabled={loading || (isEdit && success)}
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      상위 K개 토큰만 고려 (0=비활성)
                    </Typography>
                  </Stack>
                </Grid>

                {/* 확장된 사고 기능 - 전체 너비 */}
                {models.find(m => m.id === formData.aiModel)?.supportThinking && (
                  <Grid item xs={12}>
                    <Divider sx={{ mb: 2 }} />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.apiSettings.enableThinking}
                          onChange={(e) => handleApiSettingChange('enableThinking', e.target.checked)}
                          disabled={loading || (isEdit && success)}
                          sx={{ 
                            color: '#3b82f6',
                            '&.Mui-checked': { color: '#3b82f6' }
                          }}
                        />
                      }
                      label={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2" fontWeight={600}>
                            확장된 사고 기능 활성화
                          </Typography>
                          <Chip label="Beta" size="small" color="warning" sx={{ height: 20 }} />
                        </Stack>
                      }
                    />
                    {formData.apiSettings.enableThinking && (
                      <Alert 
                        severity="info" 
                        sx={{ 
                          mt: 2,
                          backgroundColor: 'rgba(59, 130, 246, 0.05)',
                          border: '1px solid rgba(59, 130, 246, 0.2)'
                        }}
                      >
                        <Typography variant="body2">
                          AI가 내부 사고 과정을 거쳐 더 깊이 있는 분석을 수행합니다.
                          응답 시간이 증가할 수 있지만 품질이 향상됩니다.
                        </Typography>
                      </Alert>
                    )}
                  </Grid>
                )}

                {/* 프리셋 버튼 추가 */}
                <Grid item xs={12}>
                  <Divider sx={{ mb: 2 }} />
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Typography variant="caption" color="text.secondary" sx={{ width: '100%', mb: 1 }}>
                      빠른 설정:
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        handleApiSettingChange('temperature', 0.3);
                        handleApiSettingChange('topP', 0.7);
                        handleApiSettingChange('topK', 40);
                      }}
                      sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                    >
                      정확한 답변
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        handleApiSettingChange('temperature', 0.8);
                        handleApiSettingChange('topP', 0.95);
                        handleApiSettingChange('topK', 0);
                      }}
                      sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                    >
                      기본 설정
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        handleApiSettingChange('temperature', 0.9);
                        handleApiSettingChange('topP', 0.95);
                        handleApiSettingChange('topK', 0);
                      }}
                      sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                    >
                      창의적 글쓰기
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Box className="form-actions">
            <Button
              type="submit"
              variant="contained"
              disabled={loading || (accountInfo && !isEdit)}
            >
              {loading ? <CircularProgress size={24} /> : (isEdit ? '수정' : '생성')}
            </Button>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={loading}
            >
              {accountInfo ? '목록으로' : '취소'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
    </div>
  );
}