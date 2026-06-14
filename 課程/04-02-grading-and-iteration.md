---
title: "Chapter 12：評估結果分析與持續迭代"
description: "拿到 eval 分數之後的實際行動 — 根因分析、常見失敗模式診斷、迭代策略選擇（增量/A/B/重寫），以及從 v1 到 v5 的真實演化案例。"
outline: [2, 3]
---
# 第 12 章：評估結果分析與持續迭代

前兩章我們談了怎麼幫 Skill 打分數——從觸發測試到品質評分矩陣，你已經有一套工具可以量化 Skill 的表現。但拿到分數之後呢？

多數人會犯一個致命錯誤：**看了分數，嘆口氣，然後放著不管。**

這一章要解決的核心問題是：**拿到 eval 報告之後，你實際上要做什麼？** 怎麼從一堆數字中找出真正的瓶頸？怎麼決定下一版要改什麼？什麼時候該放棄改寫、直接砍掉重練？

如果你只想學一件事：**Eval 的目的不是打分數，是決定下一步做什麼。**

---

## 學習目標

完成本章後，你將能夠：

1. **判讀 eval 報告**：辨識 scores 背後的真正問題，而非只看平均數字
2. **根因分析**：從失敗案例追溯到 SKILL.md 中具體哪一條 instruction 出了問題
3. **診斷常見失敗模式**：一眼看出是 trigger failure、instruction skip、還是 wrong output
4. **設計迭代策略**：根據問題類型選擇 A/B 測試、增量修改、或版本重寫
5. **建立追蹤系統**：透過 eval history、changelog、version matrix 追蹤 Skill 的演化
6. **設計回饋迴路**：從使用者回報、自動監控、季度 review 持續改善
7. **判斷 rewrite vs refine**：理解 Skill 生命週期，決定何時該修、何時該重寫
8. **從真實案例學習**：分析一個 Skill 從 v1 到 v5 的完整演化過程

---

## 12.1 判讀 Eval 結果：分數背後的訊號

拿到 eval 報告的第一件事：**不要看平均。**

平均分數是最危險的數字。一個平均 0.72 的 Skill，可能是「所有項目都普通」，也可能是「一半完美一半爛掉」。兩種情況需要的解法完全不同。

### 看懂分數分布

**先看分布，再看平均。** 一個好的 eval 報告應該讓你看見每一筆測試的個別分數，而不是只有一個總分。

```
❌ 只看平均：Overall Score: 0.72

✅ 看分布：
  ┌────────────────────────────────────────────┐
  │ Trigger Test (10 cases)                    │
  │  ✅✅✅✅✅✅✅✅✅❌  → 0.90              │
  │                                            │
  │ Instruction Following (8 cases)            │
  │  ✅✅✅✅✅❌❌❌  → 0.50 ← 問題在這裡    │
  │                                            │
  │ Output Quality (8 cases)                   │
  │  ✅✅✅✅✅✅✅✅  → 1.00                  │
  │                                            │
  │ Safety (4 cases)                           │
  │  ✅✅✅✅            → 1.00                  │
  └────────────────────────────────────────────┘
```

看到 distribution 的威力了嗎？平均 0.72 看起來還行，但 Instruction Following 只有 0.50——這才是你該花時間的地方。

### 常見的分數模式與診斷

| 分數模式 | 可能的原因 | 優先級 |
|---------|-----------|--------|
| Trigger 低 (<0.6)，其他高 | Description 不夠 pushy | 🔴 最高 |
| Instruction 低，Trigger 高 | 步驟寫得不夠程序化 | 🔴 高 |
| Output Quality 低 | 缺少輸出模板 | 🟡 中 |
| Safety 低 | 缺少 PVE 或 Gotchas | 🔴 最高（安全問題） |
| 全部平均偏低 | 可能不是 Skill 問題，是 eval 測試本身設計不良 | 🟢 先確認測試 |
| 單一 extreme outlier | 邊界情況沒處理 | 🟡 補邊界案例 |

> ⚠️ **一個常見陷阱**：第一次跑 eval 分數很難看是正常的。不要因此沮喪。我見過最極端的案例是——一個 v1 Skill 的 Trigger 分數只有 0.15，但經過三輪 description 迭代後升到 0.92。分數低不代表 Skill 爛，只代表它還沒被優化過。

### Fail Case 比 Pass Case 重要十倍

每當你看到一個 ❌，不要只看見「失敗」。要問：「這個失敗教了我什麼？」

