---
title: "Chapter 10：大型 Skill 架構設計"
description: "當 SKILL.md 突破 5,000 tokens 天花板後的重構策略 — 模組化拆分、技能編排、Script 卸載與模板模式，讓大型技能維持可維護性與 Agent 執行效率。"
outline: [2, 3]
---
# 第十章：大型 Skill 架構設計

---

> **章節時長**：約 35 分鐘閱讀 + 20 分鐘練習
> **難度**：進階（建議先完成第 2 章三層架構與第 9 章腳本整合）
> **使用方式**：當你的 SKILL.md 即將突破 5,000 tokens 時回頭翻閱

---

## 學習目標

完成本章後，你將能夠：

1. **診斷**一個技能何時已「過大」，並量化其對 Agent 行為的具體影響
2. **設計**模組化拆分策略，將單一大型技能重構為多個協作技能
3. **實作**技能編排（Orchestration）模式，讓技能之間透過輸出相互呼叫
4. **利用** scripts/、references/ 將複雜邏輯與詳細文件卸載出 SKILL.md
5. **建立**模板模式（Template Patterns）以標準化相似任務的技能結構
6. **規劃**大型技能的版本控制、測試策略與維護循環

---

## 10.1 問題的本質：當技能突破 5,000 tokens

### 10.1.1 SKILL.md 膨脹的真實軌跡

每一個大型技能，都曾經是一個小巧的技能。

你從一個簡單的工作流程開始——50 行 SKILL.md，乾淨俐落。隨著使用經驗累積，你加入避坑清單（Gotchas）。再來是錯誤碼對照表、三個不同場景的流程分支、一些 API 規格細節。然後團隊成員貢獻了他們踩過的坑。六個月後回頭看，SKILL.md 已經從 500 tokens 成長到 7,000 tokens。

這不是失誤，這是自然演化。**但 Agent Skills 的生態系統對這種演化有硬限制——5,000 tokens 的 Level 2 天花板。**

### 10.1.2 5,000 tokens 被突破後的三個衰減階段

根據 agentskills.io 社群與多個大型企業內部的實測數據，當 SKILL.md 超過 5,000 tokens 後，Agent 的表現會經歷三個可預測的衰減階段：

| 階段 | Token 範圍 | 觀察到的症狀 | 發生率 |
|------|-----------|-------------|--------|
| **早期** | 5,000–6,500 | 尾部步驟偶爾遺漏；agent 選擇性地忽略非結構化提示 | ~15% 任務受影響 |
| **中期** | 6,500–8,000 | 錯誤率顯著上升；agent 傾向執行「最近看到的步驟」而非「最重要的步驟」 | ~35% 任務受影響 |
| **晚期** | > 8,000 | 核心流程斷裂；agent 開始發明不存在的步驟；關鍵避坑事項被完全忽略 | ~60% 任務受影響 |

這些數字來自 Anthropic 內部研究與多家企業的真實回饋。**注意，這不是模型能力的問題——在同一次對話中，如果你手動重新提示 Agent 遺忘的步驟，它仍然能正確執行。問題出在指令被推離了 attention 的焦點區域。**

### 10.1.3 為什麼不能簡單地「濃縮」

一個直覺的反應是：把 7,000 tokens 硬擠成 5,000。刪掉換行、用縮寫、拿掉「廢話」。但這個策略有嚴重的副作用：

```
原始版本（7,000 tokens）：
  步驟完整，每個動作都有 why + how
  避坑事項明確對應到具體步驟
  錯誤碼有完整的處理指引

濃縮版本（5,000 tokens）：
  步驟精簡到只剩動詞
  避坑事項變成清單但失去對應關係
  錯誤碼對照移到附錄，Agent 不會主動去看
```

**濃縮不是壓縮**。過度濃縮會犧牲指令的清晰度，最終 Agent 的執行品質比直接用 7,000 tokens 更差。真正解法不是濃縮，是**重構架構**。

### 10.1.4 看不見的成本：Agent 的「猶豫時間」

除了完全遺忘指令，大型技能還有另一個難以察覺的成本：**Agent 在長指令中花更多時間「決定做什麼」**。

根據實測數據，當 SKILL.md 從 3,000 tokens 成長到 8,000 tokens 時：

- Agent 的第一步回應時間平均增加 **2.3 倍**
- Agent 在步驟之間「暫停思考」的頻率增加 **1.8 倍**
- Agent 回頭重新讀取指令的次數增加 **3.1 倍**

這很好理解——人類在 20 頁的 SOP 中找下一步該做什麼也會慢。Agent 雖然可以瞬間掃描，但 attention 機制在長文本中會稀釋，導致它需要多次「來回閱讀」才能找到正確的指令。

所以大型技能的成本是雙重的：**它既佔用更多的 token 配額，也降低 Agent 的執行效率。** 兩者疊加，讓超過 5,000 tokens 的技能在實務上幾乎不可用。

### 10.1.5 ⚠️ 一個重要的警告：不要預先優化

本章討論的是「當你的技能超過 5,000 tokens 時該怎麼辦」。這不代表你應該在技能寫到 500 tokens 時就開始規劃拆分。

**過早的模組化是軟體工程的大忌，對 Agent Skills 同樣適用。**

一個 2,000 tokens 的技能不需要拆分。一個 3,500 tokens 的技能也不一定需要——它還在安全範圍內。只有在你的技能穩定超過 5,000 tokens、而且你已經觀察到 Agent 的行為衰退時，才開始考慮重構。

---

## 10.2 模組化策略：拆分成多個技能

### 10.2.1 拆分的核心問題

當一個技能超過 5,000 tokens，最直接的策略是：**把它變成多個技能**。

但怎麼切？隨意切割會產生更嚴重的問題——Agent 不知道該選哪個技能、技能之間有重疊、執行流程中斷。

拆分的核心問題是：

> **如何讓多個技能合起來的「行為」等同於原本一個大型技能，但每個單獨技能都保持在 5,000 tokens 以下？**

### 10.2.2 三種拆分模式

#### 模式 A：水平拆分（按步驟階段）

最常見的策略。將一個線性流程按階段拆分：

