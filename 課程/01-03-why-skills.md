---
title: "Skills vs Tools vs MCP vs Plugins — 完整比較"
description: "全面比較 Agent 四種擴充機制：Tools、Skills、MCP 與 Plugins，提供決策框架與混合架構設計指南。"
outline: [2, 3]
---

# Chapter 3：Skills vs Tools vs MCP vs Plugins — 完整比較

---

## 學習目標

完成本章後，你將能夠：

1. **區分** Agent 四種擴充機制的本質差異：Tools、Skills、MCP、Plugins
2. **判斷** 在什麼情境下該採用哪一種機制
3. **設計** 同時使用四種機制的混合架構
4. **評估** Skills 作為開放標準相對於 Plugins 的長期優勢
5. **應用** 決策框架來選擇適當的擴充方式

---

## 3.1 Agent 擴充性的四大支柱

現代 AI Agent 之所以能從「聊天機器人」進化為「數位員工」，關鍵在於它具備可擴充性（extensibility）。但「擴充」這個詞涵蓋了四種截然不同的機制，開發者經常混淆。

這四種機制分別是：

| # | 機制 | 核心隱喻 | 抽象層級 |
|---|------|---------|---------|
| 1 | **Tools** | 工具箱裡的工具 | 函式級 |
| 2 | **Skills** | 專業人員的 SOP 手冊 | 流程級 |
| 3 | **MCP** | 電話線 / USB 插槽 | 通訊級 |
| 4 | **Plugins** | 商店買的擴充配件 | 平台級 |

每一種都在 Agent 生態系統中扮演不同角色。把它們搞混，就像把螺絲起子、操作手冊、電話線和原廠配件混為一談——雖然都跟「修理東西」有關，但用途完全不同。

本章將逐一拆解，然後告訴你怎麼組合。

---

## 3.2 Tools — 單一功能的 API

### 什麼是 Tool？

Tool 是 Agent 可以呼叫的**單一函式**。它做一件事，做好，然後回傳結果。

典型的 Tool 簽章長這樣：

```
function search(query: string): SearchResult[]
function calculate(expression: string): number
function fetch(url: string): string
function sendEmail(to: string, subject: string, body: string): boolean
```

### 怎麼運作的？

Agent 在執行時會收到一份可用 Tools 的清單（通常以 JSON schema 描述）。當 Agent 判斷當前任務需要某項能力時，它會產生一個符合該 Tool 規格的呼叫請求，由執行環境（如 Claude Code、OpenCode）實際呼叫。

```
使用者：「台灣現在幾點？」
    ↓
Agent 思考：需要查詢時間 → 可用 Tool: getCurrentTime(location)
    ↓
Agent 產生呼叫：getCurrentTime({ location: "Asia/Taipei" })
    ↓
執行環境回傳結果："2026-06-06 14:30:00 CST"
    ↓
Agent 包裝成自然語言回應使用者
```

### 常見範例

- **搜尋工具**：`webSearch()`、`webFetch()`
- **檔案工具**：`readFile()`、`writeFile()`、`glob()`
- **運算工具**：`calculate()`、`codeInterpreter()`
- **系統工具**：`bash()`、`executeCommand()`

### 界限

Tools 的設計哲學是**單一職責**。它不包含：

- 何時該呼叫（那是 Agent 的判斷）
- 呼叫後如何處理結果（那也是 Agent 的判斷）
- 失敗時如何重試（Agent 或框架處理）
- 多步驟流程（那不是 Tool 的責任）

> **重點**：Tool 沒有「流程知識」。它知道怎麼搜尋，但不知道「怎麼寫一份研究報告」。後者是 Skill 的工作。

---

## 3.3 Skills — 完整工作流程的封裝

### 什麼是 Skill？

Skill 是一份**給 AI Agent 讀的專業操作手冊**。它不是一個函式，而是一組指令，告訴 Agent 如何完成一個完整的任務流程。

實體上，它是一個資料夾 + 一個 `SKILL.md` 檔案：

```
my-skill/
├── SKILL.md          # 必要：完整操作指令
├── scripts/          # 選用：輔助腳本
├── references/       # 選用：參考文件
└── assets/           # 選用：靜態資源
```

### 怎麼運作的？

Skill 採用**三層漸進式揭露**（Progressive Disclosure）：