```markdown
## Fail Case 分析模板

測試案例： 「幫我批次處理這 500 份 PDF」
預期結果： ✅ 觸發 PDF Skill
實際結果： ❌ 未觸發（Agent 自己用 PyPDF2 一份一份處理）

根因： Description 中有 "batch processing" 但沒有 "500 份" 的規模暗示
      Agent 覺得 500 份不算大，不需要專門的 Skill

修正： Description 補上 "For batches of 100+ files, this skill is 10x faster"
```

**養成習慣**：每一次 eval 結束，寫下 top 3 fail cases 的根因分析。累積三輪之後，你會發現 pattern——那些總是失敗的測試類型，就是你的 Skill 最大的弱點。

---

## 12.2 根因分析：為什麼 Skill 表現不好？

拿到一個失敗案例後，最忌諱的就是「猜原因然後直接改」。你必須有一套系統性的流程來定位真正的問題。

### 三層過濾法

這是一個我在實戰中歸納出來的 debug 流程，適合用來定位任何 Skill 的表現問題：

```
Layer 1: 是觸發問題還是執行問題？
  ├── Agent 根本沒叫這個 Skill → 問題在 description（見第 3 章秘笈 S3）
  └── Agent 有叫，但執行錯 → 往下

Layer 2: 是讀懂了做錯，還是根本沒讀懂？
  ├── Agent 理解了 instruction 但執行步驟不對 → 問題在程序化（見第 7 章）
  └── Agent 完全忽略了某條 instruction → 往下

Layer 3: 是 instruction 太隱晦，還是 Agent 選擇性忽略？
  ├── instruction 寫得太抽象 → 改為程序式 + 具體檢查點
  └── Agent 在兩條衝突的 instruction 中選了錯的 → 檢查指令優先級
```

### 實戰案例：一個 CI/CD Skill 的根因分析

某個團隊開發了一個 `ci-cd-deploy` Skill，eval 分數如下：

| 維度 | 分數 | 問題 |
|------|------|------|
| Trigger | 0.92 | ✅ 很好 |
| Instruction Following | 0.38 | 🔴 很差 |
| Output Quality | 1.00 | ✅ 完美 |
| Safety | 0.75 | 🟡 有一筆失敗 |

Instruction Following 只有 0.38？這不正常。來看具體 fail cases：

**Fail Case 1：** 要求「部署到 staging 環境」，Agent 卻部署到 production。
- 第一層過濾：有觸發（✅），是執行問題。
- 第二層過濾：Agent 有讀 instruction（✅），但選擇了錯的環境。
- 第三層過濾：Instruction 寫的是「檢查 `DEPLOY_ENV` 環境變數」，但 Agent 在執行時系統預設了 `production`，Agent 沒有覆蓋。

**根因**：缺少「預設值強制覆蓋」的指令。Instruction 只說了「檢查」，沒說「如果預設是 production，強制改成 staging」。

**修正**：
```markdown
## Step 1: 確認部署環境（⚠️ 此步驟不可跳過）

- 執行 `echo $DEPLOY_ENV` 確認當前值
- **強制設定**：`$DEPLOY_ENV = "staging"`（不論原本是什麼，都改成 staging）
- 再次確認：`echo $DEPLOY_ENV` 必須顯示 `staging`
- 如果仍然是 `production`，**立刻中止**，不要繼續
```

注意到關鍵差異了嗎？從「檢查」變成「強制設定 + 再次確認 + 中止條件」——這才是 Agent 不會做錯的指令。

### 五 Whys 在 Skill Debug 中的應用

豐田生產方式的「五個為什麼」在 Skill debug 上一樣有效：

```
問題： Agent 把 staging 部署到 production 了

Why 1: 為什麼部署到 production？ → 因為 `DEPLOY_ENV` 預設是 production
Why 2: 為什麼預設是 production？ → 因為 instruction 只說「檢查」沒說「覆蓋」
Why 3: 為什麼只說檢查？ → 因為我假設 Agent 會自己知道要改成 staging
Why 4: 為什麼我這樣假設？ → 因為對人類來說「部署到 staging」意思很清楚
Why 5: 為什麼對人類清楚對 Agent 不清楚？ → Agent 需要「明確的賦值」，不是「意圖推論」
```

**真正的根因**：我的 instruction 是「人類-friendly」的，不是「Agent-friendly」的。修正方向：把所有「你應該知道要做什麼」的隱含假設，全部寫成明確指令。

---

## 12.3 常見失敗模式與對應解法

從大量實戰案例中，我歸納出三種最常見的 Skill 失敗模式。看懂它們，你就能在 eval 報告出來的第一時間知道問題在哪裡。

### 模式 A：Trigger Failure（觸發失敗）

**症狀**：Agent 沒叫這個 Skill，自己硬幹。

**Eval 報告特徵**：Trigger score < 0.5，但其他 scores 可能正常（因為根本沒執行到）。

**最常見的原因**：

