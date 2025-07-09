# 调试密钥池状态
$serviceUrl = "https://seekergol-api-key-poo-92.deno.dev"
$adminKey = "84861142"

Write-Host "🔍 调试密钥池状态" -ForegroundColor Green
Write-Host ""

# 检查密钥池状态
Write-Host "📊 检查密钥池状态..." -ForegroundColor Yellow
try {
    $statusResponse = Invoke-RestMethod -Uri "$serviceUrl/admin/status?provider=gemini" -Method GET -Headers @{
        "X-Admin-Key" = $adminKey
    }
    
    Write-Host "✅ 状态获取成功!" -ForegroundColor Green
    Write-Host "总密钥数: $($statusResponse.totalKeys)" -ForegroundColor White
    Write-Host "活跃密钥数: $($statusResponse.activeKeys)" -ForegroundColor White
    Write-Host "可用密钥数: $($statusResponse.availableKeys)" -ForegroundColor White
    
    Write-Host ""
    Write-Host "🔑 密钥详情:" -ForegroundColor Cyan
    foreach ($key in $statusResponse.keys) {
        Write-Host "密钥ID: $($key.id) | 活跃: $($key.isActive) | 使用: $($key.usage)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ 状态获取失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🧪 测试API调用逻辑..." -ForegroundColor Yellow

# 测试不同的策略
$strategies = @("roundRobin", "leastUsed", "random")
foreach ($strategy in $strategies) {
    Write-Host "测试策略: $strategy" -ForegroundColor Cyan
    try {
        $testUrl = "$serviceUrl/api/gemini/models/gemini-pro:generateContent?strategy=$strategy"
        Write-Host "请求URL: $testUrl" -ForegroundColor Gray
        
        $testPrompt = @{
            contents = @(
                @{
                    parts = @(
                        @{
                            text = "Hello"
                        }
                    )
                }
            )
        } | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri $testUrl -Method POST -Headers @{
            "Content-Type" = "application/json"
        } -Body $testPrompt
        
        Write-Host "✅ $strategy 策略成功!" -ForegroundColor Green
    } catch {
        Write-Host "❌ $strategy 策略失败: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
} 