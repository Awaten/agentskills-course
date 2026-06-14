---
title: "第十五章：Skills、MCP、Subagents — 三層架構實戰"
description: "深入理解 Skills、MCP、Subagents 三種原語的本質差異與協作關係，掌握四種編排模式並實作完整的三層事件回應系統。"
outline: [2, 3]
---

# 第十五章：Skills、MCP、Subagents — 三層架構實戰

---

> **章節時長**：約 35 分鐘閱讀 + 25 分鐘練習
> **難度**：中高階（建議先完成第 2 章三層漸進式揭露與第 5 章 MCP 基礎）
> **使用方式**：若你正在設計包含多個技能的複雜 Agent 系統，本章可直接作為架構決策指南

---

## 學習目標

完成本章後，你將能夠：

1. **區分** Skills、MCP、Subagents 三種原語（primitives）的本質差異與互補關係
2. **設計**一組協作規則，決定什麼邏輯該放入哪一層
3. **實作**一個跨三層的真實案例（事件回應系統）
4. **評估**架構方案的 latency、context 共享與錯誤傳播特性
5. **套用**四種常見的編排模式到自己的 Agent 專案中

---

## 15.1 三個原語，一個系統

如果你已經完成前面章節的學習，你應該已經分別認識了這三個概念：

- **Skills**：Agent 的專業手冊（第 2-10 章）
- **MCP**：Agent 連接外部世界的工具協定（第 14 章，05-02）
- **Subagents**：Agent 委派任務給專門的助理（第 ⚠️ 13 章或前導章節）

但它們之間是什麼關係？各自解決什麼問題？哪些場景該用哪一個？

**這是本章要回答的核心問題。**

### 15.1.1 一句話區分

```
Skills   = Agent 的「大腦」— 知道怎麼做事
MCP      = Agent 的「手腳」— 接觸外部世界
Subagent = Agent 的「同事」— 可以委派的幫手
```

- 沒有 Skills，Agent 不知道正確的執行順序與注意事項
- 沒有 MCP，Agent 只能憑空想像，無法讀寫檔案、呼叫 API、操作瀏覽器
- 沒有 Subagents，Agent 被迫自己完成每一件事，無法平行處理

三者缺一不可。但更重要的是：**它們如何協作？**

[DIAGRAM: 三層能力模型。一個機器人圖示（代表 Agent）連接到三個不同顏色的區塊。左側區塊是「Skills（知識/指令）」— 一本打開的書，內含步驟與避坑清單。中間區塊是「MCP（工具/外部）」，顯示扳手、螺絲起子和 API 連線圖示，分別代表檔案系統、網路請求、資料庫。右側區塊是「Subagent（委派/平行）」，顯示一個人物圖示分裂成數個小人物，每個箭頭標示不同的任務。三個區塊之間有雙向箭頭相連，頂部標題：「Agent 系統的三層原語」。]

---

## 15.2 Layer 1 — Skills：內在知識與指令

### 15.2.1 Skills 的本質

Skills 是**指令集**。它不是程式碼，而是敘述性的步驟描述——告訴 Agent「怎麼做才能正確完成這個任務」。

與傳統程式最大的差異：Skills 依賴 Agent 的**理解能力與判斷力**來執行，而非嚴格的編譯執行。

一個典型的 Skill 包含：

| 元件 | 用途 | 範例 |
|------|------|------|
| **name + description** | 讓 Agent 知道何時該用 | `name: fb-post-publisher` |
| **逐步流程** | 告訴 Agent 執行順序 | `第一步：開啟 Creator Studio` |
| **Gotchas（避坑清單）** | Agent 不會自己發現的陷阱 | `⚠️ React contenteditable 不吃 DOM 直接修改` |
| **校驗循環** | 確保每一步正確 | `執行 scripts/validate.sh 確認格式` |

### 15.2.2 Skills 不適合做什麼

Skills 非常擅長「告訴 Agent 怎麼做」，但它們**不擅長**：

