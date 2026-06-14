---
title: "秘笈 S2：3 分鐘學會 SKILL.md 格式 — 一個檔案就能讓 Agent 學會新技能"
description: "3 分鐘學會 SKILL.md 完整格式：frontmatter 五個欄位、name 命名規則、description 觸發條件、目錄結構、漸進式揭露三層架構，附完整可複製模板。"
outline: [2, 3]
---

# 秘笈 S2：3 分鐘學會 SKILL.md 格式 — 一個檔案就能讓 Agent 學會新技能

> **系列第 2 篇** · 六步精通 Agent Skills 生態 · [上一篇：什麼是 Agent Skills](/agentskills-course/01-foundation/01-01-what-are-agent-skills/article.md)

---

## Hook：你能想像一個 AI 格式，只靠一個檔案就風靡全球嗎？

2025 年底，Anthropic 發布了一個開放標準（Open Standard）。

沒有 SDK，沒有複雜的 CLI，沒有數百頁的 spec。

**就是一個 markdown 檔案。**

放到一個資料夾裡，AI Agent 就會自動學會它。不用編譯、不用註冊、不用安裝。

今天這個生態已經有 **2,600+ 個開源技能**，橫跨 48 個來源倉庫，相容 30+ 個 AI 平台。

而這一切的基礎，就是 **SKILL.md**。

如果你只能學三件事，這篇就是那三件。

---

## 一、最小可行 SKILL.md

先別理論。這是一份**真的能用的技能**：

```markdown
---
name: greet-user
description: |
  Say hello to the user with their name.
  Use when the user first starts a conversation.
---

## Steps

1. Read the user's name from `user.name`
2. Respond with "Hello, {name}! How can I help you today?"
```

就這些。

- 三行 frontmatter（name、description）
- 一段步驟
- 一個檔案

把這個放到 `greet-user/SKILL.md`，任何支援 Agent Skills 的平台都會自動辨識它。當使用者的問題符合 description 描述的場景，Agent 就會載入這個技能，照著步驟執行。

> **「就一個檔案？沒有別的？真的假的？」**
> 真的。技能的 scaling unit 就是一個 SKILL.md。

---

## 二、Frontmatter 欄位：不多不少，五個

SKILL.md 的 frontmatter 用 YAML 格式，夾在 `---` 之間。總共就五個欄位，其中**只有兩個是必須的**：

| 欄位 | 必填 | 類型 | 說明 | 限制 |
|------|------|------|------|------|
| `name` | ✅ | string | 技能名稱 | 最長 64 字元 |
| `description` | ✅ | string | 觸發條件 + 使用情境 | 最長 1024 字元 |
| `license` | ❌ | string | 授權條款 | — |
| `compatibility` | ❌ | array | 環境需求 | — |
| `metadata` | ❌ | object | 自訂鍵值 | — |

⚠️ 還有一個實驗性欄位 `allowed-tools`（工具白名單），目前只有少數平台支援，不建議現在依賴它。

有趣的是 License 欄位。你可能會想「我的技能又不賣錢」。但事實是，**開源社群會直接複製你的技能**。如果你沒寫 License，法律上就是 All Rights Reserved，反而限制了散佈。寫個 MIT 或 Apache 2.0 吧。

[IMAGE: 五個欄位的視覺化比較圖 — 必填 vs 選填，像是一個行李箱只裝必需品]

---

## 三、Name 規則：小寫 + 連字號，就這麼簡單

`name` 欄位的規則可以用一句話說完：

> **只准用小寫字母、數字、連字號，不能連續連字號，不能以連字號開頭或結尾。**

✅ 正確範例：
- `pdf-processing` — 完美
- `data-analysis-v2` — 版本號 OK
- `code-review` — 兩個單字用連字號連接

❌ 錯誤範例：
- `PDF-Processing` — 大寫不行
- `-pdf` — 開頭連字號不行
- `pdf--processing` — 連續連字號不行
- `data_analysis` — 底線不行

為什麼這麼嚴格？因為 `name` 會被用來當作**檔案路徑的一部分**、**唯一識別碼**、**平台間的技能 ID**。大寫在某些檔案系統會出問題，底線在 URL 裡會編碼，連續連字號則容易讓解析器搞混。

> **秘訣**：把 name 當成「技能的身份證字號」來取，不是「技能的標題」。意思是：取完就別改了。

---

## 四、Description：不要描述，要「觸發」

這是整份 SKILL.md 最重要的欄位。

