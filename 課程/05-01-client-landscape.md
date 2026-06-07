---
title: "第 13 章 — Agent Skills 平台生態總覽"
description: "了解 Agent Skills 三層平台架構（Tier 1/2/3）、五大主流平台差異、progressive disclosure 原理，以及如何為團隊選擇最適合的 AI 代理人平台。"
outline: [2, 3]
---

# 第 13 章 — Agent Skills 平台生態總覽

> **學習時數**：60 分鐘 ｜ **難度**：基礎 ｜ **適用版本**：agentskills.io spec v1.0（2026）

---

## 學習目標

完成本章後，你將能夠：

1. **分辨** Agent Skills 生態的三層平台架構（Tier 1/2/3），並說明各層的關鍵差異
2. **對照** 五大主流平台（Claude Code、Cursor、Copilot、Gemini CLI、Codex）的技能安裝流程與行為特色
3. **解釋** progressive disclosure（漸進式揭露）如何讓代理人在大量技能中維持低語境成本
4. **操作** 至少三種不同的安裝方式：手動複製、CLI 安裝、Marketplace 安裝
5. **評估** 不同平台對你的開發工作流程的適合度，並做出有依據的選擇
6. **描述** agentskills.io 開放標準的演進歷程與生態意義

---

## 13.1 生態全景：從邊緣功能到核心基礎設施

如果你在 2024 年問一位開發者「你的 AI 程式碼助手用什麼技能？」，對方大概會滿臉問號。那時候，技能（skills）只是 Claude Code 一個實驗性的小功能，多數人甚至不知道它的存在。

到了 2026 年中，情況完全不同。

截至 2026 年 6 月，**超過 35 個平台** 以某種形式支援 Agent Skills 格式，從終端機代理人（terminal agents）到 IDE、從雲端平台到手機應用程式。agentskill.sh 目錄收錄了 **110,000 項以上的技能**，而光是 Awesome Agent Skills 精選集就涵蓋了 1,400 多項由官方團隊（Anthropic、Google、Vercel、Stripe、Microsoft⋯⋯）與社群貢獻的技能。

這不是曇花一現的趨勢，而是 AI 開發工具基礎設施的典範轉移。

為什麼？因為 Agent Skills 解決了一個根本問題：**通用 LLM 缺乏專業工作流程的上下文**。最強的模型在不了解你的團隊慣例、框架版本、程式碼風格或部署流程時，仍然會做出荒謬的建議。技能把這些隱性知識包裝成可版本控制、可發現、可跨平台移植的指令集。

> **⚠️** 生態仍在快速變化中。本章描述的平台功能基於 2026 年中旬的狀態。新平台每月都在增加，既有平台的支援深度也在持續演進。建議將本章視為理解生態架構的框架，而非靜態的產品對照表。

---

## 13.2 三層平台架構

整個 Agent Skills 生態可以歸納為三個 tier，每個 tier 代表不同的整合深度與開發者體驗。

### 13.2.1 Tier 1 — 原生整合（Native Integration）

這些平台的技能系統是 **核心功能**，由產品團隊官方開發與維護。使用者不需要額外外掛或 hack 就能使用技能。

| 平台 | 開發者 | 技能目錄 | 安裝方式 |
|------|--------|----------|----------|
| **Claude Code** | Anthropic | `~/.claude/skills/`、`.claude/skills/` | 手動複製、Plugin Marketplace、`/learn` |
| **Cursor** | Anysphere | `~/.cursor/skills/`、`.cursor/skills/` | 手動複製、`/learn`（v2.4+） |
| **GitHub Copilot** | Microsoft/GitHub | `~/.github/skills/` | 手動複製、GitHub Marketplace |
| **Gemini CLI** | Google | `gemini extensions` | `gemini extensions install` |
| **OpenAI Codex** | OpenAI | `AGENTS.md` 機制 | 放入專案根目錄 |

**Claude Code** 是這個領域的先驅。Anthropic 在 2025 年初推出了最初的技能格式，隨後將其開放為 agentskills.io 標準。Claude Code 的技能系統成熟度最高：支援 Plugin Marketplace、`/learn` 指令、以及全球／專案層級的目錄配置。當技能 description 與使用者任務語意匹配時，Claude Code 會自動載入對應的 `SKILL.md`——這是所謂的 **LLM-based routing**。

**Cursor** 在 v2.4 版本中加入了完整的技能支援。它不僅讀取自己的 `~/.cursor/skills/` 目錄，也會向後相容檢查 `~/.claude/skills/`——這是一個重要的生態訊號：平台之間正在互相相容。

