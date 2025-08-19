const Tag = require('../models/Tag');

// 글종류별 소주제 분류
const SUB_CATEGORIES = {
  공지: ['일반', '긴급'],
  사고팔고: ['나눔', '중고'],
  부동산: ['렌트', '룸메이트'],
  생활정보: ['맛집', '업체정보', '정착가이드', '뉴스', '육아/교육', '여행/나들이'],
  모임: ['번개', '정기', '이벤트']
};

/**
 * 태그 시스템 초기화
 * 서버 시작 시 또는 관리자가 수동으로 실행할 수 있음
 */
const initializeTags = async () => {
  try {
    console.log('태그 시스템 초기화 시작...');

    // Type 태그들
    const typeTags = [
      { value: '공지', displayName: '공지', order: 0 },
      { value: '사고팔고', displayName: '사고팔고', order: 1 },
      { value: '부동산', displayName: '부동산', order: 2 },
      { value: '생활정보', displayName: '생활정보', order: 3 },
      { value: '모임', displayName: '모임', order: 4 },
      { value: '기타', displayName: '기타', order: 5 }
    ];

    // 하위 카테고리 태그들 (category 타입으로 추가)
    const subCategoryTags = [];

    // 먼저 각 parentCategory의 기존 소주제들을 비활성화
    for (const parentCategory of Object.keys(SUB_CATEGORIES)) {
      await Tag.updateMany(
        { category: 'category', parentCategory: parentCategory },
        { isActive: false }
      );
    }

    // SUB_CATEGORIES 객체를 사용하여 모든 하위 카테고리 생성
    Object.entries(SUB_CATEGORIES).forEach(([parentCategory, subcategories]) => {
      subcategories.forEach((subcategory, index) => {
        subCategoryTags.push({
          value: subcategory,
          displayName: subcategory,
          category: 'category',
          parentCategory: parentCategory,
          order: index,
          isActive: true
        });
      });
    });

    // Region 태그들 (Exit 13부터 Exit 73까지) - 정확한 지역명 매핑
    const regionTags = [];

    // LIE(Long Island Expressway) Exit → 대표 지역 매핑
    const exitNames = {
      13: 'Exit 13 - Long Island City (Borden Ave / Pulaski Bridge)',
      14: 'Exit 14 - Long Island City (NY 25A / 50th Ave)',
      15: 'Exit 15 - Long Island City (Van Dam St)',
      16: 'Exit 16 - Long Island City (Hunters Point Ave / Greenpoint Ave)',
      17: 'Exit 17 - BQE (I-278) – Brooklyn / Queens',
      18: 'Exit 18 - Maspeth (Maurice Ave)',
      19: 'Exit 19 - Elmhurst (Woodhaven Blvd / Queens Blvd)',
      20: 'Exit 20 - Corona (Junction Blvd)',
      21: 'Exit 21 - Corona / Rego Park (108th St)',
      22: 'Exit 22 - Flushing (Grand Central Pkwy / Van Wyck Expwy)',
      23: 'Exit 23 - Flushing (Main St)',
      24: 'Exit 24 - Flushing (Kissena Blvd)',
      25: 'Exit 25 - Fresh Meadows (Utopia Pkwy / 188th St)',
      26: 'Exit 26 - Fresh Meadows (Francis Lewis Blvd)',
      27: 'Exit 27 - Bayside (Clearview Expwy I-295)',
      28: 'Exit 28 - Bayside (Oceania St / Francis Lewis Blvd)',
      29: 'Exit 29 - Oakland Gardens (Springfield Blvd)',
      30: 'Exit 30 - Douglaston (Douglaston Pkwy / East Hampton Blvd)',
      31: 'Exit 31 - Alley Pond Park / Little Neck (Cross Island Pkwy)',
      32: 'Exit 32 - Little Neck (Little Neck Pkwy)',
      33: 'Exit 33 - Lake Success / Great Neck (Community Dr / Lakeville Rd)',
      34: 'Exit 34 - North Hills (New Hyde Park Rd)',
      35: 'Exit 35 - Manhasset (Shelter Rock Rd)',
      36: 'Exit 36 - Manhasset / Port Washington (Searingtown Rd)',
      37: 'Exit 37 - Roslyn / Mineola (Willis Ave)',
      38: 'Exit 38 - East Hills (Northern State Pkwy)',
      39: 'Exit 39 - Glen Cove / Hempstead (Glen Cove Rd)',
      40: 'Exit 40 - Syosset / Mineola (NY 25 Jericho Tpke)',
      41: 'Exit 41 - Hicksville / Oyster Bay (NY 106 / NY 107)',
      42: 'Exit 42 - Jericho (Northern State Pkwy)',
      43: 'Exit 43 - Syosset / Bethpage (South Oyster Bay Rd)',
      44: 'Exit 44 - Syosset / Seaford (NY 135)',
      45: 'Exit 45 - Plainview / Woodbury (Manetto Hill Rd)',
      46: 'Exit 46 - Plainview (Sunnyside Blvd)',
      48: 'Exit 48 - Old Bethpage (Round Swamp Rd)',
      49: 'Exit 49 - Melville / Farmingdale / Huntington (NY 110)',
      50: 'Exit 50 - Dix Hills / Wyandanch (Bagatelle Rd)',
      51: 'Exit 51 - Dix Hills / Babylon (NY 231)',
      52: 'Exit 52 - Commack / North Babylon (Commack Rd)',
      53: 'Exit 53 - Bay Shore / Kings Park (Sagtikos Pkwy)',
      55: 'Exit 55 - Central Islip (Motor Pkwy CR 67)',
      56: 'Exit 56 - Smithtown / Islip (NY 111)',
      57: 'Exit 57 - Hauppauge / Patchogue (NY 454)',
      58: 'Exit 58 - Islandia / Nesconset (Old Nichols Rd)',
      59: 'Exit 59 - Ronkonkoma / Oakdale (Ocean Ave)',
      60: 'Exit 60 - Lake Ronkonkoma / Sayville (Ronkonkoma Ave)',
      61: 'Exit 61 - Holbrook / Patchogue (Patchogue-Holbrook Rd CR 19)',
      62: 'Exit 62 - Stony Brook / East Setauket / Blue Point (Nicolls Rd CR 97)',
      63: 'Exit 63 - Patchogue / Mount Sinai (North Ocean Ave CR 83)',
      64: 'Exit 64 - Port Jefferson / Patchogue (NY 112)',
      65: 'Exit 65 - Medford / Centereach / Shirley (Horseblock Rd)',
      66: 'Exit 66 - Yaphank / East Patchogue (Sills Rd)',
      67: 'Exit 67 - Yaphank / Brookhaven (Yaphank Ave)',
      68: 'Exit 68 - Shirley / Wading River (William Floyd Pkwy CR 46)',
      69: 'Exit 69 - Wading River / Center Moriches (Wading River Rd)',
      70: 'Exit 70 - Manorville / Montauk (County Route 111)',
      71: 'Exit 71 - Calverton / Hampton Bays (NY 24)',
      72: 'Exit 72 - Riverhead / Calverton (NY 25)',
      73: 'Exit 73 - Greenport / Orient (CR 58)'
    };

    // Exit 13부터 73까지만 생성 (Exit 1-12 제거)
    for (let exit = 13; exit <= 73; exit++) {
      const exitStr = exit.toString();
      // Exit 47, 54는 매핑에 없으므로 건너뛰기
      if (exit === 47 || exit === 54) {
        continue;
      }

      regionTags.push({
        value: exitStr,
        displayName: exitNames[exitStr] || `Exit ${exit}`,
        order: exit
      });
    }

    // 범위 태그 추가 (Exit 13 이하, Exit 73 이상)
    regionTags.push({ value: '<13', displayName: 'Exit 13 이하 – Queens / Brooklyn', order: 12 });
    regionTags.push({ value: '>73', displayName: 'Exit 73 이상 – East End', order: 74 });

    // 기본 옵션 추가 (지역 선택 안함)
    regionTags.push({ value: '0', displayName: '지역 선택 안함', order: 0 });

    // Type 태그 생성/업데이트
    for (const tagData of typeTags) {
      await Tag.findOneAndUpdate(
        { value: tagData.value, category: 'type' },
        {
          ...tagData,
          category: 'type',
          isActive: true
        },
        { upsert: true, new: true }
      );
    }

    // 하위 카테고리 태그 생성/업데이트
    for (const tag of subCategoryTags) {
      await Tag.findOneAndUpdate(
        { value: tag.value, category: tag.category },
        tag,
        { upsert: true, new: true }
      );
    }

    // Region 태그 생성/업데이트
    for (const tagData of regionTags) {
      await Tag.findOneAndUpdate(
        { category: 'region', value: tagData.value },
        {
          ...tagData,
          category: 'region',
          isActive: true
        },
        { upsert: true, new: true }
      );
    }

    console.log('태그 시스템 초기화 완료!');
    console.log(`- Type 태그: ${typeTags.length}개`);
    console.log(`- Category 태그: ${subCategoryTags.length}개`);
    console.log(`- Region 태그: ${regionTags.length}개 (Exit 13~73, Exit 73 이상)`);
  } catch (error) {
    console.error('태그 시스템 초기화 실패:', error);
    throw error;
  }
};

