# 详细调试API调用
$serviceUrl = "https://seekergol-api-key-poo-92.deno.dev"

Write-Host "🔍 详细调试API调用" -ForegroundColor Green
Write-Host ""

# 测试1: 检查密钥池状态
Write-Host "📊 检查密钥池状态..." -ForegroundColor Yellow
try {
    $statusResponse = Invoke-RestMethod -Uri "$serviceUrl/admin/status?provider=gemini" -Method GET -Headers @{
        "X-Admin-Key" = "84861142"
    }
    Write-Host "✅ 密钥池状态正常" -ForegroundColor Green
    Write-Host "可用密钥数: $($statusResponse.availableKeys)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 密钥池状态检查失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 测试2: 详细的API调用测试
Write-Host "📝 测试Gemini API调用..." -ForegroundColor Yellow

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

Write-Host "请求URL: $serviceUrl/api/gemini/models/gemini-pro:generateContent" -ForegroundColor Gray
Write-Host "请求体: $testPrompt" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$serviceUrl/api/gemini/models/gemini-pro:generateContent" -Method POST -Headers @{
        "Content-Type" = "application/json"
    } -Body $testPrompt
    
    Write-Host "✅ API调用成功!" -ForegroundColor Green
    Write-Host "响应: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ API调用失败: $($_.Exception.Message)" -ForegroundColor Red
    
    # 尝试获取详细错误信息
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
Write-Host "🔍 测试不同的请求格式..." -ForegroundColor Yellow

# 测试不同的请求格式
$testFormats = @(
    @{
        name = "标准Gemini格式"
        body = @{
            contents = @(
                @{
                    parts = @(
                        @{
                            text = "Hello"
                        }
                    )
                }
            )
        }
    },
    @{
        name = "简化格式"
        body = @{
            prompt = "Hello, how are you?"
        }
    }
)

foreach ($format in $testFormats) {
    Write-Host "测试格式: $($format.name)" -ForegroundColor Cyan
    try {
        $body = $format.body | ConvertTo-Json -Depth 10
        $response = Invoke-RestMethod -Uri "$serviceUrl/api/gemini/models/gemini-pro:generateContent" -Method POST -Headers @{
            "Content-Type" = "application/json"
        } -Body $body
        
        Write-Host "✅ $($format.name) 成功!" -ForegroundColor Green
        Write-Host "响应: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Cyan
        break
    } catch {
        Write-Host "❌ $($format.name) 失败: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
} 