**GitHub Copilot** 在 2026 年初正式支援 Agent Skills。安裝路徑為 `~/.github/skills/`，並整合 GitHub Marketplace 的生態系統。如果你已經在 GitHub 生態中，Copilot 的技能是最無痛的選擇。

**Gemini CLI** 走的是「擴充（extensions）」路線，技能以 extension 形式安裝：`gemini extensions install <repo-url> --consent`。Google 官方有提供一組 Gemini 品牌技能（如 `gemini-extension.json`）。

**OpenAI Codex** 採用最簡潔的做法：透過 `AGENTS.md` 檔案載入技能。將 `SKILL.md` 的內容嵌入或參考到 `AGENTS.md` 中，Codex CLI 就會在啟動時讀取。這種方式門檻最低，但缺少 progressive disclosure 的精細控制。

### 13.2.2 Tier 2 — 社群整合（Community Integration）

這些平台的技能支援由社群驅動，或者產品團隊將其視為重要但非核心的功能。技能系統「完整可用」，但可能需要一些額外設定。

| 平台 | 支援方式 | 備註 |
|------|----------|------|
| **OpenCode** | 原生 `SKILL.md` 支援 | 自動上下文路由（React→React skills） |
| **Windsurf** | `.windsurf/` 目錄 | Codeium 出品，免費方案完整 |
| **Cline** | VS Code 外掛 | 社群維護，MCP + Skills 並行 |
| **Goose** | Block 出品 | 內建 skills 系統，多 LLM 支援 |
| **Roo Code** | VS Code 外掛 | 內建 skills，支援 AGENTS.md |
| **Continue.dev** | VS Code / JetBrains | 自訂指令串接技能 |

**OpenCode** 是值得特別關注的案例。作為開源社群最受歡迎的終端代理人（GitHub 95,000+ stars），它不僅原生支援 `SKILL.md`，還實作了 **自動上下文路由**：當你的工作目錄是 React 專案時，React 相關技能會被優先觸發；切換到 Python 專案時，Python 技能自動接手。這個機制大幅減少了技能之間的干擾。

> **⚠️** Tier 2 平台的技能支援深度可能因版本而異。建議在安裝技能前先查閱各平台的最新文件，確認你使用的版本有完整的 SKILL.md 支援，而不只是 AGENTS.md 的簡單載入。

### 13.2.3 Tier 3 — 可擴充（Extensible）

這些平台本身不直接支援 SKILL.md，但透過外掛系統、自訂指令或 `AGENTS.md` 達到等效功能。

| 平台 | 實現方式 |
|------|----------|
| **VS Code** | Copilot Chat extensions + `.github/skills/` |
| **JetBrains (Junie)** | Junie 內建 skills + JetBrains Marketplace |
| **Obsidian** | Copilot 外掛 + 自訂指令集 |
| **Trae** | ByteDance 出品，官方支援 skills |
| **Zed** | 支援 `skills/` 目錄 |
| **Replit** | 透過 Agent 設定載入 |

如果你的團隊已經綁定某個 IDE（例如 JetBrains 生態），Tier 3 的支援方式讓你不必為了技能而更換工具。但要注意：這些平台的技能載入通常是 **靜態的**——也就是在系統提示詞中預先塞入所有指令，而非 progressive disclosure。這代表技能數量過多時可能吃掉大量上下文視窗。

---

## 13.3 平台目錄對照：技能放在哪裡？

不同平台對技能目錄的約定各不相同。以下是快速查詢表：

| 平台 | 全域目錄 | 專案層級目錄 | 備註 |
|------|----------|-------------|------|
| Claude Code | `~/.claude/skills/` | `.claude/skills/` | 兩者皆支援 |
| Cursor | `~/.cursor/skills/` | `.cursor/skills/` | 也讀 `.claude/skills/` |
| GitHub Copilot | `~/.github/skills/` | `.github/skills/` | 整合 Marketplace |
| OpenCode | `~/.config/opencode/skills/` | `.opencode/skills/` | 開源社群標準 |
| Windsurf | `~/.windsurf/skills/` | `.windsurf/skills/` | Codeium 生態 |
| Cline | `~/.cline/skills/` | `.cline/skills/` | VS Code 外掛目錄 |