1. **高度重複的機械操作**：如果一個步驟需要做 1000 次，寫在 SKILL.md 裡叫 Agent 手動做是浪費 token。這該交給 MCP 工具或 scripts/。
2. **即時資料運算**：「計算這個字串的 SHA256」不該用文字描述步驟，該用 `openssl sha256`。
3. **需要精確延時或協調的任務**：Agent 的「等待」行為不可靠，這類任務該交給 Subagent 或 MCP。

### 15.2.3 Skills 是「語意層」

把 Skills 想像成一個**語意層（Semantic Layer）**——它將低階的工具呼叫（Tool Calling）包裝成高階的工作流程。

MCP 提供的是「打開檔案」、「搜尋網路」、「寫入資料庫」等原子操作。但你的業務流程是「分析這份財務報表」、「發布一篇 Facebook 貼文」、「處理這個客戶退款」。

**Skills 就是連接兩者的橋樑。**

```
低階工具（MCP）:   read_file()  search_web()  execute_sql()
                        ↕          ↕              ↕
語意層（Skills）:   「分析財報」   「發布貼文」   「處理退款」
```

---

## 15.3 Layer 2 — MCP：外部工具與資料

### 15.3.1 MCP 的本質

MCP（Model Context Protocol）是一個開放協定，定義了 Agent 與外部系統之間的通訊方式。從 Agent 的角度來看，MCP 就是一系列**工具（tools）**——Agent 可以呼叫這些工具來影響外部世界。

常見的 MCP server 範例：

| MCP Server | 提供的工具 | 讓 Agent 能做什麼 |
|-----------|-----------|------------------|
| `filesystem` | read_file, write_file, search | 讀寫本地檔案 |
| `chrome-devtools` | click, fill, navigate, screenshot | 操作瀏覽器 |
| `github` | create_pr, list_issues, merge | 管理 GitHub Repository |
| `postgres` | execute_query, list_tables | 查詢資料庫 |
| `sequelize` | run_migration, seed_data | 管理資料庫結構 |

### 15.3.2 MCP 與 Skills 的界線

這是最常見的架構問題：**某個邏輯到底該放在 SKILL.md 還是寫成 MCP tool？**

一個簡單的判斷原則：

```
能用文字描述的步驟          → Skill
需要執行程式碼的操作        → MCP tool（或 scripts/）
需要持續輪詢或監聽的操作    → MCP tool
需要在多個 Skills 間共用的操作 → MCP tool（避免重複指令）
一次性的、情境特定的步驟    → Skill
```

舉例來說：「如何用 Chrome DevTools 填入 FB 貼文」——這個知識包含 React 編輯器的特殊行為（吃鍵盤事件不吃 DOM 修改），這是經驗知識，**適合放在 SKILL.md 的 gotchas 中**。

但「click 這個按鈕」、「type 這段文字」——這些是機械操作，**由 MCP tool 執行**。

### 15.3.3 ⚠️ MCP 的「接口膨脹」陷阱

當團隊開始大量使用 MCP 時，容易出現一個問題：**每一個小動作都想要新增一個 MCP tool**。

「我們需要一個 `validate_email` 的 MCP tool！」
「還需要一個 `format_date` 的 tool！」
「再一個 `count_tokens`！」

這會導致 MCP server 變得臃腫，維護成本直線上升。一個更穩健的作法是：

- **Task-specific vs. General-purpose**：MCP tool 應該是通用的（讀檔案、查資料庫、執行 shell），而不是特定於某個任務的（`validate_signup_form`）。特定任務的邏輯應該在 SKILL.md 中組合通用工具來達成。
- **Scripts 作為中繼**：如果某個邏輯太複雜不適合寫在 SKILL.md，但又太特定不適合做成 MCP tool，就寫成 `scripts/` 中的腳本，由 SKILL.md 呼叫執行。

---

## 15.4 Layer 3 — Subagents：委派與平行

### 15.4.1 為什麼需要 Subagents

單一 Agent 的能力再強，也有兩大限制：

1. **序列執行**：Agent 一次只能做一件事（至少在同一個 context 中）
2. **Context 干擾**：做 A 任務時產生的中間產出，可能干擾 B 任務的判斷

Subagents 解決這兩個問題：