/**
 * 특정 카테고리의 태그 조회
 */
const getTagsByCategory = async category => {
  try {
    return await Tag.getTagsByCategory(category);
  } catch (error) {
    console.error(`태그 조회 실패 (카테고리: ${category}):`, error);
    throw error;
  }
};

/**
 * 모든 활성 태그 조회
 */
const getAllActiveTags = async () => {
  try {
    return await Tag.getAllActiveTags();
  } catch (error) {
    console.error('모든 태그 조회 실패:', error);
    throw error;
  }
};

/**
 * 새 태그 추가
 */
const addTag = async (category, value, displayName, order = 0, description = '') => {
  try {
    const tag = new Tag({
      category,
      value,
      displayName,
      order,
      description,
      isActive: true
    });
    return await tag.save();
  } catch (error) {
    console.error('태그 추가 실패:', error);
    throw error;
  }
};

/**
 * 태그 비활성화
 */
const deactivateTag = async (category, value) => {
  try {
    return await Tag.findOneAndUpdate({ category, value }, { isActive: false }, { new: true });
  } catch (error) {
    console.error('태그 비활성화 실패:', error);
    throw error;
  }
};

// 태그 초기화 유틸리티

// 기본 태그들
const DEFAULT_TAGS = {
  types: ['공지', '사고팔고', '부동산', '생활정보', '모임', '기타'],
  regions: [
    '전체',
    '맨해튼',
    '브루클린',
    '퀸즈',
    '브롱크스',
    '스태튼아일랜드',
    '롱아일랜드',
    '뉴저지',
    '기타'
  ]
};

module.exports = {
  initializeTags,
  getTagsByCategory,
  getAllActiveTags,
  addTag,
  deactivateTag,
  DEFAULT_TAGS,
  SUB_CATEGORIES
};