不是因為它最長，而是因為它是**唯一決定 Agent 會不會載入這個技能的東西**。

Agent Skills 的觸發機制（Trigger Mechanism）是：**Agent 自己判斷當前情境是否匹配某個技能的 description。** 注意，它沒得選，它只能看 description。

這造成一個嚴重的實務問題：

> **Agent 傾向 under-trigger。它們會低估自己需要技能。**

如果你寫「Helps with PDFs」，Agent 會想：「嗯，我好像靠自己也能處理 PDF。」然後就不載入了。

你必須寫得更**具體、更 pushy**。

### Before & After 範例

❌ 不 OK 的 description：
```yaml
description: Helps with PDF files.
```

✅ OK 的 description：
```yaml
description: |
  Extract text and tables from PDF files. Use when the user
  provides a PDF document or asks you to read/analyze a PDF.
  This skill handles page parsing, table detection, and
  text extraction with proper encoding.
```

後者做了三件事：
1. 告訴 Agent **「什麼時候用」**（when user provides a PDF）
2. 告訴 Agent **「做了什麼」**（extract text and tables）
3. 告訴 Agent **「你不用就虧了」**（page parsing, table detection, encoding — 這些 Agent 自己不會做）

### 20 筆測試法

實務上，官方建議你準備 20 筆測試查詢：

- **10 筆應該觸發的** — 例如 "幫我讀這個 PDF"
- **10 筆不該觸發的** — 例如 "幫我找餐廳"

每筆跑 3 次，計算觸發率。觸發率 > 0.5 才算通過。用 60% train / 40% validation 分割，避免過擬合。

聽起來很多工？但這其實只要 10 分鐘。而且一旦做好，你對 description 的信心會完全不同。

---

## 五、目錄結構：一個資料夾，四個角色

最低需求就一個檔案：

```
my-skill/
└── SKILL.md
```

但實戰中你會需要更多。官方標準允許這些子目錄：

```
my-skill/
├── SKILL.md          # ✅ 唯一必要
├── scripts/          # 🔧 可執行的程式碼（Python、Shell 等）
├── references/       # 📚 參考文件（PDF、CSV、JSON 等）
└── assets/           # 🖼️ 靜態資源（圖片、模板等）
```

### 什麼時候用什麼？

