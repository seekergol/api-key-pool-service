# 等待GitHub Pages部署并测试服务
Write-Host "⏳ 等待GitHub Pages部署..." -ForegroundColor Yellow
Write-Host "请确保已在GitHub上启用Pages设置" -ForegroundColor Cyan

$serviceUrl = "https://seekergol.github.io/api-key-pool-service"
$maxAttempts = 20
$attempt = 0

while ($attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "尝试 $attempt/$maxAttempts..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$serviceUrl/health" -Method GET
        Write-Host "✅ 服务已部署成功!" -ForegroundColor Green
        Write-Host "响应: $($response | ConvertTo-Json)" -ForegroundColor White
        break
    } catch {
        Write-Host "❌ 尝试 $attempt 失败，等待30秒..." -ForegroundColor Red
        if ($attempt -lt $maxAttempts) {
            Start-Sleep 30
        }
    }
}

if ($attempt -eq $maxAttempts) {
    Write-Host "❌ 服务部署超时" -ForegroundColor Red
    Write-Host "请检查GitHub Pages设置是否正确启用" -ForegroundColor Yellow
} else {
    Write-Host "🎉 现在可以添加Gemini密钥了!" -ForegroundColor Green
}

Read-Host "按任意键继续" 