---
title: "從零建置你的第一個 Agent Skill"
description: "從零開始建置一個完整的 Agent Skill，包含目錄結構、SKILL.md 撰寫、Python 輔助腳本、觸發測試與發布流程的實戰教學。"
outline: [2, 3]
---

# Chapter 4：從零建置你的第一個 Agent Skill

---

## 學習目標

完成本章後，你將能夠：

1. **建立** 一個符合開放標準的 Agent Skill 目錄結構（`agents/skills/<name>/`）與核心檔案 SKILL.md
2. **撰寫** 有效的 frontmatter（name + description），使其在正確的時機被 Agent 觸發，並避免誤觸
3. **測試** Skill 在 AI Agent 中的觸發行為，運用系統化方法（20 筆測試查詢）診斷 description 的缺陷
4. **整合** Python 輔助腳本（argparse + exit code），讓 Skill 從「指引建議」升級為「可執行的工作流程」
5. **加入** 執行前/中/後三層校驗機制，確保 Agent 執行結果的正確性與一致性
6. **準備** Skill 發布所需的檢查清單與授權設定，區分社群發布與團隊內部使用的差異

---

## 4.1 為什麼需要親手建置一個 Skill？

前三章我們從概念面理解了 Agent Skills 是什麼、SKILL.md 的格式細節，以及它與 Tools、MCP、Plugins 的本質差異。但理解概念與能夠實際動手之間，存在一條必須親自跨越的鴻溝。

這章的目的很單純：**帶你從零開始，建立一個真正會動的 Agent Skill。**

我們選擇的主題是「擲骰子」（roll-dice）——不是因為它實用，而是因為它夠簡單。你不需要理解業務領域、不需要設定 API 金鑰、不需要處理外部依賴。你能夠完全專注在 Skill 本身的結構與開發流程上。

如同程式設計的第一支 Hello World，重點不在於程式本身的價值，而在於你完整走過了一次「建立 → 撰寫 → 測試 → 強化 → 發布」的循環。之後面對真實世界的複雜任務，你已經有了可重複的流程框架。

### 為什麼是「從零建置」而非「下載現成」？

截至 2026 年中，agentskills.io 上已有 2,600+ 個開源技能——其中一定包含擲骰子。你可能會問：為什麼不直接下載一個現成的就好？

原因是：**下載一個 Skill 只讓你學會「如何使用」，從零建置一個 Skill 則讓你學會「如何設計」。** 兩者的差異，就像開車與造車。你不需要會造車才能開車，但如果你想為特定團隊或專案打造專屬技能，你就需要理解造車的原理。

更實際的理由是：真實世界的技能幾乎永遠需要客製化——你的團隊有獨特的部署流程、你的專案有特殊的編碼規範、你的客戶有特定的溝通格式。這些都不在開源技能中。從零建置的經驗，正是你應對這些需求的能力基礎。

此外，從零建置能讓你學到一個關鍵洞察：**Agent Skills 的本質不是程式，而是知識封裝。** 當你親自走過每一個步驟，你會發現最困難的部分從來不是寫程式——而是如何將一個模糊的需求（「讓 Agent 學會擲骰子」）轉化為 Agent 可以精確執行的步驟序列。這種「需求→指令」的轉化能力，才是 Agent Skills 開發者最核心的技能。

### 這章的結構

本章採用「Step 1 → Step 2 → … → Step 7」的線性結構，每一步都建立在前一步的基礎上。你可以按順序跟著做，約 30 分鐘內可以完成一個完整的 Skill。

---

## 4.2 前置準備

在開始之前，請確認你具備以下環境：

| 項目 | 需求 | 備註 |
|------|------|------|
| 文字編輯器 | 任何一款（VS Code、Sublime Text、Neovim 等） | 不需特定 IDE |
| 終端機 | Bash / PowerShell / Zsh | 用於執行目錄建立與測試指令 |
| Python 3 | 3.8 以上 | 用於撰寫輔助腳本 |
| AI Coding Agent | Claude Code、Cursor、OpenCode、Gemini CLI 其中之一 | 用於測試 Skill 觸發 |
| Git（選用） | 任一版本 | 用於版本控制與發布 |

> ⚠️ 如果你使用的是不支援 Agent Skills 的平台（如純 ChatGPT Web 介面），本章的部分測試環節將無法進行。建議先安裝一個支援的 Agent 工具（Claude Code 或 OpenCode 都是免費選項）。

### 沒有 Agent 也能測試 SKILL.md

如果你暫時無法使用支援 Agent Skills 的平台，仍然可以透過「**心智模擬**」的方式進行初步驗證：

1. **Frontmatter 格式檢查**：確認 YAML 區塊的 `---` 成對出現，name 全小寫且無底線
2. **步驟完整性檢查**：逐項檢視你的步驟清單——如果一個對這個領域不熟悉的人按照你的步驟操作，能否得到正確結果？
3. **邊界條件檢查**：列出你自己的「10 個應觸發 + 10 個不應觸發」查詢，手動對照 description——哪一個查詢的關鍵字在 description 中缺少對應詞？
4. **腳本獨立測試**：直接在終端機執行 `python scripts/roll.py`，確認語法正確、輸出格式固定、exit code 行為符合預期

這些步驟雖然無法完全取代真實的 Agent 測試，但可以捕捉到 80% 以上的格式與邏輯錯誤。

---

## 4.3 Step 1：建立 Skill 目錄

每個 Agent Skill 的起點都是一個資料夾。這個資料夾的名稱就是你的 Skill 識別名稱，通常與 SKILL.md 中的 `name` 欄位一致。

在終端機執行：

```bash
mkdir -p agents/skills/roll-dice
cd agents/skills/roll-dice
```

