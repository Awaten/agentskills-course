---
title: "Chapter 5 — SKILL.md 完整參考指南"
description: "SKILL.md 的完整規格參考指南，涵蓋 frontmatter 所有欄位、Body 結構、三層漸進式揭露、目錄組織與常見錯誤修正"
outline: [2, 3]
---

# Chapter 5 — SKILL.md 完整參考指南

---

## 學習目標

完成本章後，你將能夠：

1. **解析** 任何 SKILL.md 檔案的前置資料（frontmatter）與本文結構
2. **撰寫** 符合規範的 `name` 欄位（kebab-case、64 字元上限、特殊字元限制）
3. **最佳化** `description` 欄位以提高 Agent 觸發率，並運用 20 筆測試法驗證
4. **區辨** 選填欄位（`license`、`compatibility`、`metadata`）的實務用途與 `allowed-tools` 的實驗性質
5. **組織** 技能目錄結構（SKILL.md + scripts/ / references/ / assets/）
6. **應用** 三層漸進式揭露原則，控制 Agent 的 token 成本
7. **識別** 常見的 SKILL.md 撰寫錯誤並加以修正
8. **建構** 一份可供生產環境使用的完整 SKILL.md 模板

---

## 5.1 為什麼需要一份完整參考指南？

前幾章透過「骰子技能」讓你體驗了從零到發布的流程，也簡介了 SKILL.md 的基本格式。但實戰中你會發現：**入門只需要 5 分鐘，精通需要掌握細節。**

本章是 SKILL.md 的**完整規格參考**——不是入門教學，而是你撰寫任何技能時可以反覆查閱的技術手冊。我們會逐一檢視 frontmatter 的每個欄位（包括實驗性功能）、本文的最佳結構策略、目錄組織慣例，以及 Agent 實際載入你的技能時發生的底層機制。

如果你只想「先寫一個能用的」，前面的章節已經夠了。如果你想知道**為什麼這樣寫才對、那樣寫會出問題**，這一章就是為你準備的。

---

## 5.2 Frontmatter 總覽

每個 SKILL.md 的開頭都是一段 YAML 格式的 frontmatter，包裹在 `---` 之間。這是 Agent 永遠會讀取的內容——對應三層漸進式揭露的 **Level 1（Metadata）**。

### 欄位一覽

| 欄位 | 必填 | 類型 | 最大長度 | 用途摘要 |
|------|------|------|---------|---------|
| `name` | ✅ | string | 64 字元 | 技能的唯一識別碼 |
| `description` | ✅ | string | 1024 字元 | 技能觸發條件與能力描述 |
| `license` | ❌ | string | — | 開源授權條款 |
| `compatibility` | ❌ | array | — | 相容平台或環境 |
| `metadata` | ❌ | object | — | 自訂鍵值（版本、作者等） |
| `allowed-tools` | ❌ | array | — | ⚠️ 實驗性：工具白名單 |

> ⚠️ `allowed-tools` 目前僅少數平台實作，不建議在跨平台技能中依賴它。詳見 5.6 節。

[DIAGRAM: frontmatter-visual]
一個長條圖或表格視覺化，顯示 frontmatter 五（六）個欄位的相對重要性：`name` 和 `description` 佔 80% 的權重，其餘為輔助資訊。左軸為「對技能可用性的影響力」，右軸為「開發者投入時間的建議比例」。

---

## 5.3 `name` 欄位 — 技能的身份證

`name` 是技能的唯一識別碼，類似程式套件名稱或資料庫主鍵。一旦發布，就不應該更改——因為其他技能可能會依賴它，平台的快取系統也會以它為索引。

### 格式規則

官方規範定義了一套嚴格的命名規則，本質上就是 **kebab-case**：

```
^[a-z0-9]+(-[a-z0-9]+)*$
```

用白話解釋：

| 規則 | 說明 | ✅ 正確 | ❌ 錯誤 |
|------|------|---------|---------|
| **全小寫** | 不允許大寫字母 | `pdf-processing` | `PDF-Processing` |
| **僅連字號分隔** | 單字間只能用 `-`，不能用底線或空格 | `data-analysis` | `data_analysis`、`data analysis` |
| **無連續連字號** | 不能出現 `--` | `code-review` | `code--review` |
| **首尾不可為連字號** | 連字號只能在中間 | `roll-dice` | `-roll-dice`、`roll-dice-` |
| **僅字母與數字** | 不可使用特殊字元 | `v2-parser` | `v2.parser`、`v2!parser` |
| **最長 64 字元** | 含連字號在內 | 見下述 | — |

### 為什麼這麼嚴格？

這不是吹毛求疵。`name` 會在多個場合被使用：

1. **檔案系統路徑**：技能目錄的名稱通常就是 `name`。大寫在 macOS（預設 case-insensitive）沒問題，但在 Linux 上是 case-sensitive，會造成跨平台問題。
2. **URL 識別碼**：在技能 registry 中，`name` 常被用作 URL path 的一部分。底線在 URL 中需要 percent-encoding（`_` → `%5F`），連字號則保持乾淨。
3. **平台內部索引**：Claude Code、OpenCode、Cursor 等平台會用 `name` 作為技能的唯一鍵值。一旦重複或格式異常，可能造成技能無法載入——而且平台通常不報錯，只會靜默跳過。

