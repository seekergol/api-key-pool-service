# 使用正确的Gemini API格式测试
$serviceUrl = "https://seekergol-api-key-poo-92.deno.dev"

Write-Host "🧪 测试正确的Gemini API格式" -ForegroundColor Green
Write-Host ""

# 测试1: 获取模型列表
Write-Host "📋 测试1: 获取Gemini模型列表" -ForegroundColor Yellow
try {
    $modelsResponse = Invoke-RestMethod -Uri "$serviceUrl/api/gemini/models" -Method GET
    Write-Host "✅ 模型列表获取成功!" -ForegroundColor Green
    Write-Host "响应: $($modelsResponse | ConvertTo-Json -Depth 2)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 模型列表获取失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 测试2: 使用正确的Gemini API格式
Write-Host "📝 测试2: 使用正确的Gemini API格式" -ForegroundColor Yellow
$correctPrompt = @{
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
    Write-Host "发送请求到: $serviceUrl/api/gemini/models/gemini-pro:generateContent" -ForegroundColor Gray
    $response = Invoke-RestMethod -Uri "$serviceUrl/api/gemini/models/gemini-pro:generateContent" -Method POST -Headers @{
        "Content-Type" = "application/json"
    } -Body $correctPrompt
    
    Write-Host "✅ API调用成功!" -ForegroundColor Green
    Write-Host "响应: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
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
Write-Host "🔍 检查密钥池状态" -ForegroundColor Yellow
try {
    $statusResponse = Invoke-RestMethod -Uri "$serviceUrl/admin/status?provider=gemini" -Method GET -Headers @{
        "X-Admin-Key" = "84861142"
    }
    Write-Host "✅ 密钥池状态正常!" -ForegroundColor Green
    Write-Host "可用密钥数: $($statusResponse.availableKeys)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 密钥池状态检查失败: $($_.Exception.Message)" -ForegroundColor Red
} 