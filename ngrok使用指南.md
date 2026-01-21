# 🌐 ngrok 快速部署指南

## 什麼是 ngrok？

ngrok 可以讓您的本地服務器通過安全隧道暴露到公網，任何人都可以通過網址訪問。

## 🚀 快速設置步驟

### 1. 安裝 ngrok

```bash
# 方法一：下載安裝
# 訪問 https://ngrok.com/download
# 下載並安裝

# 方法二：使用 npm
npm install -g ngrok
```

### 2. 註冊並獲取 token

1. 訪問 https://ngrok.com/signup
2. 註冊免費帳號
3. 複製您的 authtoken

### 3. 設定 authtoken

```bash
ngrok authtoken YOUR_AUTH_TOKEN
```

### 4. 啟動隧道

#### 為前端建立隧道（在一個終端機）

```bash
ngrok http 5175
```

會得到類似：`https://abc123.ngrok.io`

#### 為後端建立隧道（在另一個終端機）

```bash
ngrok http 3005
```

會得到類似：`https://def456.ngrok.io`

### 5. 更新前端配置

修改 `frontend/vite.config.js`：

```javascript
server: {
  host: '0.0.0.0',
  port: 5175,
  strictPort: true,
  proxy: {
    '/api': {
      target: 'https://def456.ngrok.io', // 使用後端的 ngrok 網址
      changeOrigin: true,
      secure: true
    }
  }
}
```

## 📱 使用方式

### 手機訪問網址：

```
https://abc123.ngrok.io
```

### 優點：

- ✅ 5分鐘內完成設置
- ✅ 全世界任何地方都能訪問
- ✅ 免費使用
- ✅ HTTPS 安全連接

### 缺點：

- ⚠️ 每次重啟會改變網址
- ⚠️ 免費版有使用限制
- ⚠️ 適合測試，不適合正式生產

## 🎯 升級到付費版

### ngrok Pro ($8/月)

- 固定網址（不再變動）
- 自訂域名
- 更高的使用限制

---

**這是最快讓您的系統可以在任何地方使用的方案！**
