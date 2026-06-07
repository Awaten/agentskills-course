# VitePress 網站開發紀錄

> 專案：Agent Skills 實戰課程文件站
> 目標：leo-laboratory.com/agentskills/
> 開始：2026-06-07
> 平台：VitePress + Vercel

---

## 架構決策

### 為何分離 website/ 和 agentskills-course/
- `agentskills-course/` 是內容的 source of truth
- `website/` 是 VitePress 專案，有自己的路由、導覽、圖片路徑需求
- 兩者分離可各自演化，互不干擾
- 未來可寫 Python sync 腳本自動從 source 同步到 website

### 為何選 VitePress 而非 Docusaurus
- Node.js 生態（與專案一致）
- 預設主題簡潔，零客製就能好看
- 檔案路由直覺（.md → .html）
- Vercel 原生支援

### 為何用 Vercel 而非 GitHub Pages
- leo-laboratory.com 已在 Vercel（或可設定）
- 支援 clean URLs、自訂 header
- 自動部署（git push → build → deploy）

---

## 任務時間表

| Task | 內容 | 狀態 | 備註 |
|------|------|------|------|
| Task 1 | 初始化 VitePress 專案 | ✅ | npm install vitepress, 127 packages |
| Task 2 | 設定 .vitepress/config.js | ✅ | sidebar (秘笈+課程), nav, search, branding |
| Task 3 | 寫 index.md 首頁 | ✅ | Hero page with feature cards, CTA |
| Task 4 | 寫 study-guide.md 學習路線圖 | ✅ | 3 條學習路徑, 難度選擇表 |
| Task 5 | 轉換秘笈 6 篇 | ✅ | Subagent 平行轉換, prev/next 導航 |
| Task 6 | 轉換課程 17 章 | ✅ | Subagent 平行轉換, Ch1→Ch17 串接 |
| Task 7 | 品牌 + 聯盟 + CSS | ✅ | custom.css, 資源頁 (Vercel/FireCrawl) |
| Task 8 | Vercel 部署設定 | ✅ | vercel.json ready |
| Task 9 | 本地建置測試 | ✅ | Build 成功, dist/ 輸出正常 |

## 檔案結構總覽

```
website/
├── .vitepress/
│   ├── config.js          # VitePress 主設定
│   ├── dist/              # 建置輸出 (git ignore)
│   ├── cache/             # 開發快取 (git ignore)
│   └── theme/
│       ├── custom.css     # Leo Lab 品牌樣式
│       └── index.js       # 主題入口
├── public/                # 靜態資源
├── index.md               # 首頁
├── study-guide.md         # 學習路線圖
├── 秘笈/                  # 6 篇秘笈 (故事風)
├── 課程/                  # 17 章課程 (教學風)
├── 資源/
│   └── tools.md           # 推薦工具 + 聯盟連結
├── package.json
├── vercel.json            # Vercel 部署設定
└── DEVELOPMENT_LOG.md     # 本開發紀錄
```

---

## 技術堆疊

- **VitePress**: 2.x (latest)
- **Node.js**: 20+
- **部署**: Vercel
- **域名**: leo-laboratory.com/agentskills/
- **Base path**: `/agentskills/`

---

## 聯盟行銷連結

| 工具 | 連結格式 | 放置位置 |
|------|---------|---------|
| Vercel | vercel.com/affiliates (待確認) | 課程/02-01 部署章節 |
| FireCrawl | firecrawl.com/affiliates (待確認) | 課程/05-02 API 整合章節 |

---

## 變更記錄

| 日期 | 變更 | 原因 |
|------|------|------|
| 2026-06-07 | 建立開發紀錄 | 專案起始 |
| 2026-06-07 | Fix: 03-01-best-practices.md 巢狀 code fence | Vue template compilation error; 改用 4-backtick 外層 |
| 2026-06-07 | Phase A 全部完成，build 通過 | 23 篇文章 + config + CSS + vercel.json