```
Level 1: 中繼資料 (~100 tokens) — 永遠載入
    └─ name + description（Agent 用來判斷「需不需要這個技能」）

Level 2: 完整指令 (<5000 tokens) — 觸發時載入
    └─ 完整的 SKILL.md（Agent 開始執行任務時讀取）

Level 3: 資源檔案（需要時載入）
    └─ scripts/、references/、assets/（實際執行時才存取）
```

### SKILL.md 的核心欄位

| 欄位 | 必填 | 說明 |
|------|------|------|
| `name` | ✅ | 小寫+數字+連字號，最多 64 字元 |
| `description` | ✅ | 觸發依據，需精準描述適用情境（最多 1024 字元） |
| `license` | ❌ | 授權條款 |
| `compatibility` | ❌ | 環境需求 |
| `allowed-tools` | ❌ | 允許使用的工具清單（實驗性） |

### 與 Tool 的關鍵差異

```
Tool:  搜尋(query) → 回傳結果
Skill: 1. 接收研究主題
       2. 用搜尋工具蒐集資料
       3. 過濾來源品質
       4. 交叉比對多個來源
       5. 產出結構化報告
       6. 附上引用來源
```

**Tool 回答「怎麼做一件事」，Skill 回答「怎麼完成一個任務」。**

### 為什麼 Skill 不是「另一種 Tool」

這是最常見的誤解。很多人看到 Tool 和 Skill 都出現在 Agent 平台上，就以為它們是可以互換的概念。不是。

- **Tool** 是 Agent 的操作能力（能做些什麼）
- **Skill** 是 Agent 的操作知識（該怎麼做才對）

沒有 Tool，Agent 什麼都不能做。沒有 Skill，Agent 什麼都做不好。

---

## 3.4 MCP — 通往外部系統的通訊協定

### 什麼是 MCP？

Model Context Protocol（MCP）是由 Anthropic 提出的**開放通訊協定**，定義了 AI Agent 如何與外部系統交換資料和服務。

你可以把 MCP 想像成 Agent 的 **USB 插槽**：

- 定義了通用的連接介面（協定）
- 任何符合規格的 MCP 伺服器都可以「插上」Agent
- Agent 不需要知道外部系統的實作細節

### MCP 架構

```
┌─────────────┐        MCP Protocol        ┌──────────────┐
│  AI Agent   │ ◄────────────────────►     │  MCP Server  │
│  (Host)     │                            │  (Service)   │
└─────────────┘                            └──────┬───────┘
                                                   │
                                           ┌───────▼───────┐
                                           │   External     │
                                           │   System       │
                                           │  (DB / API /   │
                                           │   Filesystem)  │
                                           └───────────────┘
```

### 典型 MCP 伺服器範例

- **檔案系統 MCP**：讓 Agent 安全讀寫本地檔案
- **資料庫 MCP**：讓 Agent 執行 SQL 查詢
- **GitHub MCP**：讓 Agent 操作 PR、Issue、程式碼審查
- **瀏覽器 MCP**：讓 Agent 控制瀏覽器進行自動化操作
- **Slack / Discord MCP**：讓 Agent 發送訊息到通訊平台

### 何時需要 MCP？

MCP 的價值體現在三個場景：

1. **安全隔離**：你不想讓 Agent 直接存取生產資料庫，而是透過一個有權限控管的 MCP 伺服器
2. **複雜系統整合**：外部系統有自己的認證、速率限制、錯誤處理——MCP Server 封裝這些複雜性
3. **跨語言互通**：Agent 平台是 TypeScript，但後端服務是 Python 或 Go——MCP 協定與語言無關

### MCP vs Skill：核心區別

| 層面 | MCP | Skill |
|------|-----|-------|
| 抽象層級 | 通訊層 | 知識層 |
| 解決問題 | 怎麼連線 | 怎麼做事 |
| 內容 | 端點、格式、認證 | 步驟、規則、避坑 |
| 實體形式 | 可執行的伺服器程式 | 純文字 .md 檔案 |
| 維護者 | 工程師 | 領域專家或工程師 |

> **一句話記住**：MCP 是 Agent 的**神經系統**（傳遞訊號），Skill 是 Agent 的**大腦皮質**（儲存專業知識）。

---

## 3.5 Plugins — 平台鎖定的擴充套件

### 什麼是 Plugin？

Plugin 是**綁定特定平台**的擴充套件，通常需要遵循該平台專屬的 API 規範、套件格式和發布流程。