### 實務命名策略

| 策略 | 範例 | 適用場景 |
|------|------|---------|
| **功能直述** | `pdf-extraction`、`data-cleaner` | 單一明確功能 |
| **物件-動作** | `csv-validator`、`api-tester` | 強調操作的對象 |
| **生態定位** | `openai-to-anthropic-migration` | 轉換/遷移類工具 |
| **版本化** | `config-parser-v2` | 重大版本差異（少用） |

> ⚠️ **版本化命名要謹慎**：如果你發布了 `config-parser-v2`，之後又出了 v3，你是開一個新技能 `config-parser-v3` 還是修改 v2？除非你確定兩個版本會長期並存，否則建議用單一名稱，在 `metadata.version` 中管理版本號。

---

## 5.4 `description` 欄位 — 觸發與否的唯一裁判

`description` 是整份 SKILL.md **最重要的欄位**。不是因為它最長（確實也是最長的），而是因為它是 **Agent 判斷「現在需不需要載入這個技能」的唯一依據**。

### 觸發機制（Trigger Mechanism）

Agent 的運作流程大致如下：

1. 使用者提出請求
2. Agent 掃描所有可用技能的 `name` + `description`（Level 1）
3. Agent 自行判斷當前情境是否與某個 `description` 匹配
4. 若匹配 → 載入該技能的完整本文（Level 2）
5. 若不匹配 → 不使用該技能

**注意**：Agent 沒有其他方式來發現你的技能。它不看目錄結構，不讀 scripts 內容，不檢查 references——**只看 `description`**。

### Under-Trigger 問題

實務上最常見的問題是 **Agent 傾向 under-trigger**，也就是低估自己需要某個技能。

原因在於 Agent 的「過度自信」偏誤：當它看到「Helps with PDF files」時，它會想：「我知道 PDF 是什麼，我可以自己處理，不需要載入這個技能。」——然後它就自己編了一個 PDF 解析結果，完全不跑你的程式碼。

### 對抗策略

**策略 1：三層訊息結構**

一個有效的 `description` 必須包含三層訊息：

```
[核心功能] + [觸發情境] + [獨特價值]
```

| 層級 | 目的 | 範例 |
|------|------|------|
| **核心功能** | 讓 Agent 知道這是做什麼的 | `Extract text and tables from PDF files.` |
| **觸發情境** | 讓 Agent 知道什麼時候該用 | `Use when the user provides a PDF document or asks you to read/analyze a PDF.` |
| **獨特價值** | 讓 Agent 知道自己做不來 | `This skill handles page parsing, table detection, and text extraction with proper encoding — tasks that require specific libraries.` |

**策略 2：明確定義不觸發情境**

反直觉地，告訴 Agent **「什麼時候不要用」** 反而能提高觸發準確率：

```yaml
description: |
  Roll a virtual die and return a random number between 1 and N.
  Use when the user asks to roll dice, generate random numbers,
  or simulate dice throws.
  NOT for simple "pick a number" requests or cryptographic randomness.
```

這能降低誤觸率（false positive），讓技能只在真正需要時被載入。

**策略 3：全大寫關鍵字**

Agent 的底層 tokenizer 對全大寫詞彙的權重較高。適度使用全大寫可以強化觸發訊號：

```yaml
description: |
  Use WHEN THE USER ASKS TO roll dice, GENERATE RANDOM NUMBERS,
  or SIMULATE DICE THROWS.
```

> ⚠️ 不要過度使用。全大寫應只用於最關鍵的觸發動詞，否則會稀釋效果。

### 長度限制與寫作策略

`description` 上限是 **1024 字元**，約 150-200 個英文單詞，或 300-500 個中文字元。

寫作策略建議：

```
第 1 句：核心功能（一句話定位）
第 2-3 句：觸發情境（什麼時候該用）
第 4-5 句：獨特價值（為什麼不用不行）
最後一句：邊界條件（什麼時候不該用）
```

### 20 筆測試法

要確認你的 `description` 是否有效，官方建議採用系統化的測試方法：

1. **準備 20 筆測試查詢**
   - 10 筆**應該觸發**的（如「幫我讀這個 PDF」）
   - 10 筆**不該觸發**的（如「幫我找餐廳」）
2. **分割資料集**：60% 訓練集（12 筆）/ 40% 驗證集（8 筆）
3. **每筆查詢跑 3 次**（因為 Agent 的回應有隨機性）
4. **計算觸發率**：應觸發的觸發率 > 0.5 才算通過；不該觸發的觸發率 < 0.2

聽起來很多工，但這其實只需要 10-15 分鐘。而且一旦做過，你對 `description` 的掌握度會完全不同。

[DIAGRAM: trigger-test-flow]
流程圖：從建立 20 筆查詢 → 分割 train/validation → 逐筆測試（×3）→ 計算觸發率 → 未達標則修改 description → 重新測試。迴圈直到通過。

---

## 5.5 選填欄位（但值得使用）

### `license`

雖然是選填，但**強烈建議填寫**。

```yaml
license: MIT
```

為什麼重要？因為開源社群會直接複製你的技能。如果你沒寫 License，法律上就是 **All Rights Reserved**——反而限制了他人使用和散佈。

常見選項：

