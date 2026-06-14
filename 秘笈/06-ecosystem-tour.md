---
title: "秘笈 S6：生態系速覽 + agentskill.sh 導航 — 30+ 平台，一個 Skill 到處用"
description: "Agent Skills 生態系全景 — 30+ 平台支援、agentskill.sh 技能商店、Skillsets、Skills vs MCP 對比、開放標準（Open Standard）的重要性。"
outline: [2, 3]
---

# 秘笈 S6：生態系速覽 + agentskill.sh 導航 — 30+ 平台，一個 Skill 到處用

---

去年底，我做了一件事。

我把同一個 SKILL.md 檔案，複製到 Claude Code 的 `.claude/skills/`、Cursor 的 `.cursor/skills/`、Copilot 的 `.github/skills/`，還有 OpenCode 的 `.opencode/skills/`。

全部都能用。

不是「理論上相容」，不是「改幾行才能跑」。**同一個檔案，不用改任何東西。**

這是我當時的真實反應：*Wait, this actually works?*

[IMAGE: 四格截圖並排 — 同一個 SKILL.md 分別在 Claude Code、Cursor、Copilot CLI、Gemini CLI 中被載入和使用的畫面]

---

## 30+ 平台，圖譜長這樣

先給你全景圖。目前支援 Agent Skills 的平台，按照生態位排列：

**一線平台（原生支援）：**
- **Claude Code** — `skills/` 目錄自動掃描。Anthropic 親兒子，支援最完整。
- **Cursor** — `.cursor/skills/`，Agent 模式直接吃。
- **GitHub Copilot CLI** — `.github/skills/`，有專用 `skill` 指令工具。
- **Gemini CLI** — 透過 `activate_skill` 動態載入。
- **OpenCode** — `.opencode/skills/`，可在對話中即時載入。

**生態擴充（積極整合中）：**
- **Codex CLI** — `.agents/skills/`
- **Windsurf** — 正加入 Agent Skills 支援
- **Cline**、**Roo Code**、**Continue.dev** — 開源社群快速跟進
- **Copilot for Xcode**、**Amazon Q Developer** — 平台級整合

總數：**30+ 平台**。而且每個月都在增加。

> **寫一次 Skill，30 個平台都能用。這不是未來，是現在。**

---

## 各平台的 Skills 目錄，一張表看懂

| 平台 | 目錄路徑 | 載入方式 |
|------|---------|---------|
| Claude Code | `.claude/skills/` | 自動掃描 |
| Cursor | `.cursor/skills/` | Agent 模式自動載入 |
| GitHub Copilot CLI | `.github/skills/` | `skill` 指令工具 |
| Gemini CLI | （設定檔指定） | `activate_skill` |
| OpenCode | `.opencode/skills/` | 原生載入 + Tool 呼叫 |
| Codex CLI | `.agents/skills/` | 自動偵測 |

共通規則：**把 SKILL.md 放進對的目錄，Agent 就學會了。** 沒有安裝步驟，沒有環境變數，沒有註冊金鑰。

[IMAGE: 平台相容圖，中央一個 SKILL.md 檔案，周圍放射狀連接 6 個平台的 logo，箭頭標示「同一個檔案，到處都能用」]

---

## agentskill.sh：你的技能商店

但你不需要自己去 GitHub 挖技能。2026 年初，社群推出了 **agentskill.sh** — Agent Skills 的命令列商店。

用法長這樣：

```bash
# 瀏覽熱門技能
agentskill.sh search "code review"

# 查看技能詳情
agentskill.sh info code-review

# 安裝單一技能
agentskill.sh install code-review

# 一次安裝一整套
agentskill.sh install-skillset web-development

# 列出已安裝技能
agentskill.sh list
```

它做了三件事：
1. **搜尋** — 跨 48 個來源倉庫、2,600+ 技能全文檢索，支援模糊比對和熱門排序
2. **安裝** — 自動下載原始碼、放到正確目錄、顯示使用說明
3. **Skillsets** — 一次安裝一整套相關技能，不用一個一個找

另外還有 `agentskill.sh publish` — 讓你可以把你寫好的技能發布到市集。沒錯，你不只是消費者，也可以是貢獻者。

> **agentskill.sh 之於 Agent Skills，就像 apt-get 之於 Linux、npm 之於 JavaScript。**