這個指令做了兩件事：
1. 在目前工作目錄下建立 `agents/skills/roll-dice/` 的路徑結構
2. 將當前目錄切換到剛建立的 Skill 資料夾內

### 為什麼是這個路徑？

`agents/skills/` 是 Agent Skills 生態中最常見的約定目錄，多數支援平台會自動掃描這個位置。其他常見的搜尋路徑包括：

| 平台 | 預設掃描路徑 |
|------|-------------|
| Claude Code | `~/.claude/skills/`、專案下 `agents/skills/` |
| OpenCode | `~/.opencode/skills/`、`.opencode/skills/` |
| Cursor | 專案下 `.cursor/skills/` |
| Gemini CLI | 透過 `activate_skill` 工具載入 |

如果你不確定該放哪裡，**`agents/skills/` 是最通用的選擇**。

### 目錄與三層漸進式揭露的關係

到目前為止我們只建立了一個空資料夾，但這個資料夾的結構已經決定了 Progressive Disclosure（漸進式揭露）的運作方式：

- **Level 1（中繼資料，~100 tokens）**：Agent 在啟動時掃描所有 `**/SKILL.md` 檔案，**只讀取 frontmatter 中的 `name` 和 `description`**。這時它不知道你的 body 內容，只知道自己有這個 Skill 可用。
- **Level 2（完整指令，< 5000 tokens）**：當 Agent 判斷某個任務與你的 `description` 匹配時，才會載入完整的 SKILL.md body。
- **Level 3（資源檔案）**：`scripts/`、`references/`、`assets/` 目錄下的檔案，只在 Agent 執行到需要它們的步驟時才會讀取。

這個設計的關鍵意義在於：**僅僅建立一個空的目錄結構，就已經參與了 Agent 的資源管理機制。** 後續加入 SKILL.md 和 scripts/ 時，Agent 會自動按照這套分層邏輯來載入它們，完全不需要你手動設定。

### 如果 Agent 找不到你的 Skill

Skill 目錄的放置位置直接影響 Agent 能否找到它。如果你發現 Agent 完全沒有載入你的 Skill，先確認：

1. 目錄是否在 Agent 的掃描範圍內（參閱上方各平台路徑表）
2. 目錄權限是否允許 Agent 讀取（在部分企業環境中，`~/.claude/` 可能被 IT 政策封鎖）
3. 目錄名稱是否包含特殊字元（建議只用小寫英文字母與連字號）

---

## 4.4 Step 2：撰寫 SKILL.md — Frontmatter 與 Body

在 `agents/skills/roll-dice/` 目錄下建立 `SKILL.md`。這是整個 Skill 的核心——Agent 唯一會主動讀取的檔案。

### 4.4.1 Frontmatter（中繼資料區塊）

Frontmatter 是 SKILL.md 頂端以 `---` 包夾的 YAML 區塊，包含 Agent 用於判斷「是否該載入這個 Skill」的中繼資料。

```yaml
---
name: roll-dice
description: >
  Roll a virtual die and return a random number between 1 and N.
  Use when the user asks to roll dice, generate random numbers,
  or simulate dice throws. NOT for general "pick a number" requests.
---
```

#### name 欄位規則（嚴格遵守）

`name` 是 Skill 的唯一識別碼，Agent 用它來引用和管理技能。規則如下：

| 規則 | ✅ 正確範例 | ❌ 錯誤範例 |
|------|-----------|-----------|
| 全小寫 | `roll-dice` | `Roll-Dice` |
| 只用連字號分隔 | `roll-dice` | `roll_dice`（底線）、`roll.dice`（句點） |
| 不連續連字號 | `roll-dice` | `roll--dice` |
| 不以連字號開頭或結尾 | `roll-dice` | `-roll-dice`、`roll-dice-` |
| 最多 64 字元 | `a-very-long-skill-name-that-is-still-valid` | 超過 64 字元即無效 |

> ⚠️ 格式不符的 name 不會觸發錯誤訊息——Agent 只會靜默跳過你的 Skill。這是初學者最常踩的陷阱。

#### description 欄位撰寫原則

`description` 是 Agent 判斷「當前任務是否需要這個 Skill」的**唯一依據**。一個有效的 description 應包含三層資訊：

| 層級 | 說明 | 範例（本 Skill） |
|------|------|-----------------|
| 核心功能 | 這個 Skill 做什麼 | Roll a virtual die and return a random number between 1 and N |
| 觸發情境 | 哪些使用者請求會用到它 | when the user asks to roll dice, generate random numbers |
| 邊界提示 | 哪些情況不應觸發 | NOT for general "pick a number" requests |

**實務建議**：完成初版 description 後，列出 10 個應該觸發的查詢與 10 個不該觸發的查詢，逐一測試。如果觸發率低於 50%，表示 description 需要強化。

一個常見的誤解是 description 越長越好。實際上，**description 的精準度比長度更重要**。Agent 掃描 description 的方式類似關鍵字比對——過多的修飾語會稀釋觸發詞的權重，導致該觸發的時候不觸發。建議將 description 控制在 200–400 個字元之間，同時包含功能描述、觸發情境與邊界提示三層資訊。

### 4.4.2 Body（主體指令）

Frontmatter 下方是 SKILL.md 的主體內容，使用 Markdown 格式撰寫。這是 Agent 載入後會讀取的完整指令。

```markdown
# Roll Dice Skill

Roll one or more dice with configurable number of sides.

## When to use

- User asks "roll a d20" or "give me a random number"
- You need a random integer in a game or decision-making context
- Testing randomness or probability

## How to use

1. Ask the user: "How many sides? (default: 6)"
2. Ask the user: "How many dice? (default: 1)"
3. Run `python scripts/roll.py --sides {N} --count {M}`
4. Read the output and present it to the user

## Output format

Always format the result as:

**Result**: 🎲 You rolled a **[value]** on a d**[sides]**!

Example: 🎲 You rolled a **17** on a d20!

## How NOT to use

- Do NOT use for cryptographic randomness
- Do NOT use for weighted/probability decisions without explicit consent
- Do NOT invent random numbers yourself — always run the script
```