| 原因 | 佔比 | 典型描述問題 |
|------|------|-------------|
| Description 太抽象 | ~40% | "Process data" → Agent 覺得自己就在 process data |
| 缺少負面案例 | ~25% | 只說「什麼時候用」，沒說「什麼時候不要用」 |
| 缺少關鍵字 | ~20% | 使用者的用詞跟 description 對不上 |
| 規模暗示不足 | ~15% | 沒說「這適合大檔案」Agent 就覺得小檔案也能自己做 |

**解法**：回到第 3 章的 Description 優化流程。跑 Trigger Eval，迭代 description。

> ⚠️ **一個你不想相信的事實**：Trigger failure 是所有失敗模式中最常見的，也是最容易被忽略的。因為 Agent 不會告訴你「我沒叫你的 Skill」——它只會默默地用其他方式完成任務。如果你的 eval 只看執行品質不看觸發率，你永遠不會發現這個問題。

### 模式 B：Instruction Skip（指令跳過）

**症狀**：Agent 有觸發 Skill，但跳過了某些步驟。

**Eval 報告特徵**：Trigger score 正常，但 Instruction Following score 明顯偏低。

**最常見的原因**：

1. **步驟太多**：超過 7 個步驟的 Skill，Agent 跳過步驟的機率大增。人類的短期記憶是 7±2 個 chunk，Agent 也有類似限制。
2. **步驟順序不明確**：沒有編號、沒有「Step 1/2/3」的標記，Agent 把它們當作選項而非順序。
3. **「可選」的誤導**：如果你寫了「你可以…」，Agent 的解讀是「這步不是必須的」。
4. **前置條件不滿足時不知如何處理**：如果 Step 2 需要 Step 1 的產出，但 Step 1 失敗了，Agent 可能跳過 Step 2 而不是回頭修 Step 1。

**解法**：

```markdown
## ❸ 步執行順序（嚴格依序，不可跳過）

### Step 1: [唯一要做的事]
<!-- 每一步只做一件事 -->

### Step 2: [唯一要做的事]
<!-- 如果 Step 1 失敗，不要跳過 Step 2，回到 Step 1 -->

### Step 3: [唯一要做的事]
```

關鍵原則：
- **每一步只說一件事**。不要一個步驟做三件事，拆成三步驟
- **加上數字標記**：Step 1 / Step 2 / Step 3，不要只用 bullet points
- **明確依賴關係**：如果 Step 2 依賴 Step 1，寫出來
- **失敗處理**：如果某一步失敗，明確說「回到上一步」還是「跳過」還是「中止」

### 模式 C：Wrong Output（輸出錯誤）

**症狀**：Agent 有觸發、步驟都有做，但最終產出的東西不對。

**Eval 報告特徵**：Trigger 和 Instruction Following 正常，但 Output Quality 低。

**最常見的原因**：

1. **缺少輸出模板**：Agent 不知道最終結果該長怎樣，自己「創作」了一個格式
2. **模板不夠具體**：只說「輸出 JSON」，但沒說欄位名和型別
3. **缺少驗證點**：Agent 做了但沒檢查，帶著錯誤繼續下一步

**解法**：

給予具體的輸出模板，並在模板之後加上驗證規則：

````markdown
## 輸出格式（嚴格遵守）

你必須回傳以下 JSON 格式，**不得增減欄位**：

```json
{
  "status": "success | failed | partial",
  "files_processed": 42,
  "files_failed": [],
  "output_path": "output/report_20260101.csv",
  "execution_time_seconds": 15.3
}
```

### 驗證規則
- `files_processed` 必須等於輸入檔案總數
- `files_failed` 如果是空陣列，`status` 必須是 `success`，不能是 `failed`
- `execution_time_seconds` 必須大於 0，超過 300 要附加警告
````

### 快速診斷表

| 症狀 | 最可能的原因 | 下一步 |
|------|------------|--------|
| Agent 沒叫 Skill | Trigger failure | 優化 description |
| Agent 叫了但亂做 | Instruction skip | 拆步驟、加編號、明確依賴 |
| Agent 都做了但結果不對 | Wrong output | 加輸出模板 + 驗證規則 |
| Agent 刪了不該刪的東西 | Safety failure | 加 PVE + Gotchas |
| Agent 一直問問題 | Instruction 不夠程序化 | 宣告式改程序式 |
| Agent 每次做的都不一樣 | 缺少預設值 | 給預設值 + 理由 |

---

## 12.4 迭代策略：怎麼改最有感？

知道問題在哪裡之後，下一題是：**怎麼改？**

這裡有三種迭代策略，適用不同的情境。

### 策略 A：增量修改（最常用）

**適用時機**：基礎架構沒問題，只需補強特定環節。

