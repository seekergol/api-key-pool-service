// Deno Deploy 兼容API Key Pool Service
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

// API Key Pool 类
class APIKeyPool {
  constructor() {
    this.keyPools = new Map();
    this.keyStats = new Map();
    this.adminKey = Deno.env.get("ADMIN_KEY") || "your-admin-key";
    this.proxyBaseUrl = "https://steamgovernment.deno.dev";
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

const keyPool = new APIKeyPool();

serve(async (req) => {
  const { method, url } = req;
  const urlObj = new URL(url);

  // CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Key",
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const pathname = urlObj.pathname;

    // 管理端点
    if (pathname.startsWith("/admin")) {
      return await handleAdminRequest(req, urlObj, corsHeaders);
    }

    // API 调用端点
    if (pathname.startsWith("/api/")) {
      return await handleAPIRequest(req, urlObj, corsHeaders);
    }

    // 健康检查
    if (pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 默认返回使用说明
    return new Response(JSON.stringify({
      message: "API Key Pool Service",
      endpoints: {
        admin: {
          "POST /admin/keys": "Add API key",
          "GET /admin/status": "Get pool status",
          "PUT /admin/keys/:id": "Update key",
          "DELETE /admin/keys/:id": "Delete key"
        },
        api: {
          "POST /api/:provider/*": "Proxy API call with key pool"
        }
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Handler error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleAdminRequest(req, urlObj, corsHeaders) {
  const adminKey = req.headers.get("x-admin-key");
  if (adminKey !== keyPool.adminKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const method = req.method;
  const pathname = urlObj.pathname;

  if (method === "POST" && pathname === "/admin/keys") {
    const { provider, apiKey, maxRequests, metadata } = await req.json();
    if (!provider || !apiKey) {
      return new Response(JSON.stringify({ error: "Provider and apiKey are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const keyId = keyPool.addKey(provider, apiKey, maxRequests, metadata);
    return new Response(JSON.stringify({
      message: "Key added successfully",
      keyId,
      provider
    }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (method === "GET" && pathname === "/admin/status") {
    const provider = urlObj.searchParams.get("provider");
    const status = keyPool.getPoolStatus(provider);
    return new Response(JSON.stringify(status), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (method === "POST" && pathname === "/admin/reset") {
    const { provider } = await req.json();
    keyPool.resetKeyUsage(provider);
    return new Response(JSON.stringify({ message: "Usage reset successfully" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (method === "PUT" && pathname.startsWith("/admin/keys/")) {
    const keyId = pathname.split("/").pop();
    const { isActive, maxRequests, metadata } = await req.json();
    const updated = keyPool.updateKey(keyId, { isActive, maxRequests, metadata });
    if (!updated) {
      return new Response(JSON.stringify({ error: "Key not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ message: "Key updated successfully" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (method === "DELETE" && pathname.startsWith("/admin/keys/")) {
    const keyId = pathname.split("/").pop();
    const deleted = keyPool.deleteKey(keyId);
    if (!deleted) {
      return new Response(JSON.stringify({ error: "Key not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ message: "Key deleted successfully" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Admin endpoint not found" }), {
    status: 404,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleAPIRequest(req, urlObj, corsHeaders) {
  const method = req.method;
  const pathname = urlObj.pathname;
  const pathSegments = pathname.split("/").filter(Boolean);
  if (pathSegments.length < 3) {
    return new Response(JSON.stringify({ error: "Invalid API path. Expected: /api/:provider/*" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const provider = pathSegments[1];
  const apiPath = pathSegments.slice(2).join("/");
  const strategy = urlObj.searchParams.get("strategy") || "roundRobin";
  const keyInfo = keyPool.getAvailableKey(provider, strategy);
  if (!keyInfo) {
    return new Response(JSON.stringify({
      error: "No available API keys",
      provider,
      strategy,
      suggestion: "Please add more keys or wait for rate limit reset"
    }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    let targetUrl;
    if (provider === "gemini") {
      targetUrl = `https://generativelanguage.googleapis.com/v1beta/${apiPath}`;
    } else if (provider === "openai") {
      targetUrl = `https://api.openai.com/v1/${apiPath}`;
    } else {
      return new Response(JSON.stringify({ error: `Unsupported provider: ${provider}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 添加API密钥到查询参数或请求头
    const headers = {};
    for (const [k, v] of req.headers.entries()) {
      if (k !== "host" && k !== "x-admin-key") headers[k] = v;
    }

    let fetchUrl = targetUrl;
    if (provider === "gemini") {
      // 只允许2.5/2.0 flash模型，路径拼接与官方一致
      fetchUrl = `https://generativelanguage.googleapis.com/v1/models/${apiPath}`;
      headers["x-goog-api-key"] = keyInfo.key;
    } else if (provider === "openai") {
      headers["Authorization"] = `Bearer ${keyInfo.key}`;
    }

    // 代理请求
    const fetchInit = {
      method,
      headers,
    };
    if (method !== "GET") {
      fetchInit.body = await req.text();
    }
    const response = await fetch(fetchUrl, fetchInit);
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    keyPool.recordKeyUsage(keyInfo.id, {
      success: response.ok,
      error: !response.ok ? responseData.error : null
    });

    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("API request error:", error);
    keyPool.recordKeyUsage(keyInfo.id, {
      success: false,
      error: error.message
    });
    return new Response(JSON.stringify({
      error: "Proxy request failed",
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}