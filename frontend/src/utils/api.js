import axios from "axios";
import { ElMessage } from "element-plus";

// 動態設定 API 基礎 URL
const getBaseURL = () => {
  // 如果有設定環境變數，使用環境變數
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 開發環境或本地環境使用代理
  if (import.meta.env.DEV) {
    return "/api";
  }

  // 生產環境預設（之後需要更新為實際的後端網址）
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

// 請求攔截器
api.interceptors.request.use(
  (config) => {
    // 可以在這裡添加 loading 狀態
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 回應攔截器
api.interceptors.response.use(
  (response) => {
    // 直接返回原始response，讓各個組件自行處理
    return response;
  },
  (error) => {
    let message = "網路錯誤，請稍後重試";

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
          message = data.message || "請求的資源不存在";
          break;
        case 500:
          message = "伺服器錯誤，請稍後重試";
          break;
        default:
          message = data.message || `請求失敗 (${status})`;
      }
    } else if (error.request) {
      message = "無法連接到伺服器，請檢查網路連線";
    }

    console.error("API錯誤:", error);
    return Promise.reject(error);
  },
);

export default api;
