# 测试Gemini API调用脚本
$serviceUrl = "https://seekergol-api-key-poo-92.deno.dev"

Write-Host "🧪 测试Gemini API调用" -ForegroundColor Green
Write-Host ""

# 测试1: 获取可用模型
Write-Host "📋 测试1: 获取Gemini可用模型" -ForegroundColor Yellow
try {
    $modelsResponse = Invoke-RestMethod -Uri "$serviceUrl/api/gemini/models" -Method GET
    Write-Host "✅ 模型获取成功!" -ForegroundColor Green
    Write-Host "可用模型数量: $($modelsResponse.models.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 模型获取失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 测试2: 调用Gemini生成内容
Write-Host "📝 测试2: 调用Gemini生成内容" -ForegroundColor Yellow
$testPrompt = @{
    contents = @(
        @{
            parts = @(
                @{
                    text = "Hello! Please respond with a simple greeting in Chinese."
                }
            )
        }
    )
} | ConvertTo-Json

try {
    $generateResponse = Invoke-RestMethod -Uri "$serviceUrl/api/gemini/models/gemini-pro:generateContent?strategy=roundRobin" -Method POST -Headers @{
        "Content-Type" = "application/json"
    } -Body $testPrompt
    
    Write-Host "✅ 内容生成成功!" -ForegroundColor Green
    Write-Host "回复内容: $($generateResponse.candidates[0].content.parts[0].text)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 内容生成失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 测试3: 查看密钥池状态
Write-Host "📊 测试3: 查看密钥池使用状态" -ForegroundColor Yellow
try {
    $statusResponse = Invoke-RestMethod -Uri "$serviceUrl/admin/status?provider=gemini" -Method GET -Headers @{
        "X-Admin-Key" = "84861142"
    }
    
    Write-Host "✅ 状态获取成功!" -ForegroundColor Green
    Write-Host "总密钥数: $($statusResponse.totalKeys)" -ForegroundColor White
    Write-Host "活跃密钥数: $($statusResponse.activeKeys)" -ForegroundColor White
    Write-Host "可用密钥数: $($statusResponse.availableKeys)" -ForegroundColor White
    
    Write-Host ""
    Write-Host "🔑 密钥使用详情:" -ForegroundColor Cyan
    foreach ($key in $statusResponse.keys) {
        Write-Host "密钥ID: $($key.id) | 状态: $($key.isActive) | 使用: $($key.usage)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ 状态获取失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 测试完成!" -ForegroundColor Green 