### 關鍵設計原則

**原則一：程序 > 宣告。** 不要寫「本 Skill 提供擲骰子功能」，而是寫「問使用者要幾面骰 → 問要幾顆 → 執行腳本 → 呈現結果」。Agent 是步驟驅動的，它需要的是動作序列，不是功能分類。編號清單（1. 2. 3.）的效果遠優於段落描述——Agent 對數字順序的服從度明顯高於對自然語言的理解。

**原則二：輸出格式必須明確指定。** 如果你不給範例，Agent 會在每次執行時自行發明格式——結果就是使用者在不同時間看到完全不同的回覆風格，這會造成困惑。給出具體的範例模板（包括 emoji 和粗體標記）可以讓輸出保持一致。

**原則三：反面指令（How NOT to use）與正面指令同等重要。** Agent 需要知道哪些行為是禁止的。沒有反面指令，Agent 可能在不適合的場景（如需要加密安全的亂數）中使用你的 Skill。反面指令的寫法建議使用「Do NOT」開頭，並標明具體的禁止行為——模糊的「請謹慎使用」對 Agent 來說沒有約束力。

### 加入 Gotchas：隱藏陷阱比最佳實務更有價值

知識庫中強調一個關鍵概念：**Gotchas（避坑事項）是 SKILL.md 中最高價值的內容。** 這些是環境特定的事實——Agent 不問就不會知道的隱藏陷阱。在 SKILL.md 中加入 Gotchas 段落可以顯著減少 Agent 出錯的機會：

```markdown
## Gotchas

- Windows 環境下，`python scripts/roll.py` 中的正斜線（/）可以正常運作，
  不需要改為反斜線（\）
- Agent 在執行腳本時應使用完整路徑，而非相對路徑——如果工作目錄不正確，
  腳本可能無法被找到
- 使用 `exit(main())` 而非 `main()` 可以確保 exit code 被正確傳遞給
  呼叫者（在某些環境中，`main()` 不回傳 exit code）
```

這些資訊在任何官方文件中都找不到——它們來自於實際使用經驗。**你在開發過程中踩到的每一個坑，都應該轉化為 Gotchas 段落中的一則條目。**

### Body 撰寫的常見錯誤對照表

為了幫助你避開初學者最常犯的錯誤，以下是三組「錯誤 vs 正確」的對照：

| 層面 | ❌ 錯誤寫法 | ✅ 正確寫法 |
|------|-----------|-----------|
| 步驟模糊 | `Roll the dice and show the result.` | `1. Ask user for number of sides (default: 6). 2. Ask user for number of dice (default: 1). 3. Run python scripts/roll.py --sides {N} --count {M}. 4. Read the output and present it.` |
| 輸出格式不明 | `Display the result in a nice format.` | `Format as: 🎲 You rolled a **{value}** on a d**{sides}**!` |
| 無錯誤處理 | `If something goes wrong, handle it.` | `Check exit code: if 0, present output; if non-zero, show error to user and ask if they want to retry.` |

每一列都對應一個真實案例——這些錯誤在社群中反覆出現，幾乎每個初學者都會踩到至少其中一個。

讀過第三章（最佳實務）的讀者會記得一個重要原則：**提供預設值，而不是提供選單。** 意思是，在 SKILL.md 中，應該直接告訴 Agent 在沒收到使用者參數時該做什麼，而不是讓 Agent 列出選項讓使用者選擇。

以擲骰子 Skill 為例：

```
❌ 不好：Ask the user: "How many sides? Options: 4, 6, 8, 10, 12, 20, 100"
✅ 較好：Ask the user: "How many sides? (default: 6)"
```

前者讓 Agent 陷入選單模式——列出所有選項，等待使用者選擇。後者則讓 Agent 可以在使用者沒有指定時直接使用預設值，大幅減少對話來回次數。這在真實工作流程中非常重要：**每多一次對話往返，使用者對自動化的信任就減少一分。**

---

## 4.5 Step 3：在你的 Agent 中測試

檔案寫好了，現在要驗證 Agent 是否真的會載入它。這一步往往是最耗時的——不是因為技術困難，而是因為你無法直接控制 Agent 的內部決策過程，只能從行為推斷。

### 3.1 基本觸發測試

在支援 Agent Skills 的平台中，直接輸入觸發查詢：

```
請幫我擲一顆骰子
```

觀察 Agent 的反應。你可能會遇到以下三種狀況：

| 狀況 | 現象 | 原因 | 解決方案 |
|------|------|------|---------|
| **A：完美觸發** | Agent 載入 Skill 並依步驟執行 | description 精準、body 結構清晰 | 繼續下一步 |
| **B：無反應** | Agent 自己亂猜一個數字，沒有載入 Skill | description 不夠具體，Agent 認為自己可以處理 | 強化 description，加入更多觸發關鍵字 |
| **C：步驟錯亂** | Agent 載入了 Skill，但跳過步驟或順序錯誤 | body 的指令不夠線性，缺少編號 | 改用編號清單，加入明確的順序指示 |

### 3.2 為什麼 Agent 會「偷懶」不載入你的 Skill？

狀況 B 是最常見也最令人挫折的。原因很微妙：**Agent 的底層模型本身就能回答「隨機數字」這類問題。** 當你的 description 不夠有說服力時，Agent 的直覺反應是「我自己來就好，不需要載入額外工具」。

