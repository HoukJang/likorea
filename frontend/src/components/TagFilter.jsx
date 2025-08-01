import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllTags, getSubCategoriesByParent } from '../api/tags';
import '../styles/TagFilter.css';

const TagFilter = ({ onFilterChange, currentFilters = {} }) => {
  const [tags, setTags] = useState({});
  const [subCategories, setSubCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: currentFilters.type || '',
    region: currentFilters.region || '',
    subcategory: currentFilters.subcategory || '',
    search: currentFilters.search || '',
  });

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const response = await getAllTags();
        setTags(response.tags || {});
      } catch (err) {
        setError('태그를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  // 글종류가 변경될 때 하위 카테고리 로드
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (filters.type) {
        try {
          const response = await getSubCategoriesByParent(filters.type);
          
          if (response && response.subCategories) {
            setSubCategories(prev => ({
              ...prev,
              [filters.type]: response.subCategories,
            }));
          }
        } catch (err) {
          // 하위 카테고리 로드 실패 시 조용히 처리
          console.error('Failed to load subcategories:', err);
        }
      }
    };

    fetchSubCategories();
  }, [filters.type]);

  const handleFilterChange = useCallback((key, value) => {
    const newFilters = {
      ...filters,
      [key]: value,
    };

    // 글종류가 변경되면 소주제 초기화
    if (key === 'type') {
      newFilters.subcategory = '';
    }

    setFilters(newFilters);
    onFilterChange(newFilters);
  }, [filters, onFilterChange]);

  const clearFilters = useCallback(() => {
    const clearedFilters = {
      type: '',
      region: '',
      subcategory: '',
      search: '',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  }, [onFilterChange]);

  const hasActiveFilters = useMemo(
    () => filters.type || filters.region || filters.subcategory || filters.search,
    [filters.type, filters.region, filters.subcategory, filters.search]
  );

  if (loading) {
    return <div className='tag-filter-loading'>필터를 불러오는 중...</div>;
  }

  if (error) {
    return <div className='tag-filter-error'>오류: {error}</div>;
  }

  return (
    <div className='tag-filter'>
      <div className='filter-controls'>
        <div className='filter-group'>
          <label className='filter-label'>글종류</label>
          <select
            className='filter-select'
            value={filters.type}
            onChange={e => handleFilterChange('type', e.target.value)}
          >
            <option value=''>전체</option>
            {tags.type &&
              tags.type.map(tag => (
                <option key={tag.value} value={tag.value}>
                  {tag.displayName}
                </option>
              ))}
          </select>
        </div>

        {filters.type && subCategories[filters.type] && subCategories[filters.type].length > 0 && (
          <div className='filter-group'>
            <label className='filter-label'>소주제</label>
            <select
              className='filter-select'
              value={filters.subcategory}
              onChange={e => handleFilterChange('subcategory', e.target.value)}
            >
              <option value=''>전체</option>
              {subCategories[filters.type].map(subcategory => (
                <option key={subcategory.value} value={subcategory.value}>
                  {subcategory.displayName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className='filter-group'>
          <label className='filter-label'>지역</label>
          <input
            type='text'
            className='filter-input'
            placeholder='Exit 번호 (예: 24, 24-60, 0)'
            value={filters.region}
            onChange={e => handleFilterChange('region', e.target.value)}
          />
        </div>

        <div className='filter-group'>
          <label className='filter-label'>검색</label>
          <input
            type='text'
            className='filter-input'
            placeholder='제목/내용 검색'
            value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
          />
        </div>

        {hasActiveFilters && (
          <button className='clear-filters-btn' onClick={clearFilters}>
            초기화
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div className='active-filters'>
          <span className='active-filters-label'>필터:</span>
          {filters.type && (
            <span className='filter-tag'>
              글종류: {tags.type?.find(t => t.value === filters.type)?.displayName}
              <button onClick={() => handleFilterChange('type', '')} className='remove-filter-btn'>
                ×
              </button>
            </span>
          )}
          {filters.subcategory && (
            <span className='filter-tag'>
              소주제: {filters.subcategory}
              <button
                onClick={() => handleFilterChange('subcategory', '')}
                className='remove-filter-btn'
              >
                ×
              </button>
            </span>
          )}
          {filters.region && (
            <span className='filter-tag'>
              지역: {filters.region}
              <button
                onClick={() => handleFilterChange('region', '')}
                className='remove-filter-btn'
              >
                ×
              </button>
            </span>
          )}
          {filters.search && (
            <span className='filter-tag'>
              검색: {filters.search}
              <button
                onClick={() => handleFilterChange('search', '')}
                className='remove-filter-btn'
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

export default React.memo(TagFilter);
