import api from './index';

// 활성 배너 조회
export const getActiveBanner = async () => {
  try {
    const response = await api.get('/banners/active');
    return response;
  } catch (error) {
    console.error('활성 배너 조회 실패:', error);
    throw error;
  }
};

// 모든 배너 조회 (관리자)
export const getAllBanners = async () => {
  try {
    const response = await api.get('/banners');
    return response;
  } catch (error) {
    console.error('배너 목록 조회 실패:', error);
    throw error;
  }
};

// 배너 생성 (관리자)
export const createBanner = async (bannerData) => {
  try {
    const response = await api.post('/banners', bannerData);
    return response;
  } catch (error) {
    console.error('배너 생성 실패:', error);
    throw error;
  }
};

// 배너 수정 (관리자)
export const updateBanner = async (bannerId, bannerData) => {
  try {
    const response = await api.put(`/banners/${bannerId}`, bannerData);
    return response;
  } catch (error) {
    console.error('배너 수정 실패:', error);
    throw error;
  }
};

// 배너 삭제 (관리자)
export const deleteBanner = async (bannerId) => {
  try {
    const response = await api.delete(`/banners/${bannerId}`);
    return response;
  } catch (error) {
    console.error('배너 삭제 실패:', error);
    throw error;
  }
};

// 배너 활성화/비활성화 토글 (관리자)
export const toggleBannerStatus = async (bannerId) => {
  try {
    const response = await api.patch(`/banners/${bannerId}/toggle`);
    return response;
  } catch (error) {
    console.error('배너 상태 변경 실패:', error);
    throw error;
  }
};