- **平行執行**：主 Agent 將獨立任務委派給多個 Subagents，各自在自己 context 中執行
- **context 隔離**：每個 Subagent 只有自己任務的 context，不受其他任務干擾
- **專業化**：每個 Subagent 可以載入自己需要的 Skills，不需要知道其他 Skills 的存在

### 15.4.2 Subagent 的三種模式

#### 模式 A：任務委派（Task Delegation）

主 Agent 將一個獨立任務完全交給 Subagent，等待結果：

```
你（主 Agent）
  │
  ├─ 委派「搜尋 2026 AI 趨勢」→ Subagent A（研究員）
  │   返回：搜尋結果摘要
  │
  └─ 委派「資料庫 schema 設計」→ Subagent B（架構師）
      返回：ER 圖與 migration 計畫
```

#### 模式 B：平行 Fan-out

同時啟動多個 Subagents，收集所有結果後整合：

```
你（主 Agent）
  │
  ├─ Subagent A（爬蟲）→ 爬取 5 個來源
  ├─ Subagent B（分析）→ 分析競爭對手
  └─ Subagent C（撰寫）→ 生成報告草稿
      同步等待 → 整合為最終報告
```

#### 模式 C：工作管線（Pipeline）

Subagents 依序執行，上一個的輸出是下一個的輸入：

```
你（主 Agent）
  │
  Subagent A（資料蒐集）→ output.json
       ↓
  Subagent B（資料清洗）→ cleaned.json
       ↓
  Subagent C（資料分析）→ report.md
```

### 15.4.3 ⚠️ Subagent 的啟動成本

Subagent 不是免費的。每次啟動一個 Subagent 都有 overhead：

| 成本項目 | 大約消耗 |
|---------|---------|
| 建立 Subagent context | 1,000-3,000 tokens（系統提示） |
| 傳遞任務描述 | 200-500 tokens |
| 傳回結果 | 變動（取決於結果大小） |
| 上下文切換 | 主 Agent 需要「回想」Subagent 在做什麼 |

因此：**一個只做 30 秒工作的 Subagent 通常不值得啟動**。只有在任務的預期執行時間 > 2-3 分鐘，或任務需要獨立 context 時，才考慮使用 Subagent。

---

## 15.5 三層協作：一個 Skill 呼叫 MCP 並委派 Subagent

現在我們來看三層如何實際協作。

### 15.5.1 典型協作流程

```
           SKILL.md（指令層）
               │
               │ 「執行步驟 1：使用 MCP 工具搜尋網路」
               │
               ▼
           MCP tool（執行層）
               │
               │ 返回搜尋結果
               │
               ▼
           Agent 判斷結果（語意層）
               │
               │ 「執行步驟 2：委派 Subagent 分析這份資料」
               │
               ▼
           Subagent（隔離層）
               │
               │ 返回分析報告
               │
               ▼
           Agent 整合結果（語意層）
               │
               │ 「執行步驟 3：用 MCP 工具寫入檔案」
               │
               ▼
           完成
```

### 15.5.2 具體的程式碼視角

```markdown
# SKILL.md（technology-research）

## 步驟 2：深度分析

1. 從步驟 1 的 output/articles.json 讀取原始資料
2. 對每個技術主題：
   a. 使用 MCP tool `web_search` 搜尋最新的討論
   b. 委派一個 Subagent 專門分析這個主題的優缺點
   c. Subagent 返回結構化的分析結果
3. 使用 MCP tool `write_file` 將分析結果寫入 output/analysis.json
```

當 Agent 執行步驟 2a 時：
```
Agent 讀取 SKILL.md → 「需要搜尋」
Agent 呼叫 MCP tool web_search(query="...")
Agent 取得搜尋結果 → 放入 context
```

當 Agent 執行步驟 2b 時：
```
Agent 讀取 SKILL.md → 「需要委派分析」
Agent 啟動 Subagent，傳遞任務描述 + 搜尋結果
Subagent 在自己的 context 中載入 analysis skill
Subagent 返回分析報告
Agent 接收報告 → 放入 context
```

### 15.5.3 關鍵：SKILL.md 是「指揮中心」

注意整個流程中，**SKILL.md 扮演了指揮中心（Orchestrator）的角色**。它不是被動被讀取的文件，而是引導 Agent 動態選擇「何時用 MCP」、「何時委派 Subagent」。