**做法**：一次只改一件事。改完立刻跑 eval 確認效果。

```
Iteration 1: 只改 description（加關鍵字）
  → Eval: Trigger 0.65 → 0.82 ✅

Iteration 2: 只改 Step 3 的驗證點
  → Eval: Instruction Following 0.70 → 0.85 ✅

Iteration 3: 只加輸出模板
  → Eval: Output Quality 0.60 → 0.95 ✅
```

**為什麼一次只改一件事？** 因為如果你同時改了 description、步驟、模板、和 Gotchas，然後分數上升了——你不知道是哪個改動造成的。下次出問題時，你也不知道該 rollback 哪個變更。

> ⚠️ **反直覺的建議**：即使你很清楚「這三個問題都要改」，也請分三次 commit 分三次 eval。前後可能只差 30 分鐘，但這個習慣會讓你的 iteration 有 traceability。

### 策略 B：A/B 測試

**適用時機**：有兩條路可以走，而且不確定哪條比較好。

**常見的 A/B 場景**：

| 對比項目 | A 方案 | B 方案 |
|---------|--------|--------|
| Description 風格 | 功能清單型 | 情境推銷型 |
| 步驟結構 | 線性 5 步驟 | 分組 3 階段 |
| 輸出格式 | JSON | Markdown 表格 |
| Gotchas 位置 | 最前面 | 分散在步驟中 |

**做法**：複製 Skill 成兩個版本（`my-skill-v1` 和 `my-skill-v2`），對同一組 eval 測試分別執行，比較分數。

```markdown
## A/B Test 結果記錄

測試日期：2026-06-01
測試項目：Description 風格（功能清單 vs 情境推銷）

A 方案（功能清單型）：Trigger Score 0.58
  "Extract text and tables from PDF files. Batch processing supported."

B 方案（情境推銷型）：Trigger Score 0.92
  "Extract text, tables, and metadata from scanned PDFs and digital PDFs.
   Supports OCR fallback for image-based PDFs. Use when you receive PDF
   invoices, reports, or academic papers. Even if the user says 'documents'."

結論：B 方案顯著優於 A 方案。情境推銷 + Even if 句有效。
```

### 策略 C：版本重寫

**適用時機**：累積修改超過 10 次、原始結構已經撐不住新的需求。

**判斷標準**：當你發現「加一條新的 Gotchas 需要修改三個既有步驟」的時候，就是該重寫的時候了。

**做法**：不要在原檔上修改。開一個新的 `SKILL_v2.md`，從頭開始寫，然後對比兩者的 eval 分數。

### 如何選擇策略？

```markdown
問題範圍小（單一步驟、單一描述）→ 增量修改
問題不明確（不知道哪種做法好）→ A/B 測試
問題範圍大（結構性問題、累積修改多）→ 版本重寫
```

---

## 12.5 變更追蹤：把演化過程記錄下來

你可以迭代，但不能亂迭代。**沒有記錄的迭代叫做亂改。**

變更追蹤有三個層級，建議全部實作：

### Level 1：Eval Result History

每一次跑 eval 的結果都要記錄下來。最簡單的格式是 CSV：

```csv
date,version,trigger_score,instruction_score,output_score,safety_score,notes
2026-01-01,v1,0.42,0.88,1.00,1.00,初始版本
2026-01-05,v2,0.67,0.88,1.00,1.00,加了 description 關鍵字
2026-01-10,v3,0.67,0.75,1.00,0.50,重構步驟結構但 safety 下降了
2026-01-12,v4,0.67,0.88,1.00,1.00,補回 safety checks
2026-01-15,v5,0.92,0.95,0.88,1.00,大改 description；調整輸出模板
```

有了這張表，你可以回答最重要的問題：**「這版比上版好嗎？」**

而且當分數突然下降時（v3 的 safety 從 1.00 掉到 0.50），你可以立刻知道是哪個改動造成的。

### Level 2：SKILL.md Changelog

在 SKILL.md 的最後加上 Changelog 區塊：

```markdown
## Changelog

### v5 (2026-01-15)
- **Description**：全面改寫為情境推銷型，加入 Even if 句
- **輸出模板**：從 JSON 改為 Markdown 表格（配合下游工具）
- **Gotchas**：新增第 7 條（Windows 路徑要用反斜線）
- 觸發率 v4 0.67 → v5 0.92 ✅

### v4 (2026-01-12)
- **Safety**：補回 Step 2 的 PVE 檢查（v3 不小心移除）
- Safety Score v3 0.50 → v4 1.00 ✅

### v3 (2026-01-10)
- **步驟重構**：將原本的 8 個步驟合併為 5 個
- ⚠️ 移除了 Step 4 的安全檢查（意外），v4 補回
```

