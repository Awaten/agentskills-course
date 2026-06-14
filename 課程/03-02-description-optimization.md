---
title: "第 8 章：Description 觸發優化 — 科學化測試與迭代"
description: "建立可量測的 Trigger Eval 方法論，透過測試驅動迭代將 Skill 觸發率從 0.3 提升到 0.8+"
outline: [2, 3]
---

# 第 8 章：Description 觸發優化 — 科學化測試與迭代

前一章我們學到了如何撰寫高品質的 SKILL.md 內容——從經驗萃取、程序化指令、到驗證循環。但有一件殘酷的事實我們還沒有面對：**Agent 根本不會讀你的 SKILL.md，如果它的 description 沒寫對的話。**

這一章是整門課中最「技術性」的一章。我們不談感覺、不談直覺、不談「我覺得這樣寫比較好」。我們要建立一套**可量測、可重複、可驗證**的 description 優化流程——Trigger Eval 方法論。

---

## 學習目標

完成本章後，你將能夠：

1. **診斷觸發問題**：判斷一個 Skill 觸發率偏低的根本原因（description 問題 vs 測試查詢問題 vs Agent 偏誤）
2. **設計測試集**：為任意 Skill 建立 20 筆 Trigger Eval 測試查詢（10 正向 + 10 負向），遵循 train/validation 分割
3. **執行觸發率測試**：對每筆查詢執行 3 次測試，計算觸發率，判斷是否通過 >0.5 閾值
4. **迭代優化**：根據 eval 結果系統性地修改 description，而非盲目猜測
5. **撰寫 Pushy Description**：應用關鍵字堆疊、情境錨定、負面案例、even if 擴張句等技巧，將正向觸發率從 <0.3 提升到 >0.8
6. **避免過擬合**：使用 train/validation 分割確保 description 的泛化能力，而非背誦測試例句

---

## 8.1 Description 是唯一的觸發機制

在 Agent Skills 的三層漸進式揭露架構中，description 的角色極其特殊：

| 層級 | 內容 | Token 預算 | 載入時機 |
|------|------|-----------|----------|
| Level 1 | name + description | ~100 tokens | **永遠載入，每個 session 都讀** |
| Level 2 | SKILL.md 完整指令 | <5000 tokens | 僅當 description 觸發時載入 |
| Level 3 | scripts/, references/, assets/ | 不定 | 需要時動態載入 |

**沒有任何其他觸發機制。** 沒有語義匹配、沒有意圖分類、沒有關鍵字過濾——只有 description 這一層決定了 Agent 是否會載入你的 Skill。

這意味著三件事：

1. **Description 沒過關，後面全部白寫**。你花三小時寫的 SKILL.md 內容、精心設計的驗證循環、完整的 Gotchas——如果 description 沒觸發，Agent 永遠不會看到它們。
2. **Description 不是摘要，是銷售文案**。很多人把 description 當作 SKILL.md 的「目錄」來寫——「這個 Skill 包含 A、B、C 功能」。但 Agent 不需要目錄，它需要的是「在什麼情況下該用這個 Skill」的信號。
3. **Token 預算極度有限**。1024 個字元（不是 token，但約等於 200-300 tokens）要承擔觸發判斷的全部責任。你沒有廢話的空間。

> ⚠️ **一個常見的誤解**：有人認為 Agent 會「理解」description 的語義，所以用模糊的語言也可以。但實測顯示——Agent 對 description 的匹配是非常 literal 的。你寫 "process data"，它不會推論到 "parse CSV"。你必須寫 "parse CSV"。

---

## 8.2 Under-Trigger 偏誤：Agent 天生保守

理解 why description 必須「強硬」之前，我們需要先理解一個系統性的偏誤——**under-trigger bias**。

### 為什麼 Agent 傾向不觸發？

這不是 bug，這是 feature。Agent 的訓練資料和獎勵機制讓它傾向保守：

**1. 錯誤成本不對稱**
- 誤觸發（false positive）：Agent 載入了一個無關的 Skill，浪費 token，可能做錯事 → **明顯的錯誤**
- 漏觸發（false negative）：Agent 自己硬幹，結果做得不好 → **不明顯的錯誤**（Agent 自己不知道它漏了什麼）

因為誤觸發比漏觸發更容易被發現和指責，Agent 演化出了「寧可不觸發，也不要亂觸發」的策略。

**2. 過度自信**
Agent 對自身能力的評估有系統性的高估。它看到「分析資料」這個任務，覺得自己就能做——不需要呼叫一個「data-analysis」Skill。Agent 沒有很好的「元認知」（metacognition）來判斷「這件事我可能做不好，需要專業 Skill 的幫助」。

**3. 文字匹配的 literal 性**
Agent 的語義理解沒有我們想像的那麼抽象。一個描述為「Process PDF files」的 Skill，在面對「把這份掃描檔轉成文字」的使用者需求時，Agent 可能無法建立「PDF → 掃描檔 → OCR → 文字提取」的連結——因為 description 中沒有「OCR」這個關鍵字。

### Under-trigger 的數據

雖然目前沒有大規模的公開研究，但從開源社群的回報和實戰經驗來看，一個未經優化的 description：

- 正向案例（應該觸發）的觸發率約 **0.2 - 0.4**
- 這意味著 **60% - 80% 的潛在使用機會被浪費了**
- 經過優化後，正向觸發率可以提升到 **0.7 - 0.95**

