@echo off
chcp 65001 >nul
echo 🚀 开始部署 API Key Pool Service 到 GitHub Pages...

REM 检查Git是否安装
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git 未安装，请先安装 Git
    echo 下载地址: https://git-scm.com/download/win
    pause
    exit /b 1
)

REM 检查是否在Git仓库中
if not exist ".git" (
    echo 📁 初始化 Git 仓库...
    git init
)

REM 检查是否有远程仓库
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo 🔗 需要配置远程仓库
    echo.
    echo 📋 请先在GitHub上创建仓库：
    echo 1. 访问 https://github.com/new
    echo 2. 仓库名称: api-key-pool-service
    echo 3. 选择 Public 或 Private
    echo 4. 点击 Create repository
    echo.
    set /p github_username=请输入你的GitHub用户名: 
    set /p confirm_create=是否已创建GitHub仓库？(y/n): 
    if /i "%confirm_create%"=="y" (
        git remote add origin https://github.com/%github_username%/api-key-pool-service.git
        echo ✅ 远程仓库已添加
    ) else (
        echo ❌ 请先创建GitHub仓库，然后重新运行脚本
        pause
        exit /b 1
    )
)

REM 检查必要文件是否存在
if not exist "index.html" (
    echo ❌ 缺少必要文件: index.html
    pause
    exit /b 1
)
if not exist "api.js" (
    echo ❌ 缺少必要文件: api.js
    pause
    exit /b 1
)
if not exist "sw.js" (
    echo ❌ 缺少必要文件: sw.js
    pause
    exit /b 1
)
if not exist "README.md" (
    echo ❌ 缺少必要文件: README.md
    pause
    exit /b 1
)

REM 配置管理员密钥
echo 🔑 配置管理员密钥...
set /p admin_key=请输入管理员密钥 (默认: admin-key-123): 
if "%admin_key%"=="" set admin_key=admin-key-123

REM 更新api.js中的管理员密钥
echo 正在更新管理员密钥...
powershell -Command "(Get-Content api.js) -replace 'const adminKey = ''your-admin-key'';', 'const adminKey = ''%admin_key%'';' | Set-Content api.js"

echo ✅ 管理员密钥已更新

REM 添加所有文件
echo 📦 添加文件到 Git...
git add .

REM 提交更改
echo 💾 提交更改...
git commit -m "Deploy API Key Pool Service to GitHub Pages"

REM 推送到远程仓库
echo 🚀 推送到 GitHub...
git push origin main

echo.
echo ✅ 部署完成！
echo.
echo 📋 接下来的步骤：
echo 1. 进入你的 GitHub 仓库设置
echo 2. 找到 'Pages' 选项
echo 3. 在 'Source' 部分选择 'Deploy from a branch'
echo 4. 选择 'main' 分支
echo 5. 点击 'Save'
echo.
echo 🌐 部署完成后，你的服务地址将是：
for /f "tokens=*" %%i in ('git remote get-url origin') do set remote_url=%%i
for /f "tokens=2 delims=/" %%i in ("%remote_url%") do set username=%%i
echo https://%username%.github.io/api-key-pool-service
echo.
echo 🧪 测试部署：
echo curl https://%username%.github.io/api-key-pool-service/health
echo.
echo 📖 更多信息请查看 DEPLOYMENT.md 文件
echo.
pause 