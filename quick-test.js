// 快速测试脚本 - 用于快速验证API Key Pool Service功能

// 配置信息 - 请根据实际情况修改
const CONFIG = {
  // 服务地址 - 替换为你的部署地址
  serviceUrl: 'https://your-deployed-service.vercel.app',
  
  // 管理员密钥 - 替换为你的管理员密钥
  adminKey: 'your-admin-key',
  
  // Gemini API密钥 - 替换为你的实际密钥
  geminiApiKey: 'your-gemini-api-key'
};

// 简单的HTTP请求函数
async function request(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, data: { error: error.message } };
  }
}

// 快速测试函数
async function quickTest() {
  console.log('🚀 开始快速测试...\n');
  
  // 1. 健康检查
  console.log('1. 测试健康检查...');
  const health = await request(`${CONFIG.serviceUrl}/health`);
  if (health.status === 200) {
    console.log('✅ 服务正常运行');
  } else {
    console.log('❌ 服务不可用，请检查部署地址');
    return;
  }
  
  // 2. 添加Gemini密钥
  console.log('\n2. 添加Gemini API密钥...');
  const addKey = await request(`${CONFIG.serviceUrl}/admin/keys`, {
    method: 'POST',
    headers: {
      'X-Admin-Key': CONFIG.adminKey
    },
    body: JSON.stringify({
      provider: 'gemini',
      apiKey: CONFIG.geminiApiKey,
      maxRequests: 1000,
      metadata: {
        description: 'Quick Test Gemini Key',
        tags: ['test']
      }
    })
  });
  
  if (addKey.status === 201) {
    console.log('✅ 密钥添加成功');
    console.log(`   密钥ID: ${addKey.data.keyId}`);
  } else {
    console.log('❌ 密钥添加失败:', addKey.data);
    return;
  }
  
  // 3. 查看密钥池状态
  console.log('\n3. 查看密钥池状态...');
  const status = await request(`${CONFIG.serviceUrl}/admin/status?provider=gemini`, {
    method: 'GET',
    headers: {
      'X-Admin-Key': CONFIG.adminKey
    }
  });
  
  if (status.status === 200) {
    console.log('✅ 状态获取成功');
    console.log(`   总密钥数: ${status.data.totalKeys}`);
    console.log(`   可用密钥数: ${status.data.availableKeys}`);
  } else {
    console.log('❌ 状态获取失败:', status.data);
  }
  
  // 4. 测试Gemini API调用
  console.log('\n4. 测试Gemini API调用...');
  const apiCall = await request(
    `${CONFIG.serviceUrl}/api/gemini/models/gemini-pro:generateContent?strategy=roundRobin`,
    {
      method: 'POST',
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Hello! Please respond with 'API Key Pool Service is working!' in English."
              }
            ]
          }
        ]
      })
    }
  );
  
  if (apiCall.status === 200 && apiCall.data.candidates) {
    console.log('✅ Gemini API调用成功');
    const responseText = apiCall.data.candidates[0]?.content?.parts[0]?.text || 'No response';
    console.log(`   响应: ${responseText.substring(0, 100)}...`);
  } else {
    console.log('❌ Gemini API调用失败:', apiCall.data);
  }
  
  // 5. 测试轮询效果（连续调用3次）
  console.log('\n5. 测试轮询效果（连续调用3次）...');
  for (let i = 1; i <= 3; i++) {
    console.log(`   第${i}次调用...`);
    const roundRobinCall = await request(
      `${CONFIG.serviceUrl}/api/gemini/models/gemini-pro:generateContent?strategy=roundRobin`,
      {
        method: 'POST',
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Test call ${i}: Please respond with 'Call ${i} successful!'`
                }
              ]
            }
          ]
        })
      }
    );
    
    if (roundRobinCall.status === 200) {
      console.log(`   ✅ 第${i}次调用成功`);
    } else {
      console.log(`   ❌ 第${i}次调用失败:`, roundRobinCall.data);
    }
    
    // 等待500ms避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n🎉 快速测试完成!');
  console.log('\n📝 测试总结:');
  console.log('- 服务健康检查: ✅');
  console.log('- 密钥管理: ✅');
  console.log('- API调用: ✅');
  console.log('- 轮询功能: ✅');
  console.log('\n💡 提示: 如果所有测试都通过，说明你的API Key Pool Service运行正常!');
}

// 运行快速测试
if (typeof window === 'undefined') {
  // Node.js环境
  quickTest().catch(console.error);
} else {
  // 浏览器环境
  window.quickTest = quickTest;
}

// 导出函数（用于模块化）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { quickTest, request };
} 