這與傳統程式設計的 control flow 有本質差異：

| | 傳統程式 | Agent Skills |
|---|---|---|
| **控制流程** | 程式碼決定 | Agent 根據指令判斷 |
| **工具呼叫** | 預先寫死的 API calls | 動態選擇的 MCP tools |
| **委派邏輯** | 手動 thread/process 管理 | Agent 判斷何時需要 Subagent |
| **錯誤處理** | try-catch 區塊 | 指令中的 ⚠️ 警告與校驗循環 |

---

## 15.6 架構模式：四種常見編排

### 模式 1：Skill-driven Orchestration

**概念**：一個主控 Skill 定義完整流程，流程中穿插 MCP 呼叫與 Subagent 委派。

**適用**：流程固定的任務（資料管線、發布流程、部署腳本）。

```
Orchestrator Skill
  ├─ MCP: 讀取設定檔
  ├─ Subagent: 平行處理每個模組
  └─ MCP: 寫入結果
```

**優點**：流程可控，易於除錯。
**缺點**：缺乏彈性——偏離流程的邊界案例需要新的 Skill 版本。

### 模式 2：Subagent Specialization

**概念**：每個 Subagent 有自己的 Skills 套件，處理特定領域的任務。主 Agent 做路由。

**適用**：多領域系統（客服系統、程式碼審查平台）。

```
Customer Support Agent（主路由）
  ├─ Subagent: 帳務問題（載入 billing skill + MCP 查詢帳務 DB）
  ├─ Subagent: 技術問題（載入 troubleshooting skill + MCP 讀取系統日誌）
  └─ Subagent: 客訴問題（載入 escalation skill + MCP 開立工單）
```

**優點**：隔離性最好，每個領域獨立演進。
**缺點**：Subagent 之間無法共享 context，跨領域問題需要主 Agent 介入協調。

### 模式 3：Tool-first Micro-workflow

**概念**：盡可能用 MCP tool 完成工作，SKILL.md 極簡（只是 tool 的組合說明），不使用 Subagent。

**適用**：簡單的自動化任務（轉檔、備份、定時報告）。

```
MCP: read_file → MCP: convert_format → MCP: write_file
  ↑                                                       ↑
  └─────────────── SKILL.md（5 行指令）──────────────────┘
```

**優點**：延遲最低，token 消耗最小。
**缺點**：無法處理需要判斷的複雜情境。

### 模式 4：Hybrid Mesh

**概念**：混合使用三種模式，根據任務特性動態決定。

**適用**：大型企業級系統，任務類型多樣且不可預測。

```
主控 Skill（決策節點）
  │
  ├─ 如果任務為「例行性」→ 模式 3（Tool-first）
  ├─ 如果任務為「多領域」→ 模式 2（Subagent Specialization）
  └─ 如果任務為「固定流程」→ 模式 1（Skill-driven）
```

**優點**：高度彈性，可適應各種任務類型。
**缺點**：設計複雜度最高，需要仔細測試決策邏輯是否正確。

[DIAGRAM: 四種架構模式的並排比較圖。從左到右分別是四種模式的簡化示意圖。模式 1（Skill-driven Orchestration）畫一個大圓（Orchestrator Skill）連接數個小工具圖示（MCP）和數個小人物（Subagents）。模式 2（Subagent Specialization）畫一個路由器圖示連接到三個不同顏色的人物（帳務、技術、客訴），每個人旁邊有其專屬的工具包。模式 3（Tool-first Micro-workflow）畫一條直線上的三個工具圖示（read → convert → write），上方放一個極小的文件圖示代表精簡的 SKILL.md。模式 4（Hybrid Mesh）畫一個菱形決策節點，三條虛線分別連結到前三種模式。每種模式下方標示其適用場景。]

---

## 15.7 真實案例：事件回應系統（Incident Response）

這是一個實際在公司內部部署的系統，完整使用了 Skills + MCP + Subagents 三層架構。

### 15.7.1 情境

當線上服務發生異常（例如網站回應逾時、資料庫連線數爆量），一個 Agent 需要自動回應事件，流程如下：