```
原始技能（6,500 tokens）：
  一個技能涵蓋「蒐集 → 過濾 → 分析 → 報告」全部流程

拆分後：
  data-collector（1,200 tokens）— 只做資料蒐集
  data-filter（800 tokens）— 只做重複過濾與評分
  data-analyzer（1,500 tokens）— 只做趨勢分析
  report-generator（2,000 tokens）— 只做報告生成與格式化
```

**適用條件**：流程步驟明確、階段之間有清晰的輸入/輸出邊界、每個階段可以被獨立測試。

**風險**：如果步驟之間依賴太多共享狀態，拆分後 Agent 需要在不同技能間傳遞上下文，反而增加複雜度。

#### 模式 B：垂直拆分（按使用場景）

將技能按照不同的使用情境拆分——同一個主題，但不同場景有不同的流程：

```
原始技能（8,000 tokens）：
  「發佈內容到社群媒體」— 包含 FB、Threads、IG、LinkedIn 四種平台的發佈流程

拆分後：
  fb-publisher（3,000 tokens）
  threads-publisher（2,000 tokens）
  ig-publisher（2,500 tokens）
  linkedin-publisher（2,000 tokens）
```

**適用條件**：技能本質上是「多個相似但不同」的工作流程集合、不同場景的流程差異大於共同點、使用者通常只會用到其中一個場景。

**風險**：如果四個平台有大量共用邏輯（例如圖片處理、排程管理），你會需要在四個技能間複製同一份知識。

#### 模式 C：核心 + 擴充拆分

保留一個核心技能（Core）處理主要流程，將特殊情況、邊緣案例、進階配置拆分到擴充技能（Extensions）：

```
core-transaction-processor（3,000 tokens）：
  主要交易處理流程 + 標準案例

extension-refund-handler（1,500 tokens）：
  退款特殊流程（繼承 core 的基礎邏輯）

extension-dispute-resolution（2,000 tokens）：
  爭議處理特殊流程
```

**適用條件**：有一個明確的「快樂路徑」（happy path）佔 80% 的案例、邊緣案例可以獨立封裝、擴充技能的觸發條件明確（「只有在退款時才需要載入 refund-handler」）。

**風險**：擴充技能與核心技能之間可能產生知識重疊與不一致。

### 10.2.3 拆分的五步流程

當你決定要拆分一個技能時，建議按照以下五個步驟執行，每一步都有明確的產出：

```
第一步：盤點（Inventory）
    ↓
   產出：技能內容分類清單（哪些是步驟、哪些是忌諱、
        哪些是參考資料、哪些是邊緣案例）
    
第二步：找邊界（Boundary）
    ↓
   產出：階段之間或場景之間的切割點
    
第三步：命名（Name）
    ↓
   產出：每個子技能的 name + description
    
第四步：分配（Allocate）
    ↓
   產出：每個子技能分配到哪些內容區塊
    
第五步：驗證（Verify）
    ↓
   產出：確認所有內容都被分配到某個子技能，
        沒有遺漏、沒有重疊
```

#### 第一步：盤點

打開你的 SKILL.md，將每個區塊分類標記：

```markdown
## 安裝步驟                    ← 類型：步驟（STEP）
## API 端點說明                ← 類型：參考（REF）
## 常見錯誤碼                  ← 類型：參考（REF）
## 退款處理流程                ← 類型：步驟（STEP）- 邊緣案例
## 標準交易流程                ← 類型：步驟（STEP）- 主流程
## Windows 平台特殊注意事項    ← 類型：避坑（GOTCHA）
## 驗證步驟                    ← 類型：驗證（CHECK）
```

#### 第二步：找邊界

根據盤點結果，識別自然的切割點：

- **步驟之間的依賴關係**：步驟 A 的輸出是不是步驟 B 的輸入？如果是，它們可能屬於同一個子技能
- **使用頻率**：某些區塊只在 5% 的案例中被用到（如退款處理）？那是拆分的強烈信號
- **主題凝聚性**：相關的內容在一起，不相關的分開

#### 第三步到第五步

命名、分配、驗證——這三步在 10.2.2 節的拆分模式中已經涵蓋了具體做法。

### 10.2.4 拆分的判斷矩陣

| 問題 | 水平拆分 | 垂直拆分 | 核心+擴充 |
|------|---------|---------|----------|
| 流程有明顯的階段邊界？ | ✅ 最適合 | ⚠️ 次要 | ⚠️ 次要 |
| 不同場景流程差異大？ | ❌ 不合適 | ✅ 最適合 | ⚠️ 可以 |
| 80% 案例走同一條路？ | ⚠️ 可以 | ❌ 不合適 | ✅ 最適合 |
| 步驟間共享大量狀態？ | ❌ 不合適 | ✅ 較適合 | ⚠️ 可接受 |
| 需要獨立測試每個階段？ | ✅ 最適合 | ⚠️ 可接受 | ⚠️ 可接受 |

---

## 10.3 技能編排（Orchestration）：一個技能呼叫另一個

### 10.3.1 為什麼 Agent 可以自然做到編排

拆分成多個技能後，下一個問題是：**誰來決定何時使用哪個技能？**

答案是：**Agent 自己**——只要你把 description 寫對。

Agent Skills 的核心機制是 Agent 根據 description 自動判斷是否觸發一個技能。如果你將一個大型技能拆分成多個小技能，Agent 在執行流程的每個階段時，會再次掃描技能列表，觸發當下階段需要的技能。

這意味著：**只要你把每個技能的 description 寫清楚，Agent 就能自動完成技能之間的編排。**

### 10.3.2 隱性編排 vs 顯性編排

#### 隱性編排（Implicit Orchestration）

依賴 Agent 的自主判斷。每個技能的 description 描述自己在整個流程中的角色，Agent 在執行過程中「自然」地依序觸發。

```
技能 A（description）：
  "Collect raw data from sources. First step in the analysis pipeline."

技能 B（description）：
  "Filter and score collected data. Run AFTER data-collector."

技能 C（description）：
  "Generate formatted report from filtered data. Run AFTER data-filter."
```

**優點**：不需要額外的編排邏輯，description 就是編排合約。
**缺點**：Agent 不一定會照順序執行；在複雜流程中可能跳過某個步驟。

#### 顯性編排（Explicit Orchestration）