> ⚠️ **這些數字來自有限的實戰樣本**。你的 Mileage 可能不同。這正是為什麼我們需要 Trigger Eval——用數據說話，不要靠感覺。

### Under-trigger 的破解方向

理解了 Agent 為什麼傾向不觸發，破解方向就很清楚了：

| Agent 的傾向 | 破解策略 |
|-------------|---------|
| 怕誤觸發 → 過度保守 | 加入明確的觸發信號和「even if」句，降低它的決策閾值 |
| 過度自信 → 不求助 | 描述任務的難度和專業門檻，讓 Agent 知道自己可能做不好 |
| Literal 匹配 → 漏接 | 關鍵字堆疊：列出所有可能的同義詞、變體、相關詞 |

---

## 8.3 好 Description vs 壞 Description：並排分析

與其抽象地討論「好的 description 長怎樣」，不如直接看對比。以下每一組對比都來自真實的 Skill，並附上為什麼有效/無效的推理。

### 範例 1：PDF 處理 Skill

**❌ 壞的（太抽象）：**

```
Process PDF files and extract content.
```

**推理分析：**
- Agent 的自我對話：「我本來就會讀 PDF。我的訓練資料包含大量 PDF 文件，我可以用 Python 的 PyMuPDF 或 pdfplumber 來處理。不需要呼叫外部 Skill。」
- 問題：沒有說明「哪種」PDF（掃描檔？數位檔？）、"extract content"太模糊（文字？表格？metadata？）、沒有門檻條件
- 預估觸發率：0.1 - 0.25

**✅ 好的（夠具體）：**

```
Extract text, tables, and metadata from scanned PDFs and digital PDFs. Supports OCR fallback for image-based PDFs, table structure preservation, and batch processing of 1000+ files. Use when you receive PDF invoices, reports, or academic papers that need structured output. Even if the user just says "I have a bunch of PDFs" or "scan these documents" — trigger this skill. DO NOT use for creating or editing PDFs.
```

**推理分析：**
- Agent 的自我對話：「這個 Skill 能做 OCR——我自己做 OCR 很麻煩，需要 Tesseract + 影像預處理。而且它說明了具體的情境（invoices, reports, academic papers），我的使用者正好在說『把這份掃描合約轉成文字』。關鍵字『scanned』、『OCR』、『invoices』都對上了。even if 那句讓我知道即使使用者只說『PDFs』我也該觸發。」
- 預估觸發率：0.7 - 0.9

### 範例 2：資料分析 Skill

**❌ 壞的（太短）：**

```
Analyze data.
```

**推理分析：**
- Agent 的自我對話：「分析資料？我隨時都在分析資料。這個 description 完全沒有告訴我它跟我的內建能力有什麼不同。」
- 問題：3 個詞完全沒有任何區別性資訊。這可能是所有 description 中最常見的錯誤——**把 Skill 描述得太像 Agent 的基本能力**。
- 預估觸發率：0.05 - 0.15

**✅ 好的（有門檻）：**

```
Parse CSV, JSON, Excel, and Parquet files using chunked streaming and parallel processing. Handles >100K rows, auto-type inference, null imputation, and schema validation. Use when the dataset is too large for pandas in-memory or when you need automated data profiling with quality reports. ⚠️ NOT for real-time streaming or database queries. Even if the user just says "here's a data file" or "load this for me."
```

**推理分析：**
- Agent 的自我對話：「它說『too large for pandas in-memory』——這是一個明確的門檻，我知道什麼時候該用。它支援 Parquet 格式和 chunked streaming，這些我自己處理起來很麻煩。負面案例（not for real-time streaming）幫我排除了錯誤觸發。Use case 很具體。」
- 關鍵技巧：**門檻條件**（>100K rows）+ **痛點描述**（too large for pandas）+ **格式差異化**（Parquet）
- 預估觸發率：0.75 - 0.9

### 好 Description 的共通特徵

從以上對比可以歸納出高觸發率 description 的 5 個必要特徵：

| 特徵 | 說明 | 如果缺少會怎樣 |
|------|------|--------------|
| **技術關鍵字** | 包含 Agent 認得出的專有名詞和技術術語 | Agent 不知道這個 Skill 能取代它的哪個弱項 |
| **門檻條件** | 規模、複雜度、特定格式等觸發條件 | Agent 無法判斷「什麼時候該用」 |
| **使用情境** | 具體描述使用者說什麼話時該觸發 | Agent 在面對真實任務時無法建立連結 |
| **負面案例** | 明確說什麼時候不該用 | Agent 可能誤觸發，或者反過來因為怕誤觸發而不觸發 |
| **Even if 句** | 對付 under-trigger 的終極武器 | Agent 在模糊情境中會選擇不觸發 |

---

## 8.4 Trigger Eval 方法論

現在我們知道好的 description 長怎樣——但「知道」不等於「能寫出來」。你可能寫了一個自認為很完美的 description，結果 Agent 還是不觸發。

**你需要測試。** 而且不是感覺上的測試——是系統化、可重複、有數據的測試。

### 方法論概述

Trigger Eval 是一個五步驟的流程：

```
Step 1: 設計測試集（20 筆查詢，10 正 + 10 負）
Step 2: 分割訓練集和驗證集（60%/40%）
Step 3: 對訓練集執行評估（每筆 3 次）
Step 4: 計算觸發率，判斷是否 > 0.5
Step 5: 迭代修改 description（回到 Step 3）
```

