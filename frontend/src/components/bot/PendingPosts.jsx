import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Checkbox,
  FormControlLabel,
  Stack,
  Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PreviewIcon from '@mui/icons-material/Preview';
import { linkifyContent } from '../../utils/linkify';
import { 
  approvePost, 
  rejectPost, 
  updatePendingPost,
  approveBatch 
} from '../../api/approval';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import DOMPurify from 'dompurify';

export default function PendingPosts({ posts, onApproval, onReload }) {
  const [editDialog, setEditDialog] = useState({ open: false, post: null });
  const [previewDialog, setPreviewDialog] = useState({ open: false, post: null });
  const [rejectDialog, setRejectDialog] = useState({ open: false, post: null });
  const [editedPost, setEditedPost] = useState({ title: '', content: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const contentEditorRef = useRef(null);

  const handleSelectPost = (postId) => {
    setSelectedPosts(prev => {
      if (prev.includes(postId)) {
        return prev.filter(id => id !== postId);
      }
      return [...prev, postId];
    });
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedPosts(posts.map(post => post._id));
    } else {
      setSelectedPosts([]);
    }
  };

  const handleApprove = async (postId) => {
    try {
      setLoading(true);
      await approvePost(postId);
      onApproval();
    } catch (err) {
      console.error('승인 실패:', err);
      setError('게시글 승인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedPosts.length === 0) return;

    try {
      setLoading(true);
      await approveBatch(selectedPosts);
      setSelectedPosts([]);
      onApproval();
    } catch (err) {
      console.error('일괄 승인 실패:', err);
      setError('일괄 승인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = (post) => {
    setRejectDialog({ open: true, post });
    setRejectReason('');
  };

  const handleRejectConfirm = async () => {
    if (!rejectDialog.post) return;

    try {
      setLoading(true);
      await rejectPost(rejectDialog.post._id, rejectReason);
      setRejectDialog({ open: false, post: null });
      onApproval();
    } catch (err) {
      console.error('거절 실패:', err);
      setError('게시글 거절에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (post) => {
    setEditDialog({ open: true, post });
    setEditedPost({
      title: post.title,
      content: post.content
    });
  };

  // 편집 다이얼로그가 열릴 때 contentEditable에 HTML 로드
  useEffect(() => {
    if (editDialog.open && contentEditorRef.current && editDialog.post) {
      const sanitizedContent = DOMPurify.sanitize(editDialog.post.content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'img', 'a', 'blockquote', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'style', 'target'],
        ALLOW_DATA_ATTR: false
      });
      contentEditorRef.current.innerHTML = sanitizedContent;
    }
  }, [editDialog.open, editDialog.post]);

  // 이미지 붙여넣기 처리
  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (const index in items) {
      const item = items[index];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        const reader = new FileReader();
        reader.onload = function (event) {
          const img = document.createElement('img');
          img.src = event.target.result;
          img.alt = 'pasted-image';
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.style.margin = '10px 0';
          img.style.display = 'block';

          const target = e.currentTarget || e.target;
          if (target) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              range.insertNode(img);
              range.setStartAfter(img);
              selection.removeAllRanges();
              selection.addRange(range);
            } else {
              target.appendChild(img);
            }
            target.dispatchEvent(new Event('input', { bubbles: true }));
          }
        };
        reader.readAsDataURL(file);
        e.preventDefault();
        return;
      }
    }
  };

  const handleEditSave = async () => {
    if (!editDialog.post) return;

    // contentEditable에서 HTML 가져오기
    const rawContent = contentEditorRef.current ? contentEditorRef.current.innerHTML : editedPost.content;
    const sanitizedContent = DOMPurify.sanitize(rawContent, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'img', 'a', 'blockquote', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'style', 'target'],
      ALLOW_DATA_ATTR: false
    });

    try {
      setLoading(true);
      await updatePendingPost(editDialog.post._id, {
        title: editedPost.title,
        content: sanitizedContent
      });
      setEditDialog({ open: false, post: null });
      onReload();
    } catch (err) {
      console.error('수정 실패:', err);
      setError('게시글 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (post) => {
    setPreviewDialog({ open: true, post });
  };

  const getPreviewContent = (content) => {
    const plainText = content.replace(/<[^>]*>/g, ' ').trim();
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {posts.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedPosts.length === posts.length}
                indeterminate={selectedPosts.length > 0 && selectedPosts.length < posts.length}
                onChange={handleSelectAll}
              />
            }
            label="전체 선택"
          />
          {selectedPosts.length > 0 && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckIcon />}
              onClick={handleBatchApprove}
              disabled={loading}
            >
              선택 항목 승인 ({selectedPosts.length})
            </Button>
          )}
        </Box>
      )}

      <Stack spacing={2}>
        {posts.map((post) => (
          <Card key={post._id}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Checkbox
                  checked={selectedPosts.includes(post._id)}
                  onChange={() => handleSelectPost(post._id)}
                />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6" component="div">
                      {post.title}
                    </Typography>
                    <Chip
                      label={post.botId?.name || '봇'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={post.tags?.type || '기타'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {getPreviewContent(post.content)}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    작성: {formatDistanceToNow(new Date(post.createdAt), { 
                      addSuffix: true,
                      locale: ko 
                    })} • 
                    작성자: {post.author?.profile?.nickname || post.author?.id}
                  </Typography>
                </Box>
              </Box>
            </CardContent>

            <Divider />

            <CardActions>
              <Button
                size="small"
                startIcon={<PreviewIcon />}
                onClick={() => handlePreview(post)}
              >
                미리보기
              </Button>
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => handleEditClick(post)}
              >
                편집
              </Button>
              <Button
                size="small"
                color="success"
                startIcon={<CheckIcon />}
                onClick={() => handleApprove(post._id)}
                disabled={loading}
              >
                승인
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<CloseIcon />}
                onClick={() => handleRejectClick(post)}
                disabled={loading}
              >
                거절
              </Button>
            </CardActions>
          </Card>
        ))}
      </Stack>

      {posts.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            승인 대기 중인 게시글이 없습니다.
          </Typography>
        </Box>
      )}

      {/* 편집 다이얼로그 */}
      <Dialog 
        open={editDialog.open} 
        onClose={() => setEditDialog({ open: false, post: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>게시글 편집</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="제목"
            value={editedPost.title}
            onChange={(e) => setEditedPost({ ...editedPost, title: e.target.value })}
            margin="normal"
          />
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            내용
          </Typography>
          <Box
            ref={contentEditorRef}
            contentEditable
            onInput={(e) => setEditedPost({ ...editedPost, content: e.currentTarget.innerHTML })}
            onPaste={handlePaste}
            sx={{
              border: '1px solid rgba(0, 0, 0, 0.23)',
              borderRadius: 1,
              padding: 2,
              minHeight: '200px',
              maxHeight: '400px',
              overflowY: 'auto',
              backgroundColor: '#fff',
              '&:focus': {
                outline: '2px solid #1976d2',
                outlineOffset: '-2px',
              },
              '& p': { margin: '0 0 10px' },
              '& img': { maxWidth: '100%', height: 'auto', display: 'block', margin: '10px 0' },
              '& a': { color: '#1976d2', textDecoration: 'underline' },
              '& ul, & ol': { marginLeft: '20px' },
              '& blockquote': { 
                borderLeft: '3px solid #ddd', 
                paddingLeft: '10px', 
                marginLeft: '0',
                color: '#666'
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, post: null })}>
            취소
          </Button>
          <Button onClick={handleEditSave} variant="contained" disabled={loading}>
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 미리보기 다이얼로그 */}
      <Dialog 
        open={previewDialog.open} 
        onClose={() => setPreviewDialog({ open: false, post: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{previewDialog.post?.title}</DialogTitle>
        <DialogContent>
          <Box 
            dangerouslySetInnerHTML={{ 
              __html: linkifyContent(DOMPurify.sanitize(previewDialog.post?.content || '')) 
            }}
            sx={{ 
              '& p': { marginBottom: 1 },
              '& img': { maxWidth: '100%', height: 'auto' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog({ open: false, post: null })}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 거절 다이얼로그 */}
      <Dialog 
        open={rejectDialog.open} 
        onClose={() => setRejectDialog({ open: false, post: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>게시글 거절</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            이 게시글을 거절하시겠습니까?
          </Typography>
          <TextField
            fullWidth
            label="거절 사유 (선택)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            placeholder="거절 사유를 입력하세요"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, post: null })}>
            취소
          </Button>
          <Button 
            onClick={handleRejectConfirm} 
            color="error"
            variant="contained"
            disabled={loading}
          >
            거절
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}