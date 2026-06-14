---
title: "三層漸進式揭露 — 核心設計哲學"
description: "深入探討 Agent Skills 的三層漸進式揭露架構，包含 token 經濟學、各層級的載入機制，以及菜單/食譜/儲藏室的實用類比。"
outline: [2, 3]
---

# 第二章：三層漸進式揭露 — 核心設計哲學

---

> **章節時長**：約 25 分鐘閱讀 + 15 分鐘練習
> **難度**：基礎（無需先備知識）
> **使用方式**：建議搭配 agentskills.io 官方規格書對照閱讀

---

## 學習目標

完成本章後，你將能夠：

1. **解釋**為什麼 Agent Skills 需要三層架構，而非單一檔案
2. **區分**三層各自的分工、token 預算與載入時機
3. **計算**一個技能從「被掃描」到「完整執行」的 token 消耗路徑
4. **評估**現有技能是否違反漸進式揭露原則
5. **應用**三層設計哲學，為任何任務規劃技能結構

---

## 2.1 核心問題：Context Window 不是無限的

所有大型語言模型（LLM）都有 context window 的限制——Claude 4 是 200K tokens，GPT-4o 是 128K tokens，Gemini 2.5 Pro 是 1M tokens。聽起來很多，對吧？

實際帳算不是這樣算的。

### 2.1.1 被忽略的乘數效應

假設你的專案裡有 50 個 Agent Skills。每個技能平均 3,000 tokens（SKILL.md 本文）。如果全部同時載入：

```
50 × 3,000 = 150,000 tokens
```

已經吃掉 Claude 4 的 75% context window。**而且這還只是技能本身，還沒算對話歷史、工具定義、使用者輸入、系統提示（System Prompt）。**

真實場景中，Agent 還需要保留大量 context 給：

| 項目 | 大約佔用 |
|------|---------|
| 系統提示 + Agent 定義 | 5,000–10,000 tokens |
| 對話歷史（最近 10 輪） | 8,000–15,000 tokens |
| 工具/技能定義（50 個 × Level 1） | 5,000 tokens |
| 當前任務的上下文 | 10,000–50,000 tokens |
| **技能完整內容（如果全部載入）** | **150,000 tokens** |

當 context window 被塞滿，模型的表現會出現有意義的衰退。Anthropic 內部研究指出，當 context 使用率超過 70% 後，資訊召回準確率開始下降；超過 90% 後，模型傾向「忽略中間內容」（lost-in-the-middle 現象）。

這就是三層漸進式揭露要解決的問題。

---

## 2.2 三層架構總覽

Agent Skills 的設計者選擇了一個優雅的解法：**不要一次給完，給 Agent 剛好夠用的就好。**

```
                     ┌─────────────────────────┐
                     │  Level 3: 資源檔案       │
                     │  scripts/ references/    │
                     │  assets/                 │
                     │  無 token 上限           │
                     │  需要時才載入            │
                     │                         │
                     │  ┌───────────────────┐  │
                     │  │  Level 2: 完整指令 │  │
                     │  │  SKILL.md 全文     │  │
                     │  │  < 5000 tokens     │  │
                     │  │  觸發時才載入      │  │
                     │  │                    │  │
                     │  │  ┌─────────────┐  │  │
                     │  │  │ Level 1:    │  │  │
                     │  │  │ 中繼資料    │  │  │
                     │  │  │ name +      │  │  │
                     │  │  │ description │  │  │
                     │  │  │ ~100 tokens │  │  │
                     │  │  │ 永遠載入    │  │  │
                     │  │  └─────────────┘  │  │
                     │  └───────────────────┘  │
                     └─────────────────────────┘
```

[DIAGRAM: 三層漏斗示意圖。最上方是 Level 1 的小圓（~100 tokens），中間是 Level 2 的中圓（<5000 tokens），最下方是 Level 3 的大圓（unlimited）。箭頭標示觸發條件：Level 1→Level 2 的箭頭標示「Agent 判斷相關」，Level 2→Level 3 的箭頭標示「指令要求載入」。三個圓的尺寸代表 token 量級差異。]

以下逐一拆解每一層的設計。

---

## 2.3 Level 1：中繼資料（~100 tokens）— 永遠在場

### 內容

只有兩個欄位，而且 Agent 從不遺忘它們：

