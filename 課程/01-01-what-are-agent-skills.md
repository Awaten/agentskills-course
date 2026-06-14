---
title: "Agent Skills 是什麼？"
description: "了解 AI Agent 的核心限制與 Context Gap 問題，認識 Agent Skills 如何透過最輕量的專業化單元解決跨平台知識封裝的挑戰。"
outline: [2, 3]
---

# Chapter 1：Agent Skills 是什麼？

---

## 學習目標

完成本章後，你將能夠：

1. **解釋** AI Agent 在缺乏領域上下文時的核心限制，以及 Agent Skills 如何解決這個問題
2. **區分** Agent Skills 與 Tools、MCP、Plugins 在本質、用途與跨平台能力上的差異
3. **描述** Progressive Disclosure（漸進式揭露）三層架構的設計原理與資源效率優勢
4. **辨識** 哪些平台支援 Agent Skills 生態，並能說明開放標準為何重要

---

## 1.1 問題的本質：AI Agent 的上下文鴻溝

### 1.1.1 強大的模型，脆弱的任務執行

2025 年到 2026 年，大型語言模型的能力出現了飛躍性的突破。GPT-4o、Claude 4、Gemini 2.5 Pro——這些模型在基準測試上的表現不斷刷新紀錄，能夠撰寫程式碼、分析文件、甚至通過專業考試。

然而，當你將這些模型以 Agent 的形式部署到真實工作流程中時，一個尷尬的現象出現了：

> **模型很強，但 Agent 很笨。**

為什麼？答案不是模型能力不夠，而是 **上下文鴻溝（Context Gap）**。

一個 AI Agent 在啟動時，擁有的是模型訓練時學到的「一般知識」——它知道 JavaScript 是什麼、了解 REST API 的概念、能夠解釋 Git 的基本操作。但它不知道的是你專案的特定知識：

- 你的團隊用 yarn 還是 pnpm？
- CI/CD 管線的 `npm test` 實際上會觸發哪三個測試套件？
- 發佈到生產環境前，需要手動批准哪個 Slack 頻道？
- 錯誤訊息中「Error Code 1047」對應的是哪個內部服務？

這些知識從來不會出現在任何公開的訓練資料中。它們存在於你的專案文件、團隊慣例、甚至老同事的腦袋裡。

### 1.1.2 傳統解決方案的不足

在 Agent Skills 出現之前，工程團隊有幾種方式試圖讓 Agent 具備專案知識：

| 方法 | 做法 | 問題 |
|------|------|------|
| System Prompt 直接寫死 | 在 Agent 啟動指令中加入專案規則 | 每次更新都要改部署設定，無法跨專案重用 |
| 文件向量化（RAG） | 將文件存入向量資料庫，讓 Agent 查詢 | 檢索品質不穩定，Agent 不一定會去查 |
| 客製 Plugin | 為特定平台寫專屬擴充功能 | 綁定平台，Claude Code 的插件不能在 Cursor 用 |
| 口頭交代（？） | 每次使用時手動告訴 Agent 規則 | 人會忘記，無法標準化，零複用性 |

這些方法都有一個共同的結構性問題：**知識鎖在特定平台或特定流程裡，無法標準化、無法跨平台複用。**

---

## 1.2 解決方案：一個資料夾 + 一個檔案

### 1.2.1 最輕量的專業化單元

Agent Skills 提出的解法非常簡單：

```
my-skill/
├── SKILL.md          # 唯一必要檔案
├── scripts/          # 選用：可執行的輔助程式碼
├── references/       # 選用：參考文件
└── assets/           # 選用：靜態資源（圖片、模板等）
```

一個資料夾、一個 `SKILL.md` 檔案。把它放進你的專案，AI Agent 就自動學會一個新技能。

這個設計的關鍵洞察是：**專業知識的本質是指令，不是程式碼。**

你不一定需要寫 JavaScript 或 Python 來讓 Agent 學會一件事。你需要的是一份結構化的、步驟清晰的指令文件——告訴 Agent 什麼時候該做什麼、怎麼做、以及哪些坑要避開。

### 1.2.2 不是給人看的文件

這點非常重要：**SKILL.md 不是給人讀的文件，是給 AI Agent 讀的指令集。**

人類閱讀文件時，會自動補上背景知識和常識。當文件說「請先安裝相依套件」，人類會自動理解這代表 `npm install` 或 `pip install`，取決於專案類型。

Agent 不會。

Agent 需要的是極度具體、沒有模糊空間的指令。舉例來說，一個「發送通知」技能的 SKILL.md 可能會這樣寫：