1. 確認事件類別與嚴重程度
2. 蒐集相關資訊（日誌、指標、最近變更）
3. 分析根本原因
4. 執行緩解措施（或建立工單）
5. 事後撰寫報告

### 15.7.2 三層設計

#### Skills 層

| Skill | 用途 | 關鍵指令 |
|-------|------|---------|
| `incident-triage` | 分類事件，判斷嚴重程度 | 根據 error pattern 比對已知案例庫 |
| `incident-investigate` | 蒐集與分析資訊 | 執行 MCP 工具讀取日誌、查詢指標 |
| `incident-mitigate` | 執行緩解措施 | 重啟服務、擴容、切換備援 |
| `incident-report` | 事後撰寫報告 | 格式化的時間軸 + 根因分析 + 行動項目 |

#### MCP 層

| MCP Server | 提供的工具 | 在案例中的用途 |
|-----------|-----------|--------------|
| `prometheus` | query_metric | 查詢 CPU、記憶體、延遲指標 |
| `k8s` | get_pods, describe_deployment | 檢查 Pod 狀態、重啟 Deployment |
| `pagerduty` | trigger_incident, acknowledge | 開立事件、更新狀態 |
| `slack` | send_message, list_channels | 發送通知到 #incident 頻道 |
| `filesystem` | read_file, grep_logs | 讀取應用程式日誌 |
| `github` | list_recent_commits | 檢查最近程式碼變更 |

#### Subagent 層

| Subagent | 載入的 Skills | 任務 |
|---------|-------------|------|
| **第一線調查員** | incident-triage, incident-investigate | 快速判定事件類型與影響範圍 |
| **基礎設施專家** | k8s 操作、資料庫調校 | 深入檢查系統層面的問題 |
| **程式碼分析師** | git blame、diff 分析 | 找出最近變更與事件的關聯 |
| **通報專員** | incident-notify | 向團隊與主管發送狀態更新 |

### 15.7.3 完整執行流程

```
事件觸發（PagerDuty alert）
    │
    ▼
主控 Skill「incident-response」啟動
    │
    ├─ 1. ⚠️ 先確認事件不是誤報
    │      MCP: query_metric("error_rate") > threshold?
    │      如果是誤報 → 關閉事件，結束
    │
    ├─ 2. 委派「第一線調查員」Subagent
    │      Subagent 載入 incident-triage skill
    │      MCP: grep_logs("ERROR", timeframe="5m")
    │      MCP: list_recent_commits(repo="backend")
    │      返回：事件分類為「資料庫連線逾時」，影響範圍「訂單服務」
    │
    ├─ 3. 委派「基礎設施專家」Subagent
    │      Subagent 載入 incident-investigate skill（基礎設施版）
    │      MCP: query_metric("db_connection_count")
    │      MCP: describe_deployment("order-service")
    │      返回：資料庫連線池耗盡，Deployment 無異常
    │
    ├─ 4. 執行緩解措施（根據時間敏感度決定）
    │      MCP: 執行資料庫連線池擴容
    │      MCP: 重啟 order-service 的部分 Pod
    │      Slack: 發送「執行中」通知到 #incident
    │
    ├─ 5. 監控 5 分鐘
    │      MCP: query_metric("error_rate") 確認下降
    │      MCP: query_metric("latency_p99") 確認恢復
    │
    └─ 6. 委派「程式碼分析師」Subagent + 事後報告
           Subagent 載入 incident-report skill
           產出：完整的事後檢討報告（Postmortem）
           MCP: write_file("postmortem-2026-06-06.md")
           Slack: 發送報告連結到 #incident
```

### 15.7.4 為什麼三層在這裡很重要？

如果只用 Skills 不用 MCP：
> Agent 只能告訴人類「你應該去檢查資料庫連線數」，無法實際執行查詢。

如果只用 MCP 不用 Skills：
> Agent 有一堆工具但不知道「事件回應的正確順序是什麼」，可能先重啟服務才確認影響範圍。

如果不用 Subagents：
> 單一 Agent 的 context 會被「日誌內容 + 指標數據 + 程式碼變更 + 通報訊息」塞滿，無法有效思考。每個 Subagent 的隔離 context 讓它們可以專注在自己的任務上。