| License | 適合場景 |
|---------|---------|
| `MIT` | 最寬鬆，允許任何人做任何事，只需保留著作權聲明 |
| `Apache-2.0` | 類似 MIT，但包含專利授權條款 |
| `CC-BY-4.0` | 創作共用，適合非程式碼的技能（如教學技能） |
| `CC0-1.0` | 公眾領域，放棄所有權利 |

### `compatibility`

宣告技能需要什麼環境：

```yaml
compatibility:
  - platform: opencode
    version: ">=1.0"
  - platform: claude-code
  - python: ">=3.10"
```

注意：`compatibility` 目前**多數平台不會自動檢查**。它更像是一種「宣告給人類和其他工具讀的 metadata」。但隨著生態成熟，未來可能被納入自動相容性驗證。

### `metadata`

存放自訂資訊的彈性空間：

```yaml
metadata:
  author: your-name
  version: 1.2.0
  category: data-processing
  tags: [pdf, extraction, text]
```

實務用途：
- 技能版本管理（當 `name` 不變但內容更新時）
- 分類與標籤（供 registry 搜尋與過濾）
- 作者與維護者資訊（方便社群聯繫）

---

## 5.6 `allowed-tools` — 實驗性功能

`allowed-tools` 是 SKILL.md 規格中標記為 **實驗性** 的欄位。它的概念是：限制技能執行期間可以使用的工具清單。

```yaml
allowed-tools:
  - Read
  - Write
  - Bash
  - WebSearch
```

### 設計初衷

這個欄位的目的是**安全隔離**。如果一個技能只應該讀取檔案和執行 Python 腳本，理論上就不需要 `WebSearch` 或 `Write`（寫入任意位置）等工具。透過白名單機制，平台可以限制技能的權限範圍。

### 現狀與限制

⚠️ **截至 2026 年中，只有極少數平台實作了這個功能。** 多數平台（包括 Claude Code 和 OpenCode 的最新版本）會忽略這個欄位。

#### 如果平台不支援會發生什麼？

當平台遇到不認識的 frontmatter 欄位時，標準行為是**靜默忽略**——不會報錯、不會警告、也不會影響其他欄位的解析。這意味著你可以在開放的生態中安全地加入 `allowed-tools` 作為宣告，而不必擔心破壞相容性。

#### 實務建議

- **未來規劃**：如果你在開發封閉環境的技能（如企業內部的技能），可以開始加入 `allowed-tools` 作為宣告，預先為將來的權限管控做好準備
- **目前忽略**：如果你的目標是跨平台發布到公開 Registry，現在不需要依賴這個欄位來實現安全隔離
- **設計保留空間**：在組織技能目錄時，可以預先思考「這個技能理論上需要哪些工具」，但不需要現在就寫進 SKILL.md
- **持續關注**：這個欄位在社群中是被討論得最熱烈的話題之一，因為它觸及了 Agent 安全性的核心問題。如果未來主流平台開始實作，它將徹底改變技能的分發與執行模型

#### 與其他安全機制的關係

`allowed-tools` 不是唯一的安全層。目前生態中還有：

| 機制 | 層級 | 說明 |
|------|------|------|
| **平台權限設定** | 執行環境 | 使用者在平台層級設定 Agent 可以使用的工具 |
| **技能白名單** | 載入階段 | 平台管理者限制哪些技能可以被載入 |
| **`allowed-tools`** | 技能內部 | 技能自己宣告需要的工具（實驗性） |

三者可以並存，但目前只有前兩者被廣泛實作。

---

## 5.7 Body 本文 — 真正的專業知識

Frontmatter 是身分證，Body 是操作手冊。`---` 之後的內容對應三層揭露的 **Level 2（Instructions）**，是 Agent 觸發後會完整載入的部分。

### 內容結構建議

一個經過實戰驗證的 Body 結構如下，依序涵蓋七個段落：

```
## Overview（選擇性）
## Prerequisites（建議）
## Steps（核心 — 務必有）
## Input / Output Examples（建議）
## Gotchas（高價值 — 強烈建議）
## Verification（建議）
## Troubleshooting（選擇性 — 進階）
```

以下逐一說明每個段落的用途與寫法。

#### Overview（選擇性）

一句話總結這個技能完成什麼目標。不是必要的——因為 `description` 已經做了這件事。但如果你希望 Agent 在載入後快速掌握核心目標，這裡可以用更白話的方式重申一次。

```markdown
## Overview

Validate CSV files for schema compliance, data type correctness,
and null value rates. Generates a structured validation report.
```

#### Prerequisites（建議）

使用可勾選清單，讓 Agent 在開始執行前確認環境就緒：

```markdown
## Prerequisites

- [ ] Python 3.10+ installed
- [ ] Required packages installed: `pip install pandas pyyaml`
- [ ] Input CSV file path is accessible
- [ ] Output directory exists (will be created if not)
```

為什麼用清單而不是段落？因為 Agent 對 checklist 格式的服從度極高——它會一格一格確認，而不是讀完段落後選擇性忽略。

#### Steps（核心 — 務必有）

這是 Body 最重要的段落。原則：

1. **每一步都要動詞開頭**：`Check`、`Read`、`Run`、`If...then`、`Return`
2. **包含判斷點與分支**：`If the file is empty, return an error message instead of proceeding`
3. **具體到 Agent 不需要猜**：不要說「處理檔案」，要說「讀取檔案的開頭 4 個 bytes 確認 PDF header」

