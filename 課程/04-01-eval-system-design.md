---
title: "Chapter 11：設計 Skill 評估系統"
description: "建立 Skill 品質評估系統 — 從觸發率、指令遵循度、輸出品質三個維度量測 Agent 的表現，設計評估資料集、評分 rubric 與回歸測試流程。"
outline: [2, 3]
---
# 第 11 章：設計 Skill 評估系統

> **「沒有測量，就沒有改善。」**  
> 這句 Peter Drucker 的管理名言，在 Agent Skills 的世界裡同樣成立。你花了好幾個小時寫了一份 SKILL.md，但你真的知道它好不好用嗎？Agent 執行的時候，每一步都走對了嗎？如果答案是「不確定」，那你需要一個評估系統。

---

## 學習目標

完成本章後，你將能夠：

1. **定義** Skill 品質的三個核心維度：觸發率、指令遵循度、輸出品質
2. **設計** 評估資料集（eval dataset），涵蓋代表性查詢、邊界案例與失敗情境
3. **實作** 觸發測試：用量化方式衡量 description 的有效性
4. **建構** 指令遵循度的驗證機制，確保 Agent 按順序執行步驟
5. **開發** 評分 rubric，包含量化指標與質化標準
6. **建立** 回歸測試流程，防止 Skill 更新後品質倒退

---

## 11.1 為什麼需要評估系統？—— 沒有測量，就無法改善

### 11.1.1 主觀感受 vs. 客觀數據

假設你寫了一份 Code Review Skill。你覺得它寫得很好——步驟清楚、範例完整、gotchas 也列了。你很有信心地把它放進專案。

然後呢？

Agent 真的照做了嗎？還是它看了你的 Skill，然後繼續用自己的方式做事？你的 Skill 讓 Agent 的輸出變好了，還是變差了？

沒有評估系統，你只能依賴**主觀感受**——而主觀感受是出了名的不可靠。

| 感覺 | 真相 |
|------|------|
| 「Agent 好像有照我的 Skill 做」 | 你只看到結果沒看到過程 |
| 「這個 Skill 應該沒問題」 | 你沒測過就不知道 |
| 「偶爾會出錯，但大致 OK」 | 你沒有數據知道「偶爾」是 5% 還是 50% |
| 「Description 夠清楚了」 | Agent 可能 80% 的時候根本沒觸發 |

### 11.1.2 評估系統的三個用途

一個完整的評估系統不只幫你「打分數」，它應該服務三個目的：

1. **診斷（Diagnosis）**：找出 Skill 的弱點——是觸發不夠？步驟不清？還是輸出格式不穩？
2. **迭代（Iteration）**：每次修改後，用同一套評估告訴你「改好了還是改壞了」
3. **護航（Regression Guard）**：防止「修了一個 bug，產生兩個 bug」的典型悲劇

> **⚠️ 關於評估的投入時機**：不建議在寫完第一版 SKILL.md 就立刻投入大量時間建評估系統。先手動測幾次、確認核心流程可行，再開始建評估。通常建議在 Skill 穩定使用一週後再補上正式評估。

---

## 11.2 Skill 品質的三個維度

要評估一個 Skill，你得先定義「什麼是好的 Skill」。我們從三個維度來拆解：

### 11.2.1 維度一：觸發率（Trigger Rate）

**定義**：當使用者提出一個應該由這個 Skill 處理的任務時，Agent 是否正確地觸發了這個 Skill？

這是所有維度中最基本的。**觸發都觸發不了，後面就不用談了。**

觸發率的計算方式：

```
Trigger Rate = 觸發次數 / 總測試次數
```

但這裡有個陷阱：**觸發率分兩種錯誤**。

- **False Negative（應該觸發但沒觸發）**：使用者問「幫我 review 這個 PR」，你的 Code Review Skill 沒被叫起來。這是**最致命的錯誤**——Skill 等於白寫。
- **False Positive（不該觸發卻觸發了）**：使用者問「幫我格式化這個檔案」，你的 Code Review Skill 跳出來說「我來 review」。這會讓使用者困惑，但至少你的 Skill 有機會被看見。

> **工程師的直覺**可能會覺得 false positive 比較糟（因為會干擾使用者），但在 Agent Skills 的生態中，**false negative 才是真正的殺手**。一個 Agent 傾向 under-trigger 的系統，false positive 有時反而是好事——至少 Agent 會去讀你的 SKILL.md。

### 11.2.2 維度二：指令遵循度（Instruction Compliance）

**定義**：當 Agent 觸發了 Skill 之後，它是否按照 SKILL.md 中的步驟順序、限制條件和規則來執行？

這是評估系統中最難量化的維度。Agent 可以「讀了你的 Skill，然後決定不照做」——這不是 bug，這是大型語言模型（LLM）的本質。

指令遵循度的常見違規模式：