這不是 bug，而是 Agent 的 token 經濟學——載入一個 SKILL.md 需要消耗 context window 的空間，Agent 的內部機制會權衡「載入的成本」與「載入的效益」。如果你的 description 沒有讓它覺得「這個 Skill 比我直接回答更好」，它就不會載入。

解決方案有幾個方向：

1. **強調權威性**：在 description 中強調 Skill 包含可驗證的腳本（"includes a verifiable Python script"）
2. **使用大寫觸發詞**：Agent 的 tokenizer 對大寫詞彙的權重更高，適當使用 "WHEN THE USER ASKS TO ROLL DICE" 可以提升觸發率
3. **明確寫出「不要自己猜」**：在 body 中加入 "Do NOT invent random numbers yourself — always run the script"

### 3.3 系統化測試方法

單一次測試通過不代表你的 description 夠好。根據實務經驗，**一個可靠的 description 需要經過至少 20 筆測試查詢的驗證**：

1. 準備 10 個**應該觸發**的查詢（如「擲骰子」、「roll a d20」、「給我一組亂數」）
2. 準備 10 個**不該觸發**的查詢（如「幫我決定晚餐」、「今天運勢如何」、「推薦一本書」）
3. 逐一測試，記錄每次是否觸發
4. 計算觸發率：應觸發的觸發次數 / 10（目標 > 0.7）

如果一個應觸發的查詢在連續 3 次測試中都被忽略，表示你的 description 中缺乏該查詢的關鍵觸發詞。將這個查詢的關鍵字加入 description 後重新測試。

### 3.4 邊界測試

除了觸發率測試，還需要測試錯誤情境：

- 「幫我決定晚餐吃什麼」（**不該**觸發 — 這是決策，不是擲骰）
- 「給我一個 1 到 100 的隨機數字」（**應該**觸發 — 這是亂數產生）
- 「今天運氣如何？」（**不該**觸發 — 這是占卜，不是隨機）
- 「擲一個 100 面骰」（**應該**觸發 — 這是合法的骰子規格）
- 「擲一個 -5 面骰」（**應該**觸發，但需觸發錯誤處理 — 數值不合法）

### 3.5 平台驗證指令

部分平台提供指令來檢查 Skill 是否被正確載入：

```bash
# Claude Code
skills list              # 列出所有可用 Skill
skills show roll-dice    # 顯示特定 Skill 內容

# OpenCode
skill list
skill show roll-dice
```

如果你的平台不支援即時 Skill 列表，可以透過觀察 Agent 的行為來判斷：

- **已載入的特徵**：Agent 在回應中提到「根據 roll-dice skill」或「讓我執行腳本」
- **未載入的特徵**：Agent 直接回答一個數字，沒有任何引用 Skill 的跡象
- **部分載入的特徵**：Agent 知道要擲骰子，但步驟不符合 SKILL.md 中的描述

> ⚠️ 如果 Agent 完全不回應你的任何查詢，且你確定程式碼沒有問題，請先確認 Skill 是否放在正確的掃描路徑下。某些平台在非標準路徑下不會自動掃描。

---

## 4.6 Step 4：加入 Python 輔助腳本

純文字的 SKILL.md 有一個根本限制：**Agent 可以不執行任何程式碼，自己編造答案。** 對擲骰子這類簡單任務，Agent 自己編的數字可能正確（雖然你可能無法驗證它是否真的有執行），但對於需要計算、資料轉換、API 呼叫的任務，Agent 的幻覺會導致錯誤結果。

解法是提供一支 Agent 可以實際執行的腳本，讓它不再需要猜測。這也對應到 Progressive Disclosure 的 Level 3（資源檔案）——腳本只在需要時才被讀取和執行，不會浪費 context window。

### 為什麼選擇 Python？

Python 是 AI Agent 生態中最普遍支援的腳本語言，理由包括：

- **跨平台**：Windows、macOS、Linux 皆可執行
- **零依賴**：隨機數生成使用標準函式庫 `random`，不需要安裝第三方套件
- **Agent 熟悉度高**：大多數 AI Agent 對 Python 語法的理解程度最高，腳印最輕
- **argparse 原生支援**：Agent 可以透過 `--help` 自動理解參數，不需要額外文件

如果你的團隊生態以 Node.js 為主，也可以選擇 JavaScript/TypeScript——選擇標準是「Agent 能順暢執行的語言」，而非「你最熟悉的語言」。

### 建立 scripts/roll.py

```python
#!/usr/bin/env python3
"""Roll a virtual die with configurable sides and count."""
import random
import argparse

def main():
    parser = argparse.ArgumentParser(description="Roll a die")
    parser.add_argument("--sides", type=int, default=6,
                        help="Number of sides (default: 6)")
    parser.add_argument("--count", type=int, default=1,
                        help="Number of dice (default: 1)")
    args = parser.parse_args()

    # Validate inputs
    if args.sides < 2:
        print("Error: sides must be >= 2")
        return 1
    if args.count < 1:
        print("Error: count must be >= 1")
        return 1

    results = [random.randint(1, args.sides) for _ in range(args.count)]
    total = sum(results)

    print(f"Results: {results}")
    print(f"Total: {total}")
    return 0

if __name__ == "__main__":
    exit(main())
```

### 腳本設計要點

| 設計決策 | 理由 |
|---------|------|
| 使用 `argparse` 且提供 `--help` | Agent 會自行讀取 help 來理解參數，降低使用門檻 |
| 參數有合理的預設值（`sides=6`, `count=1`）| Agent 不傳參數時仍能正常運作 |
| 包含輸入驗證（sides >= 2, count >= 1） | 防止 Agent 傳入不合理參數 |
| 回傳值為 exit code（0 成功 / 1 錯誤） | Agent 可以根據 exit code 判斷執行是否成功 |

### 在終端機測試腳本

