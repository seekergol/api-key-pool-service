// API Key Pool Service - 部署在 Vercel/Deno Deploy 等平台

class APIKeyPool {
    constructor() {
      // 存储 API 密钥池（生产环境建议使用数据库）
      this.keyPools = new Map();
      // 密钥使用统计
      this.keyStats = new Map();
      // 管理员密钥（用于管理密钥池）
      this.adminKey = process.env.ADMIN_KEY || 'your-admin-key';
      // 中转服务地址
      this.proxyBaseUrl = 'https://steamgovernment.deno.dev';
      // 轮询索引（用于轮询选择密钥）
      this.roundRobinIndex = new Map();
    }
  
    // 添加 API 密钥到池中
    addKey(provider, apiKey, maxRequests = 1000, metadata = {}) {
      if (!this.keyPools.has(provider)) {
        this.keyPools.set(provider, []);
        this.roundRobinIndex.set(provider, 0);
      }
      
      const keyInfo = {
        id: this.generateKeyId(),
        key: apiKey,
        maxRequests,
        currentRequests: 0,
        isActive: true,
        createdAt: new Date(),
        metadata,
        lastUsed: null
      };
      
      this.keyPools.get(provider).push(keyInfo);
      return keyInfo.id;
    }
  
    // 获取可用的 API 密钥（轮询方式）
    getAvailableKey(provider, strategy = 'roundRobin') {
      const keys = this.keyPools.get(provider) || [];
      
      // 筛选可用密钥（活跃且未达到限制）
      const availableKeys = keys.filter(key => 
        key.isActive && key.currentRequests < key.maxRequests
      );
      
      if (availableKeys.length === 0) {
        return null;
      }
      
      let selectedKey;
      
      if (strategy === 'roundRobin') {
        // 轮询选择：按顺序选择下一个可用密钥
        selectedKey = this.getNextRoundRobinKey(provider, availableKeys);
      } else if (strategy === 'leastUsed') {
        // 最少使用：选择使用次数最少的密钥
        selectedKey = availableKeys.reduce((min, key) => 
          key.currentRequests < min.currentRequests ? key : min
        );
      } else if (strategy === 'random') {
        // 随机选择
        selectedKey = availableKeys[Math.floor(Math.random() * availableKeys.length)];
      } else {
        // 默认使用轮询
        selectedKey = this.getNextRoundRobinKey(provider, availableKeys);
      }
      
      return selectedKey;
    }
    
    // 轮询选择下一个密钥
    getNextRoundRobinKey(provider, availableKeys) {
      if (availableKeys.length === 0) return null;
      
      let currentIndex = this.roundRobinIndex.get(provider) || 0;
      let attempts = 0;
      const maxAttempts = availableKeys.length;
      
      while (attempts < maxAttempts) {
        const key = availableKeys[currentIndex % availableKeys.length];
        currentIndex = (currentIndex + 1) % availableKeys.length;
        this.roundRobinIndex.set(provider, currentIndex);
        
        if (key.isActive && key.currentRequests < key.maxRequests) {
          return key;
        }
        
        attempts++;
      }
      
      // 如果轮询失败，回退到最少使用策略
      return availableKeys.reduce((min, key) => 
        key.currentRequests < min.currentRequests ? key : min
      );
    }
  
    // 记录密钥使用
    recordKeyUsage(keyId, requestInfo = {}) {
      for (const [provider, keys] of this.keyPools) {
        const key = keys.find(k => k.id === keyId);
        if (key) {
          key.currentRequests++;
          key.lastUsed = new Date();
          
          // 记录统计信息
          if (!this.keyStats.has(keyId)) {
            this.keyStats.set(keyId, {
              totalRequests: 0,
              successRequests: 0,
              errorRequests: 0,
              lastError: null
            });
          }
          
          const stats = this.keyStats.get(keyId);
          stats.totalRequests++;
          
          if (requestInfo.success) {
            stats.successRequests++;
          } else {
            stats.errorRequests++;
            stats.lastError = requestInfo.error || 'Unknown error';
          }
          
          break;
        }
      }
    }
  