| 違規類型 | 舉例 | 嚴重程度 |
|----------|------|----------|
| 跳過步驟 | Step 2（驗證輸入）直接跳過到 Step 4（執行） | 🔴 高 |
| 改變順序 | 先執行再檢查，而非先檢查再執行 | 🔴 高 |
| 忽略限制 | 「不要用 `rm -rf`」但還是用了 | 🔴 高（危險） |
| 修改指令參數 | 要求 timeout=5000，用了 timeout=30000 | 🟡 中 |
| 添加未授權步驟 | 自己在中途加了個發 Slack 通知的步驟 | 🟡 中 |
| 誤解條件判斷 | 把「如果檔案大於 100MB」解讀為「如果檔案大於 100KB」 | 🔴 高 |

### 11.2.3 維度三：輸出品質（Output Quality）

**定義**：Agent 執行這個 Skill 後的輸出，是否達到預期的品質標準？

輸出品質是最終使用者的體驗，也是最難自動化評估的維度。它包含了：

- **正確性**：結果是對的嗎？
- **完整性**：該做的都做了嗎？還是只做了一半？
- **格式一致性**：輸出格式是否與模板一致？
- **錯誤處理**：遇到異常情況時，Agent 是否適當處理？

> **⚠️ 輸出品質的評估方法**：完全自動化非常困難。一個務實的做法是：對可量化的部分（格式、完成與否）用自動化檢查，對質化部分（正確性、適切性）用人工抽樣評分。我們會在 11.6 詳細討論。

---

## 11.3 建立評估資料集

### 11.3.1 評估資料集是什麼？

評估資料集（eval dataset）是一組精心挑選的測試案例，用來衡量 Skill 的品質。它不是隨機選的，也不是你手邊正好有的案例——它是**刻意設計**的。

一個完整的 eval dataset 包含三種查詢類型：

| 類型 | 佔比 | 目的 | 範例 |
|------|------|------|------|
| **代表性查詢（Representative）** | 60% | 模擬真實使用情境 | 「幫我 review 這個 PR #42 的程式碼」 |
| **邊界案例（Edge Cases）** | 20% | 測試 Skill 的適用範圍邊界 | （檔案只有一行）「review 這個單行變更」 |
| **失敗情境（Failure Scenarios）** | 20% | 測試不該觸發時是否正確不觸發 | 「幫我煮一杯咖啡」 |

### 11.3.2 題庫設計——Train / Validation 分割

這個概念來自機器學習：你不能用同一組資料來「訓練」和「考試」。

對於 description 優化，我們需要：

- **Training Set（60%）**：用來迭代 description 的措辭，直到觸發率達標
- **Validation Set（40%）**：用來驗證 description 在未看過的查詢上是否仍然有效

之所以需要分割，是因為**過擬合（Overfitting）** 在 description 優化中非常常見——你的 description 可能精準匹配了那 10 題測試查詢，但換一批類似的查詢就失效了。

### 11.3.3 正負樣本的設計原則

一個好的 eval dataset 應該包含：

**正樣本（應觸發）**：
- 直接用 Skill 名稱的查詢：「執行 Code Review」
- 用同義詞的查詢：「幫我看一下這段程式的品質」
- 隱含需求的查詢：「這個 PR 有安全問題嗎？」
- 混合任務的查詢：「幫我 review 這個 PR，然後合併到 main」

**負樣本（不應觸發）**：
- 不相關的查詢：「幫我部署到 production」
- 相似但不同的查詢：「幫我 review 這份合約」（合約 ≠ 程式碼）
- 邊界混淆的查詢：「幫我看一下這段文字的文法」（文法檢查 ≠ code review）
- 明顯無關的查詢：「天氣怎麼樣？」

> **⚠️ 負樣本的數量**：一般建議負樣本和正樣本的比例在 1:1 左右。太少負樣本，你無法確認 false positive 的嚴重程度；太多負樣本，你可能會過度優化而讓 description 變得太狹隘。

---

## 11.4 觸發測試：量化的 Description 有效度

### 11.4.1 觸發測試的執行方式

這是最基礎也最重要的測試。它回答一個問題：**當使用者說出某句話時，Agent 會不會想起你的 Skill？**

測試方法：

```
對每一筆查詢 query：
    將 query + 所有 available skills 的 description 餵給 Agent
    記錄 Agent 選擇了哪個 Skill（或沒選）
    重複 3 次（因為 LLM 輸出有隨機性）
    計算觸發率 = 觸發次數 / 3
```

為什麼要跑 3 次？因為 LLM 不是確定性的。同一個查詢搭配同一個 description，第一次觸發了、第二次沒觸發，這是正常現象。跑多次取平均值，才能得到穩定的觸發率估計。

### 11.4.2 門檻值設定

什麼樣的觸發率才算「及格」？這取決於你對這個 Skill 的期望：

| 門檻 | 適用場景 | 說明 |
|------|----------|------|
| > 0.9 | 安全關鍵操作 | 任何一次錯過都可能造成損害 |
| > 0.7 | 核心工作流程 | 錯過幾次還可以接受，但不理想 |
| > 0.5 | 輔助性 Skill | 錯過時 Agent 自己硬幹還可以 |
| > 0.3 | 實驗性 Skill | 還在測試中，觸發不觸發都可以 |

