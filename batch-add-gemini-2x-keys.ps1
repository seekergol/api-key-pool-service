# 批量添加Gemini 2.5/2.0 flash密钥脚本
$serviceUrl = "https://seekergol-api-key-poo-92.deno.dev"
$adminKey = "<你的管理员密钥>"
$keys = Get-Content .\keys.txt

foreach ($apiKey in $keys) {
    if ([string]::IsNullOrWhiteSpace($apiKey)) { continue }
    $body = @{
        provider = "gemini"
        apiKey = $apiKey.Trim()
        maxRequests = 1000
        metadata = @{
            addedBy = "BatchScript"
            addedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        }
    } | ConvertTo-Json
    try {
        $addKeyResponse = Invoke-RestMethod -Uri "$serviceUrl/admin/keys" -Method POST -Headers @{
            "Content-Type" = "application/json"
            "X-Admin-Key" = $adminKey
        } -Body $body
        Write-Host "✅ 添加成功: $($apiKey.Substring(0, 10))... | 密钥ID: $($addKeyResponse.keyId)" -ForegroundColor Green
    } catch {
        Write-Host "❌ 添加失败: $($apiKey.Substring(0, 10))... - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 显示密钥池状态
try {
    $status = Invoke-RestMethod -Uri "$serviceUrl/admin/status?provider=gemini" -Method GET -Headers @{
        "X-Admin-Key" = $adminKey
    }
    Write-Host "\n📊 当前Gemini密钥池状态:" -ForegroundColor Yellow
    Write-Host "总密钥数: $($status.totalKeys)" -ForegroundColor White
    Write-Host "活跃密钥数: $($status.activeKeys)" -ForegroundColor White
    Write-Host "可用密钥数: $($status.availableKeys)" -ForegroundColor White
} catch {
    Write-Host "❌ 获取密钥池状态失败: $($_.Exception.Message)" -ForegroundColor Red
} 