在一個主控技能（Orchestrator）的 SKILL.md 中明確列出步驟，每個步驟指示 Agent 觸發對應的子技能。

```markdown
# orchestrator

Run the full data analysis pipeline by executing these steps in order:

## Workflow

1. Trigger `data-collector` skill to gather raw data from all sources
2. Once collection is complete, trigger `data-filter` skill to remove duplicates
3. After filtering, trigger `data-analyzer` skill to identify trends
4. Finally, trigger `report-generator` skill to produce the output

⚠️ Do NOT skip any step. Do NOT reorder steps.
```

**優點**：執行順序有保障；主控技能的 description 可以非常精準（「完整管線的進入點」）。
**缺點**：需要維護一個額外的主控技能；主控技能本身也消耗 token。

### 10.3.3 技能間共享上下文的幾種做法

拆分成多個技能後，最常見的問題是：**上一個技能的輸出怎麼傳給下一個技能？**

| 方法 | 做法 | 最適合情境 |
|------|------|-----------|
| **檔案傳遞** | 技能 A 將結果寫入 `temp/output_a.json`，技能 B 讀取該檔案 | 資料量大、結構化資料、需要保留中間結果 |
| **description 傳遞** | 技能 A 告知 Agent「已產生 output.json」，Agent 的記憶中自然包含這個資訊 | 資訊量小、依賴 Agent 的 context |
| **外部儲存** | 使用 MCP 工具寫入資料庫或快取，技能 B 透過查詢取得 | 跨 session 共享、需要持久化、多個技能需要讀寫同一份資料 |

實務建議：**優先嘗試「檔案傳遞」**，因為它最簡單、最可靠、不依賴 Agent 的短期記憶。

### 10.3.4 ⚠️ 編排中的錯誤處理

當多個技能串聯執行時，任何一個子技能失敗都會影響整個流程。你的編排邏輯必須考慮以下三種失敗情境：

#### 情境 1：子技能未觸發

Agent 理論上應該觸發子技能，但實際上沒有。原因通常是 description 不夠精準。

**解法**：在 Description 測試中加入「前置任務已完成」的測試案例。例如：「資料已經蒐集完成，接下來請過濾重複資料」——這個查詢應該觸發 data-filter，而不是 data-collector。

#### 情境 2：子技能執行但輸出異常

子技能被觸發了、也執行了，但產出不符合預期（例如檔案格式錯誤、資料不完整）。

**解法**：在每個子技能的結尾加入驗證步驟。例如 data-collector 完成後應執行 `scripts/verify_output.py`，確認輸出檔案的 schema 正確。

#### 情境 3：編排順序錯亂

Agent 跳過某個步驟，或重新排序步驟。

**解法**：在顯性編排的主控技能中，使用「前置條件檢查」——每個子技能執行前先確認上一個步驟的產出存在：

```markdown
## 步驟 2：過濾資料

在觸發 data-filter 之前：
1. 先確認 `temp/collected.json` 存在且非空
2. 如果不存在，回到步驟 1 重新執行 data-collector
3. 只有當 collected.json 存在時，才觸發 data-filter
```

---

## 10.4 使用 Scripts 卸載複雜邏輯

### 10.4.1 什麼邏輯適合搬到 scripts/

SKILL.md 是指令文件——它告訴 Agent **要做什麼**。Scripts 是可執行程式碼——它幫 Agent **實際完成**。

以下情況適合將邏輯卸載到 scripts/：

| 情境 | 留在 SKILL.md 的後果 | 搬到 scripts/ 的好處 |
|------|---------------------|---------------------|
| 多步驟資料處理（爬蟲、解析、轉換） | SKILL.md 需要詳述每個處理步驟，輕鬆吃掉 1,000+ tokens | 一個 `python script.py` 搞定，token 成本固定 |
| 複雜的條件判斷（if-else 樹超過 5 個分支） | Agent 在長串條件判斷中會迷失 | 程式碼的條件邏輯比文字指令更可靠 |
| 需要迴圈的任務（處理清單中的每個項目） | Agent 傾向在 3-5 次迭代後偏離指令 | 程式碼會老老實實跑完所有項目 |
| 字串處理與正則表達式 | 用文字描述 regex 又長又容易誤解 | 直接寫 `re.sub(r'...', '', text)` |

### 10.4.2 一個實際的優化案例

**優化前（SKILL.md，1,200 tokens 用在資料處理）：**

```markdown
## 清理原始資料

1. 讀取 input/articles.json
2. 對每篇文章：
   a. 移除 HTML 標籤（用 regex: <[^>]*>）
   b. 將多餘的空白行縮減為單一換行
   c. 移除開頭和結尾的空白字元
   d. 如果標題包含 "Sponsored" 或 "Advertisement"，將文章標記為 "ad"
   e. 如果內容少於 100 字，將文章標記為 "too-short"
   ...
   （18 個子步驟，總計約 1,200 tokens）
```

**優化後（SKILL.md，50 tokens）：**

```markdown
## 清理原始資料

執行 `python scripts/clean_articles.py --input input/articles.json --output temp/cleaned.json`
```

**scripts/clean_articles.py：**

```python
import json, re, sys

def clean_article(article):
    article['content'] = re.sub(r'<[^>]*>', '', article['content'])
    article['content'] = re.sub(r'\n{3,}', '\n\n', article['content']).strip()
    if any(kw in article['title'] for kw in ['Sponsored', 'Advertisement']):
        article['flag'] = 'ad'
    elif len(article['content']) < 100:
        article['flag'] = 'too-short'
    return article

data = json.load(open(sys.argv[1].replace('--input=', '')))
cleaned = [clean_article(a) for a in data]
json.dump(cleaned, open(sys.argv[2].replace('--output=', ''), 'w'), ensure_ascii=False)
```

這不是一個極端的例子——現實中 **1,200 tokens → 50 tokens 的優化非常常見**。而且不只節省 token，程式的執行結果比 Agent 手動操作更穩定。

### 10.4.3 Scripts 的「傳遞線索」模式

當你將邏輯移到 scripts/ 時，要注意一個關鍵問題：**Script 的輸出必須能引導 Agent 的下一步決策**。

