/**
 * 简单测试脚本
 * 运行: npm run test
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

console.log('🧪 测试心晴空间API...\n');

// 测试函数
function testAPI(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: body ? { 'Content-Type': 'application/json' } : {}
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('请求超时'));
        });

        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// 运行测试
async function runTests() {
    const tests = [
        { name: '健康检查', path: '/health' },
        { name: 'API信息', path: '/api' },
        { name: '测评类型', path: '/api/assessment/types' },
        { name: '情绪类型', path: '/api/emotion/types' },
        { name: '求助热线', path: '/api/stats/hotlines' },
        { name: '疗愈练习', path: '/api/content/exercises' },
        { name: '每日提示', path: '/api/content/daily-tips' },
        { name: '快速练习', path: '/api/content/quick-exercises' },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            const result = await testAPI(test.path);
            if (result.status === 200 && result.data.success !== false) {
                console.log(`✓ ${test.name}`);
                passed++;
            } else {
                console.log(`✗ ${test.name} - 状态码: ${result.status}`);
                failed++;
            }
        } catch (error) {
            console.log(`✗ ${test.name} - 错误: ${error.message}`);
            failed++;
        }
    }

    console.log(`\n📊 测试结果: ${passed} 通过, ${failed} 失败`);
    
    if (failed > 0) {
        console.log('\n请确保服务器正在运行: npm start');
    }
}

runTests();