```bash
python scripts/roll.py --sides 20
# 輸出範例：Results: [17]  Total: 17

python scripts/roll.py --sides 6 --count 3
# 輸出範例：Results: [4, 2, 6]  Total: 12

python scripts/roll.py --help
# 顯示完整參數說明
```

---

## 4.7 Step 5：更新 SKILL.md 整合腳本

有了可執行的腳本後，需要讓 SKILL.md 明確指引 Agent 如何使用它。在 body 中加入 Execution 段落：

```markdown
## Execution

When asked to roll dice, follow these steps exactly:

1. Ask the user: "How many sides? (default: 6)"
2. Ask the user: "How many dice? (default: 1)"
3. Run `python scripts/roll.py --sides {N} --count {M}`
4. Check the exit code:
   - If 0: read the output and present it
   - If non-zero: report the error message to the user
5. Format the result as: 🎲 **{value}** on a d**{sides}**

### Examples

| Command | Output |
|---------|--------|
| `python scripts/roll.py --sides 20` | Results: [17]  Total: 17 |
| `python scripts/roll.py --sides 6 --count 3` | Results: [4, 2, 6]  Total: 12 |
| `python scripts/roll.py --sides 1` | Error: sides must be >= 2 |
```

### 整合後的觸發流程

加入腳本和執行段落後，完整的觸發流程如下：

[DIAGRAM: 完整觸發與執行流程圖。從「使用者輸入『擲骰子』」開始，分岔為三條路徑：(1) Agent 先掃描所有可用 Skill 的 frontmatter（Level 1），比對 description 是否匹配「擲骰子」；(2) 匹配成功後載入完整 SKILL.md（Level 2），讀取 Execution 段落的編號步驟；(3) 執行 python scripts/roll.py（Level 3），檢查 exit code——若為 0 則格式化輸出並回覆使用者，若非 0 則顯示錯誤訊息。每個階層旁的備註標示該步驟對應的 Progressive Disclosure 層級。]

這個流程圖揭示了三個重要的設計洞察：

1. **Agent 在三個層級之間動態切換**：從 Level 1（掃描）→ Level 2（載入指令）→ Level 3（執行腳本），每個層級都有明確的進入與退出條件
2. **腳本執行是唯一會離開 SKILL.md 的步驟**：其他所有步驟（問問題、格式化輸出、驗證）都在 SKILL.md 的指令範疇內完成
3. **錯誤路徑同樣需要明確定義**：exit code 非 0 時該做什麼，必須在 SKILL.md 中預先寫好——Agent 不會自行推斷「腳本失敗時該怎麼辦」

---

## 4.8 Step 6：加入驗證與邊界處理

Agent 最常見的問題不是「不會做」，而是「做了但沒檢查」。加入驗證機制可以大幅提升輸出品質。

### 校驗循環（Verification Loop）

校驗循環是 Agent Skills 中一個關鍵的設計模式。它的運作邏輯是：

```
執行 → 驗證 → 發現問題 → 修正 → 重新驗證 → 通過才繼續
```

這個循環在 SKILL.md 中的呈現方式很簡單：在執行步驟之後，加入一組明確的檢查項目。Agent 在讀取 SKILL.md 時，會依照文件的線性順序處理——先讀到執行步驟，再讀到驗證步驟，自然會在校驗失敗時回頭修正。

> **為什麼 Agent 需要被「強迫」驗證？** 因為 Agent 的思維模式本質上是「產生式」而非「審查式」。它傾向於產生答案並繼續前進，而不是停下來檢查自己的產出。明確寫入 SKILL.md 的驗證步驟，相當於在 Agent 的執行流程中強制插入一個檢查點。

### 6.1 在 SKILL.md 中加入 Validation 段落

```markdown
## Validation

After execution, always verify:

- ✅ Result values are between 1 and N (inclusive)
- ✅ If multiple dice: total equals sum of individual results
- ✅ If the result seems suspicious (e.g., all dice show the same
     value 10 times in a row), offer to re-roll
- ✅ Exit code was 0 (if not, show the error to the user)
```

### 6.2 驗證的三個層級

| 層級 | 時機 | 檢查項目 |
|------|------|---------|
| 執行前驗證 | 腳本運行之前 | Python 3 是否可用？`scripts/roll.py` 是否存在且可執行？ |
| 執行中驗證 | 腳本運行期間 | Exit code 是否為 0？輸出格式是否符合預期？ |
| 執行後驗證 | 結果產出之後 | 數值是否在合理範圍內？邏輯是否自洽（total = sum）？ |

### 6.3 常見邊界情況測試

| 測試案例 | 預期結果 |
|---------|---------|
| `--sides 2` | 結果為 1 或 2（硬幣模擬） |
| `--sides 100` | 結果在 1–100 之間 |
| `--sides 0` | 錯誤訊息：sides must be >= 2 |
| `--count 0` | 錯誤訊息：count must be >= 1 |
| `--sides 6 --count 100` | 100 個結果，每個都在 1–6 之間 |

---

## 4.9 Step 7：準備發布與分享

當你的 Skill 經過測試並穩定運作後，可以考慮分享給團隊或社群。

### 7.1 發布前檢查清單

這份清單來自實際發布經驗——每一項都對應一個真實踩過的坑：

- [ ] **name 格式正確**：全小寫、連字號、不超過 64 字元
- [ ] **description 經過實測**：至少測試 5 個應觸發與 3 個不應觸發的查詢；觸發率 > 0.7
- [ ] **SKILL.md 不超過 500 行**：超過表示塞了太多內容，應拆為多個 Skill，或將參考資料移到 `references/` 目錄
- [ ] **腳本都有 `--help`**：Agent 會自行讀取 help 理解參數——沒有 help 的腳本，Agent 使用率會顯著下降
- [ ] **沒有寫死的憑證**：API Key、Token、密碼等應使用環境變數或獨立設定檔
- [ ] **跨平台測試**：如果可能，在至少兩個不同的 Agent 平台上測試（如 Claude Code + OpenCode）
- [ ] **README.md 存在**（選用）：如果你打算發布到公開倉庫，一份給人類看的 README 可以幫助其他開發者理解你的 Skill