---

## 15.8 決策框架：什麼放在哪一層？

### 15.8.1 三步驟判斷法

當你需要決定一件事該放在哪一層時，依序問自己三個問題：

```
問題 1：這需要執行程式碼或呼叫外部服務嗎？
  │
  ├─ 是 → 這是 MCP tool 或 scripts/ 的工作
  │        接著問：
  │        這個操作需要跨 Skill 共用嗎？
  │          ├─ 是 → MCP tool（唯一共用方式）
  │          └─ 否 → scripts/ 就夠了
  │
  └─ 否 → 繼續問問題 2
    
問題 2：這需要 Agent 的判斷力還是純機械步驟？
  │
  ├─ 需要判斷 → Skill（SKILL.md 中的指令）
  │        接著問：
  │        這個判斷是 Agent 的常識還是領域知識？
  │          ├─ 常識 → 不需要寫進 Skill
  │          └─ 領域知識 → 寫進 SKILL.md
  │
  └─ 機械步驟 → 濃縮成一行指令或 script
    
問題 3：這個任務需要獨立的 context 嗎？
  │
  ├─ 是 → Subagent
  │        判斷標準：
  │        任務完成需要 > 3 分鐘？
  │        任務產出會干擾主 Agent 的 context？
  │        任務需要載入完全不同的 Skills？
  │          └─ 任一為「是」→ Subagent
  │
  └─ 否 → 由主 Agent 直接在當前 context 中執行
```

### 15.8.2 快速對照表

| 場景 | Skill | MCP | Subagent | 理由 |
|------|-------|-----|----------|------|
| 「先做 A 再做 B 再做 C」 | ✅ | | | 流程知識，需要 Agent 判斷 |
| 「讀取這個檔案」 | | ✅ | | 機械操作，需要執行程式碼 |
| 「分析這份資料並給我摘要」 | ✅ | ✅ | | 讀取用 MCP，分析判斷用 Skill |
| 「搜尋網路、爬取內容、產出報告」三個獨立子任務 | | | ✅ | 平行任務，需要獨立 context |
| 「按這個按鈕」 | | ✅ | | 瀏覽器自動化 |
| 「記得 React 編輯器不吃 DOM 直接修改」 | ✅ | | | 經驗知識，屬於 gotchas |
| 「同時監控 5 個服務的狀態」 | | | ✅ | 需要持續關注，不適合與主流程共用 context |

---

## 15.9 效能考量

### 15.9.1 延遲（Latency）

| 操作 | 典型延遲 | 原因 |
|------|---------|------|
| 載入一個 Skill | 0.5-1.5s | SKILL.md 讀取 + tokenize |
| 呼叫一個 MCP tool | 0.2-5s | 網路請求、外部服務回應時間 |
| 啟動一個 Subagent | 3-10s | 建立新 context、載入 Skills、初始化 |
| Subagent 回傳結果 | 取決於任務 | 從幾秒到幾分鐘 |

**實務建議**：

- 如果一個 MCP tool 回應時間 > 3s，考慮非同步模式（啟動後繼續其他工作，稍後回來檢查結果）
- Subagent 適合「重量級」任務（>30s），不適合「只是查個資料」的輕量操作
- Skill 的載入成本固定，所以一個 5,000 tokens 的 Skill 和一個 500 tokens 的 Skill 載入時間差異不大

### 15.9.2 Context 共享

三層之間的 context 共享機制必須明確設計：

```
Skills → Agent 的 context
  Agent 讀取 SKILL.md 後，內容就在 context 中
  可以隨時參照，不需要「傳遞」

MCP → 回傳值放入 Agent 的 context
  Agent 呼叫 MCP tool 後，回傳值成為對話的一部分
  回傳值如果太大（> 數千 tokens），可能壓縮到其他資訊的空間
  
Subagent → 透過「結果摘要」共享
  完整結果寫入檔案，摘要回傳給主 Agent
  主 Agent 不需要知道完整細節，只需要知道「發生了什麼」
```

### 15.9.3 ⚠️ 錯誤傳播