```markdown
## Steps

1. **Validate the input file**
   - Check that the file exists at the given path
   - Check that the file extension is `.csv`
   - If either check fails, return an error message and stop

2. **Read the CSV header**
   - Use `pandas.read_csv()` with `nrows=0` to read only the header
   - Store column names for schema validation

3. **Validate schema**
   - Compare column names against expected schema (from `references/schema.yaml`)
   - Report any missing or unexpected columns

4. **Check data types**
   - Sample first 100 rows and infer data types per column
   - Flag columns where type mismatch rate > 10%

5. **Generate report**
   - Return a JSON object with: passed (bool), errors (list), warnings (list), summary (string)
```

#### Input / Output Examples（建議）

Agent 需要一個「正確答案的樣本」來校驗自己的輸出。提供具體的 input → output 配對：

````markdown
## Input / Output Examples

**Input** (CSV file `users.csv`):
```csv
name,email,age
Alice,alice@example.com,30
Bob,bob@example.com,not_a_number
```

**Expected Output**:
```json
{
  "passed": false,
  "errors": [
    {"row": 2, "column": "age", "expected": "integer", "found": "string"}
  ],
  "warnings": [],
  "summary": "1 validation error found in 2 rows"
}
```
````

#### Gotchas（高價值 — 強烈建議）

這是你的技能與其他技能最大的差異化來源。Gotchas 是「Agent 不問就不會知道，但它也不會問，因為它不知道自己不知道」的環境特定知識。

```markdown
## Gotchas

- ⚠️ **空檔案陷阱**：`pandas.read_csv()` 對空檔案不會報錯——它回傳一個空的 DataFrame，後續的型別檢查全部通過。必須在步驟 1 先用 `os.path.getsize()` 檢查。
- ⚠️ **BOM 問題**：某些 Windows 產生的 CSV 包含 BOM（`\xef\xbb\xbf`），這會讓第一欄名稱變成 `\ufeffname` 而非 `name`。讀取時要加上 `encoding='utf-8-sig'`。
- ⚠️ **大型檔案**：如果 CSV 超過 100MB，不要一次載入全部記憶體。使用 `pandas.read_csv(chunksize=10000)` 分批處理。
```

善用 gotchas 的技能，Agent 的執行成功率會顯著高於沒有 gotchas 的技能。

#### Verification（建議）

Agent 執行完步驟後缺乏自我校驗的習慣。你的 verification 段落就是它的校驗清單：

```markdown
## Verification

After generating the report, always verify:

- [ ] The `passed` field matches the actual error count (passed=true when errors=[])
- [ ] Every error has all required fields: row, column, expected, found
- [ ] If the CSV was empty, the report says "empty file" not "passed"
- [ ] If the file didn't exist, the report contains an error message, not a validation result
```

#### Troubleshooting（選擇性 — 進階）

對於複雜技能，一個錯誤對照表可以大幅減少 Agent 卡住的时间：

```markdown
## Troubleshooting

| Error Message | Likely Cause | Solution |
|---------------|-------------|----------|
| `No such file or directory` | Path is relative, not absolute | Convert to absolute path with `os.path.abspath()` |
| `EmptyDataError` | File is empty | Return early with "empty file" message |
| `UnicodeDecodeError` | Encoding mismatch | Try `encoding='utf-8-sig'`, then `'cp1252'` |
| `MemoryError` | File too large | Use chunked reading with `chunksize=10000` |
```

這個表格讓 Agent 在遇到錯誤時有「劇本」可以跟，而不是自己發明解決方案（通常是錯的）。

### 步驟化的力量

Agent 本質上是一個 **reasoning engine**，擅長逐步推理。你給它步驟，它就照著走；你給它描述，它就要自己拆解——而這個拆解過程很容易出錯。

❌ 不要這樣寫：
```markdown
This skill handles PDF extraction. It uses PyMuPDF for text
extraction and Camelot for table detection.
```

✅ 要這樣寫：
```markdown
## Steps

1. Check if the file is a valid PDF by reading its header (bytes 0-4)
2. Use PyMuPDF to extract text page by page
3. If the user asked for tables, use Camelot to detect them
4. If both text and tables exist, return structured JSON with separate keys
5. If extraction fails, fall back to `pdfminer` and notify the user
```

### 輸出模板

如果你希望 Agent 輸出特定格式，**給模板比給範例更可靠**：

````markdown
## Output Format

Return a JSON object with this structure:

```json
{
  "title": "...",
  "confidence": 0.0-1.0,
  "sources": ["..."],
  "summary": "...",
  "error": null
}
```
````

Agent 看到模板會直接複製貼上填空。看到範例則會模仿，但可能偏離結構。

### Gotchas 的獨特價值

Gotchas 是 **「Agent 不問就不會知道，但它也不會問，因為它不知道自己不知道」** 的資訊。

最高價值的主題包括：

| 主題類型 | 範例 |
|---------|------|
| **環境差異** | 使用者 ID 在 production DB 叫 `user_id`，在 analytics DB 叫 `uid` |
| **隱藏限制** | `/health` endpoint 只檢查 DB 連線，不代表所有服務正常 |
| **順序依賴** | 必須先呼叫 `POST /auth` 取得 token，才能呼叫其他 API |
| **邊界案例** | 空檔案、超大檔案、特殊字元的處理方式 |

