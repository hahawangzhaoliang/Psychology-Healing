/**
 * 认证中间件
 * 统一处理 API 密钥/Secret 验证，避免各路由重复实现
 */

/**
 * Cron/内部接口密钥校验
 * 支持两种传参方式：
 *   - Header: Authorization: Bearer <secret>
 *   - Query:  ?secret=<secret>
 */
function requireSecret(req, res, next) {
    const secret = process.env.KNOWLEDGE_UPDATE_SECRET;

    // 未配置密钥时，生产环境拒绝访问，非生产环境放行（方便本地调试）
    if (!secret || secret === 'your-secret-key') {
        if (process.env.NODE_ENV === 'production') {
            return res.status(500).json({
                success: false,
                error: '服务器未正确配置访问密钥',
                code: 'CONFIG_ERROR'
            });
        }
        // 开发环境不强制密钥
        return next();
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '') || req.query.secret;

    if (token !== secret) {
        return res.status(401).json({
            success: false,
            error: '未授权访问',
            code: 'UNAUTHORIZED'
        });
    }

    next();
}

/**
 * Vercel Cron Jobs 专用校验
 * Vercel 会在 Cron 请求中注入 Authorization: Bearer <CRON_SECRET>
 * 参考：https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
 */
function requireVercelCron(req, res, next) {
    // 优先使用 requireSecret 逻辑
    return requireSecret(req, res, next);
}

module.exports = { requireSecret, requireVercelCron };
