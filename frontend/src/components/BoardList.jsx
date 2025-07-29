import React, { useState, useEffect, useCallback } from 'react';
import { getBoards } from '../api/boards';
import { getAllTags } from '../api/tags';
import { processPostsList } from '../utils/dataUtils';
import TagFilter from './TagFilter';
import BoardTable from './board/BoardTable';
import BoardCards from './board/BoardCards';
import BoardPagination from './board/BoardPagination';
import { BoardLoading, BoardError, BoardEmpty } from './board/BoardStatus';
import '../styles/BoardList.css';

const BoardList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ type: '', region: '' });
  const [tagList, setTagList] = useState(null);

  // 태그 정보 가져오기
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagResponse = await getAllTags();
        setTagList(tagResponse.tags);
      } catch (error) {
        // 태그 정보 로드 실패 시 조용히 처리
      }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiParams = {
          page: currentPage,
          limit: 25,
          ...filters,
        };

        const data = await getBoards(apiParams);

        const postsData = data.posts || data;

        const processedPosts = processPostsList(postsData);

        // 백엔드에서 이미 정렬된 데이터를 그대로 사용
        setPosts(processedPosts);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        setError(error.message || '게시글 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [currentPage, filters]);

  // 필터 변경 핸들러
  const handleFilterChange = useCallback(newFilters => {
    setFilters(newFilters);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  }, []);

  // 페이지 변경 핸들러
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);

  return (
    <div className='board-list-container' role='main' aria-label='게시판 목록'>
      {/* 태그 필터 컴포넌트 */}
      <div className='user-controls' role='region' aria-label='사용자 컨트롤'>
        <TagFilter onFilterChange={handleFilterChange} currentFilters={filters} />
      </div>

      {loading ? (
        <BoardLoading />
      ) : error ? (
        <BoardError error={error} />
      ) : posts.length === 0 ? (
        <BoardEmpty />
      ) : (
        <>
          {/* 데스크톱 테이블 뷰 */}
          <BoardTable posts={posts} tagList={tagList} />

          {/* 모바일 카드 뷰 */}
          <BoardCards posts={posts} tagList={tagList} />
        </>
      )}

      <BoardPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

export default React.memo(BoardList);
