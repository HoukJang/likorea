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
  FormHelperText
} from '@mui/material';
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
    basePrompt: '',
    aiModel: 'claude-3-haiku-20240307',
    type: 'poster',
    status: 'inactive'
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
      const response = await getClaudeModels();
      setModels(response.models || []);
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
        basePrompt: bot.prompt?.base || '',
        aiModel: bot.aiModel || 'claude-3-haiku-20240307',
        type: bot.type || 'poster',
        status: bot.status || 'inactive'
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

          <TextField
            fullWidth
            label="기본 프롬프트"
            name="basePrompt"
            value={formData.basePrompt}
            onChange={handleChange}
            multiline
            rows={4}
            helperText="봇의 기본 성격과 역할을 정의합니다."
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
              disabled={loading || (isEdit && success)}
            >
              <MenuItem value="poster">게시글 작성 봇</MenuItem>
              <MenuItem value="analyzer">분석 봇</MenuItem>
              <MenuItem value="moderator">모더레이터 봇</MenuItem>
            </Select>
          </FormControl>

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