一個值得注意的趨勢是：**跨平台相容正在成為常態**。Cursor 會讀取 Claude Code 的技能目錄；部分平台會檢查多個目錄來確保技能不被遺漏。你放在 `.claude/skills/` 的技能，很可能在多個平台上都能運作。

---

## 13.4 安裝模式：三種主要路徑

### 13.4.1 手動複製（Manual Copy）

最直接的方式。將技能資料夾複製到對應平台的技能目錄即可。

```bash
# Claude Code（專案層級—推薦團隊使用）
cp -r my-skill .claude/skills/

# Claude Code（全域—個人偏好）
cp -r my-skill ~/.claude/skills/

# Cursor
cp -r my-skill ~/.cursor/skills/

# OpenCode
cp -r my-skill .opencode/skills/
```

**優點**：完全離線可用、精準控制版本、無需網路權限。**缺點**：管理多個技能時容易混亂，更新需手動處理。

### 13.4.2 CLI 安裝（CLI Install）

適合需要頻繁安裝、更新技能的使用者。

```bash
# 跨平台通用（agentskill.sh）
npx @agentskill.sh/cli@latest setup

# 搜尋並安裝
/learn react-testing

# 指定技能安裝
/learn @anthropic/seo-content-optimizer

# Gemini CLI 擴充安裝
gemini extensions install https://github.com/org/repo.git --consent

# Claude Code Plugin Marketplace
/plugin marketplace add https://agentskill.sh/marketplace.json
/plugin install learn@agentskill-sh
```

**優點**：自動化、版本追蹤、安全掃描。**缺點**：需要網路、依賴 CLI 工具版本。

### 13.4.3 Marketplace / Registry

集中式技能市場，提供搜尋、評分、安全審計等功能。

| 平台 | 技能數量 | 特色 |
|------|---------|------|
| **agentskill.sh** | 110,000+ | 安全評分（0-100）、/learn 指令整合 |
| **skills.sh**（Vercel） | 精選 | `npx skills` CLI 工具 |
| **Awesome Agent Skills** | 1,400+（精選） | 手動篩選，無 AI 生成垃圾 |
| **LobeHub Marketplace** | 100,000+ | 最大規模技能市場之一 |
| **Tessl Registry** | 企業級 | 自動技能審查與優化建議 |

---

## 13.5 行為差異：各平台如何處理技能？

不是所有平台的技能行為都相同。以下是關鍵差異：

### 技能路由（Skill Routing）

- **Claude Code**：LLM 根據任務描述與技能的 `description` 欄位進行語義比對。你無法強制載入某個技能——模型自己判斷何時需要。
- **OpenCode**：根據專案類型自動路由。偵測到 `package.json` 有 React 依賴，就優先活化 React 技能。
- **Gemini CLI**：需要明確安裝擴充，安裝後在適當情境中自動啟用。
- **Codex CLI**：啟動時將所有 `AGENTS.md` / 技能內容注入系統提示詞。沒有動態路由——所有技能始終在 context 中。
- **Cursor**：類似 Claude Code 的語義路由，加上部分向後相容。

### 語境載入策略

所有主流平台都採用 **progressive disclosure（漸進式揭露）**，但實踐細節不同：

1. **Discovery（發現）**：啟動時僅載入技能的 `name` 與 `description`——大約 100 tokens 的技能。即使有 50 個技能，初始 context 也只增加約 5,000 tokens。
2. **Activation（活化）**：當任務與某個技能描述匹配時，代理人讀取完整的 `SKILL.md`（建議控制在 5,000 tokens 以下）。
3. **Execution（執行）**：必要時載入 `scripts/`、`references/`、`assets/` 中的檔案。

> **⚠️** Codex CLI 的 `AGENTS.md` 方式不支援嚴格意義的 progressive disclosure——所有內容在啟動時就載入了。如果你的技能數量很多，這可能導致 context 迅速膨脹。這是選擇平台時需要考慮的權衡。

### 安全模型

- **agentskill.sh**：伺服器端掃描 12 類威脅（命令注入、資料外洩、憑證竊取等），安裝前二次客戶端驗證。
- **Claude Code Plugin Marketplace**：官方驗證流程，但社群技能仍需謹慎。
- **社群來源**：無強制安全檢查。**基本原則**：從未經驗證的來源安裝技能前，手動閱讀 `SKILL.md` 檢查有無可疑指令。

---

## 13.6 [DIAGRAM: 生態地圖 — 平台分層架構]

