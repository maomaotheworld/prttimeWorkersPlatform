# 工讀生管理平台

一個完整的工讀生管理系統，包含工時計算、組別管理、薪資調整等功能。

## 專案結構

- `backend/` - Node.js 後端 API
- `frontend/` - Vue3 + Element Plus 前端應用

## 功能特色

### 工讀生管理

- 工讀生基本資料（編號、姓名、性別、等級 1-10）
- 工讀生分組管理（可自定義組別名稱）
- 工讀生組別調動

### 工時管理

- 上下班時間記錄
- 額外工時新增（附理由說明）
- 自動計算總工時

### 薪資管理

- 加薪減薪記錄
- 薪資異動歷史查詢

### 響應式設計

- 支援手機和平板瀏覽
- 區域網路存取支援

## 開發環境需求

### 後端

- Node.js 16+
- npm 或 yarn

### 前端

- Node.js 16+
- Vue3
- Element Plus

## 安裝與執行

### 後端

```bash
cd backend
npm install
npm start
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

## 網路配置

後端預設運行在 0.0.0.0:3000，可透過區域網路存取。
前端開發伺服器運行在 localhost:5173。

## API 文檔

詳見 `backend/API.md`
