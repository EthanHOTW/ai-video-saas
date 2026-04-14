#!/bin/bash
# 推送 Phase 2 完整功能：n8n 串接 + Stripe 付款
cd "$(dirname "$0")"

git add -A
git commit -m "feat: n8n pipeline 串接 + Stripe 付款整合

- 新增 Supabase admin client（service role key，給 webhook 用）
- 修復 /api/callback：Bearer token 驗證、credit 退還邏輯
- /api/generate 增加 user_id + callback_secret 到 n8n payload
- 新增 Stripe checkout session API（/api/stripe/checkout）
- 新增 Stripe webhook handler（/api/stripe/webhook）
- 新增 Stripe customer portal（/api/stripe/portal）
- 方案頁面串接真實 Stripe 結帳流程
- 設定頁面新增「管理訂閱」按鈕
- 新增 .env.example 環境變數範本"

git push origin main
echo ""
echo "✅ 推送完成！"
echo ""
echo "📋 接下來你需要設定以下環境變數（在 Vercel 和 .env.local）："
echo "  SUPABASE_SERVICE_ROLE_KEY"
echo "  API_CALLBACK_SECRET"
echo "  STRIPE_SECRET_KEY"
echo "  STRIPE_WEBHOOK_SECRET"
echo "  STRIPE_STARTER_PRICE_ID"
echo "  STRIPE_PRO_PRICE_ID"
