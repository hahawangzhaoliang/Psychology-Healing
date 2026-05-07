/**
 * 身份角色探索路由
 * 帮助用户识别和理解多重角色
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { insert, find, findById, update } = require('../config/upstash');

/**
 * 保存用户角色识别
 * POST /api/role/identify
 */
router.post('/identify', async (req, res) => {
    try {
        const { userId, roles } = req.body;
        
        if (!roles || !Array.isArray(roles) || roles.length === 0) {
            return res.status(400).json({
                success: false,
                error: '请选择至少一个角色',
                code: 'MISSING_ROLES'
            });
        }
        
        const record = {
            id: uuidv4(),
            userId: userId || null,
            roles,
            conflicts: [],  // 将在分析中填充
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await insert('userRoles', record);
        
        res.json({
            success: true,
            data: { 
                id: record.id,
                roles: record.roles
            }
        });
    } catch (error) {
        console.error('保存角色识别失败:', error);
        res.status(500).json({
            success: false,
            error: '保存失败',
            code: 'SAVE_ERROR'
        });
    }
});

/**
 * 获取角色分析
 * GET /api/role/analysis
 */
router.get('/analysis', async (req, res) => {
    try {
        const { userId, roleId } = req.query;
        
        let roleData;
        if (roleId) {
            roleData = await findById('userRoles', roleId);
        } else if (userId) {
            const allRoles = await find('userRoles');
            roleData = allRoles.find(r => r.userId === userId);
        }
        
        if (!roleData) {
            return res.status(404).json({
                success: false,
                error: '未找到角色数据',
                code: 'NOT_FOUND'
            });
        }
        
        // 分析角色冲突
        const conflicts = analyzeRoleConflicts(roleData.roles);
        
        // 更新冲突信息
        if (conflicts.length > 0) {
            roleData.conflicts = conflicts;
            roleData.updatedAt = new Date().toISOString();
        }
        
        res.json({
            success: true,
            data: {
                roles: roleData.roles,
                conflicts,
                analysis: generateAnalysis(roleData.roles, conflicts)
            }
        });
    } catch (error) {
        console.error('获取角色分析失败:', error);
        res.status(500).json({
            success: false,
            error: '分析失败',
            code: 'ANALYSIS_ERROR'
        });
    }
});

/**
 * 获取角色平衡建议
 * GET /api/role/suggestions
 */
router.get('/suggestions', async (req, res) => {
    try {
        const { conflictType } = req.query;
        
        const suggestions = getBalanceSuggestions(conflictType);
        
        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        console.error('获取建议失败:', error);
        res.status(500).json({
            success: false,
            error: '获取建议失败',
            code: 'SUGGESTION_ERROR'
        });
    }
});

/**
 * 获取角色类型列表
 * GET /api/role/types
 */
router.get('/types', (req, res) => {
    res.json({
        success: true,
        data: {
            family: [
                { id: 'child', name: '子女', description: '与父母的关系' },
                { id: 'partner', name: '伴侣', description: '恋爱/婚姻关系' },
                { id: 'parent', name: '父母', description: '育儿责任' },
                { id: 'sibling', name: '兄弟姐妹', description: '手足关系' }
            ],
            social: [
                { id: 'student', name: '学生', description: '学业、同伴关系' },
                { id: 'worker', name: '职场人', description: '工作、同事关系' },
                { id: 'freelancer', name: '自由职业者', description: '自我管理' },
                { id: 'entrepreneur', name: '创业者', description: '创业压力' }
            ],
            self: [
                { id: 'learner', name: '学习者', description: '终身学习' },
                { id: 'creator', name: '创造者', description: '兴趣爱好' },
                { id: 'volunteer', name: '志愿者', description: '社会参与' },
                { id: 'explorer', name: '探索者', description: '自我发现' }
            ]
        }
    });
});

/**
 * 分析角色冲突
 */
function analyzeRoleConflicts(roles) {
    const conflicts = [];
    
    // 定义常见的角色冲突
    const conflictPatterns = [
        {
            roles: ['worker', 'learner'],
            type: 'time_conflict',
            name: '职场人 vs 学习者',
            description: '想做好工作，但也想有时间学习提升'
        },
        {
            roles: ['worker', 'creator'],
            type: 'energy_conflict',
            name: '职场人 vs 创造者',
            description: '工作消耗精力，难以投入创造性活动'
        },
        {
            roles: ['worker', 'parent'],
            type: 'time_conflict',
            name: '职场人 vs 父母',
            description: '工作与育儿时间冲突'
        },
        {
            roles: ['student', 'partner'],
            type: 'attention_conflict',
            name: '学生 vs 伴侣',
            description: '学业压力影响恋爱关系'
        },
        {
            roles: ['child', 'partner'],
            type: 'expectation_conflict',
            name: '子女 vs 伴侣',
            description: '家庭期望与伴侣需求冲突'
        }
    ];
    
    // 检查是否存在冲突
    conflictPatterns.forEach(pattern => {
        if (pattern.roles.every(role => roles.includes(role))) {
            conflicts.push({
                type: pattern.type,
                name: pattern.name,
                description: pattern.description,
                severity: 'moderate'  // mild, moderate, high
            });
        }
    });
    
    return conflicts;
}

/**
 * 生成角色分析
 */
function generateAnalysis(roles, conflicts) {
    return {
        totalRoles: roles.length,
        roleCategories: categorizeRoles(roles),
        mainConflict: conflicts.length > 0 ? conflicts[0] : null,
        suggestions: conflicts.length > 0 
            ? getBalanceSuggestions(conflicts[0].type)
            : []
    };
}

/**
 * 分类角色
 */
function categorizeRoles(roles) {
    const categories = {
        family: ['child', 'partner', 'parent', 'sibling'],
        social: ['student', 'worker', 'freelancer', 'entrepreneur'],
        self: ['learner', 'creator', 'volunteer', 'explorer']
    };
    
    const result = { family: 0, social: 0, self: 0 };
    
    roles.forEach(role => {
        if (categories.family.includes(role)) result.family++;
        else if (categories.social.includes(role)) result.social++;
        else if (categories.self.includes(role)) result.self++;
    });
    
    return result;
}

/**
 * 获取平衡建议
 */
function getBalanceSuggestions(conflictType) {
    const suggestions = {
        time_conflict: [
            {
                title: '设定工作边界',
                items: [
                    '下班后关闭工作通知',
                    '周末至少半天完全属于自己',
                    '使用番茄工作法提高效率'
                ]
            },
            {
                title: '时间管理技巧',
                items: [
                    '每天留出1小时做自己喜欢的事',
                    '使用日历规划时间',
                    '学会说"不"'
                ]
            }
        ],
        energy_conflict: [
            {
                title: '能量管理',
                items: [
                    '识别高能量时段，用于创造性活动',
                    '工作间隙进行1分钟呼吸练习',
                    '保证充足睡眠'
                ]
            },
            {
                title: '自我关怀',
                items: [
                    '每周至少一次自我奖励',
                    '培养一个不需要消耗能量的爱好',
                    '接受自己的局限'
                ]
            }
        ],
        attention_conflict: [
            {
                title: '注意力分配',
                items: [
                    '为重要关系设定专属时间',
                    '学习时关闭手机通知',
                    '使用注意力训练提升专注力'
                ]
            },
            {
                title: '沟通技巧',
                items: [
                    '与伴侣坦诚沟通压力',
                    '寻求理解和支持',
                    '共同制定时间规划'
                ]
            }
        ],
        expectation_conflict: [
            {
                title: '设定边界',
                items: [
                    '明确表达自己的需求和底线',
                    '学会温和而坚定地拒绝',
                    '与家人沟通自己的处境'
                ]
            },
            {
                title: '寻求支持',
                items: [
                    '与伴侣共同面对家庭压力',
                    '寻求朋友的支持和建议',
                    '必要时寻求专业帮助'
                ]
            }
        ]
    };
    
    return suggestions[conflictType] || suggestions.time_conflict;
}

module.exports = router;
