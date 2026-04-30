/**
 * 心理测评相关路由
 * 使用 Upstash Search 数据库
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { insert, paginate } = require('../config/upstash');

// 测评题目数据
const TEST_DATA = {
    anxiety: {
        title: '焦虑情绪自测',
        description: '了解最近是否感到紧张、担忧或不安',
        questions: [
            '最近两周，你是否感到紧张、焦虑或急躁？',
            '最近两周，你是否难以控制担忧的情绪？',
            '最近两周，你是否对各种事情过度担心？',
            '最近两周，你是否难以放松下来？',
            '最近两周，你是否感到坐立不安、难以静坐？',
            '最近两周，你是否容易感到烦躁或易怒？',
            '最近两周，你是否感到害怕，好像会有可怕的事情发生？'
        ],
        options: [
            { text: '完全没有', score: 0 },
            { text: '有几天', score: 1 },
            { text: '一半以上的天数', score: 2 },
            { text: '几乎每天', score: 3 }
        ]
    },
    depression: {
        title: '抑郁情绪自测',
        description: '了解最近是否感到低落、疲惫或失去兴趣',
        questions: [
            '最近两周，你是否对做事提不起兴趣或没有兴趣？',
            '最近两周，你是否感到心情低落、沮丧或绝望？',
            '最近两周，你是否入睡困难、易醒或睡眠过多？',
            '最近两周，你是否感到疲倦或没有活力？',
            '最近两周，你是否食欲不振或进食过多？',
            '最近两周，你是否对自己感到失望，或觉得自己是个失败者？',
            '最近两周，你是否难以集中注意力，比如看报纸或看电视时？',
            '最近两周，你是否动作或说话缓慢到别人已经察觉？或者相反——烦躁不安、动来动去？',
            '最近两周，你是否有过不如死掉或用某种方式伤害自己的念头？'
        ],
        options: [
            { text: '完全没有', score: 0 },
            { text: '有几天', score: 1 },
            { text: '一半以上的天数', score: 2 },
            { text: '几乎每天', score: 3 }
        ]
    }
};

/**
 * 获取测评类型列表
 * GET /api/assessment/types
 */
router.get('/types', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 'anxiety',
                title: TEST_DATA.anxiety.title,
                description: TEST_DATA.anxiety.description,
                questionCount: TEST_DATA.anxiety.questions.length,
                duration: '约2分钟'
            },
            {
                id: 'depression',
                title: TEST_DATA.depression.title,
                description: TEST_DATA.depression.description,
                questionCount: TEST_DATA.depression.questions.length,
                duration: '约2分钟'
            }
        ],
        disclaimer: '本测评结果仅供参考，不能作为医学诊断依据'
    });
});

/**
 * 获取测评历史
 * GET /api/assessment/history
 */
router.get('/history', async (req, res) => {
    try {
        const { user_id, limit = 10 } = req.query;
        const query = user_id ? { user_id } : {};
        const result = await paginate('assessmentRecords', {
            limit: parseInt(limit),
            sort: { created_at: 'desc' },
            query
        });
        res.json({
            success: true,
            data: result.data,
            disclaimer: '历史记录仅供参考，不作为医学诊断依据'
        });
    } catch (error) {
        console.error('获取测评历史失败:', error);
        res.status(500).json({
            success: false,
            error: '获取历史记录失败',
            code: 'FETCH_ERROR'
        });
    }
});

/**
 * 获取测评题目
 * GET /api/assessment/:type
 */
router.get('/:type', (req, res) => {
    const { type } = req.params;
    const testData = TEST_DATA[type];
    
    if (!testData) {
        return res.status(404).json({
            success: false,
            error: '测评类型不存在',
            code: 'TEST_NOT_FOUND'
        });
    }
    
    res.json({
        success: true,
        data: {
            title: testData.title,
            description: testData.description,
            questions: testData.questions,
            options: testData.options
        },
        disclaimer: '本测评结果仅供参考，不能作为医学诊断依据。如有严重心理困扰，请寻求专业帮助。'
    });
});

/**
 * 提交测评结果
 * POST /api/assessment/:type/submit
 */
