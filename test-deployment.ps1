# GitHub Pages 部署测试脚本
# 用于验证API Key Pool Service是否成功部署

Write-Host "🧪 测试 GitHub Pages 部署..." -ForegroundColor Green
Write-Host ""

$baseUrl = "https://seekergol.github.io/api-key-pool-service"

# 测试1: 健康检查
Write-Host "📋 测试1: 健康检查" -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ 健康检查成功: $($healthResponse | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ 健康检查失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 请确保GitHub Pages已启用并完成部署" -ForegroundColor Cyan
}

Write-Host ""

# 测试2: 主页
Write-Host "📋 测试2: 主页访问" -ForegroundColor Yellow
try {
    $homeResponse = Invoke-RestMethod -Uri $baseUrl -Method GET
    Write-Host "✅ 主页访问成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 主页访问失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 测试3: API端点
Write-Host "📋 测试3: API端点" -ForegroundColor Yellow
try {
    $apiResponse = Invoke-RestMethod -Uri "$baseUrl/api/gemini/models" -Method GET
    Write-Host "✅ API端点测试成功" -ForegroundColor Green
} catch {
    Write-Host "❌ API端点测试失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 这是正常的，因为我们还没有添加API密钥" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🎯 测试完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📖 如果健康检查成功，说明部署已完成" -ForegroundColor Cyan
Write-Host "🔗 服务地址: $baseUrl" -ForegroundColor Green
Write-Host ""
Write-Host "💡 下一步：添加API密钥并测试完整功能" -ForegroundColor Yellow

Read-Host "按任意键退出" 