> **⚠️ 門檻的取捨**：追求過高的觸發率（> 0.95）通常會導致 false positive 急遽上升——你的 description 會變得過於寬泛，什麼任務都觸發。實務上 0.7-0.8 是一個合理的目標區間。

### 11.4.3 觸發測試範例

假設我們有一個 **Code Review Skill**，description 是：

```
Review pull request code changes for security issues, performance problems,
and style violations. Use when a PR needs human-like code review including
logic analysis and architecture feedback. DO NOT use for simple formatting
checks or grammar checking.
```

觸發測試結果：

| 查詢 | 期望 | 實際觸發率 | 結果 |
|------|------|------------|------|
| 「幫我 review 這個 PR」 | ✅ | 3/3 (1.0) | ✅ |
| 「這個 PR 有安全漏洞嗎？」 | ✅ | 2/3 (0.67) | ⚠️ 偏低 |
| 「幫我看這段程式的品質」 | ✅ | 1/3 (0.33) | 🔴 要改善 |
| 「幫我格式化這個檔案」 | ❌ | 1/3 (0.33) | ⚠️ false positive |
| 「天氣如何？」 | ❌ | 0/3 (0.0) | ✅ |
| 「幫我 review 這份合約」 | ❌ | 2/3 (0.67) | 🔴 false positive 偏高 |

從這個結果可以看出，description 需要調整——「幫我看這段程式的品質」這類自然表述的觸發率太低，而「review 合約」的 false positive 太高。

### 11.4.4 自動化觸發測試腳本

```python
#!/usr/bin/env python3
"""trigger_test.py — 觸發率自動化測試"""

import json
import subprocess
import sys

# 設定
SKILL_NAME = "code-review"
TEST_QUERIES = [
    # 正樣本（應觸發）
    {"query": "幫我 review 這個 PR", "expect": True},
    {"query": "這個 PR 有安全漏洞嗎？", "expect": True},
    {"query": "幫我看這段程式的品質", "expect": True},
    {"query": "review 一下這段程式碼的邏輯", "expect": True},
    {"query": "這個 commit 有沒有問題？", "expect": True},
    {"query": "檢查一下程式碼風格", "expect": True},
    # 負樣本（不應觸發）
    {"query": "幫我格式化這個檔案", "expect": False},
    {"query": "天氣如何？", "expect": False},
    {"query": "幫我 review 這份合約", "expect": False},
    {"query": "部署到 production", "expect": False},
]

def run_test(query, skill_name, trials=3):
    """對單一查詢執行多次測試，回傳觸發率"""
    triggered_count = 0
    for _ in range(trials):
        # ⚠️ 此處為示意：實際需整合你的 Agent 測試框架
        result = simulate_agent_skill_selection(query)
        if result == skill_name:
            triggered_count += 1
    return triggered_count / trials

def simulate_agent_skill_selection(query):
    """
    模擬 Agent 的 Skill 選擇。
    實務上應該呼叫 LLM 或你的 Agent runner。
    """
    # TODO: 串接實際的 Agent 測試環境
    return "code-review" if "review" in query else None

def main():
    results = []
    for test in TEST_QUERIES:
        rate = run_test(test["query"], SKILL_NAME)
        results.append({
            "query": test["query"],
            "expected": test["expect"],
            "trigger_rate": rate,
            "passed": (rate >= 0.5) if test["expect"] else (rate < 0.5)
        })

    # 輸出報告
    passed = sum(1 for r in results if r["passed"])
    print(f"=== Trigger Test Report ===")
    print(f"Skill: {SKILL_NAME}")
    print(f"Passed: {passed}/{len(results)} ({passed/len(results)*100:.0f}%)\n")

    for r in results:
        status = "✅" if r["passed"] else "🔴"
        print(f"{status} {r['query']}")
        print(f"   Expected: {'trigger' if r['expected'] else 'not trigger'} "
              f"| Rate: {r['trigger_rate']:.2f}")

    return 0 if all(r["passed"] for r in results) else 1

if __name__ == "__main__":
    sys.exit(main())
```

---

## 11.5 指令遵循度：驗證 Agent 照著步驟走

### 11.5.1 為什麼 Agent 會不照做？

你可能會想：「我 SKILL.md 都寫得那麼清楚了，Agent 怎麼可能不照做？」

答案是：**Agent 不是程式，它沒有編譯器強制它遵守你的指令。** Agent 是一個語言模型，它「理解」你的文字，但理解不等於服從。

常見原因：
- **長度偏誤**：步驟太多時，Agent 傾向「摘要執行」而非「逐步執行」
- **慣性偏誤**：Agent 過去用別的方式做過類似任務，會傾向用自己的老方法
- **模糊地帶**：你的指令有灰色地帶，Agent 用自己的判斷填補了空白

### 11.5.2 指令遵循度的測試方法

最可靠的測試方法是**軌跡比對（Trace Matching）**：

1. 定義一個「黃金路徑」（Golden Path）——嚴格按 SKILL.md 順序執行的步驟序列
2. 讓 Agent 執行任務，並記錄它實際呼叫的工具和步驟順序
3. 比對實際軌跡與黃金路徑，計算「遵循得分」

