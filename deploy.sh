#!/bin/bash

# GitHub Pages 自动部署脚本
# 用于快速部署 API Key Pool Service

echo "🚀 开始部署 API Key Pool Service 到 GitHub Pages..."

# 检查Git是否安装
if ! command -v git &> /dev/null; then
    echo "❌ Git 未安装，请先安装 Git"
    exit 1
fi

# 检查是否在Git仓库中
if [ ! -d ".git" ]; then
    echo "📁 初始化 Git 仓库..."
    git init
fi

# 检查是否有远程仓库
if ! git remote get-url origin &> /dev/null; then
    echo "🔗 请先添加远程仓库："
    echo "git remote add origin https://github.com/your-username/api-key-pool-service.git"
    echo ""
    read -p "请输入你的GitHub用户名: " github_username
    git remote add origin "https://github.com/$github_username/api-key-pool-service.git"
fi

# 检查必要文件是否存在
required_files=("index.html" "api.js" "sw.js" "README.md")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ 缺少必要文件: $file"
        exit 1
    fi
done

# 配置管理员密钥
echo "🔑 配置管理员密钥..."
read -p "请输入管理员密钥 (默认: admin-key-123): " admin_key
admin_key=${admin_key:-admin-key-123}

# 更新api.js中的管理员密钥
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/const adminKey = 'your-admin-key';/const adminKey = '$admin_key';/" api.js
else
    # Linux
    sed -i "s/const adminKey = 'your-admin-key';/const adminKey = '$admin_key';/" api.js
fi

echo "✅ 管理员密钥已更新"

# 添加所有文件
echo "📦 添加文件到 Git..."
git add .

# 提交更改
echo "💾 提交更改..."
git commit -m "Deploy API Key Pool Service to GitHub Pages"

# 推送到远程仓库
echo "🚀 推送到 GitHub..."
git push origin main

echo ""
echo "✅ 部署完成！"
echo ""
echo "📋 接下来的步骤："
echo "1. 进入你的 GitHub 仓库设置"
echo "2. 找到 'Pages' 选项"
echo "3. 在 'Source' 部分选择 'Deploy from a branch'"
echo "4. 选择 'main' 分支"
echo "5. 点击 'Save'"
echo ""
echo "🌐 部署完成后，你的服务地址将是："
echo "https://$(git remote get-url origin | sed 's/.*github\.com[:/]\([^/]*\)\/.*/\1/').github.io/api-key-pool-service"
echo ""
echo "🧪 测试部署："
echo "curl https://$(git remote get-url origin | sed 's/.*github\.com[:/]\([^/]*\)\/.*/\1/').github.io/api-key-pool-service/health"
echo ""
echo "📖 更多信息请查看 DEPLOYMENT.md 文件" 