// 中转服务测试脚本
// 用于测试中转服务是否正常工作

const TEST_CONFIG = {
  serviceUrl: 'https://your-username.github.io/api-key-pool-service',
  adminKey: 'your-admin-key',
  geminiApiKey: 'your-gemini-api-key'
};

// 测试中转服务配置
async function testProxyConfig() {
  console.log('🧪 开始测试中转服务配置...\n');
  
  // 1. 测试获取当前配置
  console.log('1. 获取当前中转服务配置...');
  try {
    const response = await fetch(`${TEST_CONFIG.serviceUrl}/admin/proxy-config`, {
      method: 'GET',
      headers: {
        'X-Admin-Key': TEST_CONFIG.adminKey
      }
    });
    
    if (response.ok) {
      const config = await response.json();
      console.log('✅ 当前配置:', config);
    } else {
      console.log('❌ 获取配置失败:', response.status);
    }
  } catch (error) {
    console.log('❌ 获取配置出错:', error.message);
  }
  
  // 2. 测试更新配置
  console.log('\n2. 更新中转服务配置...');
  try {
    const response = await fetch(`${TEST_CONFIG.serviceUrl}/admin/proxy-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': TEST_CONFIG.adminKey
      },
      body: JSON.stringify({
        enabled: true,
        baseUrl: 'https://steamgovernment.deno.dev',
        fallbackToDirect: true
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ 配置更新成功:', result);
    } else {
      console.log('❌ 配置更新失败:', response.status);
    }
  } catch (error) {
    console.log('❌ 更新配置出错:', error.message);
  }
  
  // 3. 测试API调用（使用中转服务）
  console.log('\n3. 测试API调用（使用中转服务）...');
  try {
    const response = await fetch(`${TEST_CONFIG.serviceUrl}/api/gemini/models/gemini-pro:generateContent?strategy=roundRobin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Hello! Please respond with 'Proxy service is working!' in English."
              }
            ]
          }
        ]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API调用成功（中转服务）');
      console.log('   响应:', data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response');
    } else {
      console.log('❌ API调用失败:', response.status);
      const error = await response.json();
      console.log('   错误:', error);
    }
  } catch (error) {
    console.log('❌ API调用出错:', error.message);
  }
  
  // 4. 测试禁用中转服务
  console.log('\n4. 测试禁用中转服务...');
  try {
    const response = await fetch(`${TEST_CONFIG.serviceUrl}/admin/proxy-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': TEST_CONFIG.adminKey
      },
      body: JSON.stringify({
        enabled: false,
        baseUrl: 'https://steamgovernment.deno.dev',
        fallbackToDirect: true
      })
    });
    
    if (response.ok) {
      console.log('✅ 中转服务已禁用');
    } else {
      console.log('❌ 禁用中转服务失败:', response.status);
    }
  } catch (error) {
    console.log('❌ 禁用中转服务出错:', error.message);
  }
  
  // 5. 测试直接API调用
  console.log('\n5. 测试直接API调用...');
  try {
    const response = await fetch(`${TEST_CONFIG.serviceUrl}/api/gemini/models/gemini-pro:generateContent?strategy=roundRobin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Hello! Please respond with 'Direct API call is working!' in English."
              }
            ]
          }
        ]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 直接API调用成功');
      console.log('   响应:', data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response');
    } else {
      console.log('❌ 直接API调用失败:', response.status);
      const error = await response.json();
      console.log('   错误:', error);
    }
  } catch (error) {
    console.log('❌ 直接API调用出错:', error.message);
  }
  
  console.log('\n🎉 中转服务测试完成!');
}

// 运行测试
if (typeof window === 'undefined') {
  // Node.js环境
  testProxyConfig().catch(console.error);
} else {
  // 浏览器环境
  window.testProxyConfig = testProxyConfig;
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testProxyConfig };
} 