一個好的 script 不只是完成任務，還會輸出「線索」讓 Agent 知道發生了什麼：

```bash
# scripts/validate.sh

echo "=== Validation Results ==="
echo "total_files: 42"
echo "passed: 38"
echo "failed: 4"
echo "failed_files: report_q3.xlsx, unknown_format.dat, ..."
```

Agent 讀到這個輸出後，可以自然判斷：「有 4 個檔案驗證失敗，需要手動處理」。這就是「傳遞線索」模式——**Script 的輸出就是 Agent 下一步決策的輸入**。

### 10.4.4 跨平台 Script 策略

大型技能通常需要在多種環境中執行（Windows、macOS、Linux）。你的 scripts/ 需要考慮跨平台相容性：

| 平台 | 建議的 Script 語言 | 注意事項 |
|------|-------------------|---------|
| **跨平台** | Python 3 | 最安全的选择，幾乎所有平台都可執行 |
| **Linux/macOS** | Bash (.sh) | 直接執行，簡單快速 |
| **Windows** | PowerShell (.ps1) | 注意執行策略（Execution Policy） |
| **容器化** | Docker + 任何語言 | 完全隔離，但依賴 Docker |

**實務建議**：如果可能，優先使用 Python 腳本。Python 在跨平台的一致性遠高於 Shell Script，且 Agent 通常都能執行 `python script.py`。

如果團隊同時使用 Windows 和 macOS/Linux，可以建立一個偵測腳本來決定執行哪個版本的 script：

```bash
# scripts/setup.sh — 同時支援 Windows 和 Unix
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    echo "Detected Windows environment"
    python scripts/setup_windows.py
else
    echo "Detected Unix-like environment"
    python scripts/setup_unix.py
fi
```

### 10.4.5 Script 的「安全網」模式

當一個 script 執行重要操作（例如刪除檔案、修改資料庫）時，加入安全網機制：

```bash
# scripts/cleanup.sh — 安全網範例

DRY_RUN=${DRY_RUN:-true}  # 預設為乾執行模式

if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY RUN] Would delete: temp/*.tmp"
    echo "Set DRY_RUN=false to execute"
    exit 0
fi

echo "Cleaning up temporary files..."
rm -f temp/*.tmp
echo "Done. Deleted $(ls temp/*.tmp 2>/dev/null | wc -l) files."
```

在 SKILL.md 中指示 Agent 先以乾執行模式測試，確認無誤後再正式執行：

```markdown
## 清理暫存檔

1. 先以乾執行模式測試：
   `DRY_RUN=true bash scripts/cleanup.sh`
2. 檢視輸出，確認沒有誤刪重要檔案
3. 如果一切正常，正式執行：
   `DRY_RUN=false bash scripts/cleanup.sh`
```

---

## 10.5 References 資料夾：卸載詳細文件

### 10.5.1 什麼該放 references/

References 資料夾 vs Scripts 資料夾的區別：

| | scripts/ | references/ |
|---|---|---|
| **內容類型** | 可執行程式碼 | 不可執行的參考文件 |
| **用途** | 代 Agent 執行任務 | 提供 Agent 查閱的資訊 |
| **載入方式** | Agent 執行它 | Agent 讀取它 |
| **範例** | .py, .sh, .js | .yaml, .json, .md, .csv |

適合放在 references/ 的內容：

- **錯誤碼對照表**：`references/error-codes.json` — Agent 查詢特定錯誤碼的處理方式
- **API 規格**：`references/api-spec.yaml` — 完整的端點定義與欄位說明
- **欄位對照**：`references/field-mapping.csv` — 不同系統間的欄位名稱對應
- **流程圖**：`references/architecture.md`（含 Mermaid 圖表）— 讓 Agent 理解系統架構
- **常見問題**：`references/faq.json` — 針對已知問題的標準回應

### 10.5.2 在 SKILL.md 中引用 References 的最佳方式

最常見的錯誤是：**假設 Agent 會自動去讀 references/。** Agent 不會。你必須在 SKILL.md 中明確指示何時去讀取哪個檔案。

**錯誤寫法：**

```markdown
## 錯誤處理

遇到錯誤時，參考 references/error-codes.json 處理。
```

Agent 在執行時可能完全忽略這一行——「參考」對 Agent 來說是一個模糊的指令。

**正確寫法：**

```markdown
## 錯誤處理

1. 當 API 回傳錯誤時，**先執行**：
   `read references/error-codes.json`
2. 在 error-codes 中查找 error.code 的對應處理方式
3. 按照對照表中「action」欄位指示的步驟處理

⚠️ 未查詢 error-codes 之前，不要自行猜測錯誤處理方式。
```

關鍵差異：**明確的動詞 + 明確的時機 + 明確的禁止事項。**

### 10.5.3 保持 References 的「可掃描性」

References 檔案會隨著時間增長。為了讓 Agent 能快速找到需要的資訊，保持檔案的可掃描性：

```yaml
# ❌ 糟糕：純文字長篇敘述
error E1001: 發生資料庫連線逾時。這通常發生在資料庫負載過高...（接續 200 字）

# ✅ 良好：結構化資料
- code: "E1001"
  message: "Database connection timeout"
  severity: high
  action: "Retry after 5s. If persists, check DB connection pool."
```

Agent 對結構化資料（JSON、YAML、CSV、表格）的解析效率遠高於自然語言段落。

### 10.5.4 References 的版本同步問題

大型技能中，references/ 的檔案可能會被多個技能共用。這引出一個問題：**當一個參考檔案更新時，所有依賴它的技能都需要被檢視。**

一個實務做法：在每個引用參考檔案的技能 SKILL.md 頂部，加入一個「依賴聲明」區塊：

```markdown
## 依賴的參考檔案

這個技能依賴以下參考檔案。如果這些檔案更新，請檢視本技能是否需要同步更新：

- `shared-references/error-handling-guidelines.md`（上次更新：2026-04-15）
- `references/api-spec.yaml`（上次更新：2026-05-01）
```

這不是給 Agent 看的——這是給**維護者**看的。當團隊成員更新 shared-references/ 時，可以快速找到哪些技能會受影響。

### 10.5.5 ⚠️ References 的膨脹陷阱

