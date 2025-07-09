// Vercel函数示例 - 调用GitHub Pages部署的API Key Pool Service
// 部署到Vercel后，可以通过 https://your-project.vercel.app/api/call-ai 访问

export default async function handler(req, res) {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GitHub Pages服务地址
    const serviceUrl = 'https://seekergol.github.io/api-key-pool-service';
    
    // 管理员密钥（用于管理API密钥）
    const adminKey = '84861142';
    
    // 示例1: 添加API密钥
    if (req.method === 'POST' && req.body?.action === 'addKey') {
      const { provider, apiKey, maxRequests } = req.body;
      
      const addKeyResponse = await fetch(`${serviceUrl}/admin/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminKey
        },
        body: JSON.stringify({
          provider,
          apiKey,
          maxRequests: maxRequests || 1000,
          metadata: { source: 'vercel' }
        })
      });
      
      const result = await addKeyResponse.json();
      return res.status(200).json(result);
    }
    
    // 示例2: 调用AI API（通过密钥池）
    if (req.method === 'POST' && req.body?.action === 'callAI') {
      const { provider, endpoint, data, strategy } = req.body;
      
      const apiResponse = await fetch(`${serviceUrl}/api/${provider}/${endpoint}?strategy=${strategy || 'roundRobin'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await apiResponse.json();
      return res.status(200).json(result);
    }
    
    // 示例3: 获取服务状态
    if (req.method === 'GET') {
      const statusResponse = await fetch(`${serviceUrl}/admin/status`, {
        headers: {
          'X-Admin-Key': adminKey
        }
      });
      
      const status = await statusResponse.json();
      return res.status(200).json({
        message: 'API Key Pool Service Status',
        serviceUrl,
        status
      });
    }
    
    // 默认返回使用说明
    return res.status(200).json({
      message: 'Vercel API Key Pool Service Example',
      endpoints: {
        'POST /api/call-ai': {
          action: 'addKey',
          body: {
            provider: 'gemini',
            apiKey: 'your-api-key',
            maxRequests: 1000
          }
        },
        'POST /api/call-ai': {
          action: 'callAI',
          body: {
            provider: 'gemini',
            endpoint: 'models/gemini-pro:generateContent',
            data: {
              contents: [{
                parts: [{
                  text: 'Hello, how are you?'
                }]
              }]
            },
            strategy: 'roundRobin'
          }
        },
        'GET /api/call-ai': 'Get service status'
      }
    });

  } catch (error) {
    console.error('Vercel function error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
} 