```
┌─────────────────────────────────────────────────────────────┐
│                Agent Skills 平台生態地圖（2026）                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Tier 1 — 原生整合 (Native)               │    │
│  │                                                      │    │
│  │   Claude Code    Cursor    GitHub Copilot             │    │
│  │   Gemini CLI     OpenAI Codex                        │    │
│  │                                                      │    │
│  │   特色：官方維護 // 核心功能 // 深度整合                │    │
│  └─────────────────────────────────────────────────────┘    │
│                           ↕                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Tier 2 — 社群整合 (Community)               │    │
│  │                                                      │    │
│  │   OpenCode    Windsurf    Cline    Goose              │    │
│  │   Roo Code    Continue.dev                           │    │
│  │                                                      │    │
│  │   特色：社群驅動 // 完整可用 // 需額外設定               │    │
│  └─────────────────────────────────────────────────────┘    │
│                           ↕                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            Tier 3 — 可擴充 (Extensible)               │    │
│  │                                                      │    │
│  │   VS Code       JetBrains/Junie    Obsidian           │    │
│  │   Trae          Zed                Replit             │    │
│  │                                                      │    │
│  │   特色：外掛橋接 // 靜態載入 // 生態綁定               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 技能供給層 (Supply)                    │    │
│  │                                                      │    │
│  │   agentskill.sh (110K+)     Awesome Skills (1.4K+)    │    │
│  │   skills.sh (Vercel)       LobeHub (100K+)           │    │
│  │   GitHub Directories       Tessl Registry            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              標準層 (Standard)                        │    │
│  │                                                      │    │
│  │   agentskills.io spec (v1.0)                         │    │
│  │   Linux Foundation Agentic AI Foundation             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**圖 13-1：Agent Skills 平台生態地圖**。從下往上看：標準層定義格式 → 技能供給層提供內容 → 三層平台以不同深度整合。

---

## 13.7 Skillsets：一次安裝多個技能

「我該安裝哪些技能？」是新手最常見的問題。agentskill.sh 提供了解決方案：**Skillsets（技能組合包）**。

```bash
# 安裝所有官方技能（跨平台檢測 + 選擇性安裝）
npx @agentskill.sh/cli@latest setup
```

這個指令會：
1. 自動偵測你已安裝哪些 AI 代理人平台
2. 讓你選擇要安裝到哪些平台
3. 建立正確的 symlink 到各平台的技能目錄
4. 安裝 `/learn`、`/review-skill` 等官方技能

安裝完成後，你可以在對話中直接使用：

```
/learn @anthropic/seo-content-optimizer
```

代理人會搜尋 110,000+ 項技能，建議最佳匹配，並在確認後安裝。整個過程在同一個對話中完成，不需中斷工作流程。

---

## 13.8 開放標準演進：agentskills.io 的故事

Agent Skills 不是一家公司的產品——它是一個 **開放標準**。

### 發展時間軸

| 時間 | 事件 |
|------|------|
| 2024 年 11 月 | Anthropic 發表 MCP 規格 |
| 2025 年 Q1 | Claude Code 推出 Skills 功能（最初為 Claude Code 專屬格式） |
| 2025 年 Q2 | OpenAI Codex CLI 採用類似格式 |
| 2025 年 Q3 | Google Gemini CLI 加入，支援擴充系統 |
| 2025 年 Q4 | Anthropic 將格式開放為 agentskills.io |
| 2026 年 1 月 | MCP 捐贈至 Linux Foundation Agentic AI Foundation |
| 2026 年 3 月 | agentskills.io 正式成為生態公認的開放標準 |
| 2026 年 5 月 | 35+ 平台支援，agentskill.sh 技能數突破 110,000 |

### 規格核心要點

一個 Agent Skill 的本質是一個包含 `SKILL.md` 檔案的資料夾：

```
skill-name/
├── SKILL.md          # 必要：YAML frontmatter + Markdown 指令
├── scripts/          # 選用：可執行程式碼（Python/Bash/JS）
├── references/       # 選用：補充文件（依需求載入）
├── assets/           # 選用：範本、圖片、資料檔
```

Frontmatter 最低要求只需 `name` 和 `description`：

```yaml
---
name: pdf-processing
description: Extracts text and tables from PDF files, fills PDF forms, and merges
  multiple PDFs. Use when working with PDF documents.