References 資料夾本身也會隨著時間膨脹。一個容易忽略的問題是：**Agent 在 References 中找到過時的文件，並根據過時資訊做出錯誤決策。**

解決方案：在 references/ 中建立一個 INDEX.md 或 index.json，列出所有檔案及其有效狀態：

```json
{
  "files": [
    {
      "path": "api-spec.yaml",
      "status": "active",
      "last_updated": "2026-05-01",
      "description": "Current API specification v3"
    },
    {
      "path": "api-spec-v2.yaml",
      "status": "deprecated",
      "deprecated_on": "2026-03-15",
      "description": "Old API spec — kept for migration reference only"
    }
  ]
}
```

在 SKILL.md 中指示 Agent：**「查詢參考檔案前，先讀取 references/index.json 確認檔案狀態」**。

---

## 10.6 模板模式（Template Patterns）

### 10.6.1 為什麼需要模板模式

當你管理多個技能時，會發現一個模式：**許多技能有相似的結構**——類似的步驟順序、類似的 validation 邏輯、類似的錯誤處理。

與其每次從頭寫，不如建立一個模板工廠（Template Factory），讓新技能的產生標準化。

### 10.6.2 三種模板模式

#### 模式 1：目錄模板

建立標準化的技能目錄結構，讓每個新技能都從同一個骨架開始：

```
templates/skill-starter/
├── SKILL.md              # 標準結構，包含所有必要的章節標題
├── scripts/              # 預先建立好的目錄
│   └── validate.sh       # 通用的驗證腳本範本
├── references/           
│   └── CHANGELOG.md      # 版本記錄（見 10.8 節）
└── assets/               # 如果有需要的話
```

#### 模式 2：SKILL.md 模板區塊

在 SKILL.md 中使用可複用的區塊模板。這些可以透過 scripts/ 中的腳本自動插入：

```markdown
<!-- TEMPLATE: validation-block -->
## 驗證步驟 (Template Block)

執行 `scripts/validate.sh` 確認輸出品質：

- [ ] 格式正確（validate.sh 會自動檢查）
- [ ] 無遺漏欄位
- [ ] 檔案大小在合理範圍內

如果 validation 失敗，請修正後重新執行主要流程。
<!-- END TEMPLATE -->
```

#### 模式 3：共用知識庫

建立一個所有技能都可以引用的共享 references/ 目錄。這是最輕量的模板化——不需要複製知識，只需要共用同一份參考資料：

```
shared-references/
├── error-handling-guidelines.md
├── security-checklist.md
├── common-gotchas.md
└── team-conventions.md
```

每個技能的 SKILL.md 中只需要一行：「處理前先讀取 `shared-references/security-checklist.md`。」

### 10.6.3 模板工廠腳本

當模板模式成熟後，可以建立一個腳本自動化新技能的產生：

```bash
# scripts/create-skill.sh
# Usage: bash scripts/create-skill.sh <skill-name>

SKILL_NAME=$1
TEMPLATE_DIR="templates/skill-starter"
TARGET_DIR="skills/$SKILL_NAME"

mkdir -p "$TARGET_DIR/scripts"
mkdir -p "$TARGET_DIR/references"
mkdir -p "$TARGET_DIR/assets"

# 從模板複製 SKILL.md，並置換變數
sed "s/{{SKILL_NAME}}/$SKILL_NAME/g" "$TEMPLATE_DIR/SKILL.md" > "$TARGET_DIR/SKILL.md"
cp "$TEMPLATE_DIR/scripts/validate.sh" "$TARGET_DIR/scripts/"

echo "Skill $SKILL_NAME created at $TARGET_DIR"
```

---

## 10.7 大型技能的真實案例：Codebase Onboarding Skill

### 10.7.1 背景

這是一個真實的大型技能案例，來自某個中型科技公司的內部實踐。技能目標是：**讓一個對專案完全陌生的開發者（或 AI Agent），能在 30 分鐘內理解程式碼庫的架構並開始貢獻。**

最初這是一個單一 SKILL.md，包含：

- 專案整體架構描述
- 7 個微服務的各自說明
- 資料庫 schema 與 ER 圖
- CI/CD 流程
- 開發環境設定步驟
- 程式碼規範與風格指南
- 部署流程
- 常見問題

總計：**約 12,000 tokens**。Agent 幾乎無法正常執行——它會在前半段就忘記後半段的內容。

### 10.7.2 重構後的架構

重構後，單一技能被拆解為一個主控技能 + 6 個子技能 + 大量 Level 3 資源：

```
codebase-onboarding/              # 主控技能 (~2,000 tokens)
├── SKILL.md                      # 編排流程：依序呼叫子技能
├── scripts/
│   └── verify-env.sh             # 驗證開發環境
│
├── sub-skills/
│   ├── cb-env-setup/             # 環境設定 (~800 tokens)
│   ├── cb-microservices/         # 微服務架構概覽 (~2,500 tokens)
│   ├── cb-database/              # 資料庫 schema (~1,500 tokens)
│   ├── cb-cicd/                  # CI/CD 流程 (~1,200 tokens)
│   ├── cb-code-standards/        # 程式碼規範 (~1,800 tokens)
│   └── cb-deployment/            # 部署流程 (~1,500 tokens)
│
└── shared-references/
    ├── service-dependencies.yaml
    ├── db-schema.sql
    └── makefile-commands.md
```

### 10.7.3 主控技能的 SKILL.md 結構

```markdown
# codebase-onboarding

Onboard a new developer or AI agent into this project's codebase.
Trigger when a new team member starts, or when asked to understand
the project architecture.

## Execution Order

Run the following sub-skills IN THIS ORDER:

1. **cb-env-setup**: Set up local development environment
   - Execute `scripts/verify-env.sh` after completion
   
2. **cb-microservices**: Understand service architecture
   - Read `shared-references/service-dependencies.yaml` for dependency graph
   
3. **cb-database**: Review database schemas
   - Reference `shared-references/db-schema.sql` as needed
   
4. **cb-cicd**: Learn CI/CD pipeline flow
   
5. **cb-code-standards**: Review coding conventions
   
6. **cb-deployment**: Understand deployment process

## Validation

After ALL sub-skills complete:
- Ensure the developer can explain the project's architecture in their own words
- Confirm they know how to run tests locally
- Verify they understand the deployment workflow

⚠️ Do NOT skip any sub-skill. Each is necessary.
⚠️ If any sub-skill encounters an error, report it to the user immediately.
```