---

## 5.8 目錄結構

官方規範定義的技能目錄結構如下：

```
my-skill/
├── SKILL.md          # ✅ 必要 — 技能的核心
├── scripts/          # 🔧 選用 — 可執行程式碼
├── references/       # 📚 選用 — 參考文件
└── assets/           # 🖼️ 選用 — 靜態資源
```

### 各目錄的角色

| 目錄 | 用途 | 什麼時候需要 | 範例內容 |
|------|------|-------------|---------|
| `scripts/` | 技能需要執行的程式碼 | 當 Agent 需要實際執行運算、轉換、API 呼叫時 | `scrape.py`、`transform.js`、`analyze.sh` |
| `references/` | 技能需要查閱的參考資料 | 當技能需要根據外部資料做出判斷時 | `api-spec.yaml`、`tax-rates-2026.csv`、`style-guide.md` |
| `assets/` | 技能需要輸出或使用的靜態資源 | 當技能需要產生特定格式的檔案時 | `report-template.docx`、`logo.png`、`config.json` |

### 三層揭露的對應

```
Level 1 (~100 tokens)     name + description           ← 永遠載入
Level 2 (<5000 tokens)    SKILL.md 本文                 ← 觸發時載入
Level 3 (on-demand)       scripts/ references/ assets/  ← 需要時載入
```

**關鍵理解**：Level 3 的檔案不是自動載入的。Agent 必須在 SKILL.md 中明確指示「讀取 `references/config.json`」或「執行 `scripts/process.py`」，平台才會去存取這些檔案。如果你的 SKILL.md 從來沒有提及 `scripts/`，那些腳本就等同於不存在。

---

## 5.9 三層漸進式揭露的實際運作

這是 Agent Skills 生態最核心的設計，但也是最容易被忽略的。理解它，你就能寫出對 Agent 更友善的技能。

### 載入時機的時間線

```
使用者提出請求
    │
    ▼
平台掃描所有技能的 SKILL.md
    │
    ├── 讀取 Level 1: name + description
    │   （所有技能，這個階段完全不讀本文）
    │
    ▼
Agent 根據 description 判斷是否匹配
    │
    ├── 匹配？→ 載入 Level 2: 該技能的完整本文
    │   （僅匹配的技能，其他技能仍只停留在 Level 1）
    │
    ▼
Agent 執行本文中的步驟
    │
    ├── 需要腳本？→ 載入 Level 3: scripts/xxx.py
    ├── 需要參考資料？→ 載入 Level 3: references/xxx.csv
    │
    ▼
任務完成
```

### Token 成本的實際計算

假設你有 50 個技能在一個專案中：

```
Level 1: 50 個技能 × ~100 tokens = 5,000 tokens（永遠佔用）
Level 2: 1 個觸發的技能 × ~3,000 tokens = 3,000 tokens（觸發時佔用）
Level 3: 2 個資源檔案 × ~500 tokens = 1,000 tokens（需要時佔用）

總計：約 9,000 tokens —— 即使有 50 個技能也還在合理範圍。
```

如果沒有三層設計，全部載入 Level 2（50 × 3,000 = 150,000 tokens），你的 context window 直接爆掉。

### 對技能撰寫者的啟示

1. **不要把 Level 1 當成 Level 2 來用**：不要為了提高觸發率而在 `description` 中塞入大量步驟細節。1024 字元是上限，不是目標。精準比完整重要——一個精準的 description 觸發率遠高於一個冗長但模糊的 description。
2. **Level 2 的長度控制**：雖然上限是 5000 tokens，但實務上建議控制在 2000-3000 tokens。太長的技能，Agent 載入後可能因為 context 中還有其他資訊而無法完整消化。如果你發現 Body 超過 3000 tokens，考慮拆成多個技能，或把部分內容移到 Level 3 的參考文件。
3. **把大檔案放到 Level 3**：如果你的技能需要附帶一份 50 頁的 API 規格書或法規文件，不要放進 SKILL.md。把它放到 `references/` 目錄中，然後在 Body 的步驟裡明確指示：「讀取 `references/api-spec.yaml` 來確認端點參數」。這樣做的好處是：Level 2 保持輕量，Level 3 的檔案只有在步驟執行到該點時才會被載入。
4. **注意 Level 2 的 loading 順序**：Agent 載入 Level 2 時，是從頭到尾順序讀取的。這意味著最重要的步驟應該放在前面。如果 Agent 在執行到一半時 context 被其他任務擠壓，它至少已經讀完了前半段的核心步驟。

### 實際案例：三層設計的取捨

假設你正在寫一個「台灣法規合規性檢查」技能：

| 內容 | 放在哪一層 | 原因 |
|------|-----------|------|
| name + description | Level 1 | 永遠需要被掃描到 |
| 檢查步驟（5 個步驟） | Level 2 | 核心操作流程，必須完整載入 |
| 法規條文對照表（50 頁 PDF） | Level 3 | 只有當步驟執行到「比對法規」時才需要 |
| 合規報告模板（DOCX） | Level 3 | 只有最後產生報告時才需要 |
| 執行腳本 | Level 3 | 步驟指示「執行 scripts/check.py」時才載入 |

