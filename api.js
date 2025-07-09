// GitHub Pages API Service Worker
// 用于在GitHub Pages上提供API服务

// 全局变量存储密钥池
let keyPools = new Map();
let keyStats = new Map();
let roundRobinIndex = new Map();
const adminKey = '84861142'; // 请修改为你的管理员密钥

// 中转服务配置
const proxyConfig = {
  enabled: true, // 是否启用中转服务
  baseUrl: 'https://steamgovernment.deno.dev', // 中转服务地址
  fallbackToDirect: true // 中转失败时是否回退到直接调用
};

// 工具函数
function generateKeyId() {
  return 'key_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function addKey(provider, apiKey, maxRequests = 1000, metadata = {}) {
  if (!keyPools.has(provider)) {
    keyPools.set(provider, []);
    roundRobinIndex.set(provider, 0);
  }
  
  const keyInfo = {
    id: generateKeyId(),
    key: apiKey,
    maxRequests,
    currentRequests: 0,
    isActive: true,
    createdAt: new Date(),
    metadata,
    lastUsed: null
  };
  
  keyPools.get(provider).push(keyInfo);
  return keyInfo.id;
}

function getAvailableKey(provider, strategy = 'roundRobin') {
  const keys = keyPools.get(provider) || [];
  
  const availableKeys = keys.filter(key => 
    key.isActive && key.currentRequests < key.maxRequests
  );
  
  if (availableKeys.length === 0) {
    return null;
  }
  
  let selectedKey;
  
  if (strategy === 'roundRobin') {
    selectedKey = getNextRoundRobinKey(provider, availableKeys);
  } else if (strategy === 'leastUsed') {
    selectedKey = availableKeys.reduce((min, key) => 
      key.currentRequests < min.currentRequests ? key : min
    );
  } else if (strategy === 'random') {
    selectedKey = availableKeys[Math.floor(Math.random() * availableKeys.length)];
  } else {
    selectedKey = getNextRoundRobinKey(provider, availableKeys);
  }
  
  return selectedKey;
}

function getNextRoundRobinKey(provider, availableKeys) {
  if (availableKeys.length === 0) return null;
  
  let currentIndex = roundRobinIndex.get(provider) || 0;
  let attempts = 0;
  const maxAttempts = availableKeys.length;
  
  while (attempts < maxAttempts) {
    const key = availableKeys[currentIndex % availableKeys.length];
    currentIndex = (currentIndex + 1) % availableKeys.length;
    roundRobinIndex.set(provider, currentIndex);
    
    if (key.isActive && key.currentRequests < key.maxRequests) {
      return key;
    }
    
    attempts++;
  }
  
  return availableKeys.reduce((min, key) => 
    key.currentRequests < min.currentRequests ? key : min
  );
}