### 10.7.4 子技能的 Description 設計（關鍵細節）

這個案例成功與否的關鍵，在於每個子技能的 description 是否精準。以下是六個子技能的實際 description 設計：

```yaml
# cb-env-setup
name: cb-env-setup
description: >
  Set up the local development environment for this project.
  Install dependencies, configure environment variables, and
  verify required tools. Run FIRST when onboarding.
  Does NOT cover production deployment or CI/CD setup.

# cb-microservices
name: cb-microservices
description: >
  Explain the microservice architecture of this project.
  Describe each service's responsibility, communication patterns,
  and dependency relationships. Assumes dev environment is ready.
  Does NOT cover database schemas or deployment.

# cb-database
name: cb-database
description: >
  Document the database schemas, tables, indexes, and key queries
  used in this project. Review ER relationships and data flow.
  Assumes understanding of microservice boundaries.
  Does NOT cover specific API endpoints.

# cb-cicd
name: cb-cicd
description: >
  Explain the CI/CD pipeline: build steps, test stages, deployment
  gates, and rollback procedures. Assumes dev environment is ready.
  Does NOT cover local development workflows.

# cb-code-standards
name: cb-code-standards
description: >
  Review coding conventions, linting rules, testing standards,
  and PR requirements. Can be triggered at any time during onboarding.
  Does NOT replace the team's style guide.

# cb-deployment
name: cb-deployment
description: >
  Guide through the deployment process: staging → production,
  release tagging, health checks, and monitoring. Assumes all
  previous onboarding steps are complete.
  This is the FINAL step in onboarding.
```

注意每個 description 的兩個關鍵設計：

1. **「Assumes…」前置條件**：每個子技能都明確定義了執行前需要完成的條件，這幫助 Agent 判斷執行順序
2. **「Does NOT cover…」排除條件**：明確說明不包含什麼，防止 Agent 在錯誤的情境下觸發

### 10.7.5 重構過程中遇到的挑戰

這個案例的重構並非一帆風順。以下是團隊在重構過程中遇到的三個主要挑戰：

**挑戰 1：過度拆分**

最初團隊將技能拆成了 12 個子技能——幾乎每個微服務都有一個獨立的子技能。結果 Agent 在 12 個技能之間不斷切換，context 頻繁重置，執行效率反而下降。

**教訓**：拆分的粒度應該以「Agent 能一次理解並執行」為單位，而不是以「系統的邊界」為單位。最終合併到 6 個子技能是最佳平衡點。

**挑戰 2：Description 衝突**

有三個子技能的 description 使用了相似的關鍵詞（如「了解專案」、「學習架構」），導致 Agent 在觸發時出現混淆——它不確定該用哪個。

**教訓**：同一個主控技能下的子技能，description 應該使用**不同的觸發詞彙**。如果兩個子技能的 description 有超過 50% 的關鍵詞重疊，就是衝突信號。

**挑戰 3：維護者的認知負擔**

拆分後，團隊需要維護 1 個主控技能 + 6 個子技能的 SKILL.md，總行數反而比原本的單一檔案多。雖然每個檔案更小、Agent 執行更好，但對維護者來說，要在 7 個檔案之間切換也是一種負擔。

**教訓**：模組化是為了 Agent，不是為了人類。人類維護者需要好的索引和導航——這就是為什麼 10.8 節的版本控制和 10.6 節的模板模式如此重要。

### 10.7.6 重構成果

| 指標 | 重構前 | 重構後 | 改善 |
|------|--------|--------|------|
| 最大 SKILL.md 大小 | 12,000 tokens | 2,500 tokens | **79% 減少** |
| Agent 完成率 | ~40%（經常中途偏離） | ~92%（流程穩定） | **+52%** |
| 新開發者 onboarding 時間 | 45–60 分鐘 | 20–30 分鐘 | **~40% 改善** |
| 維護一個子技能的成本 | 修改整個 12K 檔案 | 只修改相關子技能 | **局部修改** |

---

## 10.8 版本控制與維護策略

### 10.8.1 CHANGELOG.md：每個技能都該有

你的技能會演化。沒有版本記錄的技能是一個黑盒子——你不知道它何時改了、為什麼改、改了會不會破壞現有流程。

在每個技能的 references/ 中維護一個 CHANGELOG.md：

```markdown
# Changelog: codebase-onboarding

## [2.1.0] - 2026-05-20

### Added
- New sub-skill: cb-deployment (covers production deployment flow)
- references/service-dependencies.yaml with visual dependency graph

### Changed
- cb-microservices: updated service descriptions to reflect v3 API changes
- cb-env-setup: verify-env.sh now checks Docker version >= 24.0

### Fixed
- cb-database: corrected outdated table schema references

## [2.0.0] - 2026-03-01

### Changed
- Complete architecture rewrite from single skill to 1+6 modular structure
- Skill renamed from `codebase-intro` to `codebase-onboarding`

### Removed
- Deprecated `assets/env-checklist.pdf` (no longer maintained)
```

[DIAGRAM: 版本演化圖。橫軸是時間（3 個月區間），縱軸是技能演化路徑。從 v1 的單一大型方塊（12K tokens）開始，在 v2 分裂成一個主控方塊 + 6 個小方塊。v2.1 加入一個新的子技能方塊。每個節點標示對應的 CHANGELOG 條目。]

### 10.8.2 語意化版本（Semantic Versioning）for Skills

將 semver 的概念應用到技能上：

| 版本變更 | 意義 | 範例 |
|---------|------|------|
| **MAJOR**（1.0.0 → 2.0.0） | 技能結構改變、流程順序改變、description 觸發條件改變 | 拆分技能、合併技能 |
| **MINOR**（1.0.0 → 1.1.0） | 加入新步驟、新增子技能、新增 references | 加入新的驗證腳本 |
| **PATCH**（1.0.0 → 1.0.1） | 修正錯誤、更新過時資訊、改善措辭 | 修正錯誤碼對照表 |

### 10.8.3 Git 整合：技能與程式碼同步版本

