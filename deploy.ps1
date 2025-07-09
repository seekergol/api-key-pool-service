# GitHub Pages 自动部署脚本 (PowerShell版本)
# 用于在Windows上快速部署API Key Pool Service

Write-Host "🚀 开始部署 API Key Pool Service 到 GitHub Pages..." -ForegroundColor Green

# 检查Git是否安装
try {
    $gitVersion = git --version
    Write-Host "✅ Git已安装: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git 未安装，请先安装 Git" -ForegroundColor Red
    Write-Host "下载地址: https://git-scm.com/download/win" -ForegroundColor Yellow
    Read-Host "按任意键退出"
    exit 1
}

# 检查是否在Git仓库中
if (-not (Test-Path ".git")) {
    Write-Host "📁 初始化 Git 仓库..." -ForegroundColor Yellow
    git init
}

# 检查是否有远程仓库
try {
    $remoteUrl = git remote get-url origin 2>$null
    if ($remoteUrl) {
        Write-Host "✅ 远程仓库已配置: $remoteUrl" -ForegroundColor Green
    } else {
        throw "No remote configured"
    }
} catch {
    Write-Host "🔗 需要配置远程仓库" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 检测到你已创建GitHub仓库：" -ForegroundColor Cyan
    Write-Host "https://github.com/seekergol/api-key-pool-service.git" -ForegroundColor Green
    Write-Host ""
    $githubUsername = "seekergol"
    Write-Host "正在添加远程仓库..." -ForegroundColor Yellow
    git remote add origin "https://github.com/$githubUsername/api-key-pool-service.git"
    Write-Host "✅ 远程仓库已添加" -ForegroundColor Green
}

# 检查必要文件是否存在
$requiredFiles = @("index.html", "api.js", "sw.js", "README.md")
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ 缺少必要文件: $file" -ForegroundColor Red
        Read-Host "按任意键退出"
        exit 1
    }
}
Write-Host "✅ 所有必要文件已存在" -ForegroundColor Green

# 配置管理员密钥
Write-Host "🔑 配置管理员密钥..." -ForegroundColor Yellow
$adminKey = Read-Host "请输入管理员密钥 (默认: admin-key-123)"
if ([string]::IsNullOrEmpty($adminKey)) {
    $adminKey = "admin-key-123"
}

# 更新api.js中的管理员密钥
Write-Host "正在更新管理员密钥..." -ForegroundColor Yellow
$apiJsContent = Get-Content "api.js" -Raw
$apiJsContent = $apiJsContent -replace "const adminKey = 'your-admin-key';", "const adminKey = '$adminKey';"
Set-Content "api.js" $apiJsContent -Encoding UTF8

Write-Host "✅ 管理员密钥已更新" -ForegroundColor Green

# 添加所有文件
Write-Host "📦 添加文件到 Git..." -ForegroundColor Yellow
git add .

# 提交更改
Write-Host "💾 提交更改..." -ForegroundColor Yellow
git commit -m "Deploy API Key Pool Service to GitHub Pages"

# 推送到远程仓库
Write-Host "🚀 推送到 GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "✅ 部署完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 接下来的步骤：" -ForegroundColor Cyan
Write-Host "1. 进入你的 GitHub 仓库设置" -ForegroundColor White
Write-Host "2. 找到 'Pages' 选项" -ForegroundColor White
Write-Host "3. 在 'Source' 部分选择 'Deploy from a branch'" -ForegroundColor White
Write-Host "4. 选择 'main' 分支" -ForegroundColor White
Write-Host "5. 点击 'Save'" -ForegroundColor White
Write-Host ""

# 获取服务地址
try {
    $remoteUrl = git remote get-url origin
    $username = ($remoteUrl -split "/")[-2]
    $serviceUrl = "https://$username.github.io/api-key-pool-service"
    
    Write-Host "🌐 部署完成后，你的服务地址将是：" -ForegroundColor Cyan
    Write-Host $serviceUrl -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 测试部署：" -ForegroundColor Cyan
    Write-Host "curl $serviceUrl/health" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 快速测试命令：" -ForegroundColor Cyan
    Write-Host "Invoke-RestMethod -Uri '$serviceUrl/health'" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "⚠️ 无法获取服务地址，请手动检查" -ForegroundColor Yellow
}

Write-Host "📖 更多信息请查看 DEPLOYMENT.md 文件" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 恭喜！你的API Key Pool Service已成功部署！" -ForegroundColor Green
Write-Host ""
Read-Host "按任意键退出" 