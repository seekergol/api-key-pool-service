# 简化Gemini API测试
$serviceUrl = "https://seekergol-api-key-poo-92.deno.dev"

Write-Host "🧪 简化Gemini API测试" -ForegroundColor Green
Write-Host ""

# 测试1: 简单的文本生成
Write-Host "📝 测试Gemini文本生成" -ForegroundColor Yellow
$simplePrompt = @{
    contents = @(
        @{
            parts = @(
                @{
                    text = "Say hello in Chinese"
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

try {
    Write-Host "发送请求到: $serviceUrl/api/gemini/models/gemini-pro:generateContent" -ForegroundColor Gray
    $response = Invoke-RestMethod -Uri "$serviceUrl/api/gemini/models/gemini-pro:generateContent" -Method POST -Headers @{
        "Content-Type" = "application/json"
    } -Body $simplePrompt
    
    Write-Host "✅ 请求成功!" -ForegroundColor Green
    Write-Host "响应内容: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 请求失败: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        try {
            $errorContent = $_.Exception.Response.Content.ReadAsStringAsync().Result
            Write-Host "错误详情: $errorContent" -ForegroundColor Red
        } catch {
            Write-Host "无法读取错误详情" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "🔍 检查服务健康状态" -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$serviceUrl/health" -Method GET
    Write-Host "✅ 服务健康检查通过: $($healthResponse | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ 健康检查失败: $($_.Exception.Message)" -ForegroundColor Red
} 