這樣的設計讓你的技能在未觸發時只佔 ~100 tokens，即使它背後有 50 頁的參考資料。這就是三層揭露的威力。

### 跨平台載入行為的差異

⚠️ 不同平台對三層揭露的實作細節不盡相同：

| 平台 | Level 1 掃描機制 | Level 2 載入行為 | Level 3 支援度 |
|------|-----------------|-----------------|---------------|
| Claude Code | 啟動時掃描所有技能目錄 | 即時載入 | ✅ 完整支援 |
| OpenCode | 啟動時掃描 + 動態發現 | 即時載入 | ✅ 完整支援 |
| Cursor | 工作區掃描 | 按需載入 | ✅ 支援 |
| Gemini CLI | 技能 activate 時載入 | 觸發時載入 | ⚠️ 部分支援 |

雖然載入機制略有差異，但 SKILL.md 的格式在所有平台上保持一致。這意味著**你寫一份技能，就可以在任何相容平台上執行**——這是開放格式的最大優勢。

[DIAGRAM: three-level-pyramid]
三層金字塔圖，從底部的 Level 1（窄、永不消失）到頂部的 Level 3（寬、按需載入）。每層標示 token 成本與載入條件。左側標示「平台啟動時 → 觸發時 → 執行時」的時間軸。

---

## 5.10 完整 SKILL.md 模板

以下是可直接複製使用的生產級模板：

```markdown
---
name: your-skill-name
description: |
  One sentence: what this skill does.
  When to use it: describe the trigger scenarios.
  Why to use it: what makes this better than the agent doing it alone.
  When NOT to use it: boundary conditions.
license: MIT
compatibility:
  - platform: opencode
  - platform: claude-code
metadata:
  author: your-name
  version: 1.0.0
  tags: [category, subcategory]
---

## Overview

Brief one-sentence summary of what this skill achieves.

## Prerequisites

- [ ] Dependency A installed（e.g., Python 3.10+）
- [ ] Environment variable B set（e.g., `API_KEY`）
- [ ] Required file C exists

## Steps

1. **First step** — describe the action clearly
   - Include specific commands if applicable
   - Note any expected output

2. **Second step** — check the result of step 1
   - If condition X, take path A
   - If condition Y, take path B

3. **Third step** — produce the final output

## Input / Output Examples

**Input**: describe the input format

**Output**: describe the expected output

```json
{
  "example": true
}
```

## Gotchas

- ⚠️ Environment-specific fact that the agent wouldn't know
- ⚠️ Edge case: what happens when input is empty
- ⚠️ Silent failure mode: this command succeeds but doesn't mean everything is OK

## Verification

After execution, always verify:

- [ ] Check that output contains expected field
- [ ] Run `command --validate` to confirm
- [ ] If result seems suspicious, re-run with verbose flag

## Troubleshooting

| Error | Likely Cause | Solution |
|-------|-------------|----------|
| `Error: ENOENT` | Missing dependency | Run `pip install -r requirements.txt` |
| `Timeout` | Network issue | Retry with `--retry 3` flag |
```

> 這個模板涵蓋了 frontmatter（含選填欄位）和七個 body 段落。你可以根據技能的複雜度增減段落。

---

## [DIAGRAM: anatomy-of-skill-md]

```
┌─────────────────────────────────────────────────────┐
│  ---                                                │
│  name: pdf-extraction              ← kebab-case     │
│  description: |                    ← 三層訊息結構    │
│    Extract text and tables from                     │
│    PDF files. Use when...                           │
│  license: MIT                      ← 選填但建議     │
│  compatibility: ...                ← 選填           │
│  metadata:                         ← 選填           │
│    author: your-name                                │
│    version: 1.0.0                                   │
│  ---                                                │
├─────────────────────────────────────────────────────┤
│  LEVEL 1 (永遠載入) │  ~100 tokens                  │
│  平台啟動時 Agent 掃描所有技能的 name + description    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ## Overview                                        │
│                                                     │
│  ## Prerequisites                                   │
│  - [ ] Python 3.10+                  ← 可勾選清單   │
│  - [ ] PyMuPDF installed                            │
│                                                     │
│  ## Steps                              ← 步驟化     │
│  1. Check file header                               │
│  2. Extract text page by page                       │
│  3. If tables requested, run Camelot                │
│  4. Return structured JSON                          │
│                                                     │
│  ## Input / Output Examples          ← 模板化       │
│                                                     │
│  ## Gotchas                           ← 獨特價值    │
│  - ⚠️ Encrypted PDFs will fail silently             │
│                                                     │
│  ## Verification                      ← 校驗循環    │
│  - [ ] Output has "text" key                        │
│                                                     │
├─────────────────────────────────────────────────────┤
│  LEVEL 2 (觸發時載入) │  < 5000 tokens              │
│  當 Agent 判斷情境匹配 description 時載入全文         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  scripts/                                           │
│  ├── extract.py                    ← 可執行程式碼   │
│  └── validate.py                                    │
│                                                     │
│  references/                                        │
│  └── pdf-spec.pdf                  ← 參考資料       │
│                                                     │
│  assets/                                            │
│  └── template.docx                 ← 靜態資源       │
│                                                     │
├─────────────────────────────────────────────────────┤
│  LEVEL 3 (需要時載入) │  on-demand                  │
│  僅當 SKILL.md 明確指示時才存取                      │
└─────────────────────────────────────────────────────┘
```