### Skillsets：為什麼是 game changer？

單一技能解決單一問題。但真實開發流程需要多個技能協同。

一個 **Skillset** 就是一組技能的集合，發布在 agentskill.sh 上，一條指令安裝完畢：

```bash
# 安裝 Python 開發者工具包
agentskill.sh install-skillset python-dev

# 裡面包含：
# - python-package-management（套件管理最佳實務）
# - python-testing-pytest（測試寫法與慣例）
# - python-debugging（疑難排解檢查清單）
# - dockerfile-best-practices（容器化部署）
# - api-design-restful（設計 REST API）
```

不用一個一個裝。不用煩惱哪些技能搭配最好。Skillset 的維護者已經幫你配好了。

Skillsets 的出現，讓 Agent Skills 從「寫程式的小幫手」進化成「完整開發環境的知識層」。**裝一個 skillset，Agent 就懂你整個技術棧。**

[IMAGE: agentskill.sh 的 terminal 執行畫面，展示 search、install、install-skillset 三條指令的輸出，下方放大顯示 skillset 安裝過程]

---

## GitHub 上的三大技能倉庫

如果你偏好直接逛 GitHub，這三個地方值得 bookmark：

### 1. anthropics/skills（官方）
Anthropic 官方維護的技能集合。品質最高，範例最完整。適合學習 SKILL.md 的正確寫法。

### 2. addyosmani/agent-skills（48K ⭐）
前端大神 Addy Osmani 的專案。集結了社群貢獻的數百個技能，從 Python 除錯到 Docker 部署都有。**48K stars — 這是整個生態系最受關注的倉庫。**

### 3. getsentry/skills（480+ 技能）
Sentry 團隊開源的技能大集合。目前 **480+ 技能**，覆蓋從前端開發到後端維運的廣泛領域。品質一致性最高（同一團隊維護）。

另外還有 **agentskills/agentskills**（~20K stars）— 這是規格的本體，不是技能集合，而是定義「什麼是 Agent Skills」的開放標準。如果你要自己開發平台整合，這就是你的 spec。

> ⚠️ 這些數字是我寫稿時的快照。以這個生態的增長速度，你看到這篇時，每個數字都可能已經更高了。

## Skills vs MCP：到底差在哪？

這可能是 Agent Skills 生態系最常被問的問題。直接說結論：

| | Skills | MCP |
|---|---|---|
| **角色** | 專業知識封裝（Knowledge Encapsulation） | 外部系統連接 |
| **本質** | .md 文字指令 | 通訊協定（JSON-RPC） |
| **告訴 Agent** | 怎麼做這件事 | 怎麼連那個 API |
| **需要寫程式** | 不用 | 要（寫 Server） |
| **資料** | 內部知識 | 外部資料 |

實際運作是這樣的：

```
Agent
  ├── Skills（讀 SKILL.md → 知道流程）
  └── MCP Client（連 to MCP Server → 存取資料庫 / API）
```

**Skills 告訴 Agent「做什麼、怎麼做」，MCP 告訴 Agent「怎麼拿資料、怎麼呼叫外部工具」。兩者互補，不是競爭。**

你可以有個 `deploy-to-aws` 的 Skill，裡面呼叫了 MCP 的 `aws-cli` 工具來實際執行部署。Skills 是劇本，MCP 是道具。

> **Skills 是腦，MCP 是手。腦要指揮手，但腦跟手是不同的器官。**

[IMAGE: Agent Skills vs MCP 對比圖，左邊是 SKILL.md（流程圖），右邊是 MCP（從 Agent 連到外部系統的箭頭圖），中間一個箭頭寫「互補」]

---

## 開放標準 — 為什麼這很重要

Agent Skills 是開放標準。意思是你可以在任何平台上用，不用擔心被鎖在某個生態系。