### Step 1 細節：設計測試集

測試集是整個 Trigger Eval 的基礎。設計不良的測試集會導致虛假信心——你的 description 在測試集上表現很好，但實際使用時完全不觸發。

**20 筆查詢 = 10 筆正向（should trigger）+ 10 筆負向（should NOT trigger）**

**正向案例設計原則：**
- 涵蓋不同的表達方式（直接、間接、口語、專業）
- 包含關鍵字變體（「合約」、「文件」、「PDF」、「掃描檔」）
- 包含完整句子和簡短指令
- 模擬真實使用者的語氣（包括打字錯誤和不完整的語句）

**負向案例設計原則：**
- 與正向案例**表面相似但本質不同**（例如「幫我寫一份 PDF 合約」vs「幫我讀取一份 PDF 合約」）
- 涵蓋 Agent 可能誤觸發的邊界情況
- 包含相關領域但不同任務的查詢
- 至少 2-3 筆「很接近但應該拒絕」的高難度負向案例

### 實際範例：PDF Skill 的測試集

以下是為一個 PDF 處理 Skill 設計的 20 筆查詢：

**正向（Should Trigger）：**

| # | 查詢 | 設計理由 |
|---|------|---------|
| 1 | 幫我把這份合約轉成 Excel | 最常見的實用場景 |
| 2 | PDF 裡面有表格，擷取出來 | 直接描述功能 |
| 3 | 掃描檔 OCR | 簡短、技術關鍵字 |
| 4 | 批次處理這 500 份 PDF | 規模門檻 |
| 5 | 這份掃描的發票需要數位化 | 口語表達 |
| 6 | extract text from pdf | 英文指令 |
| 7 | 幫我讀取這個檔案（是 PDF 格式） | 模糊 + 補充資訊 |
| 8 | 把合約中的簽名欄位標出來 | 特定提取需求 |
| 9 | 這批文件要建檔，先轉成文字 | 間接表達 |
| 10 | PDF 轉 Markdown 要怎麼做 | 轉換任務 |

**負向（Should NOT trigger）：**

| # | 查詢 | 為什麼不該觸發 |
|---|------|--------------|
| 1 | 幫我把這份 Word 檔轉成 PDF | 反方向（建立 PDF 不是讀取） |
| 2 | 寫一份報價單 PDF | 建立/創作 PDF，不是處理 |
| 3 | 幫我翻譯這段文字 | 語言翻譯，跟 PDF 無關 |
| 4 | 把這張圖片修一下 | 圖片編輯，非文件處理 |
| 5 | 幫我檢查這份 PDF 有沒有病毒 | 資安掃描，不是內容提取 |
| 6 | 設計一份 PDF 表單 | 表單設計，不是文件解析 |
| 7 | 把這個資料夾壓縮成 zip | 壓縮任務，完全無關 |
| 8 | 幫我比較這兩個 PDF 的版本差異 | ⚠️ 邊界案例——雖然涉及 PDF，但比較版本不是這個 Skill 的功能 |
| 9 | 幫我合併這三個 PDF 檔案 | ⚠️ 邊界案例——合併是 PDF 操作但不是內容提取 |
| 10 | 把這個 PDF 加密加上密碼 | PDF 安全性操作，不是內容提取 |

> ⚠️ **特別注意負向案例 8 和 9**：它們是「高相似度負向案例」——使用者確實提到了 PDF，但任務與 Skill 的實際功能不符。這些案例的價值在於測試 description 是否有足夠的精確度來區分「與 PDF 相關」和「需要這個 Skill」。

---

## 8.5 執行 Trigger Eval

有了測試集之後，下一步是執行評估。

### 執行方式

目前 Trigger Eval 主要透過以下方式執行：

**方式一：手動測試（最可靠，但最慢）**
1. 對每一筆查詢，在對話中輸入
2. 觀察 Agent 是否載入目標 Skill
3. 記錄觸發/未觸發
4. 每筆查詢重複 3 次（因為同一查詢在不同 session 中可能因為 random seed 而有不同結果）

**方式二：腳本輔助（需要工具支援）**
某些平台提供 API 或工具來直接測試 description 匹配——在沒有這些工具的情況下，手動測試是最務實的選擇。

> ⚠️ **一個實務提醒**：同一筆查詢在不同時間、不同 context 下測試，結果可能不同。Agent 的行為受到之前對話內容的影響。這就是為什麼我們要求「3 次」——不是為了折磨你，是為了捕捉這種隨機性。

### 計算觸發率

對每一筆查詢，記錄 3 次測試的觸發次數，計算觸發率：

| 觸發次數 | 觸發率 | 意義 |
|---------|--------|------|
| 0/3 | 0.0 | 從未觸發——description 完全沒抓住這個情境 |
| 1/3 | 0.33 | 偶爾觸發——邊界案例，需要加強 |
| 2/3 | 0.67 | 大部分觸發——接近通過，但仍有改善空間 |
| 3/3 | 1.0 | 穩定觸發——這個情境已被 description 涵蓋 |

### 通過門檻

**通過條件：正向案例平均觸發率 > 0.5**