function recordKeyUsage(keyId, requestInfo = {}) {
  for (const [provider, keys] of keyPools) {
    const key = keys.find(k => k.id === keyId);
    if (key) {
      key.currentRequests++;
      key.lastUsed = new Date();
      
      if (!keyStats.has(keyId)) {
        keyStats.set(keyId, {
          totalRequests: 0,
          successRequests: 0,
          errorRequests: 0,
          lastError: null
        });
      }
      
      const stats = keyStats.get(keyId);
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

function getPoolStatus(provider = null) {
  if (provider) {
    const keys = keyPools.get(provider) || [];
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
    for (const [provider, keys] of keyPools) {
      status[provider] = getPoolStatus(provider);
    }
    return status;
  }
}

function updateKey(keyId, updates) {
  for (const [provider, keys] of keyPools) {
    const keyIndex = keys.findIndex(k => k.id === keyId);
    if (keyIndex !== -1) {
      const key = keys[keyIndex];
      Object.assign(key, updates);
      return true;
    }
  }
  return false;
}

function deleteKey(keyId) {
  for (const [provider, keys] of keyPools) {
    const keyIndex = keys.findIndex(k => k.id === keyId);
    if (keyIndex !== -1) {
      keys.splice(keyIndex, 1);
      return true;
    }
  }
  return false;
}

function resetKeyUsage(provider = null) {
  if (provider) {
    const keys = keyPools.get(provider) || [];
    keys.forEach(key => key.currentRequests = 0);
  } else {
    for (const [_, keys] of keyPools) {
      keys.forEach(key => key.currentRequests = 0);
    }
  }
}

// API处理函数
async function handleAPIRequest(url, method, headers, body) {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  // 设置CORS头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
    'Content-Type': 'application/json'
  };
  
  // 处理OPTIONS请求
  if (method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }
  
  try {
    // 健康检查
    if (pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'API Key Pool Service (GitHub Pages)'
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
    
    // 管理端点
    if (pathname.startsWith('/admin')) {
      return await handleAdminRequest(pathname, method, headers, body);
    }
    
    // API调用端点
    if (pathname.startsWith('/api/')) {
      return await handleAPIProxy(pathname, method, headers, body, urlObj);
    }
    
    // 默认返回使用说明
    return new Response(JSON.stringify({
      message: 'API Key Pool Service (GitHub Pages)',
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
    }), {
      status: 200,
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Handler error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// 处理管理请求
async function handleAdminRequest(pathname, method, headers, body) {
  const adminKeyHeader = headers.get('x-admin-key');
  
  if (adminKeyHeader !== adminKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (method === 'POST' && pathname === '/admin/keys') {
    const { provider, apiKey, maxRequests, metadata } = JSON.parse(body);
    
    if (!provider || !apiKey) {
      return new Response(JSON.stringify({ error: 'Provider and apiKey are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const keyId = addKey(provider, apiKey, maxRequests, metadata);
    
    return new Response(JSON.stringify({
      message: 'Key added successfully',
      keyId,
      provider
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (method === 'GET' && pathname === '/admin/status') {
    const urlObj = new URL(pathname, 'http://localhost');
    const provider = urlObj.searchParams.get('provider');
    const status = getPoolStatus(provider);
    
    return new Response(JSON.stringify(status), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (method === 'POST' && pathname === '/admin/reset') {
    const { provider } = JSON.parse(body);
    resetKeyUsage(provider);
    
    return new Response(JSON.stringify({ message: 'Usage reset successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (method === 'PUT' && pathname.startsWith('/admin/keys/')) {
    const keyId = pathname.split('/').pop();
    const { isActive, maxRequests, metadata } = JSON.parse(body);
    
    const updated = updateKey(keyId, { isActive, maxRequests, metadata });
    if (!updated) {
      return new Response(JSON.stringify({ error: 'Key not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ message: 'Key updated successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (method === 'DELETE' && pathname.startsWith('/admin/keys/')) {
    const keyId = pathname.split('/').pop();
    
    const deleted = deleteKey(keyId);
    if (!deleted) {
      return new Response(JSON.stringify({ error: 'Key not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ message: 'Key deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (method === 'POST' && pathname === '/admin/proxy-config') {
    const { enabled, baseUrl, fallbackToDirect } = JSON.parse(body);
    
    // 更新中转服务配置
    proxyConfig.enabled = enabled;
    proxyConfig.baseUrl = baseUrl;
    proxyConfig.fallbackToDirect = fallbackToDirect;
    
    return new Response(JSON.stringify({ 
      message: 'Proxy configuration updated successfully',
      config: proxyConfig
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (method === 'GET' && pathname === '/admin/proxy-config') {
    return new Response(JSON.stringify({ 
      config: proxyConfig
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({ error: 'Admin endpoint not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}

// 处理API代理请求
async function handleAPIProxy(pathname, method, headers, body, urlObj) {
  const pathSegments = pathname.split('/').filter(Boolean);
  if (pathSegments.length < 3) {
    return new Response(JSON.stringify({ error: 'Invalid API path. Expected: /api/:provider/*' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const provider = pathSegments[1];
  const apiPath = pathSegments.slice(2).join('/');
  const strategy = urlObj.searchParams.get('strategy') || 'roundRobin';
  
  const keyInfo = getAvailableKey(provider, strategy);
  if (!keyInfo) {
    return new Response(JSON.stringify({
      error: 'No available API keys',
      provider,
      strategy,
      suggestion: 'Please add more keys or wait for rate limit reset'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    let targetUrl;
    if (provider === 'gemini') {
      targetUrl = `https://generativelanguage.googleapis.com/v1beta/${apiPath}`;
    } else if (provider === 'openai') {
      targetUrl = `https://api.openai.com/v1/${apiPath}`;
    } else {
      return new Response(JSON.stringify({ error: `Unsupported provider: ${provider}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const requestHeaders = new Headers();
    requestHeaders.set('Content-Type', 'application/json');
    
    if (provider === 'gemini') {
      const url = new URL(targetUrl);
      url.searchParams.set('key', keyInfo.key);
      targetUrl = url.toString();
    } else if (provider === 'openai') {
      requestHeaders.set('Authorization', `Bearer ${keyInfo.key}`);
    }
    
    let response;
    let responseData;
    
    // 尝试使用中转服务
    if (proxyConfig.enabled) {
      try {
        const proxyUrl = `${proxyConfig.baseUrl}/${encodeURIComponent(targetUrl)}`;
        console.log('Using proxy service:', proxyUrl);
        
        response = await fetch(proxyUrl, {
          method,
          headers: requestHeaders,
          body: method !== 'GET' ? body : undefined,
        });
        
        responseData = await response.json();
        
        // 如果中转服务成功，直接返回
        if (response.ok) {
          recordKeyUsage(keyInfo.id, {
            success: true,
            error: null
          });
          
          return new Response(JSON.stringify(responseData), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (proxyError) {
        console.warn('Proxy service failed, trying direct call:', proxyError.message);
      }
    }
    
    // 如果中转服务失败或未启用，尝试直接调用
    if (proxyConfig.fallbackToDirect || !proxyConfig.enabled) {
      console.log('Using direct API call:', targetUrl);
      
      response = await fetch(targetUrl, {
        method,
        headers: requestHeaders,
        body: method !== 'GET' ? body : undefined,
      });
      
      responseData = await response.json();
    }
    
    recordKeyUsage(keyInfo.id, {
      success: response.ok,
      error: !response.ok ? responseData.error : null
    });
    
    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('API request error:', error);
    
    recordKeyUsage(keyInfo.id, {
      success: false,
      error: error.message
    });
    
    return new Response(JSON.stringify({
      error: 'Proxy request failed',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Service Worker 安装事件
self.addEventListener('install', (event) => {
  console.log('API Key Pool Service Worker installed');
  self.skipWaiting();
});

// Service Worker 激活事件
self.addEventListener('activate', (event) => {
  console.log('API Key Pool Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// 拦截fetch请求
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 只处理API请求
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/admin') || 
      url.pathname === '/health') {
    
    event.respondWith(
      handleAPIRequest(
        event.request.url,
        event.request.method,
        event.request.headers,
        event.request.body
      )
    );
  }
});

// 导出函数供外部使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    addKey,
    getAvailableKey,
    recordKeyUsage,
    getPoolStatus,
    updateKey,
    deleteKey,
    resetKeyUsage
  };
} 