license: Apache-2.0
---
```

### 為什麼開放標準重要？

因為它保證了你的投資**不會被平台綁定**。你今天為 Claude Code 寫的 PDF 處理技能，明天可以在 Cursor、Gemini CLI、OpenCode 上運作——不需任何修改。這種可攜性（portability）是 Agent Skills 相較於封閉生態（如早期 Copilot 外掛）最強勢的論點。

> 正如 A B Vijay Kumar 在 2026 年 5 月的分析中所說：「你今天下午寫的技能，明天可以在所有主流 AI 程式碼工具上運作——可能還包括幾個還沒上市的。這種可攜性保證在科技領域很少見，這也是 SKILL.md 格式相較於所有封閉替代方案最有力的論證。」

---

## 13.9 如何為你的團隊選擇平台？

沒有「最好的平台」，只有「最適合你的平台」。以下決策樹可以幫助你判斷：

**如果你⋯⋯**
- 已經在終端機工作，需要深度代理能力 → **Claude Code**
- 想要最友善的 IDE 體驗 + 社群最大 → **Cursor**
- 團隊已經在 GitHub 生態中（Actions、Copilot）→ **GitHub Copilot**
- 偏好開源、多模型支援 → **OpenCode** 或 **Windsurf**
- 需要使用 Gemini 模型 + Google 雲端整合 → **Gemini CLI**
- 團隊綁定 JetBrains → **Junie（JetBrains）+ Tier 3 技能支援**

### 多工具策略

值得注意的是，**許多開發者同時使用多個工具**。根據 2026 年的調查，常見組合是：

- **Copilot**：行內自動補全（inline autocomplete）
- **Cursor**：視覺化編輯工作階段
- **Claude Code**：複雜重構與自動化腳本

三者的技能目錄可以分別設定，各自載入最適合該使用情境的技能。

---

## 13.10 總結

Agent Skills 平台生態在 2025-2026 年間經歷了爆炸性成長：

1. **三層架構**：從原生整合（Tier 1）到社群支援（Tier 2）再到可擴充橋接（Tier 3），每層有不同的整合深度與開發者體驗。

2. **安裝多樣性**：手動複製、CLI 安裝、Marketplace 三種模式並行，滿足從離線到自動化的各種需求。

3. **漸進式揭露**：所有主流平台採用 Discovery → Activation → Execution 的三階段載入策略，讓代理人能管理大量技能而不消耗過多 context。

4. **開放標準**：agentskills.io 規格確保技能的可攜性。你今天寫的技能可以在 35+ 個平台上運作。

5. **生態持續擴張**：每月都有新平台加入，技能數量以指數增長。這個領域還處於早期階段。

---

## 習題

### 選擇題

**1.** Agent Skills 生態中，Tier 1（原生整合）平台的關鍵特徵是？
- A) 需要透過社群外掛才能使用技能
- B) 技能系統為平台核心功能，由產品團隊官方開發維護
- C) 只支援靜態 AGENTS.md 載入
- D) 只能在 Linux 上運作

**2.** Progressive disclosure 的三個階段依序是？
- A) Execution → Discovery → Activation
- B) Discovery → Activation → Execution
- C) Installation → Configuration → Execution
- D) Activation → Discovery → Routing

**3.** 下列哪一個平台採用「自動上下文路由」（根據專案類型自動活化對應技能）？
- A) GitHub Copilot
- B) Claude Code
- C) OpenCode
- D) JetBrains Junie

### 實作題

**4.** 請完成以下操作：
   a) 從 Awesome Agent Skills（github.com/VoltAgent/awesome-agent-skills）找到一個官方 Claude 技能
   b) 手動安裝到你選擇的三個平台中（例如 Claude Code、Cursor、OpenCode）
   c) 分別測試技能是否正確載入，記錄各平台的行為差異（例如：技能描述是否自動顯示？是否需要在對話中明確觸發？）

**5.** 請撰寫一份約 300 字的比較報告，回答以下問題：
   - 你選擇了哪個技能？
   - 三個平台的安裝流程有何異同？
   - 技能在每個平台上的活化行為是否一致？
   - 如果差異很大，你認為原因是什麼？

### 進階挑戰

**6.** 如果你的團隊使用 JetBrains IDE，但你想導入 Agent Skills，你的策略是什麼？請寫出從安裝到團隊推廣的完整計畫（約 500 字），考量到 Tier 3 平台的限制與可能的解決方案。

---

> **答案提示**：1-B, 2-B, 3-C。實作題的答案會因你選擇的技能和平台版本而異，沒有標準答案——這是練習的重點。

← [上一章：評估與迭代](/課程/04-02-grading-and-iteration) | [下一章：API 與 MCP 整合](/課程/05-02-api-integration) →