這個門檻的由來：
- 0.5 以下：description 在超過一半的正向案例中無法觸發 → 嚴重不足，必須修改
- 0.5 - 0.7：勉強通過，但仍有改善空間
- 0.7 - 0.9：良好
- 0.9+：優秀

**負向案例的觸發率要求：** 理想狀況下應該是 0.0，但實務上允許少量誤觸發（< 0.2），因為：
- 負向案例的邊界案例（如「PDF 加密」）偶爾觸發是可以理解的
- 誤觸發的代價是「浪費 token 載入了一個不需要的 Skill」——這遠比漏觸發（錯過一個需要的 Skill）的代價低

---

## 8.6 Train/Validation 分割：預防過擬合

這可能是 Trigger Eval 流程中**最容易被忽略、但也最重要**的環節。

### 什麼是過擬合（Overfitting）？

在 description 優化的語境下，過擬合的意思是：你修改 description 讓它在 20 筆測試查詢上表現完美，但這些修改只是「背誦」了測試例句，而不是真正提升了 description 的泛化能力。

結果是：測試集上觸發率 0.95，實際使用時觸發率 0.3。

### Train/Validation 分割的作法

```
全部 20 筆查詢
├── 12 筆訓練集（Training Set）
│   └── 用來迭代修改 description
└── 8 筆驗證集（Validation Set）
    └── 只用來最終驗證，修改期間完全不能碰
```

### 分割方式

有幾種分割策略：

**隨機分割（最簡單）：**
隨機選 12 筆作為訓練集，8 筆作為驗證集。適合一般用途。

**分層分割（推薦）：**
確保訓練集和驗證集都包含正向和負向案例：
- 訓練集：6 正 + 6 負（從 10 正 10 負中各取 6 筆）
- 驗證集：4 正 + 4 負（剩下的各 4 筆）

**困難案例分割（進階）：**
把最難的邊界案例放進驗證集，訓練集留給「相對容易」的案例。這樣如果驗證集表現好，代表 description 真的夠強。

### 為什麼這有效？

因為驗證集在你修改期間「完全不可見」——你不知道改了 description 後它在驗證集上的表現如何，直到你決定停止修改。

這就防止了一個心理陷阱：**「再改一句，讓這筆也過關」**。如果你能看到驗證集的結果，你會不自覺地讓 description 去 fit 那 8 筆查詢。最終 20 筆全部過關，但你的 description 已經失去了泛化能力。

### 何時可以使用驗證集？

只有一個時機點可以使用驗證集：**你決定停止修改 description，準備做最終驗證的時候。**

如果驗證集通過（正向觸發率 > 0.5），恭喜你——你的 description 具有泛化能力。
如果驗證集不通過，代表你的 description 過擬合了訓練集：回到訓練集，重新設計。

> ⚠️ **不能做的事**：驗證集不通過 → 根據驗證集的失敗案例修改 description → 重新測試驗證集。這等於把驗證集變成了另一個訓練集，完全失去了分割的意義。

---

## 8.7 Iteration Loop：迭代優化流程

Description 不是寫一次就好的。它是演化出來的。

### 迭代循環

```
        ┌──────────────────────────────────┐
        │                                  │
        ▼                                  │
  ┌──────────┐   ┌──────────────┐   ┌───────────┐
  │ Run Eval │ → │ Identify     │ → │ Revise    │
  │ 執行測試 │   │ Failures     │   │ Description│
  └──────────┘   │ 找出失敗模式  │   │ 修改描述  │
                 └──────────────┘   └───────────┘
                                              │
                                              │
                    只有驗證集通過才停止 ──────┘
```

### 失敗分析：如何從失敗中學習

每次 eval 後，不要急著修改 description。先對失敗案例進行分類：

**Type 1：關鍵字缺失**
- 症狀：Agent 沒認出查詢中的關鍵字
- 案例：查詢「掃描檔」未觸發，因為 description 中沒有 OCR/scanned 等詞
- 解法：加入遺漏的關鍵字

**Type 2：情境模糊**
- 症狀：查詢表達方式與 description 的框架不匹配
- 案例：使用者說「這批文件要建檔」而非「擷取 PDF 內容」
- 解法：加入更多使用情境描述，加入 even if 句

**Type 3：過度保守**
- 症狀：即使 description 中有相關關鍵字，Agent 仍選擇不觸發
- 案例：description 有「batch processing」但使用者說「處理幾百份文件」時沒觸發
- 解法：加強 even if 句，明確寫出「即使是這種情況也要觸發」

**Type 4：邊界衝突**
- 症狀：description 與其他 Skill 的描述重疊，Agent 選了另一個
- 案例：你的 PDF Skill 跟另一個「document-processing」Skill 同時被考慮
- 解法：增加差異化描述，明確你的 Skill 的獨特價值

### 迭代次數的實務建議

根據實戰經驗：

| 迭代次數 | 典型觸發率範圍 | 建議 |
|---------|--------------|------|
| V1（初版） | 0.1 - 0.35 | 幾乎一定需要修改 |
| V2 | 0.3 - 0.6 | 可能有明顯進步，但還不穩定 |
| V3 | 0.5 - 0.8 | 可能通過門檻，但留意驗證集 |
| V4+ | 0.7 - 0.95 | 超過三次迭代後遞減效應明顯 |

通常 **2-4 次迭代**可以從 baseline 達到及格門檻。如果超過 5 次迭代還無法達到 >0.5，問題可能不在 description——可能是測試集設計有問題，或是 Skill 本身的定位太模糊。

