import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import App from "./App.vue";

// Element Plus ци??
import "element-plus/dist/index.css";

// ?их?ци??
import "./styles/index.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

app.mount("#app");