標準的維護者在 **[github.com/agentskills/agentskills](https://github.com/agentskills/agentskills)**：

- 規格文件是 MIT 授權
- 任何人都可以提案修改
- 任何平台都可以實作
- 你的技能檔案就是你的資產，不屬於任何平台

對比一下：

| | 封閉生態 | Agent Skills（開放）|
|---|---|---|
| **技能格式** | 綁特定平台 | 純文字 Markdown |
| **跨平台** | ❌ 不行 | ✅ 30+ 平台 |
| **供應商鎖定（Vendor Lock-in）** | ❌ 會被綁住 | ✅ 你的檔案你帶走 |
| **社群貢獻** | 受限 | ✅ 任何人可參與 |

這是為什麼我覺得這東西有機會成為**事實標準**。不是因為它技術最先進，而是因為它輕到沒有任何平台有理由拒絕支援。

---

## 說說我的感受

寫完這六篇秘笈，我想分享一個觀察。

**Agent Skills 生態系正在爆炸式成長，但大部分人還沒意識到。**

細節：
- 2025 年底 Anthropic 發布規格時，只有 Claude Code 支援
- 2026 年初，30+ 平台已經相容
- GitHub 上的技能數量從幾百暴增到 2,600+
- agentskill.sh 讓安裝技能變成一條指令
- getsentry 這樣的企業開始交付 480+ 技能的集合

成長曲線不是線性的。是指數的。

我認為接下來半年會發生三件事：
1. **Skillsets 成為標準** — 不是單一技能，而是「Python 開發者工具包」、「前端工程師必備」這樣的主題包
2. **企業內部技能市集** — 公司把自己的 SOP 寫成 Skills，放進私有 registry
3. **Agent Skills 變成履歷加分項** — 就像今天會寫 Dockerfile 是加分，未來「會寫 SKILL.md」會是同樣的定位

---

## 最終 CTA：這只是開始

六篇秘笈，從 S1 的基本概念到你現在看到的生態全景。

- **S1**：Agent Skills 是什麼、為什麼你需要它
- **S2**：SKILL.md 格式，3 分鐘看懂
- **S3**：描述詞優化 — description 怎麼寫才會被觸發
- **S4**：7 個寫出高效 Instructions 的套路 — 讓 Agent 第一次就做對
- **S5**：從零到發布 — 一顆骰子 Skill 的完整實戰
- **S6**（這篇）：生態系速覽 + agentskill.sh 導航

回顧整個系列，我們走過了很長的路：

```
S1 ─ 什麼是 Agent Skills ─────── 概念與定位
S2 ─ SKILL.md 格式 ──────────── 規格與欄位
S3 ─ Description 觸發優化 ─────── 讓 Agent 找對技能
S4 ─ 7 種 Instructions 套路 ────── 讓 Agent 第一次就做對
S5 ─ 骰子 Skill 實戰 ──────────── 從零到發布
S6 ─ 生態系全景 ──────────────── 你在這裡
```

你已經掌握了 Agent Skills 的完整知識地圖。

到目前為止你看到的，只是冰山一角。如果你想更深入，我準備了完整的 **「Agent Skills 實戰線上課程」** ：

- 6 小時錄播 + 可下載教材
- 從零開始寫出你的第一個 Production-grade Skill
- 包含 Skillset 設計、測試框架、CI/CD 整合
- **限量早鳥 5 折**（前 100 名）

**[👉 點此查看課程詳情]**（連結籌備中，預計 2026 Q3 開放）

如果你還想繼續免費探索：
- 逛逛 [agentskills.io](https://agentskills.io) — 官方規格文件
- 試試 `agentskill.sh search` — 看看社群已經寫了哪些技能
- Fork 一個你喜歡的開源技能，改成你自己的版本

**Agent Skills 不會取代工程師。但它會讓懂它的工程師，比不懂的強十倍。**

而你，已經讀完了整套極速學習秘笈。剩下的，就是動手寫。

---

<!--
Written in MIT学霸 story-driven style
Part 6 of 6 in "Agent Skills 極速學習秘笈" series
S6: Ecosystem Overview + agentskill.sh Navigation
-->

> 📚 準備深入？繼續閱讀 [完整課程 Ch1：Agent Skills 是什麼？](/課程/01-01-what-are-agent-skills)

---

<div class="vp-doc-navigation">
  <div class="nav-links">
    <a href="/秘笈/05-zero-to-publish" class="prev">
      ← S5：從零到發布實戰
    </a>
    <a href="/課程/01-01-what-are-agent-skills" class="next">
      → 繼續深入？完整課程 Ch1 →
    </a>
  </div>
</div>

<style scoped>
.vp-doc-navigation {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--vp-c-divider);
}
.nav-links {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}
.nav-links a {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}
.nav-links a:hover {
  color: var(--vp-c-brand-2);
}
</style>
