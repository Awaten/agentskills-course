---
title: "秘笈 S1：Agent Skills 是什麼？為什麼你需要它"
description: "Agent Skills 是給 AI Agent 讀的指令集，一個資料夾 + SKILL.md 就能讓 Agent 學會新技能。了解它如何讓 Agent 從玩具變工具，以及為什麼這是被低估的關鍵拼圖。"
outline: [2, 3]
---

# 秘笈 S1：Agent Skills 是什麼？為什麼你需要它

---

刷到一條 GitHub 推文，有點誇張。

有人花了幾個月，從 48 個開源倉庫裡，挖出 **2,600 多個 AI Agent 技能**。全部整理成同一種格式，放在 GitHub 上。目前 20K stars。

我的第一反應：又一個生態系標準在搶山頭？還是這東西真的有料？

仔細看下去，我發現自己錯了。這不是另一個框架——它可能是讓 AI Agent 從「玩具」變「工具」的關鍵拼圖。

---

## 看到一個資料夾 + 一個 .md 檔案

先給你看它的長相：

```
my-skill/
├── SKILL.md          # 唯一必要檔案
├── scripts/          # 選用：可執行程式碼
├── references/       # 選用：參考文件
└── assets/           # 選用：靜態資源
```

就這樣。一個資料夾，一個 `SKILL.md` 檔案。

放進你的專案，AI Agent 就自動學會一個新技能。

> **它不是給人類看的文件，是給 AI Agent 讀的指令集。**

這點很重要。差別在哪？人類看文件會自動補上背景知識——Agent 不會。人類看「請先安裝依賴」會自己 `npm install`——Agent 不知道 `npm install` 是不是第一步。

所以 SKILL.md 的寫法完全不一樣：具體、步驟化、有預設值、有避坑清單。像在教一個很聰明但完全沒有常識的新人。

[IMAGE: 一個 SKILL.md 檔案內容的截圖範例，左邊是資料夾結構，右邊是 SKILL.md 內容高亮]

---

## 從哪來的？

2025 年底，**Anthropic**（Claude 的開發商）發布了這個開放標準。

不是封閉規格，沒有 vendor lock-in。開放格式，任何人、任何平台都可以實作。

