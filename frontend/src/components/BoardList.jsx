import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getBoards } from '../api/boards';
import { getAllTags } from '../api/tags';
import { getPendingPosts } from '../api/approval';
import { getUserScraps } from '../api/scrap';
import { processPostsList } from '../utils/dataUtils';
import { useAuth } from '../hooks/useAuth';
import TagFilter from './TagFilter';
import BoardTable from './board/BoardTable';
import BoardCards from './board/BoardCards';
import BoardPagination from './board/BoardPagination';
import { BoardLoading, BoardError, BoardEmpty } from './board/BoardStatus';
// import FloatingWriteButton from './FloatingWriteButton'; // FAB에 통합됨
import '../styles/BoardList.css';

const BoardList = ({ pendingOnly = false }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    type: searchParams.get('tag') || searchParams.get('type') || '',
    region: searchParams.get('region') || '',
    subcategory: searchParams.get('subcategory') || ''
  });
  const [tagList, setTagList] = useState(null);
  const [userScrapIds, setUserScrapIds] = useState(new Set());

  // URL 파라미터 변경 감지
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    setFilters({
      type: searchParams.get('tag') || searchParams.get('type') || '',
      region: searchParams.get('region') || '',
      subcategory: searchParams.get('subcategory') || ''
    });
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  }, [location.search]);

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

  // 사용자의 스크랩 목록 가져오기
  useEffect(() => {
    const fetchUserScraps = async () => {
      if (!user) return;

      try {
        // 모든 스크랩을 가져오기 위해 limit을 크게 설정
        const response = await getUserScraps({ page: 1, limit: 1000 });
        if (response.scraps) {
          const scrapIds = new Set(response.scraps.map(scrap => scrap.post?._id).filter(Boolean));
          setUserScrapIds(scrapIds);
        }
      } catch (error) {
        console.error('스크랩 목록 조회 실패:', error);
      }
    };

    fetchUserScraps();
  }, [user]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiParams = {
          page: currentPage,
          limit: 25,
          ...filters
        };

        let data;
        if (pendingOnly) {
          // 승인 대기 게시물 가져오기
          data = await getPendingPosts(apiParams);
          const postsData = data.posts || data;
          const processedPosts = processPostsList(postsData);
          setPosts(processedPosts);
          setTotalPages(data.pagination?.pages || 1);
        } else {
          // 일반 게시물 가져오기
          data = await getBoards(apiParams);
          const postsData = data.posts || data;
          const processedPosts = processPostsList(postsData);
          setPosts(processedPosts);
          setTotalPages(data.totalPages || 1);
        }
      } catch (error) {
        setError(error.message || '게시글 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [currentPage, filters, pendingOnly]);

  // 필터 변경 핸들러
  const handleFilterChange = useCallback(newFilters => {
    setFilters(newFilters);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  }, []);

  // 페이지 변경 핸들러
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);

  // Canonical URL 생성 (중요한 필터만 포함)
  const getCanonicalUrl = () => {
    const baseUrl = 'https://likorea.com/boards';
    const params = new URLSearchParams();

    // 중요한 필터만 canonical URL에 포함
    if (filters.type) params.append('type', filters.type);
    if (filters.region && filters.region !== '0') params.append('region', filters.region);

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  // 페이지 제목 생성
  const getPageTitle = () => {
    const titleParts = [];
    if (filters.type) titleParts.push(filters.type);
    if (filters.region && filters.region !== '0') titleParts.push(`지역 ${filters.region}`);
    if (pendingOnly) titleParts.push('승인 대기');

    const prefix = titleParts.length > 0 ? titleParts.join(' - ') + ' | ' : '';
    return `${prefix}롱아일랜드 한인 커뮤니티`;
  };

  return (
    <>
      <Helmet>
        <title>{getPageTitle()}</title>
        <meta name="description" content="롱아일랜드 한인 커뮤니티 게시판. 부동산, 구인구직, 맛집, 사고팔고 등 다양한 정보를 공유하세요." />
        <link rel="canonical" href={getCanonicalUrl()} />
        {/* Open Graph 태그 */}
        <meta property="og:title" content={getPageTitle()} />
        <meta property="og:url" content={getCanonicalUrl()} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="board-list-container" role="main" aria-label="게시판 목록">
        {/* 태그 필터 컴포넌트 - 승인 대기 게시물일 때는 숨김 */}
        {!pendingOnly && (
          <div className="user-controls" role="region" aria-label="사용자 컨트롤">
            <TagFilter onFilterChange={handleFilterChange} currentFilters={filters} />
          </div>
        )}

      {loading ? (
        <BoardLoading />
      ) : error ? (
        <BoardError error={error} />
      ) : posts.length === 0 ? (
        <BoardEmpty />
      ) : (
        <>
          {/* 데스크톱 테이블 뷰 */}
          <BoardTable posts={posts} tagList={tagList} pendingOnly={pendingOnly} userScrapIds={userScrapIds} />

          {/* 모바일 카드 뷰 */}
          <BoardCards posts={posts} tagList={tagList} pendingOnly={pendingOnly} userScrapIds={userScrapIds} />
        </>
      )}

      <BoardPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Floating Write Button for Mobile - FAB에 통합됨 */}
      {/* <FloatingWriteButton /> */}
    </div>
    </>
  );
};

export default React.memo(BoardList);
