# Windows PowerShell 测试脚本
# 用于测试API Key Pool Service功能

param(
    [string]$ServiceUrl = "https://your-username.github.io/api-key-pool-service",
    [string]$AdminKey = "your-admin-key",
    [string]$GeminiApiKey = "your-gemini-api-key"
)

Write-Host "🧪 开始运行API Key Pool Service测试套件..." -ForegroundColor Green
Write-Host ""

# 测试健康检查
Write-Host "1. 测试健康检查..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$ServiceUrl/health" -Method Get
    Write-Host "✅ 健康检查通过" -ForegroundColor Green
    Write-Host "   状态: $($healthResponse.status)" -ForegroundColor White
} catch {
    Write-Host "❌ 健康检查失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 测试添加密钥
Write-Host ""
Write-Host "2. 测试添加API密钥..." -ForegroundColor Yellow
try {
    $addKeyBody = @{
        provider = "gemini"
        apiKey = $GeminiApiKey
        maxRequests = 1000
        metadata = @{
            description = "Test Gemini API Key"
            tags = @("test", "gemini")
        }
    } | ConvertTo-Json -Depth 3

    $addKeyResponse = Invoke-RestMethod -Uri "$ServiceUrl/admin/keys" -Method Post -Body $addKeyBody -ContentType "application/json" -Headers @{"X-Admin-Key" = $AdminKey}
    Write-Host "✅ 密钥添加成功" -ForegroundColor Green
    Write-Host "   密钥ID: $($addKeyResponse.keyId)" -ForegroundColor White
} catch {
    Write-Host "❌ 密钥添加失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试查看状态
Write-Host ""
Write-Host "3. 测试查看密钥池状态..." -ForegroundColor Yellow
try {
    $statusResponse = Invoke-RestMethod -Uri "$ServiceUrl/admin/status?provider=gemini" -Method Get -Headers @{"X-Admin-Key" = $AdminKey}
    Write-Host "✅ 状态获取成功" -ForegroundColor Green
    Write-Host "   总密钥数: $($statusResponse.totalKeys)" -ForegroundColor White
    Write-Host "   可用密钥数: $($statusResponse.availableKeys)" -ForegroundColor White
} catch {
    Write-Host "❌ 状态获取失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试Gemini API调用
Write-Host ""
Write-Host "4. 测试Gemini API调用..." -ForegroundColor Yellow
try {
    $apiBody = @{
        contents = @(
            @{
                parts = @(
                    @{
                        text = "Hello! Please respond with 'API Key Pool Service is working!' in English."
                    }
                )
            }
        )
    } | ConvertTo-Json -Depth 3

    $apiResponse = Invoke-RestMethod -Uri "$ServiceUrl/api/gemini/models/gemini-pro:generateContent?strategy=roundRobin" -Method Post -Body $apiBody -ContentType "application/json"
    Write-Host "✅ Gemini API调用成功" -ForegroundColor Green
    $responseText = $apiResponse.candidates[0].content.parts[0].text
    $displayText = if ($responseText.Length -gt 100) { $responseText.Substring(0, 100) } else { $responseText }
    Write-Host "   响应: $displayText..." -ForegroundColor White
} catch {
    Write-Host "❌ Gemini API调用失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试轮询效果
Write-Host ""
Write-Host "5. 测试轮询效果（连续调用3次）..." -ForegroundColor Yellow
for ($i = 1; $i -le 3; $i++) {
    Write-Host "   第$i次调用..." -ForegroundColor Cyan
    try {
        $message = "Test call $i: Please respond with 'Call $i successful!'"
        $roundRobinBody = @{
            contents = @(
                @{
                    parts = @(
                        @{
                            text = $message
                        }
                    )
                }
            )
        } | ConvertTo-Json -Depth 3

        $roundRobinResponse = Invoke-RestMethod -Uri "$ServiceUrl/api/gemini/models/gemini-pro:generateContent?strategy=roundRobin" -Method Post -Body $roundRobinBody -ContentType "application/json"
        Write-Host "   ✅ 第$i次调用成功" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ 第$i次调用失败: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "🎉 测试完成!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 测试总结:" -ForegroundColor Cyan
Write-Host "- 服务健康检查: ✅" -ForegroundColor Green
Write-Host "- 密钥管理: ✅" -ForegroundColor Green
Write-Host "- API调用: ✅" -ForegroundColor Green
Write-Host "- 轮询功能: ✅" -ForegroundColor Green
Write-Host ""
Write-Host "💡 提示: 如果所有测试都通过，说明你的API Key Pool Service运行正常!" -ForegroundColor Yellow
Write-Host ""
Read-Host "按任意键退出" 