每個 entry 都要回答：**改了什麼、為什麼改、效果如何。**

### Level 3：Version Matrix

當你的 Skill 超過 5 個版本，或是你同時維護多個 Skill 時，version matrix 可以幫你宏觀掌握全局：

```
Skill            v1    v2    v3    v4    v5
─────────────────────────────────────────────
pdf-extract      0.42  0.67  0.67  0.67  0.92
code-review      0.55  0.72  0.88  0.92  —
db-migration     0.88  0.92  0.95  —     —
data-cleanup     0.30  0.45  0.58  0.63  0.70
```

這個 matrix 一秒鐘就告訴你：
- `pdf-extract` 持續在進步（從 0.42 到 0.92）
- `code-review` 已經穩定（停止迭代了）
- `db-migration` 分數很高（可能不需要再改）
- `data-cleanup` 進步緩慢（可能需要大改或重寫）

---

## 12.6 回饋迴路：不只靠 Eval

Eval 很重要，但它不是唯一的改善來源。真正的 Skill 迭代應該建立在三條回饋迴路上：

### 迴路 1：使用者回報（最快）

當使用者（包括你自己）在使用 Skill 時發現問題，這是最直接的回饋。

**建立一個簡單的回報機制**：

```markdown
## 在 SKILL.md 的最後加上：

### 👤 使用回報

如果你在使用這個 Skill 時遇到任何問題，請在執行結束後回報：
1. 你下的指令是什麼？
2. Skill 的輸出是什麼？
3. 你期望的輸出是什麼？
4. 你覺得哪裡錯了？
```

理想情況下，這可以自動化——但即使只是文字回報，也比沒有好。

### 迴路 2：自動監控（最客觀）

對於線上使用的 Skill，可以加入自動監控：

```python
# 簡易監控腳本範例
def monitor_skill_execution(skill_name, trigger_count, success_count, avg_score):
    success_rate = success_count / trigger_count if trigger_count > 0 else 0
    if success_rate < 0.7:
        alert(f"[{skill_name}] Success rate dropped to {success_rate:.2%}")
    if avg_score < 0.6:
        alert(f"[{skill_name}] Avg score dropped to {avg_score:.2f}")
```

監控的關鍵指標：
- **觸發率趨勢**：隨著時間下降？可能是環境變了
- **成功率**：執行失敗的比例是否上升
- **使用者修正次數**：使用者多常需要手動修正 Skill 的輸出

> ⚠️ **一則現實警告**：自動監控很棒，但它需要基礎設施。如果你只有 3–5 個 Skill，手動 review 每週的 eval 結果就可以了。不要為了監控而監控。

### 迴路 3：季度 Review（最全面）

每三個月做一次完整的 Skill Portfolio Review：

```
季度 Review 議程（60 分鐘）
├── 5 min: 回顧本季 eval 趨勢（上季 vs 本季分數）
├── 15 min: 逐一 review 每個 Skill 的 top 3 fail cases
├── 15 min: 檢視新出現的使用者需求和痛點
├── 10 min: 決定下季的迭代優先級
├── 10 min: 決定哪些 Skill 要 retire/archive
└── 5 min: 更新 roadmap
```

### 三條迴路的比較

| 面向 | 使用者回報 | 自動監控 | 季度 Review |
|------|-----------|---------|------------|
| 速度 | 🔴 最快（即時） | 🟡 中（事件驅動） | 🟢 慢（每季） |
| 深度 | 🟡 中等 | 🟢 淺（只看數字） | 🔴 最深 |
| 成本 | 🟢 低 | 🔴 最高 | 🟡 中 |
| 適合 | 初期、少量 Skill | 規模化、線上 Skill | 成熟團隊、大量 Skill |

**理想狀態**：三條迴路同時運作。使用者回報抓到 immediate issues，自動監控發現趨勢異常，季度 review 做策略性調整。

---

## 12.7 什麼時候該 Rewrite vs Refine？

這可能是 Skill 維護中最難的判斷。以下是我的實戰經驗總結。

### 偏向「Refine」（繼續修）的訊號

- ✅ Eval 分數持續在進步（每次迭代 +0.05 以上）
- ✅ 問題範圍是局部的（只有某一個步驟出錯）
- ✅ 修正方式明確（你已經知道要改什麼）
- ✅ 修改量小（改 1–3 行即可）
- ✅ 原始結構還合理（沒有「硬塞」的感覺）

### 偏向「Rewrite」（重寫）的訊號

- ❌ Eval 分數卡在某個 plateau 超過三次迭代
- ❌ 每次修正都引入新的問題（修 A 壞 B）
- ❌ 原始結構已經被 patch 了超過 10 次
- ❌ 新的需求跟原始設計假設完全不同
- ❌ 你花更多時間在解讀 instruction 而不是改進它