---

## 5.11 常見錯誤

以下是社群中最常見的 SKILL.md 錯誤，以及如何避免。

### 錯誤 1：Name 格式錯誤

```yaml
# ❌ 這些會讓你的技能被靜默忽略
name: PDF Processing      # 大寫 + 空格
name: data_analysis       # 底線
name: my--skill           # 連續連字號
name: -leading-hyphen     # 開頭連字號

# ✅ 正確
name: pdf-processing
name: data-analysis
name: my-skill
```

### 錯誤 2：Description 太模糊

```yaml
# ❌ Agent 會覺得「我可以自己來」
description: Helps with PDFs.

# ❌ 沒有觸發情境
description: A tool for processing PDF documents.

# ✅ 三層訊息完整
description: |
  Extract text and tables from PDF files.
  Use when the user provides a PDF or asks
  you to read/analyze a PDF document.
  Includes proper page parsing and encoding
  handling that standard text extraction lacks.
```

### 錯誤 3：Level 1 塞入太多資訊

```yaml
# ❌ description 不是說明書
description: |
  This skill extracts text and tables from PDF files.
  Step 1: Check file header. Step 2: Use PyMuPDF...
  (1000 字操作說明全部塞在這裡)
```

`description` 的目的只是 **觸發**。操作細節放在 Level 2 的 Body 中。

### 錯誤 4：Body 只有描述沒有步驟

```markdown
## How to use

This skill extracts text from PDFs using PyMuPDF.
```

Agent 讀完後只能自己猜執行順序。改成：

```markdown
## Steps

1. Validate the PDF file header
2. Initialize PyMuPDF with the file path
3. Call `page.get_text()` for each page
4. Concatenate results with page separators
5. Return the structured text output
```

### 錯誤 5：沒有校驗環節

Agent 執行完步驟後，如果沒有校驗，它就會直接相信結果是正確的——即使結果是空的或是亂碼。

```markdown
## Verification

- [ ] Output contains at least one page of text
- [ ] If output is empty, check if PDF is encrypted
- [ ] Log a warning if extraction time > 30 seconds
```

### 錯誤 6：輸出格式未指定

Agent 沒有輸出模板時，會自己發明格式——而且每次不同。

```markdown
# ❌ 只說「回傳結果」，Agent 會自由發揮
Return the validation result.
```

````markdown
# ✅ 給模板，Agent 會照著填空
Return a JSON object:

```json
{
  "passed": true,
  "errors": [],
  "warnings": [],
  "summary": "All 150 rows passed validation."
}
```
````

Agent 看到模板的行為是「複製貼上再填空」，看到描述的行為是「自己理解再生成」——前者的準確率遠高於後者。

### 錯誤 7：在 commands 中嵌入敏感資訊

```bash
# ❌ 絕對不可以
git clone https://username:password@github.com/org/repo.git
curl -H "Authorization: Bearer sk-1234567890abcdef" https://api.example.com
```

```bash
# ✅ 用環境變數
git clone https://$GITHUB_TOKEN@github.com/org/repo.git
curl -H "Authorization: Bearer $API_KEY" https://api.example.com
```

> Skill 是設計來分享的——你永遠不知道誰會 fork 你的 repo。

### 錯誤 8：忽略邊界案例

Agent 預設假設「一切都會順利」。你的技能需要明確告訴它：**當事情不順利時怎麼辦**。

```markdown
## Steps

1. Read the CSV file
   # ❌ 沒有說檔案不存在怎麼辦
2. Validate columns
```

改成：

```markdown
## Steps

1. **Check if file exists**
   - If not: return `{"error": "File not found", "path": "..."}` and stop
   - If yes: proceed to step 2

2. **Check if file is empty**
   - If empty (0 bytes): return `{"error": "Empty file"}` and stop
   - If has content: proceed to step 3

3. **Read and validate columns**
   - If CSV is malformed: catch exception, return `{"error": "Malformed CSV", "detail": "..."}`
```

每個步驟都要有「正常路徑」和「錯誤路徑」。Agent 需要你告訴它後者。

### 錯誤 9：假設 Agent 有特定知識

這是最常見也最容易被忽略的錯誤。Agent 的訓練資料中可能包含某個套件的知識，但**不保證它知道最新版本的行為**，也不保證它知道你的環境特有的設定。

```markdown
# ❌ 假設 Agent 知道怎麼用這個套件
Use `pandas.read_csv()` to read the file.

# ✅ 明確指定參數，消滅模糊空間
Use `pandas.read_csv(filepath, encoding='utf-8-sig', dtype=str)`.
```

特別是在以下情境，不要假設 Agent 知道：

| 情境 | 錯誤寫法 | 正確寫法 |
|------|---------|---------|
| API 端點 | `Call the API` | `Call POST https://api.example.com/v2/validate with header Authorization: Bearer $TOKEN` |
| 套件版本 | `Install the package` | `Run pip install pandas==2.2.0 (NOT the latest, which has a breaking change)` |
| 檔案路徑 | `Save the output` | `Save to ./output/report.json (create ./output/ first with mkdir)` |
| 權限 | `Run the script` | `Run chmod +x scripts/deploy.sh first, then execute it` |

