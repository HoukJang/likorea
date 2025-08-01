import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../hooks/useAuth';
import BotList from '../components/bot/BotList';
import BoardList from '../components/BoardList';
import { getBots } from '../api/bots';
import { getPendingPosts } from '../api/approval';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`bot-tabpanel-${index}`}
      aria-labelledby={`bot-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function BotManagement({ embedded = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [bots, setBots] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  // 관리자 권한 확인 (embedded 모드에서는 이미 Admin 컴포넌트에서 확인됨)
  useEffect(() => {
    if (!embedded && (!user || user.authority < 5)) {
      navigate('/');
    }
  }, [user, navigate, embedded]);

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [botsResponse, pendingResponse] = await Promise.all([
        getBots(),
        getPendingPosts()
      ]);

      // 디버깅을 위한 로그 추가
      console.log('Bots API Response:', botsResponse);
      console.log('Pending Posts API Response:', pendingResponse);

      setBots(botsResponse?.bots || []);
      setPendingPosts(pendingResponse?.posts || []);
      setPendingCount(pendingResponse?.pagination?.total || 0);
    } catch (err) {
      console.error('데이터 로드 실패:', err);
      // 상세한 에러 메시지 표시
      if (err.statusCode === 401) {
        setError('로그인이 필요합니다. 다시 로그인해 주세요.');
      } else if (err.statusCode === 403) {
        setError('관리자 권한이 필요합니다.');
      } else if (err.message) {
        setError(`오류: ${err.message}`);
      } else {
        setError('데이터를 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCreateBot = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('handleCreateBot called, embedded:', embedded);
    console.log('Current location:', window.location.pathname);
    
    if (embedded) {
      // 임베디드 모드에서는 새 탭에서 열기 - 절대 URL 사용
      const url = `${window.location.origin}/bots/new`;
      console.log('Opening URL:', url);
      const newWindow = window.open(url, '_blank');
      console.log('New window opened:', newWindow);
    } else {
      console.log('Navigating to /bots/new');
      navigate('/bots/new');
    }
  };

  const handleBotUpdate = () => {
    loadData(); // 봇 업데이트 후 데이터 새로고침
  };

  const handlePostApproval = () => {
    loadData(); // 승인 처리 후 데이터 새로고침
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: embedded ? 0 : 4, px: embedded ? 0 : 3 }}>
      {!embedded && (
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            봇 관리 시스템
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateBot}
          >
            새 봇 만들기
          </Button>
        </Box>
      )}
      {embedded && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateBot}
            size="medium"
          >
            새 봇 만들기
          </Button>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="봇 관리 탭">
            <Tab label="봇 목록" />
            <Tab 
              label={`승인 대기 (${pendingCount})`} 
              sx={{ 
                '& .MuiTab-wrapper': {
                  flexDirection: 'row',
                  gap: 1
                }
              }}
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <BotList 
            bots={bots} 
            onUpdate={handleBotUpdate}
            onReload={loadData}
            embedded={embedded}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <BoardList pendingOnly={true} />
        </TabPanel>
      </Paper>
    </Container>
  );
}