官網是 [agentskills.io](https://agentskills.io)，GitHub 專案叫 [agentskills/agentskills](https://github.com/agentskills/agentskills)。

到今天，生態規模是這樣的：
- **2,600+** 開源技能
- **48** 個來源倉庫
- **30+** 平台相容
- **20K** GitHub stars

⚠️ 數字每天在跳，我寫這篇時大概是這樣。實際數字可能更高。

---

## 為什麼你需要它？

講個情境。

你讓 Agent「幫我發一篇 FB 貼文」。Agent 知道怎麼用瀏覽器，知道怎麼打字，知道怎麼點按鈕。

但它不知道的是：
- 貼文格式要用 Hook + 三個觀點 + CTA
- 要先在草稿模式填好，不能直接按發布
- 發布前要等 Telegram 確認
- 發布後要不要同步 Threads

這些叫做 **context**。Agent 預設是沒有的。

Agent Skills 解決的，就是這個問題。

> **Tools 給 Agent 能力，Skills 給 Agent 專業。**

---

## 跟 Tools、MCP、Plugins 有什麼不同？

這是我當初最困惑的地方。直接給一張表：

| | Tools | MCP | Plugins | Agent Skills |
|---|---|---|---|---|
| **本質** | 單一函式 | 通訊協定 | 平台擴充 | 專業知識封裝 |
| **舉例** | `search()`、`calc()` | 連資料庫、連 API | VS Code 插件 | FB 發布流程、程式碼審查 |
| **跨平台** | ✅ 是 | ✅ 是 | ❌ 綁平台 | ✅ 純文字檔 |
| **要寫程式？** | 要 | 要 | 要看平台 | **不用**（.md 就行） |

- **Tools**：單一功能。搜尋就搜尋、計算就計算。不包含流程。
- **MCP**：Agent 跟外部系統說話的「電話線」。連上資料庫、連上 API，但不知道打電話之後要做什麼。
- **Plugins**：綁特定平台。Cursor 的插件不能在 Claude 用，Copilot 的插件不能在 Gemini 用。
- **Agent Skills**：**專業知識的封裝**。一個 SKILL.md 就是一本「怎麼做這件事」的手冊。

三句話記住：
- **Tools** = 你的工具
- **MCP** = 你的電話線
- **Agent Skills** = **你的專業**

[IMAGE: 四格對比圖，分別用圖示表示 Tools / MCP / Plugins / Agent Skills 的關係與定位]

---

## 三層漸進式：Agent 怎麼讀你的 Skill？

Agent Skills 有個很聰明的設計，叫做 **Progressive Disclosure**（漸進式揭露）。

不是一股腦把整份文件丟給 Agent，而是分三層：

```
Level 1: 中繼資料 (~100 tokens)
    ↓  Agent 掃描所有可用技能
Level 2: 完整指令 (<5000 tokens)
    ↓  觸發特定技能，載入 SKILL.md
Level 3: 資源檔案 (需要時載入)
    ↓  參考 scripts/、references/、assets/
```

**Level 1 — 永遠載入**
只有 `name` 和 `description`。Agent 啟動時，掃描所有技能的這 100 個 tokens，知道「有哪些技能可以用」。

**Level 2 — 觸發時載入**
當 Agent 判斷某個技能符合當前任務，才載入完整的 `SKILL.md`。不浪費 tokens，不讓 Agent 分心。

**Level 3 — 需要時載入**
如果技能需要執行腳本、看參考文件、讀圖，才去載 `scripts/`、`references/`、`assets/`。

這個設計的巧妙在於：**Agent 的 context window 是有限的**。你不能讓 100 個技能的全部內容同時塞爆 Agent 的記憶體。三層架構讓 Agent 只載入需要的，剛好夠用。

[IMAGE: 三層式揭露的示意圖，從 Level 1（小圓）到 Level 3（大圓），越往內越完整]

---

## 哪些平台已經支援？

30+ 平台。幾個你大概聽過的：

- **Claude Code** — 原生支援（Anthropic 親兒子）
- **Cursor** — Agent 模式直接吃
- **GitHub Copilot CLI** — 有專用 `skill` 工具
- **Gemini CLI** — 透過 `activate_skill` 載入
- **OpenCode** — 原生支援，還有三層記憶系統擴充
- **Windsurf**、**Codex CLI**、**Cline**… 名單持續增加中

共通點：它們都有某種「載入外部指令集」的機制。Agent Skills 只是把這個機制標準化了。

不需要為每個平台重寫技能。寫一次，到處用。

---

## 說說我的感受

我看完這個生態的第一反應是：**這東西被低估了。**

為什麼？因為 AI Agent 目前最大的瓶頸，從來不是模型能力不夠。

GPT-4o、Claude 4、Gemini 2.5 — 這些模型都很強。但它們在真實工作流程中就是會出包。為什麼？因為它們缺少 domain context。

Agent Skills 解決的，恰恰是這個問題。而且是從根上解決——用一種開放、輕量、跨平台的方式。

想想看：你把十次踩坑經驗寫成一個 SKILL.md，以後每次 Agent 做這件事，就自動避開那十個坑。**知識被濃縮、被複用、被傳承。**

這不只是「寫文件」。這是在教 Agent 像一個有經驗的同事那樣工作。

而我覺得，這才剛剛開始。

---

## 今天就試

1. 去 [github.com/agentskills/agentskills](https://github.com/agentskills/agentskills) 逛逛
2. 看幾個開源技能長什麼樣
3. 想一個你每天在做的重複任務——那可能就是你的第一個 Skill

**下一篇：S2 — SKILL.md 格式，3 分鐘看懂**

我會拆解 SKILL.md 的每一個欄位，告訴你 name 怎麼取才對、description 怎麼寫才會被觸發、目錄結構有哪些坑。

---

> _這篇文章是「Agent Skills 極速學習秘笈」系列的一部分。全部內容免費公開。_

[下一篇: S2: SKILL.md 格式 3 分鐘](/秘笈/02-skills-md-format) →
