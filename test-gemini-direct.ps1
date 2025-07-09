# 直接测试Gemini API
Write-Host "🔍 直接测试Gemini API" -ForegroundColor Green
Write-Host ""

# 读取第一个密钥进行测试
$keys = Get-Content "keys.txt"
$testKey = $keys[0].Trim()

Write-Host "🔑 使用密钥: $($testKey.Substring(0, 10))..." -ForegroundColor Yellow
Write-Host ""

# 测试1: 获取模型列表
Write-Host "📋 测试1: 获取模型列表" -ForegroundColor Cyan
try {
    $modelsResponse = Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1beta/models" -Headers @{
        "x-goog-api-key" = $testKey
    } -Method GET
    
    Write-Host "✅ 模型列表获取成功!" -ForegroundColor Green
    Write-Host "可用模型数量: $($modelsResponse.models.Count)" -ForegroundColor Cyan
    foreach ($model in $modelsResponse.models) {
        Write-Host "  - $($model.name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ 模型列表获取失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 测试2: 调用gemini-pro模型
Write-Host "📝 测试2: 调用gemini-pro模型" -ForegroundColor Cyan
$testPrompt = @{
    contents = @(
        @{
            parts = @(
                @{
                    text = "Hello, how are you?"
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent" -Method POST -Headers @{
        "Content-Type" = "application/json"
        "x-goog-api-key" = $testKey
    } -Body $testPrompt
    
    Write-Host "✅ gemini-pro调用成功!" -ForegroundColor Green
    Write-Host "响应: $($response.candidates[0].content.parts[0].text)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ gemini-pro调用失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 测试3: 调用gemini-2.5-flash模型
Write-Host "📝 测试3: 调用gemini-2.5-flash模型" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" -Method POST -Headers @{
        "Content-Type" = "application/json"
        "x-goog-api-key" = $testKey
    } -Body $testPrompt
    
    Write-Host "✅ gemini-2.5-flash调用成功!" -ForegroundColor Green
    Write-Host "响应: $($response.candidates[0].content.parts[0].text)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ gemini-2.5-flash调用失败: $($_.Exception.Message)" -ForegroundColor Red
} 