### 我的個人決策樹

```
Eval 分數在進步嗎？
├── 是 → 繼續 refine
└── 否 → 每次修完有變好嗎？
    ├── 有，但進步很小 → 試 A/B 測試找更好的做法
    └── 沒有，修了跟沒修一樣 → Rewrite

修改量越來越大嗎？
├── 否 → Refine
└── 是 → 累積 patch 次數 > 10？
    ├── 否 → 還是可以 refine，但要重構
    └── 是 → Rewrite

這個 Skill 還值得救嗎？
├── 任務本身還需要 → Rewrite（但要重新設計）
└── 任務已經不需要了 → Archive，不要 rewrite
```

> ⚠️ **重要的心理建設**：「Rewrite」不是失敗。Skill 跟軟體一樣，v1 的任務就是被 v2 取代。一個被 rewrite 三次的 Skill，比一個從不改的 Skill 健康十倍。

---

## 12.8 真實案例：一個 PDF Skill 的 v1 → v5 演化

最好的學習方式是真實案例。這是一個我實際維護過的 PDF 處理 Skill，花了 5 個月迭代了 5 個主要版本。

### 背景

一個內部用的 `pdf-extract` Skill，任務是從 PDF 中提取文字、表格、和中繼資料。

### Version Matrix

```
Version    Date    Trigger   Instruction   Output   Safety   Overall
─────────────────────────────────────────────────────────────────────
v1        Jan     0.42      0.88          1.00     1.00     0.72
v2        Feb     0.67      0.88          1.00     1.00     0.82
v3        Mar     0.67      0.75          1.00     0.50     0.67  ← 退步
v4        Apr     0.67      0.88          1.00     1.00     0.82
v5        May     0.92      0.95          0.88     1.00     0.93
```

### 每一代發生了什麼

**v1（初始版本）**
```
Description: "Extract content from PDF files."
Eval 發現：Trigger 只有 0.42。Agent 幾乎不叫它。
根因：Description 太抽象。「Extract content」對 Agent 來說太模糊了。
```

**v2（修 Description）**
```
Description: "Extract text, tables, and metadata from PDF files using
pypdfium2 and pdfplumber. Supports OCR fallback for scanned PDFs.
Use when user provides PDF invoices, reports, or academic papers."

Eval：Trigger 升到 0.67。Agent 開始會叫它了。
但 Instruction Following 維持 0.88，沒進步。
下一步：看看 instruction 哪裡有問題。
```

**v3（重構步驟 — 失敗）**
```
變更：把原本 6 個步驟合併成 4 個「階段」，想讓流程更簡潔。
結果：Instruction Following 反而從 0.88 掉到 0.75。
      Safety 從 1.00 掉到 0.50（因為合併步驟時不小心移除了安全檢查）。

教訓：步驟合併 ≠ 步驟優化。對 Agent 來說，明確的步驟比少步驟重要。
      而且改動時要保持 safety checks——這是最容易被「順手移除」的東西。
```

**v4（恢復 + 補強）**
```
變更：
1. 恢復成 6 個步驟（v3 的合併是錯的）
2. 補回所有 safety checks
3. 每一步加上明確的驗證點

Eval：Instruction Following 回到 0.88，Safety 回到 1.00。
但 Trigger 仍然卡在 0.67。
下一步：Trigger 已經卡了三個版本了，需要大改 description。
```

**v5（全面改寫 Description）**
```
變更：Description 從功能清單型改為情境推銷型。加入：
- 具體的使用情境
- "Even if..." 句
- 負面案例（什麼時候不要用）
- 規模暗示（"batch 100+ files"）

新的 Description：
"Extract text, tables, and metadata from scanned PDFs and digital PDFs.
Supports OCR fallback for image-based PDFs, table structure preservation,
and batch processing of 100+ files. Use when you receive PDF invoices,
reports, or academic papers that need structured output. Even if user
just says 'documents' or 'these PDFs' — trigger this skill.
NOT for PDF creation or editing."

Eval：Trigger 0.92！Instruction Following 進步到 0.95！
但 Output Quality 從 1.00 降到 0.88。
根因：新的 description 吸引了更多類型的查詢，其中有些查詢的輸出格式
      跟原本的模板不完全匹配。需要擴充模板。
```

### 關鍵 takeaways

| 版本 | 學到的教訓 |
|------|-----------|
| v1 → v2 | Description 是最大的槓桿。改 description 的效果比改 body 大 3 倍 |
| v2 → v3 | 步驟合併是陷阱。Agent 需要明確的步驟序列，不是人類的「階段思考」 |
| v3 → v4 | Safety checks 是最脆弱的。任何重構都有可能不小心移除它們 |
| v4 → v5 | Description 需要持續優化。不要因為一個版本進步了就停止迭代 |