- **scripts/**：技能需要跑程式才能完成任務。例如「分析 CSV 的技能」附帶一個 Python 腳本做資料視覺化。
- **references/**：技能需要查閱參考資料。例如「寫 API 文件的技能」附帶 OpenAPI spec 範例。
- **assets/**：技能需要輸出或使用靜態資源。例如「生成圖表的技能」附帶空白模板。

**重點**：這些資源是「需要時才載入」（on-demand loading），也就是三層漸進式揭露的 Level 3。Agent 只有在 SKILL.md 裡明確要求時，才會去讀這些檔案。

---

## 六、本文內容：怎麼寫，Agent 才會照做？

Frontmatter 只是身分證。真正的專業知識在 `---` 之後。

這裡沒有強制格式，但經過社群實戰，有幾個鐵律：

### 1️⃣ 步驟化 > 描述化

❌ 不要寫宣告：
```markdown
This skill handles PDF extraction. It uses PyMuPDF for text
extraction and Camelot for table detection.
```

✅ 要寫程序：
```markdown
## Steps

1. Check if the file is a valid PDF by reading its header
2. Use PyMuPDF to extract text page by page
3. If the user asked for tables, use Camelot to detect them
4. Return structured output with text and tables separate
```

Agent 本質上是一個 reasoning engine，它擅長的是**逐步推理**。你給它步驟，它就照著走。你給它描述，它就要自己拆解，而這個拆解過程很可能出錯。

### 2️⃣ Checklist 比段落有用

如果你有一串「發布前要檢查的事項」，用 checklist：

```markdown
## Release Checklist

- [ ] Version bumped in pyproject.toml
- [ ] CHANGELOG.md updated
- [ ] All tests pass
- [ ] Security audit complete
```

Agent 看到 checklist 會一格一格確認，比寫成段落可靠十倍。

### 3️⃣ Gotchas 是最有價值的內容

所謂 gotchas，就是**那些寫在文件角落、新手一定會踩、但老手根本忘了要講的事**。

例如：

```markdown
## Gotchas

- ⚠️ 使用者 ID 在 production DB 叫 `user_id`，
  但在 analytics DB 叫 `uid`。查使用者資料時兩個都要試。
- ⚠️ `/health` endpoint 只檢查 DB 連線，
  不代表所有服務正常。需要完整健康檢查請 call `/ready`。
```

這些資訊對 Agent 來說是**無價的**。Agent 不問就不會知道，但它也不會問，因為它不知道自己不知道。你寫進 gotchas，它就避開了。

### 4️⃣ 給模板，不要只給範例

如果你希望 Agent 輸出特定格式，給模板比給範例更可靠：

````markdown
## Output Format

Return a JSON object with this structure:

```json
{
  "title": "...",
  "confidence": 0.0-1.0,
  "sources": ["..."],
  "summary": "..."
}
```
````

Agent 看到模板會直接複製貼上填空。看到範例則會模仿，但可能偏離結構。

---

## 七、三層漸進式揭露複習

現在你已經看完整份 SKILL.md 的結構了，回顧一下這個系統最巧妙的設計：

[IMAGE: 三層金字塔圖 — Level 1 ~100 tokens, Level 2 ~5000 tokens, Level 3 on-demand]

| 層級 | 載入時機 | 內容 | Token 成本 |
|------|---------|------|-----------|
| **Level 1: Metadata** | 永遠載入 | `name` + `description` | ~100 tokens |
| **Level 2: Instructions** | 觸發時載入 | SKILL.md 本文 | <5000 tokens |
| **Level 3: Resources** | 需要時載入 | scripts/、references/、assets/ | 看檔案大小 |

為什麼這是 genius？

因為 AI Agent 的 context window 是有限的。如果每個技能都完整載入，十個技能就把 context 塞爆了。但有了漸進式揭露，系統可以**同時註冊幾百個技能**（Level 1 的 100 tokens 幾乎沒成本），只有在需要時才載入完整指令。

這就像是圖書館的目錄卡和書的差別。目錄卡可以幾萬張放一排，但你一次只會借一兩本書出來看。

---

## 八、完整模板：直接複製貼上

你現在就可以開始寫自己的第一個技能。用這個模板：

```markdown
---
name: your-skill-name
description: |
  One paragraph describing what this skill does.
  A second paragraph describing when to trigger it.
  Be specific. Be pushy.
license: MIT
compatibility:
  - platform: opencode
  - platform: claude-code
metadata:
  author: your-name
  version: 1.0.0
---

## Overview

Brief one-sentence summary of what this skill achieves.

## Prerequisites

- [ ] Dependency A installed
- [ ] Environment variable B set
- [ ] User has access to C

## Steps

1. First step — be specific
2. Second step — include commands if applicable
3. Third step — check for success criteria

## Output

Description of what the result looks like.
Include a template if output has a fixed format.

## Gotchas

- ⚠️ Thing that will go wrong if you don't handle it
- ⚠️ Edge case that the agent wouldn't think to check

## Verification

- [ ] Run this command to verify success
- [ ] Check that output contains expected value
```

---

## 說說我的感受

我剛接觸 SKILL.md 的時候，第一個反應是：「就這樣？」

**一個 markdown 檔案？沒有 DSL？沒有 SDK？沒有 plugin registry？**

我已經習慣了「要讓電腦做事就要用複雜工具」的思維模式。寫一個 React component 要學 JSX、state management、build tools。寫一個 VS Code extension 要學 contribution points、activation events、extension API。

然後 Agent Skills 告訴你：**寫一個 markdown 檔案就好。**

這其實不是技術上的創新，而是認知上的翻轉。

傳統軟體開發是「讓電腦理解人類意圖」，所以要有嚴格的語法和結構。但 Agent Skills 是「讓 AI 理解人類意圖」，而 AI 最擅長的就是讀 markdown。

> **最強的格式，就是 AI 本來就懂的東西。**

這也是為什麼我對這個生態這麼樂觀。它不是發明新語言，而是把人們已經在用的東西標準化。

下一回，我們要聊一個最容易被低估、但也最關鍵的主題：**怎麼寫 description 才能讓 Agent 一定會觸發你的技能**。這會是整個系列最重要的實戰技巧，沒有之一。

---

**下一篇預告：秘笈 3 — Description 的最佳化科學與藝術**

> **你以為自己寫的 description 夠清楚了？Agent 可不這麼想。**

---

> _這篇文章是「Agent Skills 極速學習秘笈」系列的一部分。全部內容免費公開。_

← [上一篇: S1: Agent Skills 是什麼？](/秘笈/01-what-are-agent-skills) | [下一篇: S3: Description 觸發優化](/秘笈/03-description-optimization) →
