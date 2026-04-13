#!/bin/bash
# 推送沙色主題 + 繁體中文更新到 GitHub
cd "$(dirname "$0")"

git add -A
git commit -m "feat: 全站改版 — 繁體中文 + 沙色主題 + 深淺模式切換 + 頁面轉場動畫

- 所有頁面文字改為繁體中文
- 新增沙色 (Sand) 配色主題取代藍灰色調
- 新增深色/淺色模式切換 (ThemeToggle)
- 新增由左到右頁面切換動畫 (PageTransition)
- 新增 ThemeProvider context + localStorage 記憶偏好"

git push origin main
echo ""
echo "✅ 推送完成！Vercel 將自動部署。"
echo "🌐 部署完成後請至 https://ai-video-saas-virid.vercel.app 確認"