    // 重置密钥使用计数（可以定时调用）
    resetKeyUsage(provider = null) {
      if (provider) {
        const keys = this.keyPools.get(provider) || [];
        keys.forEach(key => key.currentRequests = 0);
      } else {
        for (const [_, keys] of this.keyPools) {
          keys.forEach(key => key.currentRequests = 0);
        }
      }
    }
  
    // 生成密钥ID
    generateKeyId() {
      return 'key_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // 更新密钥信息
    updateKey(keyId, updates) {
      for (const [provider, keys] of this.keyPools) {
        const keyIndex = keys.findIndex(k => k.id === keyId);
        if (keyIndex !== -1) {
          const key = keys[keyIndex];
          Object.assign(key, updates);
          return true;
        }
      }
      return false;
    }
    
    // 删除密钥
    deleteKey(keyId) {
      for (const [provider, keys] of this.keyPools) {
        const keyIndex = keys.findIndex(k => k.id === keyId);
        if (keyIndex !== -1) {
          keys.splice(keyIndex, 1);
          return true;
        }
      }
      return false;
    }
  
    // 获取池状态
    getPoolStatus(provider = null) {
      if (provider) {
        const keys = this.keyPools.get(provider) || [];
        return {
          provider,
          totalKeys: keys.length,
          activeKeys: keys.filter(k => k.isActive).length,
          availableKeys: keys.filter(k => k.isActive && k.currentRequests < k.maxRequests).length,
          keys: keys.map(k => ({
            id: k.id,
            isActive: k.isActive,
            usage: `${k.currentRequests}/${k.maxRequests}`,
            lastUsed: k.lastUsed
          }))
        };
      } else {
        const status = {};
        for (const [provider, keys] of this.keyPools) {
          status[provider] = this.getPoolStatus(provider);
        }
        return status;
      }
    }
  }
  
  // 全局密钥池实例
  const keyPool = new APIKeyPool();
  
