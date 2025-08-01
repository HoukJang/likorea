import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import PostAddIcon from '@mui/icons-material/PostAdd';
import { useNavigate } from 'react-router-dom';
import { deleteBot, updateBotStatus, createBotPost } from '../../api/bots';

export default function BotList({ bots, onUpdate, onReload, embedded = false }) {
  const navigate = useNavigate();
  const [deleteDialog, setDeleteDialog] = useState({ open: false, bot: null });
  const [postDialog, setPostDialog] = useState({ open: false, bot: null });
  const [task, setTask] = useState('');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [deletePosts, setDeletePosts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEdit = (botId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('handleEdit called, embedded:', embedded, 'botId:', botId);
    
    if (embedded) {
      // 임베디드 모드에서는 새 탭에서 열기 - 절대 URL 사용
      const url = `${window.location.origin}/bots/edit/${botId}`;
      console.log('Opening URL:', url);
      const newWindow = window.open(url, '_blank');
      console.log('New window opened:', newWindow);
    } else {
      navigate(`/bots/edit/${botId}`);
    }
  };

  const handleDeleteClick = (bot) => {
    setDeleteDialog({ open: true, bot });
    setDeletePosts(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.bot) return;

    try {
      setLoading(true);
      await deleteBot(deleteDialog.bot._id, deletePosts);
      setDeleteDialog({ open: false, bot: null });
      onUpdate();
    } catch (err) {
      console.error('봇 삭제 실패:', err);
      setError('봇 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (bot) => {
    try {
      const newStatus = bot.status === 'active' ? 'inactive' : 'active';
      await updateBotStatus(bot._id, newStatus);
      onUpdate();
    } catch (err) {
      console.error('상태 변경 실패:', err);
      setError('상태 변경에 실패했습니다.');
    }
  };

  const handlePostClick = (bot) => {
    setPostDialog({ open: true, bot });
    setTask('');
    setAdditionalPrompt('');
  };

  const handleCreatePost = async () => {
    if (!postDialog.bot || !task.trim()) return;

    try {
      setLoading(true);
      await createBotPost(postDialog.bot._id, task, additionalPrompt);
      setPostDialog({ open: false, bot: null });
      onUpdate();
      alert('게시글이 생성되었습니다. 승인 대기 탭에서 확인하세요.');
    } catch (err) {
      console.error('게시글 생성 실패:', err);
      setError('게시글 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'maintenance':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getModelName = (modelId) => {
    const modelNames = {
      'claude-3-haiku-20240307': 'Haiku',
      'claude-3-sonnet-20240229': 'Sonnet',
      'claude-3-opus-20240229': 'Opus',
      'claude-3-5-haiku-20241022': 'Haiku 3.5',
      'claude-3-5-sonnet-20241022': 'Sonnet 3.5'
    };
    return modelNames[modelId] || modelId;
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {bots.map((bot) => (
          <Grid item xs={12} md={6} lg={4} key={bot._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    {bot.name}
                  </Typography>
                  <Chip
                    label={bot.status}
                    color={getStatusColor(bot.status)}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {bot.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={getModelName(bot.aiModel)}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={`작성: ${bot.stats?.totalPosts || 0}개`}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 1 }}
                  />
                  {bot.stats?.pendingPosts > 0 && (
                    <Chip
                      label={`대기: ${bot.stats.pendingPosts}개`}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                </Box>

                {bot.username && (
                  <Typography variant="caption" color="text.secondary">
                    ID: {bot.username}
                  </Typography>
                )}
              </CardContent>

              <CardActions>
                <IconButton
                  size="small"
                  onClick={(e) => handleEdit(bot._id, e)}
                  aria-label="편집"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleStatusToggle(bot)}
                  aria-label={bot.status === 'active' ? '비활성화' : '활성화'}
                  color={bot.status === 'active' ? 'success' : 'default'}
                >
                  {bot.status === 'active' ? <StopIcon /> : <PlayArrowIcon />}
                </IconButton>
                <Tooltip title="게시글 작성">
                  <IconButton
                    size="small"
                    onClick={() => handlePostClick(bot)}
                    aria-label="게시글 작성"
                    color="primary"
                  >
                    <PostAddIcon />
                  </IconButton>
                </Tooltip>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteClick(bot)}
                  aria-label="삭제"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, bot: null })}>
        <DialogTitle>봇 삭제 확인</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            &apos;{deleteDialog.bot?.name}&apos; 봇을 삭제하시겠습니까?
          </Typography>
          {deleteDialog.bot?.stats?.totalPosts > 0 && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>게시글 처리</InputLabel>
              <Select
                value={deletePosts}
                label="게시글 처리"
                onChange={(e) => setDeletePosts(e.target.value)}
              >
                <MenuItem value={false}>게시글 유지 (봇 연결만 해제)</MenuItem>
                <MenuItem value={true}>게시글도 함께 삭제</MenuItem>
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, bot: null })}>
            취소
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={loading}
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* 게시글 작성 다이얼로그 */}
      <Dialog 
        open={postDialog.open} 
        onClose={() => setPostDialog({ open: false, bot: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>봇으로 게시글 작성</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            봇: {postDialog.bot?.name}
          </Typography>
          <TextField
            fullWidth
            label="작성할 주제"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="예: 롱아일랜드 한인 마트 추천"
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="추가 지시사항 (선택)"
            value={additionalPrompt}
            onChange={(e) => setAdditionalPrompt(e.target.value)}
            placeholder="예: 친근한 톤으로 작성해주세요"
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPostDialog({ open: false, bot: null })}>
            취소
          </Button>
          <Button
            onClick={handleCreatePost}
            variant="contained"
            disabled={loading || !task.trim()}
          >
            작성
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}