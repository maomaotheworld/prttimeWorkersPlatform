# 🚀 Vercel 部署完整指南

## 📋 部署前準備

### ✅ 已完成的配置

- [x] `vercel.json` - Vercel 部署配置
- [x] `.vercelignore` - 忽略文件配置
- [x] `.env.example` - 環境變數範例
- [x] 修改 `api.js` 支援動態 API URL
- [x] 更新 `package.json` 添加構建腳本

## 🌐 步驟一：準備 GitHub 儲存庫

### 1. 初始化 Git（如果還沒有）

```bash
# 在專案根目錄
cd c:\Users\evelyn.pan\Downloads\GIT\prttimeWorkersPlatform
git init
git add .
git commit -m "初始化工讀生管理系統"
```

### 2. 建立 GitHub 儲存庫

1. 訪問 https://github.com/new
2. 儲存庫名稱：`parttime-workers-platform`
3. 設為 Public（免費版 Vercel 需要 Public）
4. 不要初始化 README（因為本地已有文件）

### 3. 上傳到 GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/parttime-workers-platform.git
git branch -M main
git push -u origin main
```

## 🚀 步驟二：部署到 Vercel

### 1. 註冊 Vercel 帳號

- 訪問 https://vercel.com
- 使用 GitHub 帳號註冊（推薦）

### 2. 匯入專案

1. 點擊 "New Project"
2. 選擇剛才建立的 GitHub 儲存庫
3. **重要**: 設定 Root Directory 為 `frontend`
4. Framework Preset: Vite
5. Build Command: `npm run vercel-build`
6. Output Directory: `dist`

### 3. 設定環境變數

在 Vercel 專案設定中添加：

```
Key: VITE_API_URL
Value: https://your-backend-url/api
```

**注意**: 暫時先不設定，等後端部署完成後再填入

### 4. 點擊 "Deploy"

## 🌐 步驟三：部署後端（Railway）

### 1. 準備後端部署

建立 `backend/package.json` 的啟動腳本：

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "node index.js"
  }
}
```

### 2. 部署到 Railway

1. 訪問 https://railway.app
2. 使用 GitHub 帳號註冊
3. 點擊 "New Project"
4. 選擇 "Deploy from GitHub repo"
5. 選擇您的儲存庫
6. **重要**: 設定 Root Directory 為 `backend`
7. 點擊 "Deploy"

### 3. 獲取後端網址

- Railway 會自動生成網址，如：`https://your-app-production.up.railway.app`

## 🔧 步驟四：完成配置

### 1. 更新前端環境變數

回到 Vercel 專案：

1. 進入 Settings → Environment Variables
2. 更新 `VITE_API_URL` 為：`https://your-railway-url/api`
3. 重新部署前端

### 2. 更新後端 CORS 設定

修改 `backend/index.js` 的 CORS 配置：

```javascript
app.use(
  cors({
    origin: ["https://your-vercel-url.vercel.app", "http://localhost:5175"],
    credentials: true,
  }),
);
```

## 📱 最終結果

### 前端網址：

```
https://your-app-name.vercel.app
```

### 手機訪問：

任何地方都可以通過上述網址訪問！

## 💡 重要提醒

### Vercel 免費版限制：

- ✅ 無限靜態部署
- ✅ 自動 HTTPS
- ✅ 全球 CDN
- ⚠️ 每月 100GB 頻寬
- ⚠️ 每次構建 45 秒限制

### Railway 免費版限制：

- ✅ $5 免費額度/月
- ✅ 自動 HTTPS
- ⚠️ 用完額度後會暫停

## 🆘 如需協助

如果在任何步驟遇到問題，請告訴我：

1. 遇到問題的步驟
2. 錯誤訊息
3. 截圖（如有）

**準備開始部署了嗎？從哪個步驟需要協助？**
