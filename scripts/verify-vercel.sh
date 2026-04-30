#!/bin/bash
# Vercel 部署后验证脚本

echo "=========================================="
echo "Vercel 知识库更新验证指南"
echo "=========================================="

echo ""
echo "1️⃣  部署后检查 Cron 配置"
echo "   访问: https://vercel.com/your-username/xinqing-space/settings/cron"
echo "   确认定时任务已创建"
echo ""

echo "2️⃣  手动触发更新测试"
echo "   替换 YOUR_DOMAIN 和 YOUR_SECRET 后执行:"
echo ""
echo "   curl \"https://YOUR_DOMAIN.vercel.app/api/knowledge/cron-update?secret=YOUR_SECRET\""
echo ""

echo "3️⃣  检查更新结果"
echo "   curl \"https://YOUR_DOMAIN.vercel.app/api/knowledge/health\""
echo ""

echo "4️⃣  查看知识库统计"
echo "   curl \"https://YOUR_DOMAIN.vercel.app/api/knowledge\""
echo ""

echo "5️⃣  查看 Vercel 日志"
echo "   访问: https://vercel.com/your-username/xinqing-space/logs"
echo "   搜索 'cron-update' 查看定时任务执行日志"
echo ""

echo "=========================================="
echo "预期响应示例"
echo "=========================================="
echo ""
echo "成功响应:"
echo '{
  "success": true,
  "message": "知识库更新成功",
  "duration": "4.2秒",
  "statistics": {
    "totalItems": 50,
    "exercises": 13,
    "knowledge": 7,
    "regulations": 6,
    "tips": 24
  }
}'
echo ""
echo "失败响应 (密钥错误):"
echo '{
  "success": false,
  "error": "未授权访问",
  "code": "UNAUTHORIZED"
}'