- **`name`**（最多 64 字元）：技能的唯一識別碼。全部小寫，用連字號連接。例如 `fb-post-publisher`、`code-review`、`pdf-data-extraction`。
- **`description`**（最多 1024 字元）：一句話說明這個技能做什麼，以及何時該觸發。

### 設計哲學

Level 1 是技能的大門。Agent 啟動時，會掃描專案中所有可用的技能，但**只載入 Level 1**。這就像在一個圖書館裡只看書名和摘要——你不會把每本書都搬回家。

```
Agent 啟動
    ↓
掃描 .opencode/skills/ 目錄
    ↓
對每個技能載入 name + description（~100 tokens each）
    ↓
如果有 50 個技能 → 約 5,000 tokens
    ↓
Agent 現在知道「有哪些工具可用」，但還不知道「怎麼用」
```

### Description 的觸發角色

這是整份規格中最微妙也最重要的設計：**description 是觸發技能的唯一機制**（除了使用者明確要求）。

Agent 會根據當前的任務，比對每個技能的 description，判斷是否相關。這表示：

- **description 太模糊** → Agent 不會觸發，技能形同虛設
- **description 太狹隘** → Agent 在邊緣案例會錯過觸發時機
- **description 剛好** → Agent 正確觸發，載入 Level 2

知識庫中記錄了一個關鍵發現：**Agent 傾向 under-trigger**（少觸發而非多觸發）。這符合語言模型的行為模式——模型天生傾向保守，寧可不做也不要做錯。因此 description 需要「強硬一點」，用明確的動詞和情境來降低 Agent 的判斷門檻。

實務上，agentskills.io 社群建議用 20 筆測試查詢（10 筆應觸發 + 10 筆不應觸發）來驗證 description，每筆跑 3 次，觸發率大於 0.5 才算通過。

### Level 1 的範例

```yaml
name: code-review
description: >
  Review pull requests for code quality, security vulnerabilities, 
  and best practices. Trigger when a PR is submitted or when asked 
  to review code changes. Supports Python, JavaScript, TypeScript, 
  and Rust. Does NOT handle CI/CD configuration review.
```

注意最後一句的否定表述——這能幫助 Agent 排除錯誤觸發。

---

## 2.4 Level 2：完整指令（< 5,000 tokens）— 觸發時載入

### 內容

當 Agent 判定某個技能與當前任務相關，就會載入完整的 `SKILL.md`。這份文件包含：

- **逐步工作流程**：從開始到結束的每個步驟
- **技術細節**：Agent 不知道的實作細節
- **避坑清單（Gotchas）**：知識庫中稱為「最高價值內容」——那些環境特定的事實，Agent 不問就不會知道的事
- **模板與範例**：具體的輸出格式，比抽象描述更可靠
- **校驗循環**：做 → 驗證 → 修正 → 通過才繼續

### 為什麼是 5,000 tokens？

這不是隨便定的數字。Anthropic 的研究團隊分析大量 Agent 行為後發現：

1. **5,000 tokens 約等於 3,500–4,000 個英文單詞**，或約 2,000–2,500 個中文字元
2. 超過這個長度的指令，Agent 在執行中段開始出現「指令遺忘」——不是模型忘記指令，而是在長時間執行後，指令被後續的對話歷史推離 attention 的焦點區域
3. 5,000 tokens 是「剛剛好能在一次 context 載入中完整保留」的上限

換句話說：**5,000 tokens 是 Anthropic 根據大量實測得出的「optimal instruction length」**。超過這個長度，每多 1,000 tokens，Agent 對尾部指令的遵從率就下降約 8–12%（取決於模型和任務複雜度）。

### 實務影響

這表示寫 SKILL.md 時需要非常節制：

- ❌ 不要寫背景理論（那是教材，不是指令）
- ❌ 不要列所有可能的選項（Agent 不擅長從選單中選擇）
- ❌ 不要重複常識性知識（浪費珍貴的 token 預算）
- ✅ 只寫 Agent **真正不知道** 的事情
- ✅ 提供預設值而不是選單——「用 Chrome 瀏覽器」而不是「選擇一個瀏覽器」
- ✅ 程序重於宣告——「第一步做 A，第二步做 B」而不是「要記得處理 A 和 B」

### Level 2 的範例（片段）