---

## 8.8 Pushy Description 配方

經過前面的理論和流程，現在來到具體的「怎麼寫」。這是我從數十個通過 Trigger Eval 的 description 中歸納出的配方。

### 基本配方

```
[功能描述] + [技術細節] + [使用時機] + [負面案例] + [Even If 擴張句]
```

### 成分說明

| 成分 | 目的 | 範例 |
|------|------|------|
| **功能描述** | 讓 Agent 知道這個 Skill 做什麼 | "Extract text and tables from PDFs" |
| **技術細節** | 建立差異化，讓 Agent 知道它自己做不好 | "Supports OCR fallback, 1000+ batch processing" |
| **使用時機** | 情境錨定，讓 Agent 能識別觸發條件 | "Use when user mentions invoices, contracts" |
| **負面案例** | 降低誤觸發，同時減少 Agent 的決策焦慮 | "NOT for creating PDFs" |
| **Even If 句** | 對付 under-trigger 的終極武器 | "Even if user just says 'documents'" |

### 關鍵字堆疊技巧

Agent 的文字匹配比你想像的更 literal。關鍵字堆疊是提升觸發率最直接有效的方法：

**不好的做法：**
```
Process PDF files and extract content.
```
（只有 2 個相關關鍵字：PDF, extract）

**好的做法：**
```
Extract, parse, read, and convert PDF files (scanned and digital) to text, tables, JSON, or Excel. Supports OCR for image-based PDFs.
```
（7+ 個關鍵字：extract, parse, read, convert, PDF, scanned, digital, OCR）

關鍵字堆疊的規則：
- 涵蓋不同詞性（extract/提取, parse/解析, read/讀取）
- 涵蓋文件類型（PDF, scanned PDF, digital PDF, image-based PDF）
- 涵蓋輸出格式（text, tables, JSON, Excel）
- 涵蓋技術術語（OCR, batch processing, table structure preservation）

### 情境錨定技巧

只靠關鍵字不夠——你需要告訴 Agent 在**什麼真實世界的情境**下觸發：

```
Use when:
- User wants to extract data from PDF reports, invoices, or contracts
- User mentions "scanned documents" or "OCR"
- User says they have "a bunch of PDFs" or "hundreds of files"
```

這比單純列功能更有效，因為它模擬了使用者實際的說話方式。

### Even If 句：對付 Under-Trigger 的終極武器

即使前面都寫了，Agent 在某些模糊情境中還是不敢觸發。Even if 句的用意是**明確告訴 Agent「降低你的觸發閾值」**：

```
Even if the user just says "I have some documents" or "process this file" — check if it's a PDF and trigger this skill.
```

為什麼有效？因為它直接回應了 Agent 的 under-trigger 偏誤。Agent 不敢觸發的原因是「萬一我猜錯了怎麼辦」。Even if 句說：「猜錯也沒關係，寧可誤觸發也別漏觸發。」

### 完整配方範例

```
Parse CSV, JSON, Excel, and Parquet files using chunked streaming and parallel processing. Handles >100K rows, auto-type inference, null imputation, and schema validation. Use when user provides a data file for analysis, transformation, or profiling — even if they just say "here's a file" or "load this data." Outputs structured summaries and quality reports. ⚠️ NOT for real-time streaming or database queries.
```

拆解分析：
- 功能：Parse CSV, JSON, Excel, Parquet
- 技術細節：chunked streaming, parallel processing, >100K rows, auto-type inference
- 使用時機：data file for analysis, transformation, profiling
- Even if：even if they just say "here's a file" or "load this data"
- 負面案例：NOT for real-time streaming or database queries

---

## 8.9 實戰案例：一個 Description 的三代演化

理論說完了，來看一個真實的演化案例。這是我為一個「爬蟲 Skill」迭代 description 的記錄。

### V1（初版）

```
Web scraping tool. Use for extracting data from websites.
```

**Eval 結果（訓練集 12 筆）：**

| 查詢 | 預期 | 結果 |
|------|------|------|
| 幫我爬這個網站的資料 | ✅ 觸發 | ❌ 未觸發 |
| 抓取 PTT 的標題和推文數 | ✅ 觸發 | ❌ 未觸發 |
| 監控這個頁面的價格變化 | ✅ 觸發 | ❌ 未觸發 |
| 把這個電商網站的商品資料抓下來 | ✅ 觸發 | ❌ 未觸發 |
| 這份資料在網頁上，我需要擷取 | ✅ 觸發 | ❌ 未觸發 |
| 寫一篇 Python 爬蟲 | ✅ 觸發 | ✅ 觸發 |

**正向觸發率：0.17（6 筆中僅 1 筆觸發）** ❌

**失敗分析：**
- 關鍵字缺失：description 只有 "web scraping" 和 "extract data"，但使用者的查詢包含了「爬、抓取、監控、擷取、商品資料」等變體
- 情境不足：沒有具體的使用情境說明
- Agent 的自我對話：「『幫我爬這個網站』——user 可能只是想要我用 Python 寫一個簡單的 requests + BeautifulSoup，不需要這個 Skill」

---

### V2（修正版）

```
Extract data from websites using automated crawling. Supports dynamic content (JavaScript-rendered pages), pagination handling, and structured output (JSON/CSV). Use when user needs to collect data from e-commerce sites, forums, or news portals — even if they just say "scrape" or "crawl" a website.
```