### 知名範例

| 平台 | Plugin 形式 | 開發成本 |
|------|-----------|---------|
| ChatGPT | ChatGPT Plugins / GPTs | 中 — 需撰寫 OpenAPI 規格 + 託管服務 |
| VS Code | Extensions (vsix) | 高 — 需熟悉 VS Code API |
| Cursor | Cursor Extensions | 中 — 類似 VS Code API |
| Obsidian | Community Plugins | 中 — 需 TypeScript + Obsidian API |
| WordPress | Plugins | 高 — 需 PHP + WordPress 鉤子系统 |

### Plugin 的隱性成本

Plugin 最大的問題不是開發——而是**鎖定**（lock-in）。

```
在 ChatGPT 寫一個 Plugin → 只能在 ChatGPT 用
在 VS Code 寫一個 Extension → 只能在 VS Code 用
在 Obsidian 寫一個 Plugin → 只能在 Obsidian 用
```

每換一個平台，就要重寫一次。這不是技術問題，是經濟問題——維護 N 個平台的 Plugin，成本乘以 N。

### Plugin 的適用場景

Plugin 還是有其價值的：

- **深度整合**：需要存取平台專屬 API（如 VS Code 的文件編輯器、Obsidian 的筆記圖譜）
- **效能敏感**：需要 Native 級別的執行效率（如程式碼高亮、即時協作）
- **商業發布**：需要在平台市集上架收費

---

## 3.6 四者比較總覽

[DIAGRAM: 四格對比圖 —— 分別用圖示展示 Tools / Skills / MCP / Plugins 如何與 AI Agent 互動。Tools 是直接呼叫的函式；Skills 是載入 Agent 記憶的指令集；MCP 是 Agent 與外部服務之間的通訊橋樑；Plugins 是平台與擴充套件之間的專屬介面。每格顯示 Agent、平台、外部系統的相對位置。]

### 視覺化對比

```
                  Tools
    ┌─────────────────────────────────────┐
    │  Agent ──呼叫──► Tool ──回傳──► Agent │
    │  無狀態，一次呼叫                    │
    └─────────────────────────────────────┘

                  Skills
    ┌─────────────────────────────────────┐
    │  SKILL.md ──載入──► Agent 記憶體      │
    │  指引 Agent 呼叫多個 Tool 完成任務    │
    │  有狀態，多步驟流程                  │
    └─────────────────────────────────────┘

                  MCP
    ┌─────────────────────────────────────┐
    │  Agent ◄──MCP Protocol──► MCP Server │
    │                    │                 │
    │               External System        │
    │  標準通訊協定，與語言無關             │
    └─────────────────────────────────────┘

                  Plugins
    ┌─────────────────────────────────────┐
    │  Plugin API ◄──平台綁定──► Plugin    │
    │       │                              │
    │    Agent (間接使用)                   │
    │  專屬介面，跨平台不相容               │
    └─────────────────────────────────────┘
```

---

## 3.7 何時使用什麼？— 決策框架

以下決策樹可以幫助你在設計 Agent 架構時選擇正確的機制：

```
你要給 Agent 什麼能力？
│
├─ 一個明確的單一操作？
│   └─► 用 Tool
│       e.g., 搜尋網路、計算數字、讀取檔案
│
├─ 一個完整的工作流程？
│   └─► 用 Skill
│       e.g., 發布 FB 貼文、程式碼審查、撰寫報告
│
├─ 連接到外部系統？
│   │
│   ├─ 對方有標準 API？
│   │   └─► 用 MCP Server 封裝
│   │       e.g., 資料庫查詢、Slack 發訊、GitHub 操作
│   │
│   └─ 需要平台專屬整合？
│       └─► 用 Plugin
│           e.g., VS Code 編輯器擴充、Obsidian 插件
│
└─ 以上皆是？
    └─► 組合使用（見 3.8 節）
```

### 快速判斷原則

| 問題 | 答案指向 |
|------|---------|
| 這個能力跨平台用得到嗎？ | 是 → Skill，否 → Plugin |
| 這是一個步驟還是多個步驟？ | 單一步驟 → Tool，多步驟 → Skill |
| 我需要安全控管外部存取？ | 是 → MCP |
| 我需要上架到市集收費？ | 考慮 Plugin（但優先看 Skill 是否可行） |

---

## 3.8 組合使用 — 四種機制如何協作