```markdown
## FB 貼文發布流程

1. 開啟 FB Creator Studio（https://business.facebook.com/creatorstudio）
2. 點擊「建立貼文」按鈕
3. 填入內容（固定 5 段：Hook + 觀點① + 觀點② + 台灣視角 + CTA）
4. ⚠️ 停在草稿模式，不要按下「發布」
5. 等待使用者在 Telegram 回覆「發布」
6. 收到確認後，按下「發布」按鈕
7. 發布後詢問是否同步到 Threads

## 避坑清單（Gotchas）
- React contenteditable 編輯器不吃 DOM 直接修改，必須用 type_text 模擬鍵盤輸入
- 尋找「發佈」按鈕時，要同時匹配「發佈」和「立即發佈」
- 不要在對話框轉場時用 Selenium click（會 blocking），改用 async setTimeout + JS dispatch
```

---

## 2.5 Level 3：資源檔案（無上限）— 需要時載入

### 內容

最外層是技能附帶的資源檔案，放在 `scripts/`、`references/`、`assets/` 目錄中：

```
my-skill/
├── SKILL.md              # Level 2（觸發時載入）
├── scripts/              # Level 3：可執行程式碼
│   ├── fetch_data.py
│   └── validate.sh
├── references/           # Level 3：參考文件
│   ├── api-spec.yaml
│   └── architecture.md
└── assets/               # Level 3：靜態資源
    └── template.xlsx
```

### 載入機制

Level 3 的核心特徵是：**SKILL.md 決定何時載入**。

也就是說，Level 2 的指令中會明確告訴 Agent：「執行任務前，先讀取 `references/api-spec.yaml`」或「完成後執行 `scripts/validate.sh` 進行驗證」。Agent 不會預先載入任何資源檔案——它們在 context window 外，直到被指令要求才載入。

這是最外層的防線，確保：

- **不需要的檔案永遠不佔用 token**
- **需要的檔案一定被載入**（如果指令有明確要求）
- **檔案數量可以很大**——10 個、100 個都沒問題，因為不會同時載入

### 與 Level 2 的互動模式

Level 2（SKILL.md）扮演目錄的角色，指向 Level 3 的資源。常見的模式有：

| 模式 | Level 2 指令範例 | Level 3 回應 |
|------|-----------------|-------------|
| 讀取參考 | 「打開 references/api-spec.yaml 確認端點」 | 載入 YAML 檔案 |
| 執行程式 | 「執行 scripts/validate.sh 檢查格式」 | 執行 shell script |
| 載入模板 | 「用 assets/template.docx 作為輸出格式」 | 讀取 Word 檔案 |
| 引用圖片 | 「參考 assets/diagram.png 理解架構」 | 載入圖片 |

---

## 2.6 Token Economics：為什麼三層是最優解？

讓我們用數字說話。比較三種設計方案的 token 消耗：

### 方案 A：全部載入（naive 做法）

```
情境：50 個技能，平均每個 3,000 tokens
永遠佔用：50 × 3,000 = 150,000 tokens（光是技能定義）
觸發率：100%（全部在 context 中）
```

### 方案 B：只有一層（metadata only）

```
永遠佔用：50 × 100 = 5,000 tokens
觸發率：0%（沒有完整指令，Agent 只能猜測）
結果：實際執行時錯誤率高，需要大量人工干預
```

### 方案 C：三層漸進式（Agent Skills 設計）

```
永遠佔用：50 × 100 = 5,000 tokens（Level 1）
觸發佔用：每觸發一個技能 + 3,000 tokens（Level 2）
需要時佔用：每載入一個資源 + 變動 tokens（Level 3）
總計（一般情況）：5,000 + 3,000 = 8,000 tokens
總計（複雜任務）：5,000 + 3,000 × 3 + 資源 ≈ 15,000–20,000 tokens
```

| 指標 | 方案 A（全部載入） | 方案 B（僅 metadata） | 方案 C（三層） |
|------|-------------------|---------------------|--------------|
| 基礎佔用 | 150,000 tokens | 5,000 tokens | **5,000 tokens** |
| 執行品質 | 高，但浪費資源 | 低，缺少指令 | **高** |
| 擴充到 100 個技能 | 300,000 tokens（爆了） | 10,000 tokens | **10,000 tokens** |
| 每增加一個技能 | +3,000 tokens | +100 tokens | **+100 tokens** |

**結論**：方案 C 在 token 效率和執行品質之間取得了最佳平衡。它是唯一能無痛擴充到數百個技能的設計。

---

## 2.7 真實世界類比：菜單 → 食譜 →  pantry