**修改重點：**
- 加入關鍵字：crawling, dynamic content, pagination, JSON, CSV
- 加入情境：e-commerce, forums, news portals
- Even if 句：scrape, crawl

**Eval 結果：**

| 查詢 | 預期 | 結果 |
|------|------|------|
| 幫我爬這個網站的資料 | ✅ 觸發 | ✅ 觸發 |
| 抓取 PTT 的標題和推文數 | ✅ 觸發 | ✅ 觸發 |
| 監控這個頁面的價格變化 | ✅ 觸發 | ❌ 未觸發 |
| 把這個電商網站的商品資料抓下來 | ✅ 觸發 | ✅ 觸發 |
| 這份資料在網頁上，我需要擷取 | ✅ 觸發 | ❌ 未觸發 |
| 寫一篇 Python 爬蟲 | ✅ 觸發 | ✅ 觸發 |

**正向觸發率：0.67（6 筆中 4 筆觸發）** ✅ 通過門檻

**失敗分析（剩餘的 2 筆失敗）：**
- 「監控價格變化」：description 中沒有 "monitor"、"price"、"tracking" 等關鍵字
- 「這份資料在網頁上」：表達方式太模糊，Agent 無法建立連結

---

### V3（最終版）

```
Extract, scrape, crawl, and monitor data from websites — including dynamic/JavaScript-rendered pages. Handles pagination, login-walled content, and rate limiting. Supports structured output (JSON/CSV/Excel). Use when user wants to collect product data, forum posts, news articles, or monitor price changes on e-commerce sites. Even if they just say "scrape this site," "crawl this page," "get the data from that URL," or "I need this info from the web" — trigger this skill. ⚠️ NOT for API integration or database queries.
```

**修改重點：**
- 加入 "monitor" 和 "price changes" 關鍵字
- 加入更多口語表達的 even if 範例
- 加入 login-walled content, rate limiting 等技術細節

**Eval 結果：**

| 查詢 | 預期 | 結果 |
|------|------|------|
| 幫我爬這個網站的資料 | ✅ 觸發 | ✅ 觸發 (3/3) |
| 抓取 PTT 的標題和推文數 | ✅ 觸發 | ✅ 觸發 (3/3) |
| 監控這個頁面的價格變化 | ✅ 觸發 | ✅ 觸發 (2/3) |
| 把這個電商網站的商品資料抓下來 | ✅ 觸發 | ✅ 觸發 (3/3) |
| 這份資料在網頁上，我需要擷取 | ✅ 觸發 | ✅ 觸發 (2/3) |
| 寫一篇 Python 爬蟲 | ✅ 觸發 | ✅ 觸發 (3/3) |

**正向觸發率：0.89（平均 17/18）** ✅✅

**最終驗證集結果（未曾修改時碰過的 8 筆）：**
- 4 筆正向：觸發率 0.83（10/12）
- 4 筆負向：觸發率 0.08（1/12）
- **最終判斷：通過 ✅**

### 演化總結

| 版本 | 觸發率 | 關鍵新增 |
|------|--------|---------|
| V1 | 0.17 | — |
| V2 | 0.67 | 關鍵字堆疊 + 情境錨定 |
| V3 | 0.89 | Even if 句 + 更多技術細節 |

每一輪都是「觀察哪一筆失敗 → 針對性補強 → 重新測試」的循環。

---

## 8.10 [DIAGRAM: Trigger Eval 迭代循環]

```
                    ┌─────────────────────────────┐
                    │      Skill Description       │
                    │    (開始：第一版草稿)          │
                    └──────────┬──────────────────┘
                               │
                               ▼
                    ┌─────────────────────────────┐
                    │     Step 1: 設計測試集        │
                    │                              │
                    │  ┌─────────┐  ┌──────────┐  │
                    │  │ 10 正向  │  │ 10 負向   │  │
                    │  │ Should  │  │ Should   │  │
                    │  │ Trigger │  │ NOT      │  │
                    │  └─────────┘  │ Trigger  │  │
                    │               └──────────┘  │
                    └──────────┬──────────────────┘
                               │
                               ▼
                    ┌─────────────────────────────┐
                    │  Step 2: Train/Validation    │
                    │         分割 (60/40)          │
                    │                              │
                    │  ┌──────────┐ ┌───────────┐ │
                    │  │ Training │ │ Validation│ │
                    │  │ 12 筆    │ │ 8 筆      │ │
                    │  │ ✅ 可修改 │ │ ❌ 不可碰  │ │
                    │  └────┬─────┘ └───────────┘ │
                    └───────┼─────────────────────┘
                            │
                            ▼
              ┌──────────────────────────────┐
              │  Step 3: 執行 Eval (每筆 × 3) │
              │                              │
              │  訓練集: 12 筆 × 3 = 36 次    │
              │  ┌──────────────────┐        │
              │  │ 正向觸發率 =      │        │
              │  │ (觸發次數 / 36)   │        │
              │  └──────────────────┘        │
              └──────────┬───────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
    ┌──────────────────┐  ┌──────────────────┐
    │ Trigger Rate     │  │ Trigger Rate     │
    │ > 0.5 ✅         │  │ ≤ 0.5 ❌         │
    └────────┬─────────┘  └────────┬─────────┘
             │                     │
             ▼                     ▼
    ┌──────────────────┐  ┌──────────────────┐
    │ Step 4: 驗證集測試 │  │ 失敗分析 →      │
    │ (8 筆 × 3 = 24 次)│  │ 修改 description │
    └────────┬─────────┘  └────────┬─────────┘
             │                     │
    ┌────────┴────────┐            │
    ▼                 ▼            │
  ✅ Pass          ❌ Fail         │
  (驗證集 > 0.5)   (驗證集 ≤ 0.5)  │
       │               │           │
       │    (過擬合了訓練集)         │
       │               │           │
       ▼               ▼           │
  ┌──────────┐   ┌──────────┐      │
  │ 完成！    │   │ 重新設計  │      │
  │ 發布 Skill│   │ 測試集    │──────┘
  └──────────┘   └──────────┘
```