這四種機制不是互斥的。事實上，**最好的架構通常會用到全部四種**。

### Skills 使用 Tools

Skill 內部會指示 Agent 使用哪些 Tool：

```
FB 發布 Skill (SKILL.md)
  ├─ Step 1: 用 chrome-devtools_fill 填入內容
  ├─ Step 2: 用 chrome-devtools_click 點擊按鈕
  ├─ Step 3: 用 notify 發送通知
  └─ Step 4: 用 python scripts/verify.py 驗證發布狀態
```

### Skills 參考 MCP Servers

Skill 可以指定需要哪個 MCP Server：

```yaml
# SKILL.md 中的 compatibility 欄位
compatibility:
  mcp-servers:
    - browser-tools    # 需要瀏覽器控制能力
    - filesystem       # 需要檔案讀寫能力
```

當 Agent 載入這個 Skill 時，它知道要先確保這些 MCP Server 已啟動。

### Plugins 可以 Bundled Skills

有些平台開始把 Skills 視為 Plugin 的輕量替代方案：

- **OpenCode**：Skills 是原生擴充機制，可以直接放在 `.opencode/skills/` 目錄
- **Cursor**：支援載入 `.cursor/skills/` 目錄中的 Skill
- **Claude Code**：CLAUDE.md 本身就是一種 Skill 的變體

在這些平台上，**Skill 就是一種跨平台的 Plugin 替代品**——不需要寫程式碼，只需要寫 Markdown。

---

## 3.9 真實架構案例：智慧客服 Agent

讓我們看一個具體例子，展示四種機制如何協同運作。

### 場景

一家電商公司要打造一個「智慧客服 Agent」，能夠處理訂單查詢、退貨申請、庫存查詢和客訴回應。

### 架構設計

```
┌──────────────────────────────────────────────────┐
│                   AI Agent                         │
│                                                   │
│  ┌─────────────────────────────────────────┐      │
│  │  Skills 層                              │      │
│  │  ┌────────┐ ┌────────┐ ┌────────┐      │      │
│  │  │退貨流程│ │客訴處理│ │庫存查詢│      │      │
│  │  │ Skill  │ │ Skill  │ │ Skill  │      │      │
│  │  └───┬────┘ └───┬────┘ └───┬────┘      │      │
│  └──────┼──────────┼──────────┼──────────┘      │
│         │          │          │                   │
│  ┌──────┼──────────┼──────────┼──────────┐      │
│  │  Tools 層       │          │           │      │
│  │  ┌────────┐ ┌───▼────┐ ┌──▼───────┐  │      │
│  │  │ 搜尋   │ │ 計算   │ │ 格式化   │  │      │
│  │  │ Tool   │ │ Tool   │ │ Tool     │  │      │
│  │  └────────┘ └────────┘ └──────────┘  │      │
│  └──────────────────────────────────────┘      │
│                                                │
│  ┌──────────────────────────────────────┐      │
│  │  MCP 層                               │      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────┐  │      │
│  │  │ 訂單系統  │ │ 客服CRM  │ │ Slack│  │      │
│  │  │ MCP      │ │ MCP      │ │ MCP  │  │      │
│  │  └──────────┘ └──────────┘ └──────┘  │      │
│  └──────────────────────────────────────┘      │
└──────────────────────────────────────────────────┘
         │
         └── Platform Layer: 可選 Plugin 擴充
              (例如：如果部署在 Slack，用 Slack Plugin)
```

### 運作流程

1. **客戶**在 Slack 發送訊息：「我要退貨訂單 #ORD-12345」
2. **Slack MCP Server** 接收訊息，轉送給 Agent
3. **Agent 載入「退貨流程 Skill」**，Skill 告訴 Agent：
   - 第一步：用訂單系統 MCP 查詢訂單狀態
   - 第二步：用搜尋 Tool 查找退貨政策
   - 第三步：用 CRM MCP 建立退貨單
   - 第四步：用格式化 Tool 產出回覆
   - 第五步：用 Slack MCP 回覆客戶
4. **Agent 依序執行**，每一步都遵循 Skill 的規則
5. **如果有平台專屬需求**（如 Slack 訊息按鈕），可用 Slack Plugin 擴充

### 這個架構為什麼好？

