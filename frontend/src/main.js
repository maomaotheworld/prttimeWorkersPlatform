import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import App from "./App.vue";

// 初始化 API 配置（重寫 fetch）
import "./config/api.js";

// Element Plus 樣式
import "element-plus/dist/index.css";

// 自定義樣式
import "./styles/index.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

app.mount("#app");
