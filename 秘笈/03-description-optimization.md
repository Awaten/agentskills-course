---
title: "秘笈 S3：Description 寫對，Agent 就會用 — 90% 的 Skill 沒被觸發都是 description 寫錯"
description: "Description 是 Agent 決定是否載入 Skill 的唯一觸發機制。學會 Pushy Description 配方 + Trigger Eval 測試法 + 60/40 Train/Validation 分割，告別 Skill 沒人用的悲劇。"
outline: [2, 3]
---

# 秘笈 S3：Description 寫對，Agent 就會用 — 90% 的 Skill 沒被觸發都是 description 寫錯

> **「我花了一整天寫 SKILL.md，Agent 從來沒用過。」**  
> 如果你有這種感覺，問題 90% 不在內文——在那 100 個字元的 description。

[IMAGE: 一個精美的 Skill 圖示旁邊放著放大鏡，放大鏡底下的 description 被紅筆圈起來，旁邊寫著 "The real problem"]

---

## Hook：工程師的典型悲劇

你有沒有這樣的經驗？

你精心打造了一個 Skill。指令寫了三千字，流程圖畫了三張，scripts 裡塞了五個 Python 檔。你自豪地把它放進 `.opencode/skills/`，然後⋯⋯

Agent 完全當它不存在。

你下了一個完美符合這個 Skill 的任務，Agent 卻繞了一大圈，用了四種工具，寫了一堆重複的程式碼。你的 Skill 靜靜躺在資料夾裡，像一本從來沒被翻開的書。

**這不是 Agent 笨，是你的 description 沒寫對。**

---

## 殘酷真相：Description 是唯一的觸發機制

Agent Skills 採用**三層漸進式揭露**架構：

| 層級 | 內容 | 載入時機 |
|------|------|----------|
| Level 1 | name + description (~100 tokens) | **永遠載入** |
| Level 2 | SKILL.md 完整指令 (<5000 tokens) | 觸發時才載入 |
| Level 3 | scripts/, references/, assets/ | 需要時載入 |

看到重點了嗎？

**Agent 在決定「要不要用這個 Skill」的時候，它只看得到 100 個 token。** 你 SKILL.md 裡寫得多漂亮、流程多嚴謹、範例多完整——對不起，Agent 根本沒讀到。

Description 就是那個守門員。它沒過關，後面全部白寫。

> **「Description 不是摘要，是銷售文案。」**  
> — 這句話值得貼在你螢幕上

---

## 為什麼 Agent 傾向「不觸發」

這是個系統性問題。Agent 的訓練資料讓它天生**保守**——它寧可自己硬幹，也不要亂呼叫一個不相干的 Skill 然後出糗。

這種「under-trigger 偏誤」導致一個現象：

- **Agent 對 description 的解讀比你嚴格**。你說 "Analyze data"，它覺得自己在做的也算 analyze data，不需要你的 Skill。
- **沒有明確關鍵字 = 沒有觸發**。你的描述太抽象，Agent 找不到對應的鉤子。
- **負面案例比正面案例重要**。Agent 需要知道「什麼時候不要用」，而不只是「什麼時候用」。

[IMAGE: 一個天平的插圖，左邊是「Agent 自己硬幹」右邊是「呼叫你的 Skill」，中間的 description 是唯一的砝碼]

---

## 好 vs 壞 Description：直接對比

### ❌ 壞的（太抽象）

```
Analyze data and generate reports. Use when working with data.
```

問題：Agent 覺得它本來就會分析資料，不需要你的 Skill。

### ✅ 好的（夠具體）

```
Parse CSV/JSON/Excel files with >100K rows using memory-efficient chunking and parallel processing. Includes auto-type detection and null handling. Use when the dataset is too large for pandas in-memory or when you need automated data profiling. DO NOT use for simple <1000-row files — basic pandas is sufficient.
```

為什麼有效：
- **具體格式 + 規模門檻**：Agent 知道這是給大檔案用的
- **明確的負面案例**：小檔案不要用
- **技術關鍵字**：chunking、parallel processing、auto-type detection
- **痛點描述**：too large for pandas in-memory

### ❌ 壞的（太短）

```
Helps with PDFs.
```

### ✅ 好的（推銷型）

```
Extract text, tables, and metadata from scanned PDFs and digital PDFs. Supports OCR fallback for image-based PDFs, table structure preservation, and batch processing of 1000+ files. Use when you receive PDF invoices, reports, or academic papers that need structured output. Even if the user just says "I have a bunch of PDFs" — this is what you need.
```

注意最後那句：**"Even if the user just says..."** — 這是對付 under-trigger 的終極武器。

---

## Trigger Eval：用數據說話，不要靠感覺

感覺「應該會觸發」是不夠的。**你需要測試。**

### 標準流程

```
1. 準備 20 筆測試查詢
   ├── 10 筆「應該觸發」（正向案例）
   └── 10 筆「不該觸發」（負向案例）

2. 每筆查詢跑 3 次
   - 記錄觸發/未觸發
   - 計算每筆的觸發率（0, 0.33, 0.67, 1.0）

3. 通過門檻：平均觸發率 > 0.5
```

### 實例：一個 PDF Skill 的測試集