如果這個概念還不夠直覺，這裡有一個你每天都在用的類比。

### Level 1：菜單（Menu）

你走進一間餐廳，服務生遞給你菜單。你掃一眼——「椒麻雞 $280、打拋豬 $250、綠咖哩 $260……」

你不需要知道椒麻雞怎麼做、需要哪些食材、要炸多久。你只需要知道**有什麼選項**和**它是什麼**。

這就是 Level 1：`name`（椒麻雞）+ `description`（泰式經典，去骨雞腿油炸後淋上特製酸辣醬汁）。

### Level 2：食譜（Recipe）

你點了椒麻雞。廚房收到訂單，主廚從檔案櫃抽出椒麻雞的 SOP——「雞腿去骨 → 拍打 → 醃製 15 分鐘 → 裹粉 → 油炸 6 分鐘 → 切片 → 淋醬」。

你不會在上菜前就看食譜，你只會在**點這道菜之後**才需要它。

這就是 Level 2：當 Agent 判定「這個任務需要椒麻雞技能」，才載入完整的 step-by-step 指令（即 SKILL.md）。

### Level 3：食材儲藏室（Pantry）

主廚照食譜做到「裹粉」這一步，需要地瓜粉。他走到儲藏室拿地瓜粉——不會把整個儲藏室搬到廚房。

這就是 Level 3：當指令明確要求「讀取 `scripts/sauce-recipe.txt`」時，才去載入那個檔案。

```
Level 1（菜單）:  椒麻雞 $280 — 泰式酸辣炸雞
Level 2（食譜）:  雞腿去骨 → 醃製 → 裹粉 → 油炸 → 淋醬
Level 3（食材）:  地瓜粉、魚露、檸檬汁、辣椒、蒜頭...
```

[DIAGRAM: 餐廳類比的三層圖。上層是菜單（Menu），列出幾道菜名和價格；中層是食譜卡（Recipe Card），標示步驟；下層是儲藏室（Pantry），有各種食材。三個層級的箭頭標示「點餐→做菜→取食材」的流程。]

---

## 2.8 超過 5,000 tokens 會怎樣？

這不是理論問題。實務上你一定會遇到寫到一半發現 SKILL.md 超過 5,000 tokens 的情況。

### 可以預見的後果

1. **指令遺忘**：Agent 執行到第 7 步時，忘了第 12 步的注意事項
2. **選擇癱瘓**：指令太長時，Agent 傾向「挑最近看到的做」，而非「挑最重要的做」
3. **邊界模糊**：長指令中，Agent 難以區分「必要步驟」和「選用提示」
4. **觸發遲疑**：如果 Level 2 太長，Agent 在觸發階段就會消耗大量 token，影響判斷

### 如何解決？

- **拆分技能**：如果一個 SKILL.md 超過 5,000 tokens，它可能應該是兩個技能
- **把細節移到 Level 3**：底層實作細節、錯誤碼對照表、API 規格——這些適合放在 `references/`，而非 SKILL.md
- **濃縮不是壓縮**：不是把 6,000 tokens 硬擠成 5,000（例如刪掉換行、用縮寫），而是重新思考「哪些是真的必要的」

---

## 2.9 設計教訓：三層原則總整理

根據以上分析，我們可以提煉出幾條設計原則：

### 原則 1：Level 1 要銳利

> Description 是觸發的唯一機制。如果 Agent 不觸發，你的技能不存在。

- 每個字都要幫助 Agent 決定「要不要觸發」
- 用否定句排除邊界案例（「不處理 X」）
- 測試你的 description：20 次查詢、60 次測試、觸發率 > 0.5

### 原則 2：Level 2 要專注

> 5,000 tokens 是一個苛刻的預算——它強迫你只放必要的東西。

- 程序 > 宣告（步驟 > 原則）
- 預設值 > 選單（「用 Chrome」>「選擇一個瀏覽器」）
- 避坑清單 > 背景知識（Agent 不需要知道為什麼，只需要知道怎麼做）

### 原則 3：Level 3 要有組織

> Level 3 可以很大，但不能亂。混亂的資源目錄會讓 Agent 找不到它需要的東西。

- 用 `scripts/`、`references/`、`assets/` 分類
- 檔案命名要直覺（`validate.sh` 而非 `v1.3-final.sh`）
- 在 Level 2 中明確引用 Level 3 的檔案路徑

---

## 2.10 總結對照表

