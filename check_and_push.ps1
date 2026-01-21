# 檢查 App.vue 第59行是否已修復
$appVuePath = "c:\Users\evelyn.pan\Downloads\GIT\prttimeWorkersPlatform\frontend\src\App.vue"
$line59 = (Get-Content $appVuePath)[58]  # 0-based index
Write-Host "第59行內容: $line59"

if ($line59 -like "*工讀生管理*") {
    Write-Host "✓ 第59行已修復" -ForegroundColor Green
} else {
    Write-Host "✗ 第59行仍有問題" -ForegroundColor Red
}

# 檢查是否有未提交的更改
Set-Location "c:\Users\evelyn.pan\Downloads\GIT\prttimeWorkersPlatform"
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "有未提交的更改:" -ForegroundColor Yellow
    $gitStatus
} else {
    Write-Host "✓ 沒有未提交的更改" -ForegroundColor Green
}

# 嘗試推送
Write-Host "正在推送到 GitHub..."
git add .
git commit -m "修復 App.vue 第59行語法錯誤" 2>&1
git push origin main 2>&1