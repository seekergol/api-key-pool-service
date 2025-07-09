# 测试修复后的Gemini API调用
$serviceUrl = "https://seekergol-api-key-poo-92.deno.dev"

Write-Host "🧪 测试修复后的Gemini API调用" -ForegroundColor Green
Write-Host ""

# 测试1: 使用正确的Gemini API格式
Write-Host "📝 测试Gemini API调用..." -ForegroundColor Yellow

$testPrompt = @{
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

Write-Host "请求URL: $serviceUrl/api/gemini/models/gemini-2.5-flash:generateContent" -ForegroundColor Gray
Write-Host "请求体: $testPrompt" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$serviceUrl/api/gemini/models/gemini-2.5-flash:generateContent" -Method POST -Headers @{
        "Content-Type" = "application/json"
    } -Body $testPrompt
    
    Write-Host "✅ API调用成功!" -ForegroundColor Green
    Write-Host "响应内容: $($response.candidates[0].content.parts[0].text)" -ForegroundColor Cyan
    Write-Host "完整响应: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
} catch {
    Write-Host "❌ API调用失败: $($_.Exception.Message)" -ForegroundColor Red
    try {
        $errorContent = $_.Exception.Response.Content.ReadAsStringAsync().Result
        Write-Host "错误详情: $errorContent" -ForegroundColor Red
    } catch {
        Write-Host "无法读取错误详情" -ForegroundColor Red
    }
}

Write-Host ""

# 测试2: 使用gemini-pro模型
Write-Host "📝 测试gemini-pro模型..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$serviceUrl/api/gemini/models/gemini-pro:generateContent" -Method POST -Headers @{
        "Content-Type" = "application/json"
    } -Body $testPrompt
    
    Write-Host "✅ gemini-pro模型调用成功!" -ForegroundColor Green
    Write-Host "响应内容: $($response.candidates[0].content.parts[0].text)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ gemini-pro模型调用失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 测试完成!" -ForegroundColor Green 