| 機制 | 角色 | 如果不用會怎樣 |
|------|------|--------------|
| **Skill** | 告訴 Agent 退貨流程的每個步驟 | Agent 不知道先查訂單還是先查政策 |
| **Tool** | 提供搜尋、計算、格式化等基礎能力 | Agent 無法操作資料 |
| **MCP** | 安全連接到訂單系統、CRM、Slack | Agent 無法存取後端系統 |
| **Plugin** | (選用) 深度整合 Slack 平台 | 功能受限但可用 |

---

## 3.10 開放標準的優勢 — Skills vs Plugins

這可能是本章最重要的觀念。

### Plugins 的問題

```
ChatGPT Plugin      → 只能在 ChatGPT 用
VS Code Extension   → 只能在 VS Code 用
Cursor Extension    → 只能在 Cursor 用
Obsidian Plugin     → 只能在 Obsidian 用
Slack App           → 只能在 Slack 用
Discord Bot         → 只能在 Discord 用
```

每個平台都有自己的 API、自己的 SDK、自己的上架流程、自己的審查標準。

開發者要維護 N 個平台的版本。**這不可持續。**

### Skills 的解法

Skill 是一個純文字檔案。它不依賴任何平台的 API。

```
一個 SKILL.md → 可以在 Claude Code 用
              → 可以在 Cursor 用
              → 可以在 OpenCode 用
              → 可以在 Gemini CLI 用
              → 可以在 Windsurf 用
              → 可以在 GitHub Copilot CLI 用
              → 可以在任何支援 Agent Skills 標準的平台用
```

**寫一次，到處用。**

### 更深層的意義

Plugin 代表的是**平台中心的思維**——每個平台各自為政，開發者替平台打工。

Skill 代表的是**知識中心的思維**——專業知識被封裝成開放格式，平台只是執行環境。

> **Plugin 鎖定你的知識，Skill 解放你的知識。**

這也是為什麼 2,600+ 開源技能在短短幾個月內湧現。不是因為開發者突然變勤勞了——而是因為寫一個 Skill 的成本遠低於寫一個 Plugin，且回報（跨平台可用）遠高於 Plugin。

---

## 3.11 總結對照表

| 維度 | Tools | Skills | MCP | Plugins |
|------|-------|--------|-----|---------|
| **本質** | 單一函式 | 流程指令集 | 通訊協定 | 平台擴充 |
| **實體形式** | 程式碼函式 | Markdown 檔案 (.md) | 可執行伺服器程式 | 平台專屬套件 |
| **開發難度** | 低 | 極低（純文字） | 中高 | 中高 |
| **跨平台** | ✅ 是 | ✅ 是 | ✅ 是 | ❌ 否 |
| **學習曲線** | 低 | 極低 | 中 | 高（需學平台 API） |
| **生態規模** | 極大（數百萬） | 快速成長（2,600+） | 成長中（數千） | 平台而定 |
| **內容維護者** | 工程師 | 領域專家 / 工程師 | 工程師 | 工程師 |
| **是否需要寫程式** | 需要 | **不需要**（純 .md 可達成） | 需要 | 需要 |
| **版本控制** | ✅ Git | ✅ Git（diff 友好） | ✅ Git | ⚠️ 二進制或複雜格式 |
| **審查門檻** | 程式碼審查 | 文件審查 | 程式碼審查 | 平台審查+上架 |
| **商業模式** | 內建/開源 | 開源/社群 | 開源/自建 | 市集付費 |
| **抽象層級** | 操作級 | 任務級 | 連線級 | 平台級 |

---

## 3.12 本章重點回顧

1. **Tools** 是 Agent 的肌肉——提供基礎操作能力，但不包含流程知識
2. **Skills** 是 Agent 的專業知識——用純文字檔案封裝完整工作流程
3. **MCP** 是 Agent 的通訊神經——標準化連接外部系統的協定
4. **Plugins** 是平台專屬的擴充——功能強大但有鎖定風險
5. 四種機制**不是互斥的**——最佳架構通常會組合使用全部四種
6. Skills 作為開放標準，最大優勢是**跨平台可攜性**——寫一次，到處用
7. 選擇順序：能用 Skill 解決的優先；需要外部系統用 MCP；必要時才用 Plugin

---

## 3.13 練習題

### Q1：Skill 和 Tool 的本質差異是什麼？

**提示**：想想「搜尋」和「寫一份研究報告」之間的差別。