**圖 8.1**: Trigger Eval 迭代循環。只有當訓練集 >0.5 **且** 驗證集 >0.5 時，才代表 description 具有泛化能力。任一環節未通過就必須回到修改循環。

---

## 8.11 與既有 description 的相容性

你可能在想：「我手上已經有一個 description 了，需要整個重寫嗎？」

答案是：**不需要。你可以用 Trigger Eval 逐步優化它。**

### 既有 description 的審計流程

1. **先做一次 Eval**（直接用你現有的 description）——得到 baseline 觸發率
2. **判斷 baseline**：
   - >0.5：你的 description 基本可用，只需要針對特定失敗案例補強
   - 0.3 - 0.5：需要中等程度的修改，加入關鍵字和情境
   - <0.3：需要大幅度改寫，建議從配方開始重新設計
3. **逐輪優化**（遵循迭代循環）

### 與其他 Skill 的 Description 協調

如果你生態系統中有多個 Skill，description 之間可能會互相干擾——Agent 可能會選錯 Skill。

**協調策略：**

**策略一：差異化描述（推薦）**
確保每個 Skill 的 description 有明確的差異點：
- Skill A：「Extract text from PDFs. Use for invoices/reports. ⚠️ NOT for creating PDFs.」
- Skill B：「Create and generate PDF documents from templates. Use for proposals/certificates. ⚠️ NOT for extracting data from PDFs.」

**策略二：負面案例互補**
在彼此的 description 中加入指向對方的負面案例：
- Skill A：「⚠️ If user wants to CREATE a PDF, use Skill B instead」
- Skill B：「⚠️ If user wants to EXTRACT data from a PDF, use Skill A instead」

**策略三：名稱前綴統一**
用相同前綴的 name 讓 Agent 知道它們是同一家族的 Skill：
- `pdf-extract`、`pdf-create`、`pdf-merge`

---

## 8.12 常見陷阱與注意事項

### 陷阱 1：測試查詢像在「考試」不像真實對話

❌ 錯誤的測試查詢：
```
提取 PDF 文件中的表格資料
```

✅ 正確的測試查詢：
```
這份 PDF 裡面有表格，幫我抓出來
幹這份報價單的表格我要轉成 Excel
pdf 的表格資料
```

真實使用者不會用最標準的語法下指令。如果你的測試查詢全部都是「完美的句子」，你的 description 在實際使用時會表現更差。

### 陷阱 2：觸發率 >0.5 就停止優化

>0.5 是**門檻**，不是**目標**。如果你的 description 觸發率是 0.55，它確實通過了測試——但它會比 0.9 的 description 多漏掉 35% 的觸發機會。

**建議的目標：**
- 新 Skill（剛上線）：>0.5（通過門檻即可發布）
- 穩定 Skill（已運行一段時間）：>0.7
- 關鍵 Skill（錯過觸發代價很高）：>0.85

### 陷阱 3：忽略負向案例

有些人的測試集只有正向案例——這是一個危險的遺漏。沒有負向測試，你無法知道 description 是否會在其他情境中誤觸發。

更嚴重的是：**負向案例的觸發率其實會影響正向案例的觸發率**。因為 Agent 在整個 session 中會看到所有可用的 Skill，如果一個 Skill 的 description 太「寬鬆」，它會在其他情境中頻繁誤觸發，浪費 token——平台可能因此降低它的優先級。

### 陷阱 4：不同平台的行為差異

不同 Agent 平台對 description 的匹配方式可能不同：
- Claude Code：直接將 description 與使用者的指令進行語義比對
- 其他平台：可能使用 embedding 相似度或關鍵字匹配

如果你的 Skill 要在多個平台上使用，**建議在每個平台上分別進行 Trigger Eval**。

> ⚠️ **關於平台差異的數據**：截至 2026 年中，尚沒有公開的大規模跨平台 description 行為比較。如果你在 A 平台上測試通過，但在 B 平台上表現不佳，這可能是平台的 description 匹配機制不同所致——但目前這只是推測。

---

## 8.13 總結檢查清單

當你完成一個 description 的 Trigger Eval 後，用以下清單逐項確認。

### Description 內容檢查

- [ ] **關鍵字覆蓋**：涵蓋了所有相關的技術術語和同義詞
- [ ] **門檻條件**：說明了何時該觸發（規模、格式、情境）
- [ ] **負面案例**：明確說明了何時不該觸發
- [ ] **Even if 句**：至少包含一句對付 under-trigger 的擴張句
- [ ] **使用情境**：描述了真實的使用者對話場景
- [ ] **長度合理**：不超過 1024 字元，但不少於 100 字元

