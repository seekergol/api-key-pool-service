# GitHub Pages 部署指南

## 🚀 快速部署步骤

### 1. 创建GitHub仓库

1. 在GitHub上创建新仓库，命名为 `api-key-pool-service`
2. 将代码推送到仓库：

```bash
git init
git add .
git commit -m "Initial commit: API Key Pool Service"
git branch -M main
git remote add origin https://github.com/your-username/api-key-pool-service.git
git push -u origin main
```

### 2. 启用GitHub Pages

1. 进入仓库设置 (Settings)
2. 找到 "Pages" 选项
3. 在 "Source" 部分选择 "Deploy from a branch"
4. 选择 "main" 分支
5. 点击 "Save"

### 3. 配置管理员密钥

1. 编辑 `api.js` 文件
2. 修改第6行的管理员密钥：
```javascript
const adminKey = 'your-secure-admin-key'; // 替换为你的安全密钥
```

### 4. 等待部署完成

- GitHub Pages 通常需要几分钟时间部署
- 部署完成后，你的服务地址将是：
  `https://your-username.github.io/api-key-pool-service`

## 📁 文件结构

```
api-key-pool-service/
├── index.html          # 主页面（包含测试界面）
├── api.js             # Service Worker（API服务）
├── sw.js              # Service Worker注册文件
├── README.md          # 项目说明文档
├── test.js            # 完整测试套件
├── quick-test.js      # 快速测试脚本
├── vercel.json        # Vercel配置（可选）
├── package.json       # 项目配置
└── DEPLOYMENT.md      # 部署指南
```

## ⚙️ 配置说明

### 管理员密钥设置

在 `api.js` 文件中修改：
```javascript
const adminKey = 'your-secure-admin-key'; // 替换为你的密钥
```

### 服务地址配置

部署完成后，你的服务地址将是：
```
https://your-username.github.io/api-key-pool-service
```

## 🧪 测试部署

### 1. 健康检查
```bash
curl https://your-username.github.io/api-key-pool-service/health
```

### 2. 添加密钥
```bash
curl -X POST https://your-username.github.io/api-key-pool-service/admin/keys \
  -H "X-Admin-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gemini",
    "apiKey": "your-gemini-api-key",
    "maxRequests": 1000
  }'
```

### 3. 调用API
```bash
curl -X POST https://your-username.github.io/api-key-pool-service/api/gemini/models/gemini-pro:generateContent \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"parts": [{"text": "Hello!"}]}]
  }'
```

## 🌟 GitHub Pages 优势

### ✅ 无限制使用
- **无调用次数限制**：GitHub Pages 完全免费，无API调用限制
- **无带宽限制**：静态文件托管，无带宽限制
- **无存储限制**：适合静态内容托管

### ✅ 全球CDN
- **全球加速**：GitHub Pages 使用全球CDN网络
- **自动HTTPS**：自动提供SSL证书
- **高可用性**：99.9% 可用性保证

### ✅ 简单部署
- **自动部署**：推送代码自动触发部署
- **版本控制**：完整的Git版本控制
- **回滚简单**：可以轻松回滚到任何版本

## 🔧 自定义配置

### 修改Service Worker

如果需要修改API逻辑，编辑 `api.js` 文件：

```javascript
// 修改管理员密钥
const adminKey = 'your-new-admin-key';

// 添加新的API提供商
if (provider === 'your-provider') {
  targetUrl = `https://your-api-endpoint.com/${apiPath}`;
}
```

### 添加新的API端点

在 `api.js` 的 `handleAPIRequest` 函数中添加：

```javascript
// 添加新的端点
if (pathname === '/your-endpoint') {
  return new Response(JSON.stringify({
    message: 'Your custom endpoint'
  }), {
    status: 200,
    headers: corsHeaders
  });
}
```

## 🛠️ 故障排除

### 问题1：Service Worker 未注册
**解决方案：**
1. 检查 `sw.js` 文件是否正确加载
2. 确认浏览器支持Service Worker
3. 查看浏览器控制台错误信息

### 问题2：API调用失败
**解决方案：**
1. 检查管理员密钥是否正确
2. 确认API密钥是否有效
3. 查看网络请求是否被阻止

### 问题3：CORS错误
**解决方案：**
1. 确认Service Worker正确处理CORS
2. 检查请求头设置
3. 确认目标API允许跨域请求

### 问题4：部署后无法访问
**解决方案：**
1. 等待几分钟让GitHub Pages完成部署
2. 检查仓库设置中的Pages配置
3. 确认文件路径正确

## 📊 监控和维护

### 查看部署状态
1. 进入仓库的 "Actions" 标签
2. 查看最新的部署状态
3. 检查是否有部署错误

### 更新服务
1. 修改代码文件
2. 提交并推送到GitHub
3. 等待自动部署完成

### 回滚部署
1. 在仓库历史中找到之前的版本
2. 创建新的分支或标签
3. 重新部署到该版本

## 🔒 安全建议

### 密钥管理
- 使用强密码作为管理员密钥
- 定期更换API密钥
- 不要在代码中硬编码敏感信息

### 访问控制
- 限制API调用频率
- 监控异常使用模式
- 设置使用量告警

### 数据保护
- 定期备份配置信息
- 加密存储敏感数据
- 实施访问日志记录

## 📈 性能优化

### 缓存策略
- 利用浏览器缓存
- 实施Service Worker缓存
- 优化静态资源加载

### 网络优化
- 使用CDN加速
- 压缩响应数据
- 实施请求合并

### 监控指标
- API响应时间
- 错误率统计
- 使用量监控

## 🎯 最佳实践

1. **定期更新**：保持代码和依赖的最新版本
2. **测试验证**：部署前进行充分测试
3. **文档维护**：保持文档的及时更新
4. **监控告警**：设置关键指标监控
5. **备份策略**：定期备份重要配置

## 📞 技术支持

如果遇到问题，可以：
1. 查看浏览器控制台错误信息
2. 检查GitHub Actions部署日志
3. 参考项目文档和示例
4. 提交Issue到GitHub仓库

---

**🎉 恭喜！你的API Key Pool Service已经成功部署到GitHub Pages！**

现在你可以享受无限制的API调用服务，无需担心Vercel的调用次数限制。 