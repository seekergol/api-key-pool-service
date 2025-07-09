# 检查API密钥格式
Write-Host "🔍 检查API密钥格式" -ForegroundColor Green
Write-Host ""

$keys = Get-Content "keys.txt"
$index = 1

foreach ($key in $keys) {
    if ([string]::IsNullOrWhiteSpace($key)) {
        continue
    }
    
    $key = $key.Trim()
    Write-Host "密钥 $index :" -ForegroundColor Yellow
    Write-Host "  完整密钥: $key" -ForegroundColor Gray
    Write-Host "  长度: $($key.Length)" -ForegroundColor Gray
    Write-Host "  前缀: $($key.Substring(0, [Math]::Min(10, $key.Length)))" -ForegroundColor Gray
    
    # 分析密钥特征
    if ($key.StartsWith("AIzaSy")) {
        Write-Host "  ✅ 格式: 标准Google API密钥" -ForegroundColor Green
    } elseif ($key.StartsWith("GOCSPX-")) {
        Write-Host "  ⚠️  格式: Google OAuth客户端密钥" -ForegroundColor Yellow
        Write-Host "  💡 提示: 这可能是OAuth客户端密钥，不是API密钥" -ForegroundColor Cyan
    } else {
        Write-Host "  ❓ 格式: 未知格式" -ForegroundColor Red
    }
    
    Write-Host ""
    $index++
}

Write-Host "💡 建议:" -ForegroundColor Cyan
Write-Host "1. 访问 https://aistudio.google.com/ 获取正确的Gemini API密钥" -ForegroundColor Gray
Write-Host "2. API密钥通常以 'AIzaSy' 开头" -ForegroundColor Gray
Write-Host "3. 当前密钥可能是OAuth客户端密钥，不能用于API调用" -ForegroundColor Gray 