---

## [DIAGRAM: 迭代循環與儀表板]

```
                    ┌──────────────────────────────────────┐
                    │        Skill 迭代生命週期             │
                    └──────────────────────────────────────┘

                              │
                              ▼
                    ┌──────────────────┐
                    │    Eval 測試     │
                    │  (Trigger, Inst, │
                    │   Output, Safety)│
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   根因分析       │
                    │  三層過濾法      │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
      ┌──────────────┐ ┌────────────┐ ┌──────────────┐
      │ 增量修改     │ │ A/B 測試   │ │ 版本重寫     │
      │ (局部問題)   │ │ (不確定)   │ │ (結構問題)   │
      └──────┬───────┘ └─────┬──────┘ └──────┬───────┘
             │               │               │
             └───────────────┼───────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  變更記錄        │
                    │  Eval History +  │
                    │  Changelog       │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  分數進步？      │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌────────────┐  ┌──────────────┐
        │ 繼續迭代 │  │ 卡住 3 次  │  │ 分數達標    │
        │ (回 Eval)│  │ → 重寫    │  │ → 進入維護期│
        └──────────┘  └────────────┘  └──────┬───────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │  維護模式        │
                                    │  • 使用者回報    │
                                    │  • 自動監控      │
                                    │  • 季度 Review   │
                                    └──────────────────┘
```

**圖 12.1**: Skill 迭代生命週期。每一次迭代從 Eval 開始，經根因分析選擇合適的策略，記錄變更後檢查分數變化。連續三次無進步則觸發重寫決策。分數達標後進入維護模式。

---

```
                    ┌──────────────────────────────────────┐
                    │       Eval 儀表板（季度檢視）        │
                    ├──────────────────────────────────────┤
                    │                                      │
                    │  Skill      Trigger  Inst  Out  Saf  │
                    │  ──────────────────────────────────  │
                    │  pdf-extract  0.92   0.95  0.88 1.00 │
                    │     ▲0.25     ▲0.07  ▼0.12  —      │
                    │  code-review  0.88   0.92  0.95 1.00 │
                    │     ▲0.16     ▲0.04  ▲0.03  —      │
                    │  db-migration 0.95   0.92  1.00 1.00 │
                    │     —        —      —     —         │
                    │  data-cleanup 0.63   0.70  0.75 1.00 │
                    │     ▲0.05    ▲0.07  ▲0.05  —      │
                    │                                      │
                    │  ⚠️ 需要關注：                       │
                    │  • pdf-extract Output ▼0.12          │
                    │    → 新 description 吸引更多查詢    │
                    │      但模板沒跟上，需要擴充          │
                    │  • data-cleanup 進步緩慢             │
                    │    → 考慮 v6 重寫                   │
                    └──────────────────────────────────────┘
```

**圖 12.2**: Eval 儀表板範例。每季更新一次，顯示每個 Skill 的四維分數以及相較上一季的變化（▲▼）。幫助團隊快速掌握哪些 Skill 在進步、哪些需要關注。

---

## 12.9 總結：你需要迭代的徵兆檢查清單

不是所有的 Skill 都需要馬上迭代。但如果你發現以下任何一個徵兆，就是時候行動了：

### 🚨 紅燈（立刻行動）

- [ ] Agent 完全沒叫過這個 Skill（Trigger = 0）
- [ ] 使用者在抱怨「這個 Skill 沒用」
- [ ] Skill 在 production 上造成了資料遺失或服務中斷
- [ ] Eval 分數單次掉超過 0.3

### 🟡 黃燈（本週內規劃）

- [ ] Trigger score < 0.5
- [ ] Instruction Following < 0.7
- [ ] Safety score < 0.8
- [ ] 已經超過 3 個月沒 review 這個 Skill
- [ ] 累積了 3 個以上的使用者修改請求

### 🟢 綠燈（納入下個迭代）

- [ ] Output Quality < 0.8（可能是輸出模板不夠好）
- [ ] 連續兩次 eval 分數 plateau（沒有進步也沒有退步）
- [ ] 環境有變更（API 升級、工具換版、路徑改變）
- [ ] 新的使用場景出現，但 Skill 沒有 cover

### 每季例行檢查

- [ ] 所有 Skill 的 eval 分數都記錄在 Eval History 中
- [ ] 每個 Skill 的 changelog 有更新
- [ ] 至少 review 了 top 3 fail cases
- [ ] 決定哪些 Skill 要 archive（不再需要的）
- [ ] 更新 version matrix

---

## 12.10 練習題