> 🚫 **絕對禁止**：在 SKILL.md 或 scripts/ 中嵌入任何形式的 credentials。Skill 是設計來分享的——你永遠無法控制誰會 fork 你的儲存庫。

### 7.2 加入授權資訊

在 SKILL.md 的 frontmatter 中加入授權欄位，明確宣告你的 Skill 可以如何被使用：

```yaml
---
name: roll-dice
description: >
  Roll a virtual die and return a random number between 1 and N.
license: MIT
---
```

常見的授權選擇：

| 授權 | 適合情境 | 說明 |
|------|---------|------|
| MIT | 開放原始碼、社群分享 | 最寬鬆——任何人可以自由使用、修改、散布 |
| Apache 2.0 | 企業專案 | 類似 MIT，但包含專利授權條款 |
| GPL v3 | 強制開源 | 使用此授權的程式碼必須以相同授權釋出 |
| CC BY-NC 4.0 | 僅供非商業使用 | 不適合在商業環境中使用，但可自由分享修改 |
| 自訂 | 團隊內部使用 | 不公開發布時，可省略 license 欄位 |

> ⚠️ 如果你不指定 `license`，預設為「All Rights Reserved」——這意味著其他人不能合法複製或修改你的 Skill。如果你希望社群使用你的 Skill，請務必加入明確的授權標示。

### 7.3 發布到社群 Registry

