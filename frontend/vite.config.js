import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default defineConfig(({ mode }) => {
  // 載入環境變數
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      vue(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
        imports: ["vue", "vue-router", "pinia"],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
    // 明確定義環境變數
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(
        env.VITE_API_URL || "http://localhost:3005",
      ),
    },
    server: {
      host: "0.0.0.0",
      port: 5175,
      strictPort: true, // 強制使用指定端口，如果被占用則報錯而不是切換端口
      proxy: {
        "/api": {
          target: "http://localhost:3005",
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: false,
      minify: "esbuild", // 使用 esbuild 壓縮，無需額外依賴
    },
  };
});
