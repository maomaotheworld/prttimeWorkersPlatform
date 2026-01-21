import axios from "axios";
import { ElMessage } from "element-plus";

// ?•æ?è¨­å? API ?ºç? URL
const getBaseURL = () => {
  // å¦‚æ??‰è¨­å®šç’°å¢ƒè??¸ï?ä½¿ç”¨?°å?è®Šæ•¸
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // ?‹ç™¼?°å??–æœ¬?°ç’°å¢ƒä½¿?¨ä»£??
  if (import.meta.env.DEV) {
    return "/api";
  }

  // ?Ÿç”¢?°å??è¨­ï¼ˆä?å¾Œé?è¦æ›´?°ç‚ºå¯¦é??„å?ç«¯ç¶²?€ï¼?
  return "/api";
};

// å»ºç? axios å¯¦ä?
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// è«‹æ??”æˆª??
api.interceptors.request.use(
  (config) => {
    // ?¯ä»¥?¨é€™è£¡æ·»å? loading ?€??
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ?æ??”æˆª??
api.interceptors.response.use(
  (response) => {
    // ?´æ¥è¿”å??Ÿå?responseï¼Œè??„å€‹ç?ä»¶è‡ªè¡Œè???
    return response;
  },
  (error) => {
    let message = "ç¶²è·¯?¯èª¤ï¼Œè?ç¨å??è©¦";

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          message = data.message || "è«‹æ??ƒæ•¸?¯èª¤";
          break;
        case 401:
          message = data.message || "èªè?å¤±æ?";
          break;
        case 403:
          message = data.message || "æ¬Šé?ä¸è¶³";
          break;
        case 404:
          message = data.message || "è«‹æ??„è?æºä?å­˜åœ¨";
          break;
        case 500:
          message = "ä¼ºæ??¨éŒ¯èª¤ï?è«‹ç?å¾Œé?è©?;
          break;
        default:
          message = data.message || `è«‹æ?å¤±æ? (${status})`;
      }
    } else if (error.request) {
      message = "?¡æ???¥?°ä¼º?å™¨ï¼Œè?æª¢æŸ¥ç¶²è·¯???";
    }

    console.error("API?¯èª¤:", error);
    return Promise.reject(error);
  },
);

export default api;