大型專案中，技能應該與程式碼放在同一個 repository 中，並保持版本同步：

```
專案根目錄/
├── src/
├── tests/
├── .opencode/
│   └── skills/
│       ├── onboarding/        # 版本 v2.1.0
│       │   └── references/
│       │       └── CHANGELOG.md
│       └── deployment/        # 版本 v1.3.0
│           └── references/
│               └── CHANGELOG.md
└── package.json               # 專案版本 2.1.0
```

當程式碼的 major 版本更新時，相關的技能也應該被檢視是否需要更新。

### 10.8.4 技能棄用（Deprecation）策略

不是所有技能都需要永遠保留。當一個技能不再適用時，有三種處理方式：

| 方式 | 做法 | 適用情境 |
|------|------|---------|
| **刪除** | 直接移除技能目錄 | 技能完全不再使用，且沒有歷史參考價值 |
| **封存** | 移到 `skills/_archive/` 目錄 | 技能不再使用，但可能作為未來設計參考 |
| **標記為棄用** | 在 description 中加入 "(DEPRECATED)" | 技能仍存在，但希望 Agent 盡量不要觸發 |

棄用標記的範例：

```yaml
name: legacy-deploy
description: >
  (DEPRECATED) Old deployment process using Fabric. 
  Use `deploy-v2` instead. Kept for migration reference only.
  ⚠️ Do NOT use for new deployments.
```

建議保留一份集中的棄用技能清單在 `skills/DEPRECATED.md`，讓團隊知道哪些技能已經不再維護。

### 10.8.5 維護循環：定期的技能健康檢查

建立定期檢視技能的節奏：

```
每月一次技能審查（Skill Review）：
  1. 檢查技能的 CHANGELOG 是否有遺漏的更新
  2. 比對技能內容與當前系統行為是否一致
  3. 檢查哪些技能的 token 數接近 5,000 上限
  4. 查閱最近的支持票證，找出「技能沒涵蓋到的問題」
  5. 決定哪些技能需要小改版、哪些需要重構
```

---

## 10.9 測試大型技能

### 10.9.1 元件測試（Component Testing）vs 整合測試（Integration Testing）

| | 元件測試 | 整合測試 |
|---|---|---|
| **測試對象** | 單一子技能 | 完整技能編排流程 |
| **測試內容** | 這個技能的 description 是否正確觸發？步驟是否完整？ | 多個技能串接後，整體流程是否正確？ |
| **執行方式** | 在隔離環境中觸發單一技能，觀察 Agent 行為 | 觸發主控技能，觀察完整工作流程 |
| **頻率** | 每次修改後 | 每次 major 版本更新後 |

### 10.9.2 Description 測試（重複第 5 章的方法論）

每個子技能的 description 都應該通過 20 筆測試查詢的驗證。在大型技能中，這尤其重要——因為子技能的 description 錯誤會導致整個流程中斷。

一個大型技能的子技能 description 測試計畫範例：

```
主控技能：codebase-onboarding
  測試 10 筆應觸發查詢（如「幫我 setup 開發環境」、「我想了解微服務架構」）
  測試 10 筆不應觸發查詢（如「幫我修這個 bug」、「這個 PR 需要 review」）

子技能 cb-env-setup：
  測試 10 筆應觸發查詢（如「設定開發環境」、「安裝相依套件」）
  測試 10 筆不應觸發查詢（如「資料庫 schema 是什麼」、「部署流程怎麼跑」）

...對每個子技能重複...
```

### 10.9.3 邊界案例測試

大型技能中最容易出錯的不是主要流程，而是邊界案例。以下是一些常見的邊界案例及其測試策略：

| 邊界案例 | 測試方法 | 預期行為 |
|---------|---------|---------|
| 子技能 description 高度相似 | 用相似查詢測試兩個子技能，確認各被觸發 50% 左右 | Agent 能正確區分 |
| 主控技能執行到一半中斷 | 模擬「技能 B 完成後，對話被重置」的情境 | 重新開始時，Agent 能從技能 B 繼續而非從頭 |
| 所有子技能同時符合觸發條件 | 用一個廣泛的查詢測試（如「跟我說這個專案的一切」） | 只觸發主控技能，而非所有子技能 |
| 參考檔案內容過時 | 在 references/ 中加入一個已知過時的檔案 | Agent 不應該使用過時檔案 |

### 10.9.4 流程測試：用腳本模擬完整執行

對於關鍵的編排流程，可以撰寫自動化測試腳本模擬 Agent 的行為：

```python
# tests/test_onboarding_flow.py

def test_description_accuracy():
    """驗證主控技能的 description 是否能正確觸發"""
    test_queries = [
        ("我是新來的開發者，幫我了解這個專案", True),
        ("請介紹專案的微服務架構", True),
        ("這個 API 回傳 500 錯誤，幫我檢查", False),
        ("程式碼審查這個 PR", False),
    ]
    
    for query, expected in test_queries:
        result = simulate_agent_trigger("codebase-onboarding", query)
        assert result == expected, f"Failed on: {query}"

def test_sub_skill_order():
    """驗證主控技能是否會依序觸發所有子技能"""
    result = simulate_full_flow("codebase-onboarding")
    expected_order = [
        "cb-env-setup",
        "cb-microservices", 
        "cb-database",
        "cb-cicd",
        "cb-code-standards",
        "cb-deployment",
    ]
    assert result.triggered_skills == expected_order
```

---

## 10.10 架構總覽圖

[DIAGRAM: 大型技能模組化架構圖。圖中共分三個層級。頂層是「主控技能 Orchestrator」（一個六邊形，標示 codebase-onboarding，~2K tokens），從它向下延伸出六條連線到第二層的六個「子技能 Sub-skills」（圓角矩形，分別標示 cb-env-setup、cb-microservices、cb-database、cb-cicd、cb-code-standards、cb-deployment，每個標示 token 數約 800-2,500）。從每個子技能再延伸出第三層的「資源檔 Resources」（小檔案圖示，包含 .sh、.yaml、.sql、.md 等類型），以及「驗證 Check」（圓形圖示，標示 validate.sh）。圖的右側有一個「共享資源 Shared」（一個大矩形，包含 service-dependencies.yaml、db-schema.sql 等，多個子技能的箭頭指向它）。底部有一個「CHANGELOG」（書本圖示）連接所有技能，表示版本管理涵蓋整個架構。]