遵循得分 = 正確步驟數 / 總步驟數 × 加權係數

加權係數的設計：

| 行為 | 係數 | 說明 |
|------|------|------|
| 按順序完成所有步驟 | 1.0 | 完美 |
| 跳過可選步驟 | 0.9 | 可以接受 |
| 跳過必要步驟 | 0.3 | 不可接受 |
| 改變步驟順序 | 0.5 | 如果順序不影響結果 |
| 添加未授權步驟 | 0.5-0.7 | 取決於新增步驟的影響 |
| 忽略明確禁止的指令 | 0.0 | 零分，需要重新設計 Skill |

### 11.5.3 實務上的遵循度驗證

完全自動化的遵循度驗證非常困難——因為你需要追蹤 Agent 的每一步決策。以下是務實的做法：

**方法一：Tool Call 日誌分析**

如果 Agent 環境會記錄 tool call 的歷史（Claude Code、OpenCode 都會），你可以事後分析：

```
Step 1: read_file("pull_request.diff")          ✅ — 正確
Step 2: grep("security", file_content)           ✅ — 正確
Step 3: write("review.md", content)              ✅ — 正確
（沒有 Step 4: notify_slack，因為 Skill 沒要求） ✅ — 沒有未授權步驟
```

**方法二：沙箱測試（Sandboxed Eval）**

建立一個隔離的測試環境，讓 Agent 在裡面執行任務。這個環境可以記錄所有操作，而且不會影響真實系統。

**方法三：定期抽樣人工審查**

如果自動化完全驗證太困難（通常如此），退而求其次的做法是：

1. 每次修改 Skill 後，選 2-3 個代表性的查詢
2. 手動觀察 Agent 的執行過程（而非只看結果）
3. 對照 SKILL.md 的步驟逐一比對
4. 記錄不符合的地方

> **⚠️ 關於人工審查的頻率**：不需要每週做，但每次大幅修改 Skill 後一定要做。我的習慣是：改完 -> 跑觸發測試（自動）-> 人工看一次執行軌跡（10 分鐘）-> 確認沒問題再上線。

---

## 11.6 輸出品質：最終使用者體驗

### 11.6.1 量化檢查 vs. 質化評分

輸出品質的評估是最「像人類評分」的部分，但它依然可以被結構化。

**可自動化的量化檢查：**

| 檢查項目 | 方法 | 範例 |
|----------|------|------|
| 格式正確性 | 正則表達式或 schema 驗證 | 輸出是否包含 `## Review Results` |
| 完整性 | 必要欄位是否存在 | 是否有 security、performance、style 三個章節 |
| 長度範圍 | 字數檢查 | 是否在 200-500 字之間 |
| 時間 | 執行時間檢查 | 是否在 30 秒內完成 |

**需要人工的質化評分：**

| 評分項目 | 1 分 | 3 分 | 5 分 |
|----------|------|------|------|
| 正確性 | 分析有明顯錯誤 | 大致正確但有遺漏 | 準確且全面 |
| 實用性 | 建議太抽象無法操作 | 建議方向正確但欠具體 | 建議具體可行且附理由 |
| 語氣適切性 | 語氣不符場景（太正式或太隨意） | 可接受 | 語氣專業且符合團隊文化 |

### 11.6.2 自動化檢查的工具鏈

```python
#!/usr/bin/env python3
"""output_quality_check.py — 輸出品質自動檢查"""

import re
import sys

REQUIRED_SECTIONS = [
    "安全性檢查|Security",
    "效能分析|Performance",
    "程式碼風格|Style",
    "總結|Summary",
]

FORBIDDEN_PATTERNS = [
    r"我不確定",
    r"我無法完成",
    r"TODO",
]

def check_output(output: str) -> dict:
    """執行一系列輸出品質檢查"""
    results = {
        "format_ok": False,
        "sections_found": [],
        "sections_missing": [],
        "forbidden_found": [],
        "length": len(output),
        "passed": True,
    }

    # 檢查必要章節
    for section in REQUIRED_SECTIONS:
        if re.search(section, output, re.IGNORECASE):
            results["sections_found"].append(section)
        else:
            results["sections_missing"].append(section)
            results["passed"] = False

    # 檢查禁止模式
    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, output, re.IGNORECASE):
            results["forbidden_found"].append(pattern)
            results["passed"] = False

    # 長度檢查
    if len(output) < 100:
        results["passed"] = False
        results["length_error"] = "Output too short (< 100 chars)"

    return results

# 使用範例
if __name__ == "__main__":
    test_output = """
    ## Security Review
    No critical vulnerabilities found.

    ## Performance Analysis
    The loop in line 42 could be optimized.

    ## Style
    Consistent with project style guide.

    ## Summary
    Overall quality is good.
    """

    result = check_output(test_output)
    print(json.dumps(result, indent=2, ensure_ascii=False))
```

---

## 11.7 評分 Rubric 設計

### 11.7.1 三維度加權評分

一個完整的評分 rubric 將三個維度合併為單一總分：

```
總分 = 觸發率 × W_trigger + 遵循度 × W_compliance + 輸出品質 × W_quality
```

