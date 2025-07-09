# 测试有效的API密钥
Write-Host "🔍 测试有效的API密钥" -ForegroundColor Green
Write-Host ""

# 过滤出有效的API密钥
$keys = Get-Content "keys.txt"
$validKeys = @()

foreach ($key in $keys) {
    if ([string]::IsNullOrWhiteSpace($key)) {
        continue
    }
    
    $key = $key.Trim()
    if ($key.StartsWith("AIzaSy")) {
        $validKeys += $key
        Write-Host "✅ 找到有效API密钥: $($key.Substring(0, 10))..." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📊 有效密钥统计:" -ForegroundColor Cyan
Write-Host "总密钥数: $($keys.Count)" -ForegroundColor White
Write-Host "有效API密钥数: $($validKeys.Count)" -ForegroundColor White

if ($validKeys.Count -eq 0) {
    Write-Host "❌ 没有找到有效的API密钥" -ForegroundColor Red
    Write-Host "请访问 https://aistudio.google.com/ 获取正确的Gemini API密钥" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 测试第一个有效密钥
$testKey = $validKeys[0]
Write-Host "🔑 测试密钥: $($testKey.Substring(0, 10))..." -ForegroundColor Yellow

# 测试直接API调用
Write-Host "📝 测试直接API调用..." -ForegroundColor Cyan
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

try {
    $response = Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent" -Method POST -Headers @{
        "Content-Type" = "application/json"
        "x-goog-api-key" = $testKey
    } -Body $testPrompt
    
    Write-Host "✅ 直接API调用成功!" -ForegroundColor Green
    Write-Host "响应: $($response.candidates[0].content.parts[0].text)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 直接API调用失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 测试通过代理服务调用
Write-Host "📝 测试代理服务调用..." -ForegroundColor Cyan
$serviceUrl = "https://seekergol-api-key-poo-92.deno.dev"

try {
    $response = Invoke-RestMethod -Uri "$serviceUrl/api/gemini/models/gemini-pro:generateContent" -Method POST -Headers @{
        "Content-Type" = "application/json"
    } -Body $testPrompt
    
    Write-Host "✅ 代理服务调用成功!" -ForegroundColor Green
    Write-Host "响应: $($response.candidates[0].content.parts[0].text)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 代理服务调用失败: $($_.Exception.Message)" -ForegroundColor Red
} 