官方社群位於 [github.com/agentskills/agentskills](https://github.com/agentskills/agentskills)，目前收錄 2,600+ 開源技能，是 Agent Skills 生態最大的集中式倉庫。發布流程：

1. Fork 官方倉庫到你的 GitHub 帳號
2. 將你的 Skill 整個資料夾複製到 `skills/` 目錄
3. 確認你的 SKILL.md 包含有效的 frontmatter（name、description、license）
4. 提交 Pull Request，在描述中說明你的 Skill 用途
5. 社群維護者 Review 後合併
6. 你的 Skill 出現在官方 Registry，所有支援 Agent Skills 平台的皆可搜尋使用

**發布前建議先搜尋**：確認社群中是否已有功能類似的 Skill。如果有的，你的 Skill 可以提供差異化價值（如更好的 description、更完整的腳本、更詳盡的 troubleshooting）——直接複製一個已有的 Skill 並不會為生態帶來價值。

### 7.4 加入 Git 版本控制

```bash
git init
git add SKILL.md scripts/roll.py
git commit -m "feat: add roll-dice skill"
```

---

## 4.10 持續迭代：第一個 Skill 之後

你的第一個 Skill 不會是最終版本。Agent Skills 的開發本質上是**疊代式**的——你會根據實際使用經驗不斷調整和改進。

### 典型疊代路徑

```
v1: 純文字指引（SKILL.md only）
  → 發現 Agent 自己編數字 → 加入腳本
v2: SKILL.md + roll.py
  → 發現 Agent 跳過步驟 → 改用編號清單
v3: 編號步驟 + 輸出格式範例
  → 發現 Agent 不檢查結果 → 加入 Validation
v4: 加入三層驗證
  → 準備發布 → 加入 license + README
v5: 發布到社群
```

每一次疊代都對應一個真實的使用問題。**不要追求第一個版本就完美——先讓它動起來，再讓它變好。**

### 從使用數據學習

如果你的 Skill 發布後被他人使用（或你自己持續使用一段時間），可以透過以下方式收集改進方向：

- **觀察 Agent 的回應風格**：是否每次都按照 SKILL.md 的格式輸出？如果沒有，表示格式指令需要強化
- **記錄使用者的常見問題**：使用者最常問的「非預期問題」往往暗示著 description 的邊界條件需要調整
- **追蹤 GitHub Issue**：如果你發布到公開倉庫，其他人提交的 Issue 是最直接的回饋來源

### 擴展方向

當你的骰子 Skill 穩定運作後，可以考慮以下擴展方向：

| 方向 | 說明 | 難度 |
|------|------|------|
| 支援 RPG 格式 | 解析 `2d6+3` 這類骰子表達式 | 中（需修改 roll.py 的參數解析邏輯） |
| 加入機率計算 | 擲骰後顯示「擲出這個結果的機率是 X%」 | 中（需加入組合數學計算） |
| 歷史記錄 | 記錄每次擲骰結果，支援「再擲一次」功能 | 高（需引入持久化儲存） |
| 多語言支援 | 同時支援英文和繁體中文的 description | 低（description 中並列兩種語言即可） |
| 錯誤對策強化 | 根據不同的錯誤類型提供不同的復原建議 | 低（在 Troubleshooting 段落擴充即可） |

這些擴展方向顯示一個重要規律：**大多數擴展只需要修改 SKILL.md（文字層）或 scripts/（執行層），不需要改動目錄結構或 frontmatter。** 這意味著你的 Skill 可以隨著需求成長，而不需要從頭來過。

---

## 4.11 完整目錄結構

全部步驟完成後，你的 Skill 目錄結構如下：

```
agents/skills/roll-dice/
├── SKILL.md          # Agent 唯一會主動讀取的指令檔案
└── scripts/
    └── roll.py       # Agent 依照 SKILL.md 指示執行的輔助腳本
```

兩個檔案，不到 50 行程式碼（含註解），就建立了一個可以跨平台運作的 AI 專業技能。對比傳統 Plugin 開發（安裝 SDK → 撰寫 API handler → 打包 → 提交審核 → 等待平台合併），開發效率差距在一個數量級以上。

### 目錄結構的設計哲學

你可能會注意到這個結構非常精簡——沒有 `package.json`、沒有 `pyproject.toml`、沒有 `Dockerfile`、沒有 CI 設定檔。這是刻意為之的設計決策：

- **SKILL.md 是唯一 Agent 會主動讀取的檔案**。其他所有檔案都是被動引用——Agent 只會在 SKILL.md 明確要求時才會去讀取它們。
- **這種設計強制你將核心指令集中在一個檔案中**。這與傳統軟體開發的「分離關注點」原則不同——在 Agent Skills 中，將所有步驟寫在同一個檔案中，反而能確保 Agent 看到完整的上下文。
- **Scripts 目錄的存在是選擇性的**。如果你的 Skill 只需要指引 Agent 的行為而不需要執行程式碼（如程式碼審查規範、溝通禮儀規則），你甚至可以完全不需要 scripts/ 目錄。

---

## 4.12 常見問題排除

| 問題 | 可能原因 | 解決方案 |
|------|---------|---------|
| Agent 完全沒有載入 Skill | description 不夠具體，或 name 格式錯誤 | 強化 description 觸發詞；檢查 name 是否全小寫、只用連字號；測試 description 的觸發率是否 > 0.5 |
| Agent 載入但跳過步驟 | Body 指令不夠線性，使用段落而非編號 | 改用編號清單取代段落描述；每個步驟只做一件事；避免「同時」這類模糊詞 |
| Agent 自己編數字不執行腳本 | SKILL.md 沒有明確要求執行，或沒有給執行指令 | 加入 Execution 段落，寫明「Always run the script」；在 description 中強調腳本的存在 |
| 腳本執行但 Agent 忽略輸出 | 缺少驗證機制 | 加入 Validation 段落，要求 Agent 檢查 exit code 與輸出內容；寫明「Read the script output exactly」 |
| 平台找不到 Skill | 目錄路徑不在掃描範圍 | 確認 Skill 放在平台支援的掃描路徑下；檢查目錄權限；確認目錄名稱無特殊字元 |
| 同一個 Skill 被多次載入 | Agent 每次處理相關任務都重新載入 | 這是正常行為——Agent 的每次回應都是獨立判斷，無法跨請求保留 Skill 狀態 |
| Agent 載入錯誤的 Skill | 兩個 Skill 的 description 太相似 | 檢查是否有其他 Skill 的 description 也匹配相同查詢；為每個 Skill 定義更明確的邊界條件 |
| Python 腳本回傳錯誤但 Agent 沒察覺 | Agent 只看 stdout，忽略 stderr 和 exit code | 在 SKILL.md 中明確要求檢查 exit code；要求 Agent 顯示 error output |
| 在 Windows 環境下腳本路徑錯誤 | Windows 使用反斜線，但 Agent 可能用正斜線 | 在 SKILL.md 中使用 `python scripts/roll.py`（正斜線在 Windows 也相容）；指定明確的工作目錄 |

### 疑難排解流程圖

當你遇到問題時，可以依照以下順序檢查：

1. **檢查 SKILL.md 格式**：frontmatter 是否正確（`---` 包夾 YAML）？name 是否全小寫？description 是否包含觸發詞？
2. **確認路徑**：Skill 資料夾是否在 Agent 的掃描範圍內？嘗試放在 `agents/skills/` 這個最通用的位置。
3. **腳本可執行性**：在終端機手動執行 `python scripts/roll.py`，確認沒有語法錯誤或遺失依賴。
4. **測試 description**：用最直接的查詢測試（如「擲骰子」），如果還是不觸發，表示 description 需要大幅強化。
5. **檢查 Agent 日誌**：部分平台提供除錯模式（Claude Code 的 `--verbose`、OpenCode 的除錯設定），可以查看 Agent 是否嘗試載入 Skill。如果平台不支援除錯模式，可以透過觀察回應的細節來判斷——載入 Skill 的回應通常會包含引用或步驟說明。未載入的回應則通常是簡潔的直接回答。

---

## 4.13 本章摘要

Agent Skill 的開發遵循一個可重複的七步驟流程：

| 步驟 | 動作 | 產出 | 關鍵要點 |
|------|------|------|---------|
| 1 | 建立目錄 | `agents/skills/roll-dice/` | 目錄名稱應與 skill name 一致 |
| 2 | 撰寫 SKILL.md | `SKILL.md`（frontmatter + body） | name 全小寫連字號；description 含功能+情境+邊界 |
| 3 | 測試觸發 | 驗證 Agent 載入行為 | 同時測試應觸發與不應觸發的情境 |
| 4 | 加入腳本 | `scripts/roll.py` | 使用 argparse、提供預設值、含輸入驗證 |
| 5 | 整合 SKILL.md | Execution 段落指引 Agent 使用腳本 | 寫明步驟順序、exit code 處理方式、輸出格式範例 |
| 6 | 加入驗證 | Validation 段落 | 執行前/中/後三層檢查 |
| 7 | 準備發布 | 檢查清單 + Git 初始化 | 確認無 credentials 寫死、加入授權資訊 |

### 七步驟流程作為可重複模式

這七個步驟不僅適用於 roll-dice Skill，它是任何 Agent Skill 開發的通用流程模式：

| 階段 | 核心問題 | 適用時機 |
|------|---------|---------|
| Step 1–2（建立 + 撰寫） | 這個 Skill 的觸發條件和行為是什麼？ | 所有 Skill 的起點 |
| Step 3（測試） | Agent 真的會載入它嗎？ | 每次修改 description 後 |
| Step 4–5（腳本 + 整合） | 如何讓 Agent 實際執行而非猜測？ | 需要數值計算、資料處理、API 呼叫時 |
| Step 6（驗證） | 如何確保結果正確？ | 執行結果會被用於後續決策時 |
| Step 7（發布） | 如何讓他人也能使用？ | Skill 穩定後，或需要團隊協作時 |

在你建立下一個 Skill 時，可以直接複用這個流程，只需要更換「擲骰子」的業務邏輯即可。

核心原則回顧：

1. **程序 > 宣告**：Agent 需要的是步驟序列，不是功能分類。用編號清單取代段落描述。
2. **輸出格式必須指定**：不指定格式，Agent 每次會自行發明。給出具體範例模板。
3. **Script 讓 Skill 從指引升級為可執行**：純文字 Skill 只能給建議；有腳本的 Skill 能執行任務。
4. **驗證不是選項，是必需品**：沒有校驗機制的 Agent 會產出看似合理但錯誤的結果。執行前/中/後三層檢查。
5. **Description 決定一切**：這是 Agent 觸發 Skill 的唯一依據，值得投入最多時間打磨。至少準備 20 筆測試查詢。

---

## 練習題

### Q1（建置練習）— 建立 Greeting Skill
按照本章的步驟，從零建立一個 `greeting-skill`，使其在 Agent 收到「打招呼」類請求時觸發，並輸出固定格式的回覆：「👋 Hello, {name}! Welcome to Agent Skills.」

<details class="exercise-hint">
<summary>💡 提示</summary>
這個練習不需要 Python 腳本——純 SKILL.md 即可完成。專注於 description 的觸發詞設計，確保 `"hello"`、`"hi"`、`"greetings"` 等關鍵字都能觸發，但 `"help"` 或 `"start"` 這類不相關的詞不會誤觸。
</details>

**完成標準**：
- SKILL.md 含有效 frontmatter（name + description）
- Body 包含 When to use、How to use、Output format 三個段落
- 至少測試 3 個應觸發與 2 個不應觸發的查詢

### Q2（修改練習）
修改本章的 `roll-dice` Skill，將骰子面數的預設值從 6 改為 20，並更新 SKILL.md 中的步驟說明與輸出範例，使其保持一致。

<details class="exercise-hint">
<summary>💡 提示</summary>
需要修改兩個地方——`scripts/roll.py` 的 `default=6` 參數，以及 SKILL.md 中所有提及預設值的範例。
</details>

### Q3（強化練習）
為 `roll-dice` Skill 加入錯誤處理機制。在 SKILL.md 中新增一個 Troubleshooting 段落，涵蓋以下情境：
- 使用者輸入負數面數時該怎麼回應
- Python 環境未安裝時該怎麼處理
- 腳本回傳非零 exit code 時的應對步驟

<details class="exercise-hint">
<summary>💡 提示</summary>
參考 4.12 節（常見問題排除）的表格格式，用「問題 → 原因 → 解決方案」的結構撰寫。
</details>

### Q4（設計練習）— 安全的 API 金鑰處理
你有一個需要 API 金鑰的第三方服務。請在 SKILL.md 中設計一套機制，讓使用者可以安全地提供金鑰，而不需要將金鑰寫死在 SKILL.md 或腳本中。

<details class="exercise-hint">
<summary>💡 提示</summary>
搜尋「environment variables」在 Agent Skills 中的常見使用模式。思考 `.env` 檔案的優缺點——它雖然避免了金鑰寫死在程式碼中，但 `.env` 檔案本身仍可能被不小心提交到 Git 倉庫。
</details>

**完成標準**：
- SKILL.md 中沒有任何明文 API 金鑰
- 至少提出兩種不同的金鑰提供方式
- 說明每種方式的安全性權衡

### Bonus Challenge（進階挑戰）

將你的 `roll-dice` Skill 改造成支援 RPG 格式的骰子表達式，例如 `2d6+3`（擲兩顆六面骰，總和加 3）。你需要：

1. 修改 `scripts/roll.py` 以支援解析 `2d6+3` 格式
2. 更新 SKILL.md 中的 Execution 段落，說明新的使用方式
3. 加入至少三個輸出範例
4. 在 Validation 中加入檢查：多顆骰子的結果總和是否正確

**額外目標**：完成後，測試你的 Agent 是否能正確處理「幫我擲 3d8+5」這樣的自然語言請求。

---

## 延伸閱讀

| 資源 | 說明 |
|------|------|
| [Chapter 2：SKILL.md 格式深度解析](../02-hands-on/02-02-skills-md-reference/course-article.md) | name 命名規則、description 優化技巧、目錄結構進階配置 |
| [Chapter 5：Description 優化 — 讓 Agent 在對的時間找你](../03-crafting/03-02-description-optimization/article.md) | 觸發詞設計、A/B 測試方法、20 筆測試查詢的完整流程 |
| [Chapter 6：7 個寫出高效 Instructions 的套路](../03-crafting/03-01-best-practices/article.md) | 程序性指令、校驗循環、模板輸出、避坑清單的撰寫技巧 |
| [agentskills.io](https://agentskills.io) | 官方網站，包含完整規格說明與生態資訊 |
| [github.com/agentskills/agentskills](https://github.com/agentskills/agentskills) | 官方 GitHub 倉庫，2,600+ 開源技能可供參考 |

---

*下一章：Chapter 5 — SKILL.md 欄位完整參考。我們將逐一拆解 frontmatter 中每一個欄位的用途、限制與最佳實務，並深入探討 allowed-tools、compatibility 等進階欄位的使用時機。*

---

<!--
Professional teaching style — Chapter 4 of 17
Course: Agent Skills 實戰線上課程
Topic: 從零建置你的第一個 Agent Skill
-->

---

← [上一章: Ch3: Skills vs Tools vs MCP](/課程/01-03-why-skills) | [下一章: Ch5: SKILL.md 完整參考](/課程/02-02-skills-md-reference) →
