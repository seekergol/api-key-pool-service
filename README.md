# API Key Pool Service

一个智能的API密钥池服务，支持多种AI模型API的轮询调用和负载均衡。

## 功能特性

- 🔄 **轮询负载均衡**：支持轮询、最少使用、随机三种密钥选择策略
- 🔑 **多模型支持**：支持Gemini、OpenAI等多种AI模型
- 📊 **使用统计**：实时监控密钥使用情况和成功率
- 🛡️ **安全中转**：通过安全代理服务转发API请求
- ⚡ **自动管理**：支持密钥的添加、删除、更新和重置

## 部署方式

### 🚀 GitHub Pages 部署（推荐）

**优势：**
- ✅ 无调用次数限制
- ✅ 完全免费
- ✅ 全球CDN加速
- ✅ 自动HTTPS

**快速部署：**

**Windows系统：**
```powershell
# 1. 运行PowerShell部署脚本（推荐）
.\deploy.ps1

# 2. 或者运行批处理脚本
.\deploy.bat

# 3. 或者手动部署
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/api-key-pool-service.git
git push -u origin main
```

**Linux/Mac系统：**
```bash
# 1. 运行自动部署脚本
chmod +x deploy.sh
./deploy.sh

# 2. 或者手动部署
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/api-key-pool-service.git
git push -u origin main
```

**启用GitHub Pages：**
1. 进入仓库设置 (Settings)
2. 找到 "Pages" 选项
3. 选择 "Deploy from a branch"
4. 选择 "main" 分支
5. 点击 "Save"

### Vercel部署
1. 将代码推送到GitHub仓库
2. 在Vercel中导入项目
3. 设置环境变量 `ADMIN_KEY`（管理员密钥）
4. 部署完成

### Deno Deploy部署
1. 将代码推送到GitHub仓库
2. 在Deno Deploy中导入项目
3. 设置环境变量
4. 部署完成

## API使用指南

### 1. 添加API密钥

**POST** `/admin/keys`

**Headers:**
```
X-Admin-Key: your-admin-key
Content-Type: application/json
```

**Body:**
```json
{
  "provider": "gemini",
  "apiKey": "your-gemini-api-key",
  "maxRequests": 1000,
  "metadata": {
    "description": "Gemini API Key 1",
    "tags": ["production", "backup"]
  }
}
```

**响应:**
```json
{
  "message": "Key added successfully",
  "keyId": "key_1234567890_abc123",
  "provider": "gemini"
}
```

### 2. 查看密钥池状态

**GET** `/admin/status?provider=gemini`

**Headers:**
```
X-Admin-Key: your-admin-key
```

**响应:**
```json
{
  "provider": "gemini",
  "totalKeys": 3,
  "activeKeys": 2,
  "availableKeys": 1,
  "keys": [
    {
      "id": "key_1234567890_abc123",
      "isActive": true,
      "usage": "150/1000",
      "lastUsed": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 3. 调用AI模型API

#### Gemini API调用

**POST** `/api/gemini/models/gemini-pro:generateContent?strategy=roundRobin`

**Body:**
```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "Hello, how are you?"
        }
      ]
    }
  ]
}
```

**响应:**
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Hello! I'm doing well, thank you for asking. How can I help you today?"
          }
        ]
      }
    }
  ]
}
```

#### OpenAI API调用

**POST** `/api/openai/chat/completions?strategy=leastUsed`

**Body:**
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ]
}
```

### 4. 管理密钥

#### 更新密钥
**PUT** `/admin/keys/key_1234567890_abc123`

**Headers:**
```
X-Admin-Key: your-admin-key
Content-Type: application/json
```

**Body:**
```json
{
  "isActive": false,
  "maxRequests": 2000,
  "metadata": {
    "description": "Updated description"
  }
}
```

#### 删除密钥
**DELETE** `/admin/keys/key_1234567890_abc123`

**Headers:**
```
X-Admin-Key: your-admin-key
```

#### 重置使用计数
**POST** `/admin/reset`

**Headers:**
```
X-Admin-Key: your-admin-key
Content-Type: application/json
```

**Body:**
```json
{
  "provider": "gemini"
}
```

## 密钥选择策略

### 1. 轮询策略 (roundRobin) - 默认
- 按顺序轮流使用可用密钥
- 适合负载均衡场景
- 使用方式：`?strategy=roundRobin`

### 2. 最少使用策略 (leastUsed)
- 选择当前使用次数最少的密钥
- 适合均匀分配负载
- 使用方式：`?strategy=leastUsed`

### 3. 随机策略 (random)
- 随机选择可用密钥
- 适合简单负载分散
- 使用方式：`?strategy=random`

## 支持的模型

### Gemini
- **基础URL**: `https://generativelanguage.googleapis.com/v1beta/`
- **认证方式**: 查询参数 `?key=your-api-key`
- **示例路径**: `/api/gemini/models/gemini-pro:generateContent`

### OpenAI
- **基础URL**: `https://api.openai.com/v1/`
- **认证方式**: 请求头 `Authorization: Bearer your-api-key`
- **示例路径**: `/api/openai/chat/completions`

## 错误处理

### 常见错误码

- `400` - 请求参数错误
- `401` - 管理员密钥无效
- `503` - 无可用密钥
- `500` - 服务器内部错误

### 错误响应示例
```json
{
  "error": "No available API keys",
  "provider": "gemini",
  "strategy": "roundRobin",
  "suggestion": "Please add more keys or wait for rate limit reset"
}
```

## 最佳实践

1. **密钥管理**
   - 定期轮换API密钥
   - 为不同环境使用不同的密钥
   - 监控密钥使用情况

2. **负载均衡**
   - 根据业务需求选择合适的策略
   - 监控密钥池状态
   - 及时添加备用密钥

3. **错误处理**
   - 实现重试机制
   - 监控API调用成功率
   - 设置告警阈值

4. **安全考虑**
   - 使用强密码作为管理员密钥
   - 定期更新管理员密钥
   - 限制API调用频率

## 监控和日志

服务会自动记录以下信息：
- 密钥使用次数
- 请求成功率
- 错误信息
- 最后使用时间

可以通过 `/admin/status` 端点查看详细统计信息。

## 扩展功能

### 添加新的AI模型支持

1. 在 `handleAPIRequest` 函数中添加新的provider判断
2. 配置对应的基础URL和认证方式
3. 测试新模型的API调用

### 自定义负载均衡策略

1. 在 `getAvailableKey` 方法中添加新的策略
2. 实现对应的选择逻辑
3. 更新API文档

## 故障排除

### 问题：无法获取可用密钥
**解决方案：**
1. 检查密钥是否已添加
2. 确认密钥状态为活跃
3. 检查使用次数是否超限
4. 尝试重置使用计数

### 问题：API调用失败
**解决方案：**
1. 检查API密钥是否有效
2. 确认目标API服务正常
3. 查看错误日志
4. 尝试使用其他密钥

### 问题：轮询不均衡
**解决方案：**
1. 检查密钥状态
2. 确认所有密钥都可用
3. 查看轮询索引状态
4. 考虑使用其他策略 