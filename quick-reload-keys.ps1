# 快速重新加载密钥脚本
Write-Host "🔄 快速重新加载密钥到API池" -ForegroundColor Green
Write-Host ""

$serviceUrl = "https://seekergol-api-key-poo-92.deno.dev"
$adminKey = "84861142"

# 检查keys.txt文件是否存在
if (-not (Test-Path "keys.txt")) {
    Write-Host "❌ keys.txt文件不存在，请先创建并添加密钥" -ForegroundColor Red
    exit 1
}

# 读取并添加密钥
$keys = Get-Content "keys.txt"
$successCount = 0

foreach ($apiKey in $keys) {
    if ([string]::IsNullOrWhiteSpace($apiKey)) {
        continue
    }
    
    $body = @{
        provider = "gemini"
        apiKey = $apiKey.Trim()
        maxRequests = 1000
        metadata = @{
            addedBy = "QuickReloadScript"
            addedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        }
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$serviceUrl/admin/keys" -Method POST -Headers @{
            "Content-Type" = "application/json"
            "X-Admin-Key" = $adminKey
        } -Body $body
        Write-Host "✅ 添加成功: $($apiKey.Substring(0, 10))..." -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host "❌ 添加失败: $($apiKey.Substring(0, 10))... - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📊 添加结果: $successCount/$($keys.Count) 个密钥添加成功" -ForegroundColor Cyan

# 显示最终状态
try {
    $statusResponse = Invoke-RestMethod -Uri "$serviceUrl/admin/status?provider=gemini" -Method GET -Headers @{
        "X-Admin-Key" = $adminKey
    }
    Write-Host "📋 当前密钥池状态:" -ForegroundColor Yellow
    Write-Host "总密钥数: $($statusResponse.totalKeys)" -ForegroundColor White
    Write-Host "活跃密钥数: $($statusResponse.activeKeys)" -ForegroundColor White
    Write-Host "可用密钥数: $($statusResponse.availableKeys)" -ForegroundColor White
} catch {
    Write-Host "❌ 无法获取密钥池状态" -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 使用提示:" -ForegroundColor Cyan
Write-Host "如果Deno Deploy重启，请运行此脚本重新加载密钥" -ForegroundColor Gray
Write-Host "API调用地址: $serviceUrl/api/gemini/models/gemini-pro:generateContent" -ForegroundColor Gray 