權重的設定取決於 Skill 的性質：

| Skill 類型 | W_trigger | W_compliance | W_quality | 說明 |
|------------|-----------|-------------|-----------|------|
| 安全相關 | 0.2 | 0.5 | 0.3 | 遵循度最重要，錯了會出事 |
| 內容生成 | 0.3 | 0.2 | 0.5 | 輸出品質是核心 |
| 工具整合 | 0.3 | 0.4 | 0.3 | 都要兼顧 |
| 實驗性質 | 0.5 | 0.2 | 0.3 | 先確保觸發，再優化品質 |

### 11.7.2 評分等級與閾值

| 等級 | 分數區間 | 意義 | 行動 |
|------|----------|------|------|
| S | 90-100 | 生產就緒 | 可發布 |
| A | 75-89 | 品質良好 | 有 minor 問題，可發布但排程改善 |
| B | 60-74 | 堪用 | 需改善才能發布 |
| C | 40-59 | 有明顯缺陷 | 不發布，優先修復 |
| D | 0-39 | 不可用 | 重新設計或棄用 |

### 11.7.3 Rubric 範例：Code Review Skill

```yaml
# eval-rubric.yaml — Code Review Skill 的評分標準
skill: code-review
version: 1.0

dimensions:
  trigger_rate:
    weight: 0.3
    tests:
      - id: TR-01
        description: "正樣本應觸發：'幫我 review 這個 PR'"
        threshold: 0.7
      - id: TR-02
        description: "正樣本應觸發：'檢查這段程式碼的安全性'"
        threshold: 0.7
      - id: TR-03
        description: "負樣本不應觸發：'天氣如何？'"
        threshold: 0.3  # false positive rate < 0.3

  instruction_compliance:
    weight: 0.3
    golden_path:
      - "讀取 diff"
      - "掃描安全漏洞"
      - "分析效能瓶頸"
      - "檢查程式碼風格"
      - "產生 Review 報告"
    checks:
      - id: IC-01
        description: "按順序執行所有必要步驟"
        penalty: 0.3  # 跳步驟扣分
      - id: IC-02
        description: "未執行未授權操作（如自動修改程式碼）"
        penalty: 0.5

  output_quality:
    weight: 0.4
    checks:
      - id: OQ-01
        description: "包含安全、效能、風格三個章節"
        type: "auto"
      - id: OQ-02
        description: "review 建議具體可操作"
        type: "manual"
        scale: 1-5
        threshold: 3
      - id: OQ-03
        description: "沒有不確定的語句（'可能'、'或許'、'我不確定'）"
        type: "auto"
```

---

## 11.8 執行評估：工具鍊與報告

### 11.8.1 評估管線架構

一個生產級的評估管線通常包含以下階段：

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Load Eval  │ → │  Run Tests  │ → │  Compute    │ → │  Generate   │
│  Dataset    │    │  (per test) │    │  Scores     │    │  Report     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 11.8.2 評估報告範本

```markdown
# Eval Report: code-review v2.3

**Date**: 2026-06-06
**Evaluator**: eval-runner v1.5
**Dataset**: code-review-eval-v3 (20 queries)

## Overall Score: 78/100 (Grade: B)

| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Trigger Rate | 0.75 | 0.3 | 22.5 |
| Instruction Compliance | 0.82 | 0.3 | 24.6 |
| Output Quality | 0.77 | 0.4 | 30.8 |
| **Total** | | | **78** |

## Trigger Rate Detail

| Query | Expected | Rate | Status |
|-------|----------|------|--------|
| 幫我 review 這個 PR | ✅ | 1.0 | ✅ |
| 這個 PR 有安全漏洞嗎？ | ✅ | 0.67 | ⚠️ |
| 幫我看這段程式的品質 | ✅ | 0.33 | 🔴 |
| review 這份合約 | ❌ | 0.67 | 🔴 |
| 天氣如何？ | ❌ | 0.0 | ✅ |

## Instruction Compliance Detail

| Step | Status | Note |
|------|--------|------|
| 讀取 diff | ✅ | |
| 掃描安全漏洞 | ✅ | |
| 分析效能瓶頸 | ✅ | |
| 檢查程式碼風格 | ✅ | |
| 產生 Review 報告 | ✅ | |
| 未授權操作 | ✅ | 無 |

## Output Quality Detail

| Check | Method | Score | Threshold | Status |
|-------|--------|-------|-----------|--------|
| 必要章節完整 | auto | 3/3 | 3 | ✅ |
| 建議具體可操作 | manual | 4/5 | 3 | ✅ |
| 無不確定語句 | auto | 0 forbidden | 0 | ✅ |

## Recommendations

1. 🔴 **高優先**：優化 description，提升「幫我看這段程式的品質」觸發率（目前 0.33）
2. 🔴 **高優先**：在 description 加入「不適用合約審查」的負面案例
3. 🟡 **中優先**：Review 報告的效能建議可更具體（目前偏向 general）
```

### 11.8.3 評估自動化腳本