```markdown
# notify

Send push notifications via ntfy.sh. Use when a task completes, an error
occurs, or you need to alert the user.

## Usage

1. Always use `python .opencode/skills/notify/scripts/notify.py`
   — do NOT use `& "path\to\notify.py"` (Windows will prompt file association)
2. Supported types: success, error, warning, info
3. Priority levels: default, high, max
```

注意到了嗎？它包含了 Windows 平台的一個具體陷阱——這不是一般常識，這是實際踩過的坑。人類踩坑後會記住，Agent 不會——除非你寫下來。

---

## 1.3 起源：Anthropic 與開放標準

### 1.3.1 從 Claude Code 到開放生態

Agent Skills 的概念最早來自 **Anthropic**——Claude 的開發商——在 2025 年底發布的開放標準。

Anthropic 在開發 Claude Code 的過程中，發現他們需要一種方式讓 Agent 能夠「學會」特定專案的運作方式。內部的解決方案是一個簡單的 `.md` 檔案加上一些約定——效果出奇地好。

但 Anthropic 做了一個聰明的決定：**不把這個機制鎖在 Claude Code 裡，而是把它發布為開放標準。**

### 1.3.2 官方資源

- **官方網站**：[https://agentskills.io](https://agentskills.io)
- **GitHub 組織**：[github.com/agentskills](https://github.com/agentskills)
- **規格倉庫**：[github.com/agentskills/agentskills](https://github.com/agentskills/agentskills)（~20K stars）

這個規格是完全開放的——任何平台、任何工具、任何人，都可以實作這個格式。沒有 vendor lock-in，不需要授權費，不需要簽約。

### 1.3.3 為什麼開放很重要

如果 Agent Skills 只是 Claude Code 的專屬功能，它不會引起太大的波瀾。真正讓它有意義的是「開放」兩個字：

- **跨平台複用**：為 Claude Code 寫的技能，可以在 Cursor 上使用，也可以在 Gemini CLI 上使用
- **社群累積**：開源技能可以不斷被改良、被 fork、被分享
- **避免碎片化**：如果每個平台各搞一套，整個生態就會碎裂成不相容的孤島

> 這不是一個產品策略，這是一個基礎設施思維。

---

## 1.4 核心機制：SKILL.md 如何被 Agent 載入

### 1.4.1 Description 是唯一的觸發器

Agent Skills 的運作機制建立在一個簡單的觸發邏輯上：

```
Agent 收到任務
    ↓
掃描所有可用的 SKILL.md（只讀 name + description）
    ↓
比對 description 是否與當前任務相關
    ↓
如果相關 → 載入完整 SKILL.md 作為 System Prompt 的一部分
    ↓
Agent 現在有了這個任務的專業知識
```

關鍵在於 **description 欄位**。這是 Agent 判斷「這個技能是否適用」的唯一依據。如果 description 寫得太模糊，Agent 可能在自己需要的時候卻沒有觸發。

[DIAGRAM: Agent 任務觸發流程圖。從「使用者輸入任務」開始，經過「掃描可用技能 descriptions」、「比對相關性」、「載入 SKILL.md」到「執行任務」的流程圖。]

### 1.4.2 System Prompt 注入

當 Agent 決定觸發一個技能時，完整的 `SKILL.md` 內容會被注入到當前對話的 System Prompt 中。這意味著：

- 技能指令對於 Agent 來說是 **最高優先級的行為規範**——它不只是一份參考文件，而是 Agent 必須遵循的協議
- 技能指令與模型的原生能力 **疊加**——Agent 仍然保有它的通用知識，只是現在多了專屬的領域知識
- 多個技能可以同時被觸發——如果任務跨越不同領域，Agent 可以同時載入多份 SKILL.md

這與 RAG（檢索增強生成）有本質的不同。RAG 是讓 Agent 去「查資料」——Agent 可以選擇查或不查。但 SKILL.md 是直接成為 System Prompt，Agent 無法忽略它。

---

## 1.5 生態系統總覽

### 1.5.1 規模數據

截至撰寫本文時（2026 年中），Agent Skills 生態的規模如下：

| 指標 | 數值 | 備註 |
|------|------|------|
| 開源技能數量 | **2,600+** | 來自 48 個來源倉庫 |
| 相容平台 | **30+** | 持續增加中 |
| GitHub Stars | **~20K** | agentskills/agentskills 主倉庫 |
| ⚠️ 注意 | 數字快速成長中 | 實際數字可能更高 |

### 1.5.2 主要支援平台

Agent Skills 不是某個平台的專屬功能。以下是一些已經原生支援或透過擴充機制相容的主要平台：

| 平台 | 支援方式 | 備註 |
|------|----------|------|
| **Claude Code** | 原生支援 | Anthropic 官方實作，最完整的支援 |
| **Cursor** | Agent 模式原生讀取 SKILL.md | 自動掃描專案中的技能目錄 |
| **GitHub Copilot CLI** | 專用 `skill` 指令 | 可以列出、載入、管理技能 |
| **Gemini CLI** | `activate_skill` 工具 | Google 的實作方式 |
| **OpenCode** | 原生支援 + 三層記憶擴充 | 整合了長期記憶系統 |
| **Windsurf** | 相容 | 透過目錄掃描機制 |
| **Codex CLI** | 相容 | OpenAI 的實作 |
| **Cline** | 相容 | VS Code 擴充形式 |

### 1.5.3 技能的來源分布

2,600+ 個開源技能來自多種來源：

- **官方倉庫**：Anthropic 維護的核心技能集合
- **社群貢獻**：開發者分享的個人技能
- **企業內部**：部分公司將內部 SOP 封裝為技能（未公開）
- **整合包**：針對特定框架或平台的技能合集

這種多來源的生態模式，讓技能的多樣性和品質都在快速提升。

---

## 1.6 Agent Skills vs 其他概念

這四個名詞聽起來都在做同一件事——讓 AI 更強。但你可以這樣記：

- **Tools** = 你的工具箱（扳手、螺絲起子，一個工具做一件事）
- **MCP** = WiFi 和藍牙（負責讓 Agent「連出去」）
- **Plugins** = iPhone 專屬配件（只有這個品牌能用）
- **Agent Skills** = 整本使用說明書（告訴 Agent 什麼時候用哪個工具、步驟怎麼走）

關鍵是：它們**不互斥**。一個 Skill 可以「使用」MCP 連上資料庫、「呼叫」Tools 跑程式、「透過」Plugin 整合進平台。它們是疊加的，不是四選一。

<div class="concept-cards">
  <div class="concept-card skills">
    <strong>📄 Agent Skills</strong>
    <span>流程級知識封裝</span>
    <small>1 個 SKILL.md · 跨 30+ 平台</small>
    <small>開放標準，純文字檔</small>
  </div>
  <div class="concept-card mcp">
    <strong>🔌 MCP</strong>
    <span>通訊級系統連接</span>
    <small>USB-C 類比 · 連接外部 API/DB</small>
    <small>開源協定，跨平台相容</small>
  </div>
  <div class="concept-card tools">
    <strong>🔧 Tools</strong>
    <span>函式級原子操作</span>
    <small>search() · calc() · readFile()</small>
    <small>單一職責，被 Skills 呼叫</small>
  </div>
  <div class="concept-card plugins">
    <strong>🧩 Plugins</strong>
    <span>平台級擴充元件</span>
    <small>⚠️ 鎖定單一平台</small>
    <small>不可跨用，非開放標準</small>
  </div>
</div>
<p style="text-align:center;font-size:0.8em;color:var(--vp-c-text-2);margin-top:0.75rem">▲ 資料來源：agentskills.io · modelcontextprotocol.io</p>

<div class="coexist-flow">
  <div class="coexist-top">
    <span class="coexist-node skills">📄 Agent Skills<br><em>流程級 · 說明書</em></span>
  </div>
  <div class="coexist-arrows">
    <span class="coexist-arrow">可呼叫 ⬇</span>
    <span class="coexist-arrow">可使用 ⬇</span>
  </div>
  <div class="coexist-mid">
    <span class="coexist-node tools">🔧 Tools<br><em>函式級 · 工具箱</em></span>
    <span class="coexist-node mcp">🔌 MCP<br><em>通訊級 · WiFi</em></span>
  </div>
  <div class="coexist-arrows">
    <span></span>
    <span class="coexist-arrow">可被包裝 ⬇</span>
  </div>
  <div class="coexist-bottom">
    <span></span>
    <span class="coexist-node plugins">🧩 Plugins<br><em>平台級 · 專屬配件</em></span>
  </div>
  <p class="coexist-note">💡 它們是疊加關係，不是互斥選項</p>
</div>

### 1.6.1 vs Tools：流程 vs 功能

**Tools（工具）** 是單一功能的抽象——`search()` 做搜尋、`calc()` 做計算、`read_file()` 讀檔案。Tools 是 Agent 能力的「原子單位」。

**Agent Skills** 則是一個完整的工作流程——它可能會在內部呼叫多個 Tools，並依照特定的順序和條件來執行。

```
Tools:      search()  ──→ 單一搜尋動作
Skills:     ResearchTopic ──→ search() → analyze() → summarize() → format()
```

你可以把 Tools 想像成工具箱裡的螺絲起子和扳手，把 Skills 想像成「更換輪胎」的完整流程——後者會用到前者，但前者不知道後者的存在。

### 1.6.2 vs MCP：內部 vs 外部

**MCP（Model Context Protocol）** 是 Agent 與外部系統通訊的協定——可以把它理解為 AI 界的 USB 標準。MCP 讓 Agent 能夠連接資料庫、呼叫 API、讀取檔案系統。

**Agent Skills** 是存在於 Agent 內部的專業知識。它不需要對外通訊，不需要網路連線。

```
MCP:      Agent ──MCP──→ Database / API / File System
Skills:   Agent ──內化──→ 專業工作流程
```

MCP 回答的是「怎麼連出去？」的問題。Skills 回答的是「連出去之後要做什麼？」的問題。

實務上兩者經常協同工作：一個 Skill 可能會指示 Agent 透過 MCP 去查詢資料庫，然後根據查詢結果執行下一步。

### 1.6.3 vs Plugins：開放 vs 封閉

**Plugins（插件）** 是特定平台的擴充機制——Cursor 的插件不能在 Claude Code 使用，VS Code 的插件不能在 Windsurf 使用。

**Agent Skills** 是純文字檔案，不綁定任何平台。一份 SKILL.md 可以在所有支援的平台上作用。

```
Plugins:   寫一次 → 只能用在一平台
Skills:    寫一次 → 可以在 30+ 平台使用
```

這不是技術上的限制——平台完全可以同時支援 Plugins 和 Skills。但 Skills 的開放性意味著你的投資不會被鎖在單一生態系裡。

### 1.6.4 三者可以共存

這三者不是競爭關係，而是互補關係。一個實際的例子：

```
情境：自動發佈部落格文章

MCP 層：   連線到 WordPress API、上傳圖片
Tools 層：  markdown-to-html 轉換、圖片壓縮
Skills 層：發佈流程（檢查→預覽→審核→發佈→通知）
```

每個層級解決不同層級的問題，相互疊加產生完整效果。

---

## 1.7 漸進式揭露（Progressive Disclosure）

### 1.7.1 為什麼需要分層？

Agent 的 Context Window（上下文視窗）是有限資源——即使是最先進的模型，也不可能在單一對話中無限制地塞入資訊。

假設一個專案中有 50 個 Skills，每個 SKILL.md 平均 3000 tokens——如果全部同時載入，就是 150,000 tokens，會瞬間塞爆 Context Window。

**Progressive Disclosure**（漸進式揭露）正是為了解決這個問題而設計的。

### 1.7.2 三層架構

[DIAGRAM: 三個同心圓圖，從內到外分別為 Level 1（最小）、Level 2（中等）、Level 3（最大）。標示每個層級對應的內容和載入時機。]

#### Level 1：中繼資料（~100 tokens）

**載入時機**：永遠載入，Agent 啟動時自動掃描

**包含內容**：僅 `name` 和 `description`

**功能**：讓 Agent 知道「有哪些技能可以用」。這就像是技能列表的目錄——Agent 掃描所有技能的名稱和一句話描述，但不讀取細節。

```yaml
name: fb-post-publisher
description: >
  Publish articles to Facebook Page with a 4-layer workflow:
  strategy → content → draft → confirm. Use when posting to Facebook.
```

#### Level 2：完整指令（< 5000 tokens）

**載入時機**：當 Agent 判斷某個技能與當前任務相關時

**包含內容**：完整的 `SKILL.md`

**功能**：提供完整的操作指令、規則、注意事項、程式碼範例。這是技能的核心內容。

#### Level 3：資源檔案（需要時載入）

**載入時機**：當技能執行過程中需要特定資源時

**包含內容**：`scripts/`、`references/`、`assets/` 目錄下的檔案

**功能**：提供腳本、參考資料、圖片模板等輔助資源。只有在技能真的需要執行特定操作時，才會去載入這些檔案。

### 1.7.3 為什麼這很重要

三層設計解決了三個關鍵問題：

1. **Token 經濟性**：Agent 不會浪費 tokens 在不相關的技能上
2. **專注力**：Agent 不會因為過多資訊而分心
3. **啟動速度**：Agent 可以在數秒內掃描數百個技能，而不需要全部載入

這是一個優雅的資源管理機制——不多不少，剛好夠用。

---

## 1.8 全面比較表

以下從七個維度比較 Tools、MCP、Plugins 與 Agent Skills：

| 維度 | Tools | MCP | Plugins | Agent Skills |
|------|-------|-----|---------|--------------|
| **本質** | 單一功能函式 | 外部通訊協定 | 平台擴充元件 | 專業知識封裝 |
| **範例** | `search()`、`calc()` | 連資料庫、連 Slack API | VS Code 擴充、Cursor 插件 | FB 發佈流程、程式碼審查工作流 |
| **是否需要寫程式** | 是（定義函式） | 是（實作 Server） | 依平台而定 | **不需要**（純 .md 即可） |
| **跨平台相容性** | ✅ 是（跨語言） | ✅ 是（標準協定） | ❌ 綁定特定平台 | ✅ 純文字檔，30+ 平台相容 |
| **知識層級** | 操作層（怎麼做功能） | 連通層（怎麼連系統） | 擴充層（怎麼加功能） | **專業層（怎麼做任務）** |
| **複雜度** | 低（單一操作） | 中（需建置 Server） | 中高（需平台 SDK） | 低（Markdown 文件） |
| **疊加使用** | Tools 被 Skills 呼叫 | MCP 被 Skills 使用 | 與 Skills 共存 | 可同時載入多個 |

一句話總結：

> **Tools 是 App 裡的功能，MCP 是藍牙和 WiFi，Plugins 是 iPhone 專用接頭，Agent Skills 是整本使用說明書。**

---

## 本章摘要

1. **Agent Skills 解決的是 Context Gap 問題**——AI Agent 擁有一般知識，但缺乏專案特定的領域知識。Skills 提供了標準化方式來封裝這些知識。

2. **最小單元是一個資料夾 + SKILL.md**——不需要寫程式，只需要一份結構化的 Markdown 指令文件。這是開放標準，不是專屬格式。

3. **由 Anthropic 於 2025 年底發起**——官方網站 agentskills.io，GitHub 專案 20K+ stars，30+ 平台支援。

4. **觸發機制依賴 description 欄位**——Agent 透過比對 description 與當前任務來決定是否載入完整技能。Description 的品質直接影響觸發準確率。

5. **三層 Progressive Disclosure 設計**——Level 1（中繼資料，永遠載入）→ Level 2（完整指令，觸發時載入）→ Level 3（資源檔案，需要時載入）。在 Token 效率與資訊完整性之間取得平衡。

6. **Skills 與 Tools/MCP/Plugins 是互補關係**——每個概念解決不同層次的問題，可以協同運作。Skills 是工作流程與專業知識的封裝，而 Tools 是單一功能、MCP 是外部連通協定、Plugins 是平台擴充。

---

## 練習題

### Q1（概念理解）
Agent Skills 主要解決的是 AI Agent 的什麼問題？請用 2-3 句話說明。

**提示**：思考 Agent 在真實專案中執行任務時缺少什麼。

### Q2（比較分析）
請說明 Agent Skills 與 MCP Server 在本質上的差異。它們各自解決的是什麼層次的問題？

**提示**：一個是「內部知識」，一個是「外部連通」。

### Q3（架構理解）
Progressive Disclosure 三層架構分別是什麼？為什麼需要這樣的設計？

**提示**：從 Token 效率的角度思考。

### Q4（生態認知）
請列出至少 3 個支援 Agent Skills 的平台，並說明跨平台相容為什麼重要。

**提示**：想想如果 Skills 只能用在單一平台會發生什麼事。

### 進階挑戰（Q5）
前往 [agentskills.io](https://agentskills.io) 閱讀官方規格，找出 SKILL.md 中：
- 3 個必填欄位（如果有的話）
- 3 個選填欄位
- name 欄位的命名規則限制

將你找到的結果整理成一份簡短筆記。

---

## 延伸閱讀

| 資源 | 說明 |
|------|------|
| [agentskills.io](https://agentskills.io) | Agent Skills 官方網站，包含規格說明與生態資訊 |
| [github.com/agentskills/agentskills](https://github.com/agentskills/agentskills) | 官方 GitHub 倉庫，規格與開源技能集合 |
| [Anthropic 官方部落格](https://www.anthropic.com) | Anthropic 關於 Agent Skills 的相關公告與技術文章 |

---

*下一章：Chapter 2 — 三層漸進式揭露。我們將深入探討 Skills 的核心設計哲學、token 預算分配策略、以及各層級之間的互動關係。*

---

← [下一章: Ch2: 三層漸進式揭露](/課程/01-02-progressive-disclosure) →
