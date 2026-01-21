# 🚀 Vercel 快速部署指南

## 第一步：準備 GitHub 儲存庫

### 1. 檢查 Git 狀態
```powershell
cd c:\Users\evelyn.pan\Downloads\GIT\prttimeWorkersPlatform
git status
```

### 2. 如果還沒初始化 Git，執行：
```powershell
git init
git add .
git commit -m "準備部署到 Vercel"
```

### 3. 建立 GitHub 儲存庫
1. 訪問 https://github.com/new
2. 儲存庫名稱：`prttimeWorkersPlatform` 
3. **必須設為 Public**（Vercel 免費版要求）
4. 不要勾選 "Initialize with README"

### 4. 上傳到 GitHub
```powershell
# 替換 YOUR_USERNAME 為您的 GitHub 用戶名
git remote add origin https://github.com/YOUR_USERNAME/prttimeWorkersPlatform.git
git branch -M main
git push -u origin main
```

---

## 第二步：部署前端到 Vercel

### 1. 註冊/登入 Vercel
- 訪問：https://vercel.com
- **建議使用 GitHub 帳號登入**（可以自動連接儲存庫）

### 2. 匯入專案
1. 點擊 **"Add New..." → "Project"**
2. 選擇您的 GitHub 儲存庫：`prttimeWorkersPlatform`
3. 配置專案：

```
Configure Project:
├─ Root Directory: frontend (重要！點擊 Edit 選擇)
├─ Framework Preset: Vite
├─ Build Command: npm run build
└─ Output Directory: dist
```

### 3. 暫時不設定環境變數
先點擊 **"Deploy"** 讓前端部署（後端部署完成後再設定）

### 4. 等待部署完成
- 部署時間約 1-2 分鐘
- 完成後會得到網址：`https://your-project-name.vercel.app`

---

## 第三步：部署後端到 Railway

### 1. 註冊/登入 Railway
- 訪問：https://railway.app
- **使用 GitHub 帳號登入**

### 2. 部署後端
1. 點擊 **"New Project"**
2. 選擇 **"Deploy from GitHub repo"**
3. 選擇 `prttimeWorkersPlatform` 儲存庫
4. 配置專案：
   - **Root Directory**: `backend`
   - **Start Command**: `node index.js`

### 3. 設定環境變數（如果需要）
目前後端不需要特殊環境變數，直接部署即可

### 4. 獲取後端網址
1. 點擊 **"Settings" → "Networking"**
2. 點擊 **"Generate Domain"**
3. 複製生成的網址，例如：`https://your-backend.up.railway.app`

---

## 第四步：連接前端和後端

### 1. 更新 Vercel 環境變數
1. 回到 Vercel 專案頁面
2. 進入 **Settings → Environment Variables**
3. 添加環境變數：
   ```
   Key: VITE_API_URL
   Value: https://your-backend.up.railway.app/api
   ```
   ⚠️ 記得替換為您的 Railway 後端網址

4. 點擊 **"Save"**

### 2. 重新部署前端
1. 進入 **Deployments** 頁面
2. 點擊最新部署旁的 **"⋮"** 選單
3. 選擇 **"Redeploy"**

### 3. 更新後端 CORS 設定
在本地修改 `backend/index.js`：

```javascript
// 找到 CORS 配置（約在第 10-15 行）
app.use(
  cors({
    origin: [
      'https://your-project-name.vercel.app',  // 替換為您的 Vercel 網址
      'http://localhost:5175'
    ],
    credentials: true,
  })
);
```

然後提交並推送：
```powershell
git add backend/index.js
git commit -m "更新 CORS 設定"
git push
```

Railway 會自動重新部署。

---

## ✅ 完成！測試部署

### 訪問您的應用：
```
https://your-project-name.vercel.app
```

### 測試功能：
1. ✅ 登入功能（預設帳號：admin / admin123）
2. ✅ 工讀生管理
3. ✅ 打卡系統
4. ✅ 工時記錄
5. ✅ 薪資管理
6. ✅ 活動日誌
7. ✅ 手機版響應式

---

## 📱 手機訪問

直接在手機瀏覽器輸入您的 Vercel 網址即可！

---

## 🆘 常見問題

### Q1: 前端部署失敗？
**A**: 檢查是否正確設定 Root Directory 為 `frontend`

### Q2: 後端連接失敗？
**A**: 
1. 確認 Railway 後端已成功部署
2. 檢查 Vercel 環境變數是否正確設定
3. 確認後端 CORS 包含您的 Vercel 網址

### Q3: 登入後 API 請求失敗？
**A**: 
1. 開啟瀏覽器開發者工具（F12）
2. 查看 Network 標籤的錯誤訊息
3. 確認 API URL 是否正確

### Q4: 修改代碼後如何更新？
**A**: 
```powershell
git add .
git commit -m "更新說明"
git push
```
Vercel 和 Railway 都會自動重新部署！

---

## 💡 免費版限制

### Vercel 免費版：
- ✅ 無限靜態部署
- ✅ 自動 HTTPS
- ✅ 全球 CDN
- ⚠️ 每月 100GB 頻寬

### Railway 免費版：
- ✅ $5 免費額度/月
- ✅ 自動 HTTPS
- ⚠️ 約可運行 500 小時/月

---

## 🎉 下一步

部署完成後，您可以：

1. 📧 分享網址給團隊成員
2. 📱 在手機上測試所有功能
3. 🔒 修改預設密碼（在用戶管理頁面）
4. 📊 開始使用系統管理工讀生

**需要更多協助嗎？隨時告訴我！** 🚀
