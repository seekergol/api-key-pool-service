# 添加Gemini API密钥脚本
Write-Host "🔑 添加Gemini API密钥" -ForegroundColor Green
Write-Host ""

$serviceUrl = "https://seekergol.github.io/api-key-pool-service"
$adminKey = "84861142"

# 检查服务状态
Write-Host "📋 检查服务状态..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$serviceUrl/health" -Method GET
    Write-Host "✅ 服务正常运行" -ForegroundColor Green
} catch {
    Write-Host "❌ 服务不可用，请先启用GitHub Pages" -ForegroundColor Red
    Write-Host "访问: https://github.com/seekergol/api-key-pool-service/settings/pages" -ForegroundColor Cyan
    Read-Host "按任意键退出"
    exit 1
}

Write-Host ""

# 输入Gemini API密钥
Write-Host "🔑 请输入你的Gemini API密钥:" -ForegroundColor Yellow
$apiKey = Read-Host "API密钥"
if ([string]::IsNullOrEmpty($apiKey)) {
    Write-Host "❌ API密钥不能为空" -ForegroundColor Red
    Read-Host "按任意键退出"
    exit 1
}

# 输入最大请求数
Write-Host ""
$maxRequests = Read-Host "最大请求数 (默认: 1000)"
if ([string]::IsNullOrEmpty($maxRequests)) {
    $maxRequests = 1000
}

Write-Host ""
Write-Host "🚀 正在添加Gemini密钥..." -ForegroundColor Yellow

try {
    $body = @{
        provider = "gemini"
        apiKey = $apiKey
        maxRequests = [int]$maxRequests
        metadata = @{
            addedBy = "PowerShell Script"
            addedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            provider = "gemini"
        }
    } | ConvertTo-Json

    $addKeyResponse = Invoke-RestMethod -Uri "$serviceUrl/admin/keys" -Method POST -Headers @{
        "Content-Type" = "application/json"
        "X-Admin-Key" = $adminKey
    } -Body $body

    Write-Host "✅ Gemini密钥添加成功!" -ForegroundColor Green
    Write-Host "📋 密钥ID: $($addKeyResponse.keyId)" -ForegroundColor Cyan
    Write-Host "📋 提供商: $($addKeyResponse.provider)" -ForegroundColor Cyan
    Write-Host ""

    # 显示当前状态
    Write-Host "📊 当前Gemini密钥池状态:" -ForegroundColor Yellow
    $statusResponse = Invoke-RestMethod -Uri "$serviceUrl/admin/status?provider=gemini" -Method GET -Headers @{
        "X-Admin-Key" = $adminKey
    }
    
    Write-Host "总密钥数: $($statusResponse.totalKeys)" -ForegroundColor White
    Write-Host "活跃密钥数: $($statusResponse.activeKeys)" -ForegroundColor White
    Write-Host "可用密钥数: $($statusResponse.availableKeys)" -ForegroundColor White
    Write-Host ""

    # 测试密钥
    Write-Host "🧪 测试Gemini密钥..." -ForegroundColor Yellow
    $testResponse = Invoke-RestMethod -Uri "$serviceUrl/api/gemini/models" -Method GET
    Write-Host "✅ Gemini密钥测试成功!" -ForegroundColor Green
    Write-Host ""

    # 显示使用示例
    Write-Host "💡 使用示例:" -ForegroundColor Cyan
    Write-Host "调用Gemini API:" -ForegroundColor White
    Write-Host "POST $serviceUrl/api/gemini/models/gemini-pro:generateContent" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host "❌ 添加Gemini密钥失败: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorBody = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorBody)
        $errorContent = $reader.ReadToEnd()
        Write-Host "错误详情: $errorContent" -ForegroundColor Red
    }
}

Write-Host "🎉 完成!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 服务信息:" -ForegroundColor Cyan
Write-Host "服务地址: $serviceUrl" -ForegroundColor White
Write-Host "管理员密钥: $adminKey" -ForegroundColor White
Write-Host ""

Read-Host "按任意键退出" 