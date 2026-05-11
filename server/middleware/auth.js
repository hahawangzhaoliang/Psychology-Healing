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

/**
 * 管理员鉴权中间件
 * 支持三种传参方式：
 *   - Header: Authorization: Bearer <adminToken>
 *   - Header: X-Admin-Token: <adminToken>
 *   - Query:  ?adminToken=<adminToken>
 * 管理员令牌存储在 env ADMIN_TOKEN，未配置时开发环境放行
 */
function requireAdmin(req, res, next) {
    // 优先使用环境变量中的 ADMIN_TOKEN，否则使用默认值用于本地开发
    const adminToken = process.env.ADMIN_TOKEN || 'xinqing-admin-2026';

    // 如果使用了默认值，给出警告（仅在开发/测试环境）
    if (!process.env.ADMIN_TOKEN) {
        console.warn('⚠️  警告: 使用默认 ADMIN_TOKEN，请设置环境变量 ADMIN_TOKEN');
    }

    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.replace(/^Bearer\s+/i, '');
    const headerToken = req.headers['x-admin-token'] || '';
    const queryToken = req.query.adminToken || '';
    const token = bearerToken || headerToken || queryToken;

    if (token !== adminToken) {
        return res.status(401).json({
            success: false,
            error: '管理员身份无效，请重新登录',
            code: 'ADMIN_UNAUTHORIZED'
        });
    }

    next();
}

module.exports = { requireSecret, requireVercelCron, requireAdmin };
