# 直接测试API密钥有效性
Write-Host "🔍 直接测试API密钥有效性" -ForegroundColor Green
Write-Host ""

# 读取keys.txt中的密钥
$keys = Get-Content "keys.txt"
$validKeys = @()

foreach ($apiKey in $keys) {
    if ([string]::IsNullOrWhiteSpace($apiKey)) {
        continue
    }
    
    $apiKey = $apiKey.Trim()
    Write-Host "🔑 测试密钥: $($apiKey.Substring(0, 10))..." -ForegroundColor Yellow
    
    try {
        # 直接调用Gemini API
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
        
        $response = Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$apiKey" -Method POST -Headers @{
            "Content-Type" = "application/json"
        } -Body $testPrompt
        
        Write-Host "✅ 密钥有效!" -ForegroundColor Green
        $validKeys += $apiKey
    } catch {
        Write-Host "❌ 密钥无效: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📊 测试结果:" -ForegroundColor Cyan
Write-Host "总密钥数: $($keys.Count)" -ForegroundColor White
Write-Host "有效密钥数: $($validKeys.Count)" -ForegroundColor White

if ($validKeys.Count -gt 0) {
    Write-Host ""
    Write-Host "✅ 有效密钥列表:" -ForegroundColor Green
    foreach ($key in $validKeys) {
        Write-Host "  $($key.Substring(0, 10))..." -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "💡 建议:" -ForegroundColor Cyan
    Write-Host "如果密钥有效但代理服务失败，可能是代理服务的API路径或请求格式问题" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ 所有密钥都无效，请检查密钥是否正确" -ForegroundColor Red
} 