**黃金法則**：當你在寫 SKILL.md 時，假設 Agent 是你的實習生——熱情、聰明，但對你的專案一無所知。你需要告訴它每一件「顯而易見」的事。

---

## 5.12 摘要參考總表

| 主題 | 關鍵規則 | 實務建議 |
|------|---------|---------|
| **`name`** | kebab-case, ≤ 64 chars, 僅 `[a-z0-9-]` | 取完不更改，當作唯一 ID |
| **`description`** | ≤ 1024 chars, 三層訊息 | 用 20 筆測試法驗證觸發率 |
| **`license`** | 選填，建議填寫 | 不填 = All Rights Reserved，推薦 MIT |
| **`compatibility`** | 選填，array | 目前僅供宣告，平台不強制檢查 |
| **`metadata`** | 選填，object | 存放版本號、作者、標籤 |
| **`allowed-tools`** | ⚠️ 實驗性，僅少數平台支援 | 現在可忽略，但設計時保留空間 |
| **Body 本文** | 步驟化 > 描述化，≤ 5000 tokens | 包含 Steps + Gotchas + Verification |
| **目錄結構** | SKILL.md + scripts/references/assets | Level 3 資源不是自動載入的 |
| **三層揭露** | L1 ~100t, L2 <5000t, L3 on-demand | description 不要超出應有的篇幅 |
| **校驗循環** | 每一步完成後都應驗證 | Agent 不會自動檢查自己的輸出 |

---

## 5.13 練習題

### 練習 1：撰寫一份 SKILL.md 模板

為一個「CSV 資料驗證器」技能撰寫完整的 SKILL.md。需求如下：

- 技能名稱：`csv-validator`
- 功能：檢查 CSV 檔案的欄位名稱、資料型別、空值率，並產生驗證報告
- 觸發場景：使用者上傳 CSV 檔案或要求驗證資料品質
- 需要一個 Python 腳本（放在 `scripts/`）
- 需要一個參考文件（放在 `references/`）

請寫出完整的 frontmatter + body（至少包含 Steps、Gotchas、Verification 段落）。

<details class="exercise-hint">
<summary>💡 提示</summary>
- Frontmatter 至少要有 `name` 和 `description`，建議加上 `license` 和 `metadata`
</details>
- Description 要包含三層訊息（核心功能 + 觸發情境 + 獨特價值）
- Steps 要包含判斷點（如「如果檔案不存在」或「如果空值率過高」）
- Gotchas 至少寫 2 個環境特定陷阱
- Verification 至少寫 3 個檢查項目

### 練習 2：分析真實技能的 Frontmatter

以下是一個真實技能的 frontmatter。請指出所有問題：

```yaml
---
name: my-pdf-helper
description: Helps with PDF
compatibility: Claude Code
metadata:
  author: beginner
  version: 1
---
```

1. `name` 有什麼問題？
2. `description` 有哪些問題？請改寫成三層訊息結構的版本。
3. `compatibility` 的格式正確嗎？
4. `metadata` 可以如何改善？

### 練習 3：Description 觸發測試

假設你寫了以下 description：

```yaml
description: |
  Convert markdown files to PDF format.
  Use when the user wants to export a document.
```

請設計 5 筆「應該觸發」和 5 筆「不該觸發」的測試查詢，並解釋你的選擇邏輯。

<details class="exercise-hint">
<summary>💡 提示</summary>
- 應該觸發的查詢應該包含：直接請求（「幫我轉 PDF」）、間接請求（「我要匯出這份文件」）、技術查詢（「markdown 轉 PDF 怎麼做」）
</details>
- 不該觸發的查詢應該測試邊界：請求轉成其他格式（「轉成 Word」）、不相關任務（「幫我找餐廳」）、相關但不匹配的任務（「幫我編輯這個 markdown」——只是編輯，不是轉換）

---

## 本章摘要

- **SKILL.md 是 Agent Skills 的核心**，一個檔案定義了技能的完整規格
- **Frontmatter 有兩個必填欄位**（`name`、`description`）和四個選填欄位（`license`、`compatibility`、`metadata`、`allowed-tools`）
- **`name` 使用 kebab-case**（全小寫 + 連字號），最長 64 字元，發布後不更改
- **`description` 是觸發的唯一機制**，需包含核心功能 + 觸發情境 + 獨特價值三層訊息
- **Body 本文應步驟化**，包含 Prerequisites、Steps、Input/Output Examples、Gotchas、Verification
- **三層漸進式揭露**控制 token 成本：Level 1（永遠載入）→ Level 2（觸發時載入）→ Level 3（需要時載入）
- **`allowed-tools` 為實驗性功能**，目前僅少數平台支援
- **技能目錄結構**除了 SKILL.md，還可以包含 scripts/、references/、assets/
- **常見錯誤**包括 name 格式錯誤、description 太模糊、沒有校驗環節、嵌入敏感資訊

---

*下一章：Chapter 6 — 跨平台測試與相容性。我們將實際測試同一份 SKILL.md 在 Claude Code、Cursor、Copilot 等不同平台上的行為差異，學會打造真正的跨平台 Skill。*

---

← [上一章: Ch4 從零建置第一個 Skill](/課程/02-01-quickstart) | [下一章: Ch6 跨平台測試與相容性](/課程/02-03-multi-client-testing) →