以下練習基於真實案例改編。建議先做練習 1，因為根因分析是所有迭代的基礎。

### 練習 1：分析 Eval 報告，找出根因

**情境**：你有一個 `data-cleanup` Skill，專門用來清理 CSV 資料（移除空值、標準化格式、去除重複）。以下是它的 eval 報告：

```
Trigger Score: 0.92 ✅
Instruction Following: 0.75 🟡
  Fail Cases:
  1. 「清理這個 CSV」→ Agent 跳過了 Step 2（檢查欄位名稱）
  2. 「把日期格式統一」→ Agent 用了 regex 而不是 Skill 指定的 pandas
  3. 「移除重複資料」→ Agent 移除了所有重複，但沒保留第一次出現的那筆
Output Quality: 0.63 🟡
  Fail Cases:
  1. 輸出的 CSV 沒有 header（應該要有）
  2. 日期格式不一致（有些是 YYYY-MM-DD，有些是 MM/DD/YYYY）
  3. 空值處理方式跟模板規定的不同
Safety Score: 1.00 ✅
```

**任務**（請寫下你的分析）：

1. **Instruction Following 問題**：三個 fail cases 各自屬於哪種失敗模式（12.3 的三種模式之一）？根因是什麼？
2. **Output Quality 問題**：三個 fail cases 的共同 root cause 是什麼？（提示：都在同一個 SKILL.md 區塊）
3. **綜合分析**：如果要只改一個地方來解決最多的問題，你改哪裡？為什麼？

<details class="exercise-hint">
<summary>💡 提示</summary>
Instruction Following 的 Case 1（跳過 Step 2）和 Case 2（用了不同工具）可能指向同一個根源——步驟設計問題。Case 3（錯誤的去重邏輯）則可能是 instruction 寫得不夠精確。
</details>

---

### 練習 2：為一個 Skill 設計迭代計畫

**情境**：以下是一個 `deploy-to-staging` Skill 的現狀：

```
Trigger Score: 0.45（太低）
  → Description: "Deploy to staging environment."
  
Instruction Following: 0.60
  → 主要問題：Agent 經常跳過「通知團隊」的步驟
  
Output Quality: 0.90
  → 只有 deploy 失敗時的錯誤訊息格式不一致
  
Safety Score: 0.50
  → Agent 有一次部署到 production（因為拿錯 config file）
```

**任務**：

1. **決定迭代策略**：根據 12.4 的三種策略，你會選哪一種？為什麼？
2. **撰寫新的 description**：將當前的 `"Deploy to staging environment."` 改寫為高觸發率的版本（參考 12.8 v5 的做法）
3. **設計一個解決 Safety 問題的機制**：使用 PVE（Plan-Validate-Execute）或 Gotchas，寫出具體的 instruction
4. **預測改善效果**：你預期改完後每個維度的分數會提升到多少？

**Bonus**：如果你的迭代只允許改動 3 行 text，你會改哪三行？

---

### 練習 3（進階）：比較兩個版本，決定採納哪個

**情境**：你有一個 `code-review` Skill，現在有兩個候選版本。你不知道哪個比較好，所以各跑了 eval：

**A 版本（指令清單型）**
```
Trigger: 0.80
Instruction Following: 0.92
Output Quality: 0.85
Safety: 1.00
```

**B 版本（流程引導型）**
```
Trigger: 0.92
Instruction Following: 0.75
Output Quality: 0.95
Safety: 0.75
```

**任務**：

1. **對比分析**：A 和 B 各自的強項和弱項是什麼？
2. **情境判斷**：如果這個 Skill 是用來 review production 程式的（安全最重要），你會選哪個版本？如果是用來 review 內部工具程式（效率最重要），你會選哪個版本？
3. **混合優化**：你能不能從 A 和 B 中各取一部分，組合成一個 C 版本？具體來說，你會從 A 拿什麼、從 B 拿什麼？
4. **預測 C 版本的分數**：你預期 C 版本的 eval 分數大概會是多少？

<details class="exercise-hint">
<summary>💡 提示</summary>
這題沒有標準答案。重點是你的推理過程——你必須為每一個選擇給出「為什麼」。
</details>

---

> **評估不是終點，迭代才是。每一次 eval 都是一次機會——讓你發現 Skill 可以更好的地方。不要害怕分數低，要害怕的是拿到分數後什麼都不做。**

---

*本章是「Agent Skills 實戰課程」的第 12 章。下一章將進入生態系統篇，探討 Agent Skills 在各大平台上的相容性與發布策略。*

← [Chapter 11：Eval 系統設計](/課程/04-01-eval-system-design) | [Chapter 13：平台生態總覽](/課程/05-01-client-landscape) →