```python
#!/usr/bin/env python3
"""run_eval.py — 執行完整評估管線"""

import json
import time
from dataclasses import dataclass, asdict
from typing import List

@dataclass
class EvalResult:
    skill_name: str
    version: str
    timestamp: str
    trigger_rate_score: float
    compliance_score: float
    quality_score: float
    overall_score: float
    details: dict

class EvalRunner:
    def __init__(self, rubric: dict, dataset: List[dict]):
        self.rubric = rubric
        self.dataset = dataset

    def run(self) -> EvalResult:
        """執行完整評估流程"""
        # 階段 1：觸發測試
        trigger_scores = self._run_trigger_tests()

        # 階段 2：指令遵循度測試
        compliance_scores = self._run_compliance_tests()

        # 階段 3：輸出品質測試
        quality_scores = self._run_quality_tests()

        # 計算加權總分
        w = self.rubric["dimensions"]
        overall = (
            trigger_scores["average"] * w["trigger_rate"]["weight"]
            + compliance_scores["average"] * w["instruction_compliance"]["weight"]
            + quality_scores["average"] * w["output_quality"]["weight"]
        )

        return EvalResult(
            skill_name=self.rubric["skill"],
            version=self.rubric["version"],
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%S"),
            trigger_rate_score=trigger_scores["average"],
            compliance_score=compliance_scores["average"],
            quality_score=quality_scores["average"],
            overall_score=round(overall * 100, 1),
            details={
                "trigger": trigger_scores,
                "compliance": compliance_scores,
                "quality": quality_scores,
            }
        )

    def _run_trigger_tests(self):
        """執行觸發測試（實作略）"""
        return {"average": 0.75, "details": []}

    def _run_compliance_tests(self):
        """執行遵循度測試（實作略）"""
        return {"average": 0.82, "details": []}

    def _run_quality_tests(self):
        """執行品質測試（實作略）"""
        return {"average": 0.77, "details": []}


def main():
    rubric = {
        "skill": "code-review",
        "version": "2.3",
        "dimensions": {
            "trigger_rate": {"weight": 0.3},
            "instruction_compliance": {"weight": 0.3},
            "output_quality": {"weight": 0.4},
        }
    }
    dataset = []  # 從檔案載入

    runner = EvalRunner(rubric, dataset)
    result = runner.run()

    print(json.dumps(asdict(result), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
```

---

## 11.9 回歸測試：防止品質倒退

### 11.9.1 什麼時候需要回歸測試？

每次修改 SKILL.md 都可能影響品質——即使你的修改只是加了一句話。

最容易引發品質變化的修改：

| 修改類型 | 風險 | 說明 |
|----------|------|------|
| 修改 description | 🔴 高 | 可能改變觸發行為 |
| 調整步驟順序 | 🔴 高 | Agent 可能混淆 |
| 新增章節 | 🟡 中 | 長度增加可能讓 Agent 忽略前面 |
| 移除內容 | 🟡 中 | 移除的可能是 Agent 需要的 |
| 修正錯字 | 🟢 低 | 通常安全，但偶爾影響語意 |

### 11.9.2 回歸測試流程

```
修改 SKILL.md
    │
    ▼
執行觸發測試 ──→ 觸發率下降？──→ 檢討 description 修改
    │
    ▼
執行遵循度測試 ──→ 遵循度下降？──→ 檢討步驟修改
    │
    ▼
執行輸出品質測試 ──→ 品質下降？──→ 檢討內容修改
    │
    ▼
生成比對報告 ──→ 與上次結果比較
    │
    ▼
判定：通過 / 需改善 / 復原修改
```

### 11.9.3 自動化回歸測試的實作

```python
#!/usr/bin/env python3
"""regression_test.py — 回歸測試比對"""

import json

def compare_with_baseline(current: dict, baseline_path: str) -> dict:
    """比對當前評估結果與基準線"""
    with open(baseline_path, "r") as f:
        baseline = json.load(f)

    changes = {}
    for dim in ["trigger_rate_score", "compliance_score", "quality_score", "overall_score"]:
        diff = current[dim] - baseline[dim]
        changes[dim] = {
            "before": baseline[dim],
            "after": current[dim],
            "diff": round(diff, 1),
            "regression": diff < -5  # 下降超過 5 分視為回歸
        }

    return changes


def main():
    # 模擬當前結果
    current = {
        "trigger_rate_score": 0.70,
        "compliance_score": 0.80,
        "quality_score": 0.75,
        "overall_score": 75.0,
    }
    baseline_path = "baseline_results.json"

    try:
        changes = compare_with_baseline(current, baseline_path)
        regressions = [k for k, v in changes.items() if v.get("regression")]

        if regressions:
            print(f"🔴 Regression detected in: {', '.join(regressions)}")
            for dim in regressions:
                print(f"   {dim}: {changes[dim]['before']} → {changes[dim]['after']}")
            print("Action: Review recent changes to SKILL.md")
        else:
            print("✅ No regression detected. All scores stable or improved.")

    except FileNotFoundError:
        print("No baseline found. Saving current results as baseline.")
        with open(baseline_path, "w") as f:
            json.dump(current, f, indent=2)


if __name__ == "__main__":
    main()
```