### Trigger Eval 流程檢查

- [ ] **測試集完整**：20 筆查詢（10 正 + 10 負）
- [ ] **正向案例夠真實**：模擬使用者的實際對話方式（包含口語和不完整語句）
- [ ] **負向案例有挑戰性**：包含邊界案例，不只是明顯無關的查詢
- [ ] **分割完成**：60% 訓練集 / 40% 驗證集
- [ ] **每筆執行 3 次**：捕捉隨機性
- [ ] **訓練集通過**：正向觸發率 > 0.5
- [ ] **驗證集通過**：正向觸發率 > 0.5（且未事先看過驗證集結果）
- [ ] **負向觸發率可接受**：< 0.2

### 迭代紀律檢查

- [ ] **修改前先分析失敗原因**：確定是 Type 1/2/3/4 中的哪一種
- [ ] **一次只解決一個問題**：不要同時修改多個不相關的部分
- [ ] **保留修改記錄**：記錄每個版本的 description 和評估結果
- [ ] **不過度迭代**：如果超過 5 次迭代仍未通過，重新評估測試集設計

---

## 8.14 練習題

### 練習 1：為一個 GitHub Skill 設計 Trigger Eval 測試集

**情境**：你擁有一個 `github-automation` Skill，功能是自動化 GitHub 操作——建立 PR、審查程式碼、管理 issues、執行 CI/CD 工作流程。

**任務**：
1. 設計 10 筆正向測試查詢（應該觸發的場景）
2. 設計 10 筆負向測試查詢（不應該觸發的場景）
3. 標註出其中你認為最難的 3 個負向案例（最容易誤觸發的邊界情況）

<details class="exercise-hint">
<summary>💡 提示</summary>
- 使用者會用什麼方式表達 GitHub 相關的任務？
</details>
- 哪些 GitHub 任務其實不屬於這個 Skill？（例如 clone repo 應該用 git 而非 github-automation）
- 哪些「聽起來像 GitHub 但不是 GitHub」的任務？（例如「幫我 review 這份文件」vs「幫我 review 這個 PR」）

---

### 練習 2：分析一個 Description 的失敗原因

**情境**：以下是一個 `data-visualization` Skill 的 description，它在 Trigger Eval 中獲得了 0.33 的正向觸發率：

```
Create charts and graphs from data. Supports various chart types.
```

**任務**：
1. 列出至少 4 個這個 description 的問題
2. 對每個問題，說明為什麼它會導致觸發率偏低（使用本章的 under-trigger 分析框架）
3. 推測可能的失敗查詢類型（使用者說什麼話時這個 description 會無法觸發？）
4. 改寫這個 description，目標觸發率 >0.7

<details class="exercise-hint">
<summary>💡 提示</summary>
參考 8.3 的對比分析方法，從關鍵字、門檻條件、使用情境、負面案例、even if 句五個面向分析。
</details>

---

### 練習 3（進階）：對一個既有 Description 執行完整的 Trigger Eval

**情境**：以下是一個 `log-analyzer` Skill 的 description：

```
Analyze system logs and identify errors, warnings, and anomalies. Supports multiple log formats.
```

**任務**：
1. 建立完整的 20 筆測試集（訓練集 12 筆 + 驗證集 8 筆）
2. 實際執行 Trigger Eval（3 次/每筆）
3. 記錄 baseline 觸發率
4. 修改 description，重新測試
5. 重複迭代直到訓練集 >0.5
6. 用驗證集做最終驗證

**這是一個完整的練習，建議實際在你的 Agent 環境中執行。**

**如果你無法實際執行（沒有 Agent 環境）：**

撰寫一份「模擬評估報告」：
- 你的測試集
- 你預測的觸發結果（根據你對 Agent 行為的理解）
- 你的修改計畫（V2, V3 的 description 草案）
- 你預期的最終觸發率

---

### 練習 4（挑戰題）：處理 Description 之間的衝突

**情境**：你的專案中有兩個 Skill：

- `web-scraper`：爬取網頁資料，輸出 JSON/CSV
- `api-client`：呼叫 REST API，處理 JSON 回應

**問題**：當使用者說「幫我從這個網站的 API 取得資料」時，兩個 Skill 的 description 都可能觸發——但它們應該觸發哪一個？

**任務**：
1. 分別為兩個 Skill 撰寫 description，使得：
   - 純網頁爬取任務 → `web-scraper` 觸發
   - 純 API 呼叫任務 → `api-client` 觸發
   - 混合任務（網站有 API 但需要先爬取）→ 明確指出使用哪一個
2. 為兩個 description 分別設計 5 筆邊界測試查詢
3. 說明你的 description 如何解決這個衝突

<details class="exercise-hint">
<summary>💡 提示</summary>
參考 8.11 的協調策略——差異化描述、負面案例互補、明確的任務分配。
</details>

---

*本章是「Agent Skills 設計實務」課程的第 8 章。下一章將探討如何在 Skill 中整合外部 scripts——從簡單的 shell 命令到複雜的多步驟自動化流程，以及 script 與 SKILL.md 指令之間的最佳協作模式。*


---

← [上一章: Ch7 最佳實務](/課程/03-01-best-practices) | [下一章: Ch9 使用 Scripts](/課程/03-03-using-scripts) →