三層架構中，錯誤可能在任何一層發生，且傳播路徑不同：

```
Skills 層錯誤：Agent 執行了錯誤的步驟
   → 影響範圍：當前任務
   → 修復方式：修正 SKILL.md

MCP 層錯誤：工具呼叫失敗（網路斷線、API rate limit）
   → 影響範圍：單一操作
   → 修復方式：重試、降級、回退到人工處理
   → ⚠️ Skill 應該包含「MCP 工具失敗時的替代方案」

Subagent 層錯誤：Subagent 無法完成任務
   → 影響範圍：Subagent 的獨立任務
   → 修復方式：重試（重新委派）、或由主 Agent 接管
   → ⚠️ 主 Agent 不應假設 Subagent 一定會成功
```

一個穩健的三層系統，應該在每個層級都有錯誤處理：

```markdown
## 步驟 2：分析根本原因

1. 委派基礎設施專家 Subagent 進行分析
2. ⚠️ 如果 Subagent 在 60 秒內未回傳結果：
   視為逾時，由主 Agent 自行執行基本分析
3. ⚠️ 如果 Subagent 回傳「無法判定」：
   標記為「需要人工介入」，升級到 on-call 工程師
4. ⚠️ 如果 MCP 工具（prometheus）無法連接：
   改用備用指標來源（cloudwatch）
```

---

## 15.10 本章摘要

1. **三層各司其職**：Skills 提供知識與流程（大腦），MCP 提供工具與資料（手腳），Subagents 提供委派與隔離（同事）。

2. **SKILL.md 是指揮中心**：它不只是指令文件，更是動態決定「何時用 MCP」、「何時委派 Subagent」的決策引擎。

3. **決策三步驟**：需要程式碼執行嗎？→ MCP/scripts。需要判斷力嗎？→ Skill。需要獨立 context 嗎？→ Subagent。

4. **Subagents 有啟動成本**：3-10s 的 overhead + 1,000-3,000 tokens 的系統提示。只適合重量級任務。

5. **四種編排模式**：Skill-driven（固定流程）、Subagent Specialization（領域隔離）、Tool-first（輕量自動化）、Hybrid Mesh（動態決策）。

6. **錯誤傳播三層都要處理**：MCP 失敗的替代方案、Subagent 逾時的降級策略、Skill 指令的校驗循環，缺一不可。

7. **事件回應系統的真實案例**展示了三層如何協作——這不是理論模式，而是已經在生產環境驗證過的架構。

---

## 練習題

### Q1（分類題）：以下項目分別屬於哪一層？

將下列 8 個項目分類到 Skills / MCP / Subagent / 可能多層：

1. 「先讀取設定檔，再根據設定檔的環境變數決定使用哪個資料庫」
2. `read_file("config.yaml")`
3. 一個專門爬取 PTT 文章的助理，有自己的爬蟲 skills
4. 「⚠️ 在 Windows 上檔案路徑要用反斜線」
5. `execute_sql("SELECT * FROM users WHERE status = 'active'")`
6. 同時爬取 5 個新聞網站的最新頭條
7. 「如果 API 回傳 429，等待 5 秒後重試，最多重試 3 次」
8. 一個共享的 `format_report()` 工具函式

---

### Q2（設計題）：為「內容排程發布系統」設計三層架構

假設你要建立一個自動化內容發布系統，功能包含：

- 從 Google Sheets 讀取排程表
- 自動產生社群媒體貼文（調整語氣與長度）
- 在指定時間發布到 FB、Threads、LinkedIn
- 發布後收集互動數據
- 每週產出發布成效報告

請回答：

1. 你會將哪些邏輯放在 Skills 層？列出至少 3 個 Skill 的名稱與簡短描述（name + description）
2. 你會需要哪些 MCP Servers？列出至少 3 個並說明用途
3. 你會在哪裡使用 Subagent？說明理由（需要獨立 context 的任務）
4. ⚠️ 如果 Google Sheets API 在發布時無法連接，你的三層架構如何處理這個錯誤？（分別說明 Skills、MCP、Subagent 各自該做什麼）

---

### Q3（分析題）：辨識架構問題