---

## 11.10 [DIAGRAM] 評估系統架構圖

```
╔══════════════════════════════════════════════════════════════════╗
║                   Skill Evaluation System                        ║
╚══════════════════════════════════════════════════════════════════╝

                             ┌──────────────────┐
                             │   Eval Dataset    │
                             │  (JSON/YAML)      │
                             │  • Representative │
                             │  • Edge Cases     │
                             │  • Failure Scen.  │
                             └────────┬─────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Test Runner                                │
├─────────────────┬─────────────────┬─────────────────────────────┤
│                 │                 │                             │
│   ▼             │   ▼             │   ▼                         │
┌──────────┐     ┌──────────┐     ┌──────────┐                   │
│Trigger   │     │Instruct. │     │Output    │                   │
│Tests     │     │Compliance│     │Quality   │                   │
│(3 runs/  │     │Tests     │     │Tests     │                   │
│ query)   │     │(Trace    │     │(Auto +   │                   │
│          │     │ Matching)│     │ Manual)  │                   │
└────┬─────┘     └────┬─────┘     └────┬─────┘                   │
     │                │                │                         │
     ▼                ▼                ▼                         │
┌──────────────────────────────────────────────────────────────┐  │
│                     Scoring Engine                            │  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │  │
│  │Trigger Score│  │Compliance   │  │Quality Score│           │  │
│  │Weight: 0.3  │  │Score: 0.3   │  │Weight: 0.4  │           │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │  │
│         │                │                │                   │  │
│         └────────────────┼────────────────┘                   │  │
│                          ▼                                     │  │
│                 ┌────────────────┐                             │  │
│                 │  Overall Score │                             │  │
│                 │  (0-100)       │                             │  │
│                 └───────┬────────┘                             │  │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │   Report Generator  │
              │   (Markdown / JSON) │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Historical DB     │
              │  ┌───────────────┐  │
              │  │ Baseline      │  │
              │  │ v2.2: 82 pts  │  │
              │  │ v2.3: 78 pts  │  │
              │  │ v2.4: ?       │  │
              │  └───────────────┘  │
              └─────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Regression Check    │
              │ Δ > -5 → Alert     │
              └─────────────────────┘
```

> **架構說明**：這個評估系統由三個階段組成——測試執行（觸發、遵循、品質三種測試）、分數計算（加權彙整為單一總分）、以及報告與回歸分析。歷史資料庫儲存每次評估的結果，用於追蹤品質趨勢和比對回歸。

---

## 11.11 真實範例：Code Review Skill 的評估報告

以下是一份完整的評估報告，展示一個真實的 Code Review Skill 在某次修改後的評估結果。

### 背景

- **Skill**: `code-review` v2.3
- **最近修改**: 優化了 description（加入更多觸發關鍵字），調整了步驟順序
- **評估日期**: 2026-06-06
- **評估人員**: 自動化評估管線 + 一次人工抽樣

### 觸發測試結果（20 筆查詢，每筆 3 次）

```
正樣本觸發率: 12/14 = 0.86
負樣本正確排除率: 4/6 = 0.67

詳細:
✅ 幫我 review 這個 PR             1.0
✅ 這個 PR 有資安問題嗎？           0.67  ⚠️ 邊緣
✅ 檢查這段程式碼的效能             0.67  ⚠️ 邊緣
✅ review 一下程式碼邏輯            0.33  🔴 偏低
❌ 部署到 production                0.0   ✅ 正確不觸發
❌ 幫我 review 這份合約             0.67  🔴 False Positive
❌ 天氣如何？                       0.0   ✅ 正確不觸發
❌ 這篇文章的文法有問題嗎？         0.33  ⚠️ False Positive 邊緣
```

**觀察**：Description 對「review 程式碼邏輯」這類自然表述的觸發率不足。對「review 合約」的 false positive 偏高。

### 指令遵循度測試結果（3 個測試案例人工審查）

```
測試案例 1：「review PR #42」
  步驟順序: ✅ 完全正確
  未授權操作: ✅ 無
  遵循度: 1.0

測試案例 2：「檢查這個 PR 的安全性」
  步驟順序: ⚠️ 跳過了「讀取 diff」（Agent 直接用 URL 抓 PR）
  未授權操作: ✅ 無
  遵循度: 0.85

測試案例 3：「review 最近三個 commit」
  步驟順序: ⚠️ Agent 自行合併了「安全掃描」和「效能分析」為一步
  未授權操作: ✅ 無
  遵循度: 0.75
```

**觀察**：Agent 在處理非典型輸入（多個 commit）時傾向自行重組步驟。需在 SKILL.md 中明確寫出「如果有多個 commit，每個都要分開 review」。

### 輸出品質測試結果（自動 + 人工）

```
自動檢查:
  ✅ 必要章節完整 (3/3)
  ✅ 無不確定語句 (0 forbidden found)
  ✅ 輸出長度適中 (342-518 words)
  ✅ 格式與模板一致

人工評分 (抽樣 3 份輸出):
  正確性: 4.3/5
  實用性: 3.7/5 ⚠️ 部分建議偏 general
  語氣適切: 5/5 ✅
```

