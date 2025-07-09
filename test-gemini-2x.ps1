# 测试 Gemini 2.5/2.0 Flash
# 自动读取keys.txt中第一个有效key
$keys = Get-Content "keys.txt" | Where-Object { $_.Trim().Length -gt 0 }
$apiKey = $keys[0].Trim()
$body = @{
    contents = @(
        @{
            parts = @(
                @{
                    text = "Hello, how are you? Please respond in Chinese."
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

$models = @("gemini-2.5-flash", "gemini-2.0-flash")
foreach ($model in $models) {
    $url = "https://generativelanguage.googleapis.com/v1/models/$model:generateContent"
    Write-Host "\n🧪 直连测试模型: $model" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri $url -Method Post -Headers @{
            "Content-Type" = "application/json"
            "x-goog-api-key" = $apiKey
        } -Body $body
        Write-Host "✅ 直连API调用成功!" -ForegroundColor Green
        Write-Host "回复: $($response.candidates[0].content.parts[0].text)" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ 直连API调用失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 代理服务测试
$serviceUrl = "https://seekergol-api-key-poo-92.deno.dev"
foreach ($model in $models) {
    $url = "$serviceUrl/api/gemini/models/$model:generateContent"
    Write-Host "\n🧪 代理服务测试模型: $model" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri $url -Method Post -Headers @{
            "Content-Type" = "application/json"
        } -Body $body
        Write-Host "✅ 代理API调用成功!" -ForegroundColor Green
        Write-Host "回复: $($response.candidates[0].content.parts[0].text)" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ 代理API调用失败: $($_.Exception.Message)" -ForegroundColor Red
    }
} 