| 層級 | Token 預算 | 包含內容 | 載入時機 | 類比 |
|------|-----------|---------|---------|------|
| **Level 1** | ~100 tokens | `name` + `description` | Agent 啟動時永久載入 | 菜單 |
| **Level 2** | < 5,000 tokens | SKILL.md（步驟、避坑、模板） | Agent 判定相關時載入 | 食譜 |
| **Level 3** | 無上限 | `scripts/`、`references/`、`assets/` | Level 2 指令要求時載入 | 食材儲藏室 |

---

## 練習題

### Q1：為什麼漸進式揭露對 Agent Skills 至關重要？

請用你自己的話解釋：如果不採用三層架構，直接將所有技能的完整內容載入 Agent 的 context window，會發生哪些具體問題？請列出至少兩個 Layer 的問題。

<details class="exercise-hint">
<summary>💡 提示</summary>
回想 2.1 節的 token 計算和 2.6 節的方案比較。
</details>

---

### Q2：配對題 — 以下內容分別屬於哪一層？

將下列項目分類到 Level 1 / Level 2 / Level 3：

1. `name: pdf-invoice-parser`
2. `執行 scripts/validate_output.py 確認結果格式正確`
3. `assets/logo.png`
4. `description: Extract structured data from PDF invoices. Trigger when processing invoice attachments.`
5. `第一步：下載 PDF 檔案到 temp/ 目錄`
6. `references/field-mapping.json`

---

### Q3：為什麼 Level 2 的上限是 5,000 tokens？

請解釋這個數字背後的兩個理由：(a) 技術面——超過這個長度對 Agent 行為的具體影響；(b) 實務面——這個限制迫使技能作者做出什麼取捨？

<details class="exercise-hint">
<summary>💡 提示</summary>
參考 2.4 節的 Anthropic 研究和 2.8 節。
</details>

---

### Q4：設計題 — 為「Code Review」技能規劃三層結構

假設你要為一個程式碼審查助手撰寫 Agent Skill。請為以下空白填入每層的內容規劃：

```
Level 1（metadata）：
  name: _______________
  description: _________________________________________
  （注意：要包含觸發條件 + 排除條件）

Level 2（SKILL.md）：
  主要的步驟（列點）：
  - ___________________
  - ___________________
  - ___________________
  - ___________________
  至少一個避坑項目：
  - ⚠️ ___________________

Level 3（resource files）：
  你會需要哪些資源檔案？
  - scripts/: _______________
  - references/: _______________
  - assets/: _______________
```

---

### Bonus Challenge：讀 spec 找答案

前往 [agentskills.io](https://agentskills.io) 閱讀官方規格，找出以下問題的答案：

1. 除了 name 和 description，Level 1 metadata 還允許哪些**選用欄位**？
2. 官方規格中對 Level 2 的長度建議是否與本章一致？有沒有提到任何例外情況？
3. Level 3 的目錄結構是否可以自訂？還是必須使用 `scripts/`、`references/`、`assets/` 這三個名稱？

> 這題沒有標準答案——目的是訓練你直接閱讀原始規格，而不是依賴二手資料。規格本身不長，大約 10 分鐘可以讀完。

---

## 重點回顧

- Agent Skills 的三層架構是為了解決 context window 的有限性
- Level 1（~100 tokens）永遠在 context 中，是 Agent 選擇技能的依據
- Level 2（< 5,000 tokens）在觸發時載入，包含完整的執行指令
- Level 3（無上限）需要時才載入，存放資源檔案
- 5,000 tokens 是 Anthropic 研究得出的 optimal instruction length
- Description 是觸發的唯一機制，Agent 傾向 under-trigger，所以要寫得明確且「強硬」
- 三層設計讓技能可以擴充到數百個而不耗盡 token 預算

---

**下一篇：第三章 — 從零開始寫你的第一個 SKILL.md**

實際動手建立一個完整的 Agent Skill，從 name 取得到 gotchas 撰寫，每一步都有範例對照。

---

<!--
Course: Agent Skills 實戰線上課程 (17 chapters)
Chapter 2 of 17: 三層漸進式揭露：核心設計哲學
Style: Professional teaching (Udemy-style), formal but approachable
Author: Technical Writer persona
-->

---

← [上一章: Ch1: Agent Skills 是什麼？](/課程/01-01-what-are-agent-skills) | [下一章: Ch3: Skills vs Tools vs MCP](/課程/01-03-why-skills) →