### 綜合評分

| 維度 | 分數 | 權重 | 加權 |
|------|------|------|------|
| 觸發率 | 77% | 0.3 | 23.1 |
| 指令遵循度 | 87% | 0.3 | 26.1 |
| 輸出品質 | 75% | 0.4 | 30.0 |
| **總分** | | | **79.2 (Grade: B)** |

### 改善建議（依優先順序）

1. **🔴 Description 優化**：加入「程式碼邏輯審查」、「code logic review」等關鍵字；加入「非合約審查」的負面案例
2. **🔴 多 commit 處理**：在 SKILL.md 中加入「多筆 commit 的處理規則」
3. **🟡 建議具體化**：在 Review 報告的模板中加入「請給出具體的程式碼行號和修改建議」的提示
4. **🟢 監控觸發率趨勢**：下次修改前後比對，確保優化確實改善

---

## 11.12 總結：每個 Skill 都需要的最小評估

如果你沒有時間建立一個完整的評估系統，以下是**最低底線**：

### 每個 Skill 都必須通過的「健康檢查」

1. **觸發測試（5 題）**
   - 3 題應該觸發的正樣本 → 觸發率 > 0.5
   - 2 題不該觸發的負樣本 → false positive rate < 0.5

2. **手動跑一次完整流程**
   - 你真的看過 Agent 執行你的 Skill 嗎？不是只看結果——是看過程。
   - 對照 SKILL.md，每一步都做了嗎？

3. **輸出是否「看起來像回事」**
   - 格式對嗎？
   - 內容合理嗎？還是充滿了「我不確定」？

### 什麼時候該升級到完整評估？

| 情況 | 行動 |
|------|------|
| Skill 只有你自己用 | 最小評估就夠了 |
| Skill 要給團隊用 | 建立完整的觸發測試 + 定期人工抽樣 |
| Skill 是開源的 | 建立完整的 eval pipeline |
| Skill 涉及安全或金錢 | 強制每次修改跑完整回歸測試 |

---

## 11.13 練習題

### 練習 1：為「部落格發布 Skill」建立評估資料集

**背景**：你有一個 Blog Publisher Skill，它的功能是將 Markdown 文章格式化、加入 frontmatter、上傳圖片、然後發布到 WordPress。

**任務**：設計一組評估資料集，包含至少：
- 6 個正樣本（應觸發）
- 4 個負樣本（不應觸發）
- 至少 1 個邊界案例

<details class="exercise-hint">
<summary>💡 提示</summary>
思考一下哪些查詢「聽起來像」發布文章但實際上不是？哪些任務不應該呼叫這個 Skill？
</details>

---

### 練習 2：為「資料庫備份 Skill」設計評分 Rubric

**背景**：你有一個 Database Backup Skill，步驟如下：
1. 檢查磁碟空間（> 1GB free）
2. 執行 mysqldump
3. 壓縮備份檔
4. 上傳到 S3
5. 驗證備份完整性
6. 清理超過 30 天的舊備份

**任務**：
1. 為這個 Skill 分配三維度的權重（觸發率 / 遵循度 / 輸出品質），並說明理由
2. 設計檢查「指令遵循度」的 golden path
3. 列出至少 3 個「自動化可檢查」的輸出品質項目
4. 列出至少 2 個「需要人工審查」的輸出品質項目

---

### 練習 3：分析一份評估報告

```
## 觸發測試摘要
正樣本觸發率: 6/8 = 0.75
負樣本正確排除率: 2/4 = 0.50

## 常見違規
- 跳過「驗證輸入」步驟（3/5 測試案例）
- 使用 `rm` 而非 Skill 要求的 `safe-delete`（2/5）
- 輸出格式缺少 timestamp 欄位（4/5）

## 最近修改
- 將 description 從 "Backup database" 改為
  "Create encrypted database backups to S3 with integrity verification"
```

**問題**：
1. 這個 Skill 最大的問題是什麼？
2. 你認為 description 的修改方向正確嗎？
3. 如果只能改善一個問題，你選哪個？為什麼？

---

### 練習 4：實作一個觸發測試腳本

**任務**：基於 11.4.4 的範例程式碼，擴充一個適用於你實際某個 Skill 的觸發測試腳本。

**要求**：
1. 至少 5 個正樣本和 3 個負樣本
2. 每筆查詢跑 3 次
3. 輸出格式包含：查詢、期望、實際觸發率、是否通過
4. （進階）整合到 CI/CD 流程中

---

> **本章回顧**：你學會了如何從觸發率、指令遵循度、輸出品質三個維度來評估一個 Skill。你學會了設計評估資料集、執行觸發測試、驗證指令遵循度、以及建立回歸測試機制。最重要的是，你明白了「沒有測量就沒有改善」——一個沒有評估系統的 Skill，就像沒有儀表板的飛機：你可能飛得起來，但你永遠不知道什麼時候會墜機。

← [Chapter 10：大型 Skill 架構](/課程/03-04-large-skill-architecture) | [Chapter 12：評估與迭代](/課程/04-02-grading-and-iteration) →
