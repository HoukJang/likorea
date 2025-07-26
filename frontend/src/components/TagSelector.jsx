import React, { useState, useEffect } from 'react';
import { getAllTags, getSubCategoriesByParent } from '../api/tags';
import '../styles/TagSelector.css';

const TagSelector = ({ selectedTags, onTagChange, required = true }) => {
  const [userAuthority, setUserAuthority] = useState(0);
  const [tags, setTags] = useState({});
  const [subCategories, setSubCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 사용자 권한 확인
    const authority = localStorage.getItem('userAuthority');
    setUserAuthority(authority ? parseInt(authority) : 0);
  }, []);

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
      if (selectedTags.type) {
        try {
          const response = await getSubCategoriesByParent(selectedTags.type);

          if (response && response.subCategories) {
            setSubCategories(prev => ({
              ...prev,
              [selectedTags.type]: response.subCategories,
            }));
          }
        } catch (err) {
          // 하위 카테고리 로드 실패 시 조용히 처리
        }
      }
    };

    fetchSubCategories();
  }, [selectedTags.type]);

  const handleTagChange = (category, value) => {
    const newTags = {
      ...selectedTags,
      [category]: value,
    };

    // 글종류가 변경되면 소주제 초기화
    if (category === 'type') {
      newTags.subcategory = '';
    }

    onTagChange(newTags);
  };

  if (loading) {
    return <div className='tag-selector-loading'>태그를 불러오는 중...</div>;
  }

  if (error) {
    return <div className='tag-selector-error'>오류: {error}</div>;
  }

  return (
    <div className='tag-selector'>
      <div className='tag-group'>
        <label className='tag-label'>
          글종류 {required && <span className='required'>*</span>}
        </label>
        <select
          className='tag-select'
          value={selectedTags.type || ''}
          onChange={e => handleTagChange('type', e.target.value)}
          required={required}
        >
          <option value=''>글종류 선택</option>
          {tags.type &&
            tags.type.map(tag => {
              // 공지 태그는 권한 4 이상만 선택 가능
              if (tag.value === '공지' && userAuthority < 4) {
                return null;
              }
              return (
                <option key={tag.value} value={tag.value}>
                  {tag.displayName}
                </option>
              );
            })}
        </select>
      </div>

      {selectedTags.type &&
        subCategories[selectedTags.type] &&
        subCategories[selectedTags.type].length > 0 && (
          <div className='tag-group'>
            <label className='tag-label'>소주제</label>
            <select
              className='tag-select'
              value={selectedTags.subcategory || ''}
              onChange={e => handleTagChange('subcategory', e.target.value)}
            >
              <option value=''>소주제 선택 (선택사항)</option>
              {subCategories[selectedTags.type].map(subcategory => (
                <option key={subcategory.value} value={subcategory.value}>
                  {subcategory.displayName}
                </option>
              ))}
            </select>
          </div>
        )}

      <div className='tag-group'>
        <label className='tag-label'>지역</label>
        <select
          className='tag-select'
          value={selectedTags.region || '0'}
          onChange={e => handleTagChange('region', e.target.value)}
        >
          {tags.region &&
            tags.region.map(tag => (
              <option key={tag.value} value={tag.value}>
                {tag.displayName}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};

export default TagSelector;