router.post('/:type/submit', async (req, res) => {
    try {
        const { type } = req.params;
        const { answers, user_id } = req.body;
        
        const testData = TEST_DATA[type];
        if (!testData) {
            return res.status(404).json({
                success: false,
                error: '测评类型不存在',
                code: 'TEST_NOT_FOUND'
            });
        }
        
        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                error: '请提供测评答案',
                code: 'MISSING_ANSWERS'
            });
        }
        
        // 计算分数
        let totalScore = 0;
        answers.forEach(answer => {
            if (typeof answer === 'number') {
                totalScore += answer;
            }
        });
        
        // 获取结果等级
        const result = getResultLevel(type, totalScore);
        
        // 保存记录
        const record = {
            id: uuidv4(),
            user_id: user_id || null,
            test_type: type,
            score: totalScore,
            level: result.level,
            answers: JSON.stringify(answers),
            created_at: new Date().toISOString()
        };
        
        await insert('assessmentRecords', record);
        
        res.json({
            success: true,
            data: {
                id: record.id,
                score: totalScore,
                level: result.level,
                title: result.title,
                description: result.description,
                suggestions: result.suggestions,
                showHotline: result.showHotline
            },
            disclaimer: '本测评结果仅供参考，不能作为医学诊断依据'
        });
    } catch (error) {
        console.error('提交测评失败:', error);
        res.status(500).json({
            success: false,
            error: '提交失败，请稍后再试',
            code: 'SUBMIT_ERROR'
        });
    }
});

/**
 * 根据分数获取结果等级
 */
function getResultLevel(type, score) {
    if (type === 'anxiety') {
        if (score <= 4) {
            return {
                level: 'normal',
                title: '情绪状态良好',
                description: '你最近的焦虑水平在正常范围内，继续保持良好的状态。',
                suggestions: [
                    '继续保持规律作息和适度运动',
                    '每天花5分钟专注于呼吸，让大脑获得一次简单的"重启"',
                    '和朋友聊聊天，分享生活中的美好'
                ],
                showHotline: false
            };
        } else if (score <= 9) {
            return {
                level: 'mild',
                title: '轻度焦虑情绪',
                description: '你最近可能有些焦虑，这是正常的情绪反应。',
                suggestions: [
                    '尝试腹式呼吸放松法，每次5-15分钟',
                    '保持规律作息，避免熬夜',
                    '适度运动如散步、瑜伽有助于缓解焦虑',
                    '写情绪日记，记录触发事件和真实需求'
                ],
                showHotline: false
            };
        } else if (score <= 14) {
            return {
                level: 'moderate',
                title: '中度焦虑情绪',
                description: '你最近可能感到比较焦虑，建议关注自己的情绪状态。',
                suggestions: [
                    '建议每天进行10-15分钟正念冥想练习',
                    '尝试渐进式肌肉放松',
                    '和信任的人聊聊你的感受',
                    '如果这种状态持续两周以上，建议寻求专业帮助'
                ],
                showHotline: true
            };
        } else {
            return {
                level: 'high',
                title: '焦虑水平偏高',
                description: '你最近可能感到比较辛苦，建议寻求专业支持。',
                suggestions: [
                    '你的感受值得被认真对待',
                    '建议尽快寻求专业心理咨询师或医生的帮助',
                    '可以拨打心理援助热线获得即时支持',
                    '记住，寻求帮助是勇敢的选择'
                ],
                showHotline: true
            };
        }
    } else {
        // 抑郁测评
        if (score <= 4) {
            return {
                level: 'normal',
                title: '情绪状态良好',
                description: '你最近的情绪状态在正常范围内，继续保持。',
                suggestions: [
                    '继续保持积极的生活态度',
                    '培养一两个让自己开心的爱好',
                    '每天记录三件好事，提升幸福感'
                ],
                showHotline: false
            };
        } else if (score <= 9) {
            return {
                level: 'mild',
                title: '轻度低落情绪',
                description: '你最近可能有些低落，这是正常的情绪波动。',
                suggestions: [
                    '尝试做一些让自己感到愉悦的小事',
                    '保持规律作息，每天晒晒太阳',
                    '适度运动如快走、慢跑，促进内啡肽分泌',
                    '培养一项兴趣爱好'
                ],
                showHotline: false
            };
        } else if (score <= 14) {
            return {
                level: 'moderate',
                title: '中度低落情绪',
                description: '你最近可能感到比较疲惫或低落，建议关注自己的情绪。',
                suggestions: [
                    '制定小目标，逐步增加积极活动',
                    '每周至少一次主动联系亲友',
                    '有氧运动每周3-5次，每次30分钟',
                    '如果这种状态持续，建议寻求专业帮助'
                ],
                showHotline: true
            };
        } else {
            return {
                level: 'high',
                title: '需要专业支持',
                description: '你最近可能承受着很大的压力，请寻求专业帮助。',
                suggestions: [
                    '请尽快寻求专业心理咨询或医疗帮助',
                    '拨打心理援助热线可以获得即时支持',
                    '告诉信任的人你的感受',
                    '你不需要一个人面对，有人愿意帮助你'
                ],
                showHotline: true
            };
        }
    }
}

module.exports = router;