以下是某個團隊設計的三層架構。請找出至少 3 個設計問題，並說明為什麼：

```
專案：客戶支援系統

Skills:
  cs-triage（分類客戶問題，4,500 tokens）
  cs-billing（處理帳務問題，包含直接查詢資料庫的 SQL 語法，3,200 tokens）
  cs-technical（處理技術問題，2,800 tokens）

MCP:
  只有一個 MCP server：slack（發送訊息到支援頻道）

Subagents:
  未使用

流程：
  Agent 讀取 cs-triage skill → 判斷問題類型
  → 如果是帳務問題，讀取 cs-billing skill
    → cs-billing 的步驟包含「執行 SQL 查詢」——但沒有 DB 相關的 MCP tool
    → Agent 回應：「請執行以下 SQL：SELECT * FROM invoices...」
  → 如果問題無法分類，在 Slack 發送訊息給人工客服
```

提示：思考「cs-billing 需要查資料庫但沒有對應 MCP」、「Subagent 是否適合這裡」、「分類技能與專項技能之間的重疊」。

---

### Q4（實作題）：改寫 Skill 加入 MCP 與 Subagent

以下是一個簡化的事件回應 SKILL.md。它完全沒有使用 MCP 或 Subagents——只有文字指令。請改寫它，加入 MCP 工具呼叫與 Subagent 委派。

```markdown
# incident-responder

## 步驟
1. 收到警報時，先看看 error rate 是不是真的很高
2. 如果是，去看看最近的日誌有沒有錯誤
3. 再檢查一下伺服器的 CPU 和記憶體
4. 如果找到原因，嘗試修復
5. 修復後觀察 5 分鐘確認問題解決
6. 寫一份報告
```

改寫要求：
- 加入具體的 MCP tool 名稱與參數（可以假設你需要的 MCP servers 都存在）
- 將「寫報告」改為 Subagent 委派
- 在步驟 1 加入「確認非誤報」的 ⚠️ 邏輯
- 在步驟 4 加入「無法修復時」的替代路徑

---

### Bonus Challenge：實作一個迷你三層系統

選擇一個你日常工作或個人專案中的重複性任務（例如「每週整理閱讀清單」、「自動化部署筆記到部落格」），為它設計並實作一套 Skills + MCP + Subagents 的三層架構：

1. **第一層**：撰寫一個主控 SKILL.md，包含完整的流程與 gotchas
2. **第二層**：串接至少 2 個 MCP tools（例如 filesystem 讀寫 + 一個網路服務）
3. **第三層**：在其中一個步驟委派 Subagent 處理獨立子任務
4. 實際執行一次，記錄觀察到的行為與效能數據
5. 寫一份簡短的回顧（半頁 A4），說明「三層協作比只用 Skills 好在哪裡」

---

## 重點回顧

- Skills、MCP、Subagents 是 Agent 系統的三個互補原語，分別對應：知識與流程、外部工具、任務委派
- SKILL.md 是指揮中心——決定何時呼叫 MCP、何時啟動 Subagent
- MCP 提供機械操作（讀檔、查詢、點擊），Skills 提供判斷與經驗（順序、gotchas）
- Subagents 提供 context 隔離與平行執行，但有 3-10s 的啟動成本
- 四種架構模式：Skill-driven、Subagent Specialization、Tool-first、Hybrid Mesh
- 錯誤處理必須三層兼顧：MCP 失敗的替代方案、Subagent 逾時降級、Skill 指令的校驗循環
- 事件回應系統是真實世界中三層協作的經典案例——從 triage 到調查、緩解、報告，每一層都扮演特定角色
- 決策三步驟幫助你判斷任何邏輯該放在哪裡：需要執行程式碼？→ MCP；需要判斷力？→ Skill；需要獨立 context？→ Subagent

---

<!--
Course: Agent Skills 實戰線上課程 (17 chapters)
Chapter 15 of 17: Skills、MCP、Subagents：三層架構實戰
Style: Professional teaching (Udemy-style), formal but approachable
Author: Technical Writer persona
-->

← [上一章：API 與 MCP 整合](/課程/05-02-api-integration) | [下一章：發布與分享](/課程/06-01-distribution) →
