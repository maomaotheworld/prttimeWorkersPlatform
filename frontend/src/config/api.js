// API 基礎配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

export const getApiUrl = (endpoint) => {
  // 確保 endpoint 以 / 開頭
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
};

// 統一的 fetch 封裝
export const apiFetch = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  return response;
};

export default {
  baseURL: API_BASE_URL,
  getUrl: getApiUrl,
  fetch: apiFetch,
};
