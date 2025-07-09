# 测试不同的Gemini API路径
$serviceUrl = "https://seekergol-api-key-poo-92.deno.dev"

Write-Host "🧪 测试不同的Gemini API路径" -ForegroundColor Green
Write-Host ""

# 测试不同的API路径
$testPaths = @(
    "/api/gemini/models",
    "/api/gemini/models/gemini-pro:generateContent",
    "/api/gemini/models/gemini-pro/generateContent",
    "/api/gemini/generateContent",
    "/api/gemini/chat/completions"
)

foreach ($path in $testPaths) {
    Write-Host "🔍 测试路径: $path" -ForegroundColor Yellow
    
    try {
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
        
        $response = Invoke-RestMethod -Uri "$serviceUrl$path" -Method POST -Headers @{
            "Content-Type" = "application/json"
        } -Body $testPrompt
        
        Write-Host "✅ 成功! 状态码: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "响应: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Cyan
        break
    } catch {
        Write-Host "❌ 失败: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host ""
Write-Host "🔍 检查服务根路径" -ForegroundColor Yellow
try {
    $rootResponse = Invoke-RestMethod -Uri $serviceUrl -Method GET
    Write-Host "✅ 服务根路径正常: $($rootResponse | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ 服务根路径失败: $($_.Exception.Message)" -ForegroundColor Red
} 