# 🚀 Vercel 部署準備腳本

Write-Host "================================" -ForegroundColor Cyan
Write-Host "   Vercel 部署準備工具" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 步驟 1: 初始化 Git
Write-Host "步驟 1: 初始化 Git 儲存庫..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "✓ Git 已初始化" -ForegroundColor Green
} else {
    git init
    Write-Host "✓ Git 初始化完成" -ForegroundColor Green
}

# 步驟 2: 檢查 .gitignore
Write-Host ""
Write-Host "步驟 2: 檢查 .gitignore..." -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    Write-Host "✓ .gitignore 已存在" -ForegroundColor Green
} else {
    Write-Host "✗ .gitignore 不存在，請先創建" -ForegroundColor Red
    exit 1
}

# 步驟 3: 添加所有文件
Write-Host ""
Write-Host "步驟 3: 添加文件到 Git..." -ForegroundColor Yellow
git add .
Write-Host "✓ 文件已添加" -ForegroundColor Green

# 步驟 4: 創建提交
Write-Host ""
Write-Host "步驟 4: 創建 Git 提交..." -ForegroundColor Yellow
$commitMessage = "準備部署到 Vercel - 工讀生管理系統"
git commit -m $commitMessage
Write-Host "✓ 提交完成" -ForegroundColor Green

# 步驟 5: 提示用戶創建 GitHub 儲存庫
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   下一步：創建 GitHub 儲存庫" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "請執行以下步驟：" -ForegroundColor White
Write-Host ""
Write-Host "1. 訪問: https://github.com/new" -ForegroundColor Green
Write-Host "2. 儲存庫名稱: prttimeWorkersPlatform" -ForegroundColor Green
Write-Host "3. 設定: Public (重要！)" -ForegroundColor Green
Write-Host "4. 不要勾選任何初始化選項" -ForegroundColor Green
Write-Host "5. 點擊 'Create repository'" -ForegroundColor Green
Write-Host ""
Write-Host "然後執行以下命令（替換 YOUR_USERNAME）：" -ForegroundColor Yellow
Write-Host ""
Write-Host "git remote add origin https://github.com/YOUR_USERNAME/prttimeWorkersPlatform.git" -ForegroundColor Cyan
Write-Host "git branch -M main" -ForegroundColor Cyan
Write-Host "git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   準備完成！" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "接下來請參考 VERCEL_快速部署.md 繼續操作" -ForegroundColor White
Write-Host ""