<details>
<summary>參考答案</summary>
Tool 是單一功能的 API，只做一件事（如搜尋、計算），不包含何時呼叫、如何處理結果的知識。Skill 是完整工作流程的封裝，包含多個步驟、判斷規則、錯誤處理和最佳實務。簡言之：Tool 回答「怎麼做」，Skill 回答「怎麼做好」。
</details>

### Q2：什麼時候該用 MCP 而不是 Skill？

**提示**：如果你的問題是「怎麼連上資料庫」而不是「怎麼查詢訂單」...

<details>
<summary>參考答案</summary>
當你需要安全、標準化地連接到外部系統時，用 MCP。MCP 負責通訊層——認證、速率限制、錯誤處理。Skill 負責知識層——連上之後要做什麼。如果你的問題是「怎麼連線」，那是 MCP；如果你的問題是「連上之後怎麼操作」，那是 Skill。兩者經常搭配使用。
</details>

### Q3：為什麼 Skills 比 Plugins 更具可攜性？

**提示**：純文字 vs 二進制、開放格式 vs 平台 API。

<details>
<summary>參考答案</summary>
Skill 是純文字 Markdown 檔案，不依賴任何平台的 API 或 SDK，任何支援 Agent Skills 標準的平台都可以載入。Plugin 則綁定特定平台的 API 規範、套件格式和發布流程——換一個平台就要完全重寫。Skills 的可攜性來自於它的開放標準本質和極簡的格式設計。
</details>

### Q4：設計一個同時使用四種機制的系統

**情境**：你正在打造一個「自動化程式碼審查 Agent」，它需要：
- 讀取 GitHub PR 的程式碼變更
- 根據團隊編碼規範檢查程式碼
- 在 PR 上留下審查意見
- 在 Slack 通知作者

請畫出架構圖，並標明各元件屬於哪一種機制。

<details>
<summary>參考架構</summary>
```
Agent: 程式碼審查 Agent
│
├─ Skills:
│   └─ code-review-skill (SKILL.md)
│       ├─ Step 1: 用 GitHub MCP 取得 PR diff
│       ├─ Step 2: 用 search Tool 查詢編碼規範
│       ├─ Step 3: 逐檔案檢查，記錄問題
│       ├─ Step 4: 用 GitHub MCP 張貼審查意見
│       └─ Step 5: 用 Slack MCP 通知作者
│
├─ Tools:
│   ├─ search() — 查詢編碼規範文件
│   └─ format() — 格式化審查意見
│
├─ MCP Servers:
│   ├─ github-mcp — 讀取 PR、張貼意見
│   └─ slack-mcp — 發送訊息
│
└─ Plugins (選用):
    └─ GitHub Actions Plugin — 在 CI/CD 流程中觸發審查
```
</details>

### Bonus：找一個 MCP Server 並描述如何被 Skill 引用

在 GitHub 上搜尋一個 MCP Server（關鍵字：`mcp-server`），閱讀它的 README，然後回答：

1. 這個 MCP Server 提供什麼能力？
2. 一個 Skill 如何在其 SKILL.md 中引用這個 MCP Server？

<details>
<summary>範例</summary>
以 GitHub MCP Server（github.com/modelcontextprotocol/servers）為例：

1. **能力**：提供操作 GitHub 的 Tool——列出 PR、審查程式碼、建立 Issue、搜尋倉庫等
2. **Skill 引用方式**：
   ```yaml
   # SKILL.md
   name: pr-review
   description: Review GitHub pull requests against team coding standards.
   compatibility:
     mcp-servers:
       - github    # 需要 GitHub MCP Server
       - filesystem  # 需要本地檔案存取
   ```
   在 SKILL.md 的步驟中，Skill 會指示 Agent 使用 GitHub MCP Server 提供的 Tool（如 `getPullRequestDiff`、`submitReviewComment`）來完成 PR 審查任務。
</details>

---

## 下一步

在 Chapter 4 中，我們將實際動手——從零建置第一個 Agent Skill，包含建立目錄、撰寫 SKILL.md、加入腳本與驗證，完整走完開發流程。

---

<!--
Professional teaching style — Chapter 3 of 17
Course: Agent Skills 實戰線上課程
Topic: Skills vs Tools vs MCP vs Plugins — Complete Comparison
-->

---

← [上一章: Ch2: 三層漸進式揭露](/課程/01-02-progressive-disclosure) | [下一章: Ch4: 從零建置第一個 Skill](/課程/02-01-quickstart) →