| 查詢 | 預期 | 結果 (3次) | 觸發率 |
|------|------|-----------|--------|
| "幫我把這份合約轉成 Excel" | ✅ 觸發 | ✅✅✅ | 1.0 |
| "PDF 裡面有表格，擷取出來" | ✅ 觸發 | ✅✅✅ | 1.0 |
| "掃描檔 OCR" | ✅ 觸發 | ✅✅❌ | 0.67 |
| "批次處理 500 份 PDF" | ✅ 觸發 | ✅✅✅ | 1.0 |
| "幫我翻譯這段文字" | ❌ 不觸發 | ❌❌❌ | 0.0 |
| "寫一封 email" | ❌ 不觸發 | ❌❌❌ | 0.0 |

> **⚠️ 如果你的正向案例平均觸發率 < 0.5，別急著調 description——先確認你的測試查詢真的夠「像使用者會說的話」。**

---

## Train/Validation 分割：避免過擬合

這是從機器學習借來的概念，但在 Skill description 優化上一樣致命地重要。

**常見的錯誤**：你寫了一個 description，用 20 筆測試，全部通過，開心部署。結果實際使用時 Agent 還是不觸發。

為什麼？因為你**無意識地讓 description 去 fit 你的測試資料**。

解法：**60%/40% 分割**

```
全部 20 筆查詢
├── 12 筆 Training Set（用來迭代修改 description）
└── 8 筆 Validation Set（只用來最終驗證，修改期間不動）
```

這樣做的好處是：如果 validation set 也通過，你才有信心 description 是真的有泛化能力，而不只是背下了 20 個例句。

[IMAGE: 一個資料分割示意圖，60% 藍色（Training）和 40% 綠色（Validation），中間一個 filter]

---

## Iteration Loop：迭代，迭代，再迭代

Description 不是寫一次就好的。它是**演化出來的**。

```
Eval → Identify Failures → Revise Description → Repeat
        ↑____________________________↓
```

### 實際案例：迭代三代

**V1：** "Process PDF files and extract content."

→ Eval：正向觸發率 0.25。太爛。

**V2：** "Extract text, tables, and metadata from PDF files. Supports OCR and batch processing."

→ Eval：正向觸發率 0.58（勉強過關），但有幾筆特定查詢（如「掃描檔」）沒觸發。

**V3：** "Extract text, tables, and metadata from scanned PDFs and digital PDFs. Supports OCR fallback for image-based PDFs, table structure preservation, and batch processing of 1000+ files. Use when you receive PDF invoices, reports, or academic papers that need structured output. Even if the user just says 'I have a bunch of PDFs' or 'scan these documents' — trigger this skill."

→ Eval：正向觸發率 0.92 ✅

看到了嗎？**每一輪都是觀察「哪一筆失敗」→ 針對性地補關鍵字和情境**。

---

## Pushy Description 配方

根據實戰經驗，一個高觸發率的 description 有以下成分：

### 基本配方（必填）

```
[具體功能 + 技術細節] + [使用時機] + [明確負面案例] + [Even if 擴張句]
```

### 進階技巧

| 技巧 | 說明 | 範例 |
|------|------|------|
| **關鍵字堆疊** | 列出所有可能的同義詞和變體 | "parse, extract, convert, read, process, analyze" |
| **情境錨定** | 描述使用者可能說的話 | "Use when user mentions invoices, reports, statements" |
| **負面清單** | 明確說不要用 | "DO NOT use for image editing or PDF creation" |
| **Even if 句** | 對付 under-trigger | "Even if the user just says 'documents'" |
| **門檻條件** | 規模或複雜度條件 | "For datasets > 10K rows" |

### 完整範例（直接抄）

> Parse CSV, JSON, Excel, and Parquet files using chunked streaming and parallel processing. Handles >100K rows, auto-type inference, null imputation, and schema validation. Use when user provides a data file for analysis, transformation, or profiling — even if they just say "here's a file" or "load this data." Outputs structured summaries and quality reports. ⚠️ NOT for real-time streaming or database queries.

---

## 說說我的感受

我犯過最大的錯誤，就是我曾經花 **80% 的時間在寫 SKILL.md 的 body**，然後 description 隨便寫三句話就交差了。

現在回頭看，這個優先級完全錯了。

Description 是你的 Skill 的**產品頁面標題**。你會花三小時開發一個功能，然後花三十秒想它的命名嗎？不會吧。那為什麼對 Skill 你就這麼做？

**如果你只有 30 分鐘寫一個 Skill，請這樣分配：**

- 20 分鐘寫 description + 測試
- 10 分鐘寫 body 大綱

是的，body 只給 10 分鐘。因為 description 沒寫對，body 寫得再好都沒人看。

另一個體悟是：**你不是在寫給人看，你是寫給 Agent 看**。人類可以從模糊的描述推論出用途，Agent 不行。Agent 需要你**把話說死**——越具體越好，越 pushy 越好。

> **「對 Agent 禮貌，就是對自己的 Skill 殘忍。」**

---

## 下一步

Description 寫對了，Agent 就會乖乖觸發你的 Skill——但觸發之後呢？你的 SKILL.md 內容能不能讓 Agent 真正把事情做好？

這就是下一章的主題：

**➡️ 秘笈 S4：7 種 Killer Instruction 寫法 — 讓 Agent 照你的劇本走**

我們會拆解 7 種經過實戰驗證的 instruction 模式，從 checklist 式到 escape hatch 式，每一種都有完整範例和適用場景。

[IMAGE: 下一章的預告卡片，列出 7 種 instruction pattern 的名稱]

---

> _這篇文章是「Agent Skills 極速學習秘笈」系列的一部分。全部內容免費公開。_

← [上一篇: S2: SKILL.md 格式 3 分鐘](/秘笈/02-skills-md-format) | [下一篇: S4: 7 個高效 Instructions 套路](/秘笈/04-instruction-patterns) →
