// API 基礎配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

export const getApiUrl = (endpoint) => {
  // 確保 endpoint 以 / 開頭
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
};

export default {
  baseURL: API_BASE_URL,
  getUrl: getApiUrl,
};
