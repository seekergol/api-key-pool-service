// API Key Pool Service 测试用例
// 用于测试密钥池服务的各项功能

const BASE_URL = 'https://your-deployed-service.vercel.app'; // 替换为你的部署地址
const ADMIN_KEY = 'your-admin-key'; // 替换为你的管理员密钥

// 测试配置
const TEST_CONFIG = {
  geminiApiKey: 'your-gemini-api-key', // 替换为你的Gemini API密钥
  openaiApiKey: 'your-openai-api-key', // 替换为你的OpenAI API密钥
  testProvider: 'gemini',
  testStrategy: 'roundRobin'
};

// 工具函数：发送HTTP请求
async function makeRequest(url, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();
  
  return {
    status: response.status,
    data,
    headers: response.headers
  };
}

// 测试用例类
class APITestSuite {
  constructor() {
    this.testResults = [];
    this.baseUrl = BASE_URL;
    this.adminKey = ADMIN_KEY;
  }

  // 记录测试结果
  logTest(name, success, message, data = null) {
    const result = {
      name,
      success,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    console.log(`[${success ? '✅' : '❌'}] ${name}: ${message}`);
    
    if (data) {
      console.log('   Data:', JSON.stringify(data, null, 2));
    }
  }

  // 测试1：添加API密钥
  async testAddKey() {
    try {
      const response = await makeRequest(`${this.baseUrl}/admin/keys`, {
        method: 'POST',
        headers: {
          'X-Admin-Key': this.adminKey
        },
        body: JSON.stringify({
          provider: TEST_CONFIG.testProvider,
          apiKey: TEST_CONFIG.geminiApiKey,
          maxRequests: 1000,
          metadata: {
            description: 'Test Gemini API Key',
            tags: ['test', 'gemini']
          }
        })
      });

      if (response.status === 201 && response.data.keyId) {
        this.logTest('添加API密钥', true, '密钥添加成功', response.data);
        return response.data.keyId;
      } else {
        this.logTest('添加API密钥', false, `添加失败: ${response.status}`, response.data);
        return null;
      }
    } catch (error) {
      this.logTest('添加API密钥', false, `请求异常: ${error.message}`);
      return null;
    }
  }

  // 测试2：查看密钥池状态
  async testGetStatus() {
    try {
      const response = await makeRequest(
        `${this.baseUrl}/admin/status?provider=${TEST_CONFIG.testProvider}`,
        {
          method: 'GET',
          headers: {
            'X-Admin-Key': this.adminKey
          }
        }
      );

      if (response.status === 200) {
        this.logTest('查看密钥池状态', true, '状态获取成功', response.data);
        return response.data;
      } else {
        this.logTest('查看密钥池状态', false, `获取失败: ${response.status}`, response.data);
        return null;
      }
    } catch (error) {
      this.logTest('查看密钥池状态', false, `请求异常: ${error.message}`);
      return null;
    }
  }

  // 测试3：调用Gemini API（轮询策略）
  async testGeminiAPICall(strategy = 'roundRobin') {
    try {
      const response = await makeRequest(
        `${this.baseUrl}/api/gemini/models/gemini-pro:generateContent?strategy=${strategy}`,
        {
          method: 'POST',
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "Hello! Please respond with a simple greeting in English."
                  }
                ]
              }
            ]
          })
        }
      );

      if (response.status === 200 && response.data.candidates) {
        this.logTest(`Gemini API调用 (${strategy})`, true, 'API调用成功', {
          response: response.data.candidates[0]?.content?.parts[0]?.text || 'No response text'
        });
        return response.data;
      } else {
        this.logTest(`Gemini API调用 (${strategy})`, false, `调用失败: ${response.status}`, response.data);
        return null;
      }
    } catch (error) {
      this.logTest(`Gemini API调用 (${strategy})`, false, `请求异常: ${error.message}`);
      return null;
    }
  }

  // 测试4：测试不同策略
  async testDifferentStrategies() {
    const strategies = ['roundRobin', 'leastUsed', 'random'];
    
    for (const strategy of strategies) {
      await this.testGeminiAPICall(strategy);
      // 等待一秒避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // 测试5：添加多个密钥测试轮询
  async testMultipleKeys() {
    try {
      // 添加第二个密钥
      const response1 = await makeRequest(`${this.baseUrl}/admin/keys`, {
        method: 'POST',
        headers: {
          'X-Admin-Key': this.adminKey
        },
        body: JSON.stringify({
          provider: TEST_CONFIG.testProvider,
          apiKey: TEST_CONFIG.geminiApiKey, // 使用相同密钥进行测试
          maxRequests: 500,
          metadata: {
            description: 'Second Test Gemini API Key',
            tags: ['test', 'gemini', 'backup']
          }
        })
      });

      if (response1.status === 201) {
        this.logTest('添加第二个密钥', true, '第二个密钥添加成功', response1.data);
        
        // 测试轮询效果
        console.log('\n🔄 测试轮询效果（连续调用5次）:');
        for (let i = 1; i <= 5; i++) {
          console.log(`\n--- 第${i}次调用 ---`);
          await this.testGeminiAPICall('roundRobin');
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } else {
        this.logTest('添加第二个密钥', false, `添加失败: ${response1.status}`, response1.data);
      }
    } catch (error) {
      this.logTest('添加第二个密钥', false, `请求异常: ${error.message}`);
    }
  }

  // 测试6：错误处理测试
  async testErrorHandling() {
    // 测试无效的provider
    try {
      const response = await makeRequest(
        `${this.baseUrl}/api/invalid-provider/test`,
        {
          method: 'POST',
          body: JSON.stringify({ test: 'data' })
        }
      );

      if (response.status === 400) {
        this.logTest('错误处理测试', true, '无效provider正确处理', response.data);
      } else {
        this.logTest('错误处理测试', false, `预期400错误，实际${response.status}`, response.data);
      }
    } catch (error) {
      this.logTest('错误处理测试', false, `请求异常: ${error.message}`);
    }
  }

  // 测试7：健康检查
  async testHealthCheck() {
    try {
      const response = await makeRequest(`${this.baseUrl}/health`);

      if (response.status === 200 && response.data.status === 'ok') {
        this.logTest('健康检查', true, '服务正常运行', response.data);
        return true;
      } else {
        this.logTest('健康检查', false, `健康检查失败: ${response.status}`, response.data);
        return false;
      }
    } catch (error) {
      this.logTest('健康检查', false, `请求异常: ${error.message}`);
      return false;
    }
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🚀 开始运行API Key Pool Service测试套件...\n');
    
    // 测试健康检查
    const isHealthy = await this.testHealthCheck();
    if (!isHealthy) {
      console.log('❌ 服务不可用，停止测试');
      return;
    }

    // 测试添加密钥
    const keyId = await this.testAddKey();
    
    // 测试查看状态
    await this.testGetStatus();
    
    // 测试基本API调用
    await this.testGeminiAPICall();
    
    // 测试不同策略
    await this.testDifferentStrategies();
    
    // 测试多密钥轮询
    await this.testMultipleKeys();
    
    // 测试错误处理
    await this.testErrorHandling();
    
    // 输出测试总结
    this.printTestSummary();
  }

  // 打印测试总结
  printTestSummary() {
    console.log('\n📊 测试结果总结:');
    console.log('='.repeat(50));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过: ${passedTests} ✅`);
    console.log(`失败: ${failedTests} ❌`);
    console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.name}: ${r.message}`));
    }
    
    console.log('\n🎉 测试完成!');
  }
}

// 运行测试
async function runTests() {
  const testSuite = new APITestSuite();
  await testSuite.runAllTests();
}

// 如果直接运行此文件，则执行测试
if (typeof window === 'undefined') {
  // Node.js环境
  runTests().catch(console.error);
} else {
  // 浏览器环境
  window.runTests = runTests;
}

// 导出测试类（用于模块化）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APITestSuite;
} 