  // 主要的 API 处理函数
  export default async function handler(req, res) {
    // 设置 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  
    const { method, url } = req;
    const urlParts = new URL(url, `http://${req.headers.host}`);
    const pathname = urlParts.pathname;
  
    try {
      // 管理端点
      if (pathname.startsWith('/admin')) {
        return await handleAdminRequest(req, res);
      }
  
      // API 调用端点
      if (pathname.startsWith('/api/')) {
        return await handleAPIRequest(req, res);
      }
  
      // 健康检查
      if (pathname === '/health') {
        return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
      }
  
      // 默认返回使用说明
      return res.status(200).json({
        message: 'API Key Pool Service',
        endpoints: {
          admin: {
            'POST /admin/keys': 'Add API key',
            'GET /admin/status': 'Get pool status',
            'PUT /admin/keys/:id': 'Update key',
            'DELETE /admin/keys/:id': 'Delete key'
          },
          api: {
            'POST /api/:provider/*': 'Proxy API call with key pool'
          }
        }
      });
  
    } catch (error) {
      console.error('Handler error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // 处理管理请求
  async function handleAdminRequest(req, res) {
    const adminKey = req.headers['x-admin-key'];
    
    if (adminKey !== keyPool.adminKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    const { method, url } = req;
    const urlParts = new URL(url, `http://${req.headers.host}`);
    const pathname = urlParts.pathname;
  
    if (method === 'POST' && pathname === '/admin/keys') {
      // 添加密钥
      const { provider, apiKey, maxRequests, metadata } = req.body;
      
      if (!provider || !apiKey) {
        return res.status(400).json({ error: 'Provider and apiKey are required' });
      }
  
      const keyId = keyPool.addKey(provider, apiKey, maxRequests, metadata);
      
      return res.status(201).json({
        message: 'Key added successfully',
        keyId,
        provider
      });
    }
  
    if (method === 'GET' && pathname === '/admin/status') {
      // 获取池状态
      const provider = urlParts.searchParams.get('provider');
      const status = keyPool.getPoolStatus(provider);
      
      return res.status(200).json(status);
    }
  
    if (method === 'POST' && pathname === '/admin/reset') {
      // 重置使用计数
      const provider = req.body.provider;
      keyPool.resetKeyUsage(provider);
      
      return res.status(200).json({ message: 'Usage reset successfully' });
    }
    
    if (method === 'PUT' && pathname.startsWith('/admin/keys/')) {
      // 更新密钥信息
      const keyId = pathname.split('/').pop();
      const { isActive, maxRequests, metadata } = req.body;
      
      const updated = keyPool.updateKey(keyId, { isActive, maxRequests, metadata });
      if (!updated) {
        return res.status(404).json({ error: 'Key not found' });
      }
      
      return res.status(200).json({ message: 'Key updated successfully' });
    }
    
    if (method === 'DELETE' && pathname.startsWith('/admin/keys/')) {
      // 删除密钥
      const keyId = pathname.split('/').pop();
      
      const deleted = keyPool.deleteKey(keyId);
      if (!deleted) {
        return res.status(404).json({ error: 'Key not found' });
      }
      
      return res.status(200).json({ message: 'Key deleted successfully' });
    }
  
    return res.status(404).json({ error: 'Admin endpoint not found' });
  }
  
  // 处理 API 请求
  async function handleAPIRequest(req, res) {
    const { method, url } = req;
    const urlParts = new URL(url, `http://${req.headers.host}`);
    const pathname = urlParts.pathname;
    
    // 解析路径: /api/:provider/*
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length < 3) {
      return res.status(400).json({ error: 'Invalid API path. Expected: /api/:provider/*' });
    }
  
    const provider = pathSegments[1]; // 'gemini', 'openai', etc.
    const apiPath = pathSegments.slice(2).join('/'); // 剩余的路径
    
    // 获取策略参数（可选）
    const strategy = urlParts.searchParams.get('strategy') || 'roundRobin';
  
    // 获取可用的密钥
    const keyInfo = keyPool.getAvailableKey(provider, strategy);
    if (!keyInfo) {
      return res.status(503).json({ 
        error: 'No available API keys',
        provider,
        strategy,
        suggestion: 'Please add more keys or wait for rate limit reset'
      });
    }
  
    try {
      // 构建目标 URL
      let targetUrl;
      if (provider === 'gemini') {
        targetUrl = `https://generativelanguage.googleapis.com/v1beta/${apiPath}`;
      } else if (provider === 'openai') {
        targetUrl = `https://api.openai.com/v1/${apiPath}`;
      } else {
        return res.status(400).json({ error: `Unsupported provider: ${provider}` });
      }
  
      // 添加 API 密钥到查询参数或请求头
      const headers = { ...req.headers };
      delete headers.host;
      delete headers['x-admin-key'];
  
      if (provider === 'gemini') {
        // Gemini 使用查询参数
        const url = new URL(targetUrl);
        url.searchParams.set('key', keyInfo.key);
        targetUrl = url.toString();
      } else if (provider === 'openai') {
        // OpenAI 使用请求头
        headers['Authorization'] = `Bearer ${keyInfo.key}`;
      }
  
      // 通过中转服务发送请求
      const proxyUrl = `${keyPool.proxyBaseUrl}/${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(proxyUrl, {
        method,
        headers,
        body: method !== 'GET' ? JSON.stringify(req.body) : undefined,
      });
  
      const responseData = await response.json();
      
      // 记录密钥使用
      keyPool.recordKeyUsage(keyInfo.id, {
        success: response.ok,
        error: !response.ok ? responseData.error : null
      });
  
      // 返回响应
      return res.status(response.status).json(responseData);
  
    } catch (error) {
      console.error('API request error:', error);
      
      // 记录错误
      keyPool.recordKeyUsage(keyInfo.id, {
        success: false,
        error: error.message
      });
  
      return res.status(500).json({ 
        error: 'Proxy request failed',
        details: error.message
      });
    }
  }
  
  // 可选：定时重置密钥使用计数
  // setInterval(() => {
  //   keyPool.resetKeyUsage();
  //   console.log('Key usage reset at:', new Date().toISOString());
  // }, 60 * 60 * 1000); // 每小时重置一次