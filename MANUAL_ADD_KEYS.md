# 🔑 手动添加API密钥指南

## 前提条件

确保GitHub Pages已启用：
1. 访问：https://github.com/seekergol/api-key-pool-service/settings/pages
2. 选择 "Deploy from a branch"
3. 选择 "master" 分支
4. 点击 "Save"
5. 等待2-5分钟部署完成

## 方法1：使用PowerShell脚本

```powershell
# 运行添加密钥脚本
.\add-keys.ps1
```

## 方法2：使用curl命令

### 添加Gemini密钥
```bash
curl -X POST https://seekergol.github.io/api-key-pool-service/admin/keys \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: 84861142" \
  -d '{
    "provider": "gemini",
    "apiKey": "YOUR_GEMINI_API_KEY",
    "maxRequests": 1000
  }'
```

### 添加OpenAI密钥
```bash
curl -X POST https://seekergol.github.io/api-key-pool-service/admin/keys \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: 84861142" \
  -d '{
    "provider": "openai",
    "apiKey": "YOUR_OPENAI_API_KEY",
    "maxRequests": 1000
  }'
```

## 方法3：使用PowerShell命令

### 添加Gemini密钥
```powershell
$body = @{
    provider = "gemini"
    apiKey = "YOUR_GEMINI_API_KEY"
    maxRequests = 1000
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://seekergol.github.io/api-key-pool-service/admin/keys" `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json"
    "X-Admin-Key" = "84861142"
  } `
  -Body $body
```

### 添加OpenAI密钥
```powershell
$body = @{
    provider = "openai"
    apiKey = "YOUR_OPENAI_API_KEY"
    maxRequests = 1000
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://seekergol.github.io/api-key-pool-service/admin/keys" `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json"
    "X-Admin-Key" = "84861142"
  } `
  -Body $body
```

## 验证密钥添加

### 查看密钥池状态
```powershell
Invoke-RestMethod -Uri "https://seekergol.github.io/api-key-pool-service/admin/status" `
  -Method GET `
  -Headers @{ "X-Admin-Key" = "84861142" }
```

### 测试Gemini密钥
```powershell
Invoke-RestMethod -Uri "https://seekergol.github.io/api-key-pool-service/api/gemini/models" -Method GET
```

### 测试OpenAI密钥
```powershell
Invoke-RestMethod -Uri "https://seekergol.github.io/api-key-pool-service/api/openai/models" -Method GET
```

## 使用密钥

### 调用Gemini API
```powershell
$body = @{
    contents = @(
        @{
            parts = @(
                @{ text = "Hello, how are you?" }
            )
        }
    )
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://seekergol.github.io/api-key-pool-service/api/gemini/models/gemini-pro:generateContent" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body $body
```

### 调用OpenAI API
```powershell
$body = @{
    model = "gpt-3.5-turbo"
    messages = @(
        @{ role = "user"; content = "Hello, how are you?" }
    )
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://seekergol.github.io/api-key-pool-service/api/openai/chat/completions" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body $body
```

## 重要信息

- **服务地址**: https://seekergol.github.io/api-key-pool-service
- **管理员密钥**: 84861142
- **支持的策略**: roundRobin, leastUsed, random
- **默认策略**: roundRobin

## 故障排除

1. **404错误**: 确保GitHub Pages已启用
2. **401错误**: 检查管理员密钥是否正确
3. **503错误**: 检查API密钥是否有效
4. **网络错误**: 检查网络连接 