/**
 * 请求参数校验中间件工厂
 * 提供轻量级的请求体和查询参数校验
 */

/**
 * 校验请求体必填字段
 * @param {string[]} fields - 必填字段名列表
 */
function requireFields(...fields) {
    return (req, res, next) => {
        const missing = fields.filter(f => {
            const val = req.body[f];
            return val === undefined || val === null || val === '';
        });

        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                error: `缺少必填字段: ${missing.join(', ')}`,
                code: 'MISSING_FIELDS',
                fields: missing
            });
        }

        next();
    };
}

/**
 * 将查询参数转换为整数（带默认值和范围限制）
 * 挂载后在 req.pagination 上提供 { page, limit, offset }
 * @param {{ defaultLimit?: number, maxLimit?: number }} options
 */
function parsePagination(options = {}) {
    const { defaultLimit = 20, maxLimit = 100 } = options;

    return (req, _res, next) => {
        const page   = Math.max(1, parseInt(req.query.page,   10) || 1);
        const limit  = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit, 10) || defaultLimit));
        const offset = parseInt(req.query.offset, 10) || (page - 1) * limit;

        req.pagination = { page, limit, offset };
        next();
    };
}

module.exports = { requireFields, parsePagination };
