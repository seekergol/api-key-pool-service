# API密钥添加脚本
$serviceUrl = "https://seekergol.github.io/api-key-pool-service"
$adminKey = "84861142"

Write-Host "🔑 API密钥添加工具" -ForegroundColor Green

# 检查服务状态
try {
    $healthResponse = Invoke-RestMethod -Uri "$serviceUrl/health" -Method GET
    Write-Host "✅ 服务正常运行" -ForegroundColor Green
} catch {
    Write-Host "❌ 服务暂时不可用" -ForegroundColor Red
    Write-Host "请确保GitHub Pages已启用" -ForegroundColor Yellow
    Read-Host "按任意键退出"
    exit 1
}

# 选择提供商
Write-Host "选择API提供商: 1.Gemini 2.OpenAI 3.自定义"
$providerChoice = Read-Host "请输入选择 (1-3)"
$provider = switch ($providerChoice) {
    "1" { "gemini" }
    "2" { "openai" }
    "3" { Read-Host "请输入提供商名称" }
    default { "gemini" }
}

# 输入API密钥
$apiKey = Read-Host "请输入API密钥"
$maxRequests = Read-Host "最大请求数 (默认: 1000)"
if ([string]::IsNullOrEmpty($maxRequests)) { $maxRequests = 1000 }

# 添加密钥
try {
    $addKeyResponse = Invoke-RestMethod -Uri "$serviceUrl/admin/keys" -Method POST -Headers @{
        "Content-Type" = "application/json"
        "X-Admin-Key" = $adminKey
    } -Body (ConvertTo-Json @{
        provider = $provider
        apiKey = $apiKey
        maxRequests = [int]$maxRequests
    })

    Write-Host "✅ 密钥添加成功! ID: $($addKeyResponse.keyId)" -ForegroundColor Green
    
    # 测试密钥
    $testResponse = Invoke-RestMethod -Uri "$serviceUrl/api/$provider/models" -Method GET
    Write-Host "✅ 密钥测试成功!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ 添加失败: $($_.Exception.Message)" -ForegroundColor Red
}

Read-Host "按任意键退出" 