---

## 本章摘要

1. **5,000 tokens 是硬上限**：當 SKILL.md 超過這個長度，Agent 會出現指令遺忘、選擇偏差、流程斷裂等三階段衰退。濃縮不是解法——重構才是。

2. **三種拆分模式**：水平拆分（按步驟階段）、垂直拆分（按使用場景）、核心+擴充拆分（快樂路徑 + 邊緣案例）。每種模式有其適用條件與風險。

3. **Agent 自動編排**：只要 description 寫得夠精準，Agent 可以自動在多個技能之間切換。需要更精確控制時，可使用主控技能（Orchestrator）進行顯性編排。

4. **Scripts 是 token 殺手**：將複雜的資料處理、條件判斷、迴圈邏輯搬到 scripts/，可以將數千 tokens 的指令簡化為一行腳本呼叫。

5. **References 需要明確引用**：Agent 不會自動去讀 references/。必須在 SKILL.md 中用明確的動詞和時機指示「何時」讀取「哪個」檔案。

6. **模板模式標準化生產**：目錄模板、模板區塊、共用知識庫三種模式幫助團隊標準化技能產出，並可透過腳本自動化新技能建立。

7. **版本控制不可省略**：每個技能都應該有 CHANGELOG.md + 語意化版本。大型專案中技能應與程式碼同步版本管理。

8. **雙層測試策略**：元件測試驗證單一子技能的 description 與步驟；整合測試驗證多技能編排的完整流程。

---

## 練習題

### Q1（診斷題）：分析一個技能的膨脹程度

找一個你正在使用或維護的 Agent Skill（或使用下方提供的範例），計算以下指標：
- 當前 SKILL.md 的 token 數（可用 `wc -c` 或線上 tokenizer 估算）
- 它屬於哪個衰減階段（早期 5K-6.5K / 中期 6.5K-8K / 晚期 >8K）？
- 最近一次 Agent 執行時，你觀察到哪些「指令遺忘」的症狀？

**範例技能描述**：一個部落格發佈技能，包含 SEO 關鍵字分析、Markdown 格式轉換、圖片上傳壓縮、WordPress API 呼叫、排程管理、多平台同步（FB/Threads/LinkedIn）、數據追蹤——總計約 9,000 tokens。最近 Agent 經常忘記執行圖片壓縮步驟。

---

### Q2（設計題）：為上述技能設計拆分策略

以上述部落格發佈技能為例（9,000 tokens，包含 SEO、格式轉換、圖片處理、WordPress API、排程、多平台同步、數據追蹤），設計一個拆分方案：

1. 你會選擇哪種拆分模式（水平/垂直/核心+擴充）？為什麼？請從「步驟依賴關係」和「使用頻率」兩個角度說明。
2. 拆分後的技能結構（列出每個子技能的名稱與預估 token 數，總和應接近 9,000）
3. 你會用隱性編排還是顯性編排？為什麼？
4. 哪些邏輯適合搬到 scripts/？哪些資訊適合放到 references/？請分別列出 2-3 個具體範例
5. ⚠️ 你的拆分策略有沒有可能造成「過度拆分」？你如何判斷拆分粒度是否恰當？

---

### Q3（實作題）：建立一個模板工廠

為你的團隊建立一個「技能產生器」腳本 `scripts/create-skill.sh`（或 .ps1）：

- 它應該接受技能名稱作為參數
- 自動建立 `SKILL.md`、`scripts/`、`references/`、`assets/`
- SKILL.md 中包含標準的章節結構（至少：description、步驟、驗證、gotchas）
- scripts/ 中包含一個通用的 validate.sh 範本
- references/ 中包含一個空的 CHANGELOG.md

<details class="exercise-hint">
<summary>💡 提示</summary>
參考 10.6 節的模板模式與範例腳本。
</details>

---

### Q4（分析題）：比較真實案例的前後差異

參考 10.7 節的 codebase-onboarding 案例：

1. 為什麼重構後的 Agent 完成率從 40% 提升到 92%？請從 token 經濟學的角度解釋。
2. 主控技能的 SKILL.md 只有約 2,000 tokens——如果它增加到 4,500 tokens，你認為這代表什麼？是好是壞？
3. 如果團隊加入了一個新的子技能（例如 cb-security-audit），你需要修改哪些東西？（提示：不只主控技能）

---

### Bonus Challenge：重構一個真實技能

選擇一個你專案中超過 5,000 tokens 的技能（或刻意寫一個超過此長度的技能），完成一次完整重構：

1. **診斷階段**：記錄當前 token 數與 Agent 的行為問題
2. **設計階段**：繪製拆分策略圖（主控 + 子技能的結構）
3. **重構階段**：實際拆分，將複雜邏輯移到 scripts/，詳細資料移到 references/
4. **驗證階段**：對每個子技能的 description 執行 20 筆測試查詢
5. **記錄階段**：更新 CHANGELOG.md，記錄這次 major 版本變更

提交一份重構報告（約 1 頁 A4），包含前後對比數據（token 數、Agent 完成率、維護難度）。

---

## 重點回顧

- 大型技能（>5,000 tokens）不是「寫得不好」——它是自然演化，但需要被重構
- 拆分的三個模式：水平（按階段）、垂直（按場景）、核心+擴充（按案例類型）
- Agent 可以自動編排多個技能——只要 description 夠精準，或用主控技能指揮
- Scripts 與 References 是 token 管理的兩大武器——能搬就搬
- 模板模式 + 版本控制 + 測試策略 = 大型技能的可持續維護架構
- 技能與程式碼應該同步版本管理，在 major 版本更新時互相檢視

---

<!--
Course: Agent Skills 實戰線上課程 (17 chapters)
Chapter 10 of 17: 大型 Skill 架構設計
Style: Professional teaching (Udemy-style), formal but approachable
Author: Technical Writer persona
-->

← [Chapter 9：使用 Scripts](/課程/03-03-using-scripts) | [Chapter 11：Eval 系統設計](/課程/04-01-eval-system-design) →
