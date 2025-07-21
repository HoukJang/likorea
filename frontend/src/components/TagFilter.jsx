import React, { useState, useEffect } from 'react';
import { getAllTags } from '../api/tags';
import '../styles/TagFilter.css';

const TagFilter = ({ onFilterChange, currentFilters = {} }) => {
  const [tags, setTags] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: currentFilters.type || '',
    region: currentFilters.region || '',
    search: currentFilters.search || ''
  });

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const response = await getAllTags();
        setTags(response.tags || {});
      } catch (err) {
        console.error('태그 로딩 실패:', err);
        setError('태그를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      type: '',
      region: '',
      search: ''
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = filters.type || filters.region || filters.search;

  if (loading) {
    return <div className="tag-filter-loading">필터를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="tag-filter-error">오류: {error}</div>;
  }

  return (
    <div className="tag-filter">
      <div className="filter-controls">
        <div className="filter-group">
          <label className="filter-label">글종류</label>
          <select
            className="filter-select"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">모든 글종류</option>
            {tags.type && tags.type.map(tag => (
              <option key={tag.value} value={tag.value}>
                {tag.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">지역</label>
          <input
            type="text"
            className="filter-input"
            placeholder="Exit 번호 (예: 24, 24,25,26, 24-60, 30-40,0, <=13, >73, 0=지역선택안함)"
            value={filters.region}
            onChange={(e) => handleFilterChange('region', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">검색</label>
          <input
            type="text"
            className="filter-input"
            placeholder="제목 또는 내용 검색..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        {hasActiveFilters && (
          <button 
            className="clear-filters-btn"
            onClick={clearFilters}
          >
            필터 초기화
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="active-filters">
          <span className="active-filters-label">활성 필터:</span>
          {filters.type && (
            <span className="filter-tag">
              글종류: {tags.type?.find(t => t.value === filters.type)?.displayName}
              <button 
                onClick={() => handleFilterChange('type', '')}
                className="remove-filter-btn"
              >
                ×
              </button>
            </span>
          )}
          {filters.region && (
            <span className="filter-tag">
              지역: {filters.region}
              <button 
                onClick={() => handleFilterChange('region', '')}
                className="remove-filter-btn"
              >
                ×
              </button>
            </span>
          )}
          {filters.search && (
            <span className="filter-tag">
              검색: {filters.search}
              <button 
                onClick={() => handleFilterChange('search', '')}
                className="remove-filter-btn"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TagFilter; 