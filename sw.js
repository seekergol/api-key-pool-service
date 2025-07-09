// Service Worker 注册文件
// 用于在GitHub Pages上提供API服务

// 注册Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/api.js')
      .then((registration) => {
        console.log('API Key Pool Service Worker registered successfully:', registration);
      })
      .catch((error) => {
        console.log('API Key Pool Service Worker registration failed:', error);
      });
  });
}

// 全局API函数
window.APIKeyPoolService = {
  // 健康检查
  async healthCheck() {
    try {
      const response = await fetch('/health');
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  },

  // 添加密钥
  async addKey(provider, apiKey, maxRequests = 1000, metadata = {}) {
    try {
      const response = await fetch('/admin/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': window.adminKey || 'your-admin-key'
        },
        body: JSON.stringify({
          provider,
          apiKey,
          maxRequests,
          metadata
        })
      });
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  },

  // 获取状态
  async getStatus(provider = null) {
    try {
      const url = provider ? `/admin/status?provider=${provider}` : '/admin/status';
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Admin-Key': window.adminKey || 'your-admin-key'
        }
      });
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  },

  // 调用Gemini API
  async callGeminiAPI(prompt, strategy = 'roundRobin') {
    try {
      const response = await fetch(`/api/gemini/models/gemini-pro:generateContent?strategy=${strategy}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      });
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  },

  // 调用OpenAI API
  async callOpenAIAPI(messages, model = 'gpt-3.5-turbo', strategy = 'roundRobin') {
    try {
      const response = await fetch(`/api/openai/chat/completions?strategy=${strategy}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages
        })
      });
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  },

  // 重置使用计数
  async resetUsage(provider = null) {
    try {
      const response = await fetch('/admin/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': window.adminKey || 'your-admin-key'
        },
        body: JSON.stringify({ provider })
      });
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  },

  // 设置管理员密钥
  setAdminKey(key) {
    window.adminKey = key;
    localStorage.setItem('adminKey', key);
  },

  // 获取管理员密钥
  getAdminKey() {
    return window.adminKey || localStorage.getItem('adminKey') || 'your-admin-key';
  },

  // 测试连接
  async testConnection() {
    const health = await this.healthCheck();
    if (health.status === 'ok') {
      console.log('✅ API Key Pool Service 连接正常');
      return true;
    } else {
      console.log('❌ API Key Pool Service 连接失败:', health);
      return false;
    }
  }
};

// 自动加载管理员密钥
window.addEventListener('load', () => {
  const savedAdminKey = localStorage.getItem('adminKey');
  if (savedAdminKey) {
    window.adminKey = savedAdminKey;
  }
});

// 导出供模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.APIKeyPoolService;
} 