import axios from "axios";
import { ElMessage } from "element-plus";

// 自動設定 API 基礎 URL
const getBaseURL = () => {
  // 如果有設定環境變數,使用環境變數
  if (import.meta.env.VITE_API_URL) {
    // 確保 URL 以 /api 結尾
    const url = import.meta.env.VITE_API_URL;
    return url.endsWith('/api') ? url : `${url}/api`;
  }

  // 開發環境:本地環境使用代理
  if (import.meta.env.DEV) {
    return "/api";
  }

  // 生產環境預設(之後需要更改為實際後端網址)
  return "/api";
};

// 建立 axios 實例
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 請�??�截??
api.interceptors.request.use(
  (config) => {
    // 從 localStorage 獲取 token
    const token = localStorage.getItem("auth_token");
    
    // 如果有 token,添加到請求頭
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ?��??�截??
api.interceptors.response.use(
  (response) => {
    // ?�接返�??��?response，�??�個�?件自行�???
    return response;
  },
  (error) => {
    let message = "網路?�誤，�?稍�??�試";

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          message = data.message || "請求參數錯誤";
          break;
        case 401:
          message = data.message || "認證失敗";
          break;
        case 403:
          message = data.message || "權限不足";
          break;
        case 404:
          message = data.message || "請求資源不存在";
          break;
        case 500:
          message = "伺服器錯誤,請稍後再試";
          break;
        default:
          message = data.message || `請求失敗 (${status})`;
      }
    } else if (error.request) {
      message = "無法連接到伺服器,請檢查網路連線";
    }

    console.error("API?�誤:", error);
    return Promise.reject(error);
  },
);

export default api;
