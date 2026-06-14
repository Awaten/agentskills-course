---
title: "Chapter 16：發布與分享你的 Skill"
description: "學習如何將 Skill 發布到 agentskill.sh、GitHub 或企業內部，包含 README 撰寫、授權選擇、語意化版本與 Skillset 打包策略。"
outline: [2, 3]
---

# Chapter 16：發布與分享你的 Skill

你花了好幾個小時，甚至好幾天，寫好了一份 SKILL.md。你反覆測試了 description 的觸發率、驗證了指令的準確性、補上了所有踩過的 Gotchas——它是個紮實的好技能。

然後呢？

Skill 的價值不在於它存在你的硬碟裡，而在於它能被別人使用。這章要解決的就是這個問題：**如何把你的 Skill 包裝好、發布出去、讓全世界（或你的團隊）都能安裝使用。**

---

## 學習目標

完成本章後，你將能夠：

1. **選擇** 適合的發布管道——GitHub、agentskill.sh registry、或私有 registry——取決於你的目標受眾
2. **準備** 一個符合發布標準的 Skill 倉庫，包含 README、LICENSE、使用範例
3. **發布** Skill 到 agentskill.sh registry，包含正確的格式、中繼資料（Metadata）與版本號
4. **設計** Skillset——將多個相關技能打包，讓使用者一條指令安裝完整工具組
5. **應用**  Semantic Versioning 於 Skill 版本管理，清楚傳達改動的影響範圍
6. **最佳化** 技能的可發現性——讓使用者在搜尋時正確找到你的技能
7. **選擇** 合適的開源授權條款，理解 MIT、Apache、GPL 對使用者的意義

---

## 16.1 發布管道的選擇

Agent Skills 的生態系提供了多種發布管道，每一種適合不同的場景。

### 16.1.1 GitHub：最基礎的發布方式

GitHub 是 Agent Skills 生態的起點。在最簡單的形式中，發布一個 Skill 就是建立一個 GitHub 倉庫，把 SKILL.md 放進去。

```
my-awesome-skill/
├── SKILL.md          # 必要：技能的核心指令
├── README.md         # 強烈建議：給人類看的說明
├── LICENSE           # 建議：授權條款
├── scripts/          # 選用：輔助腳本
├── references/       # 選用：參考文件
└── examples/         # 選用：使用範例
```

**優點**：
- 零門檻——如果你會用 Git，你就會發布
- 完整的版本控制——每個 release 都有歷史記錄
- GitHub Issues + PRs——社群回饋機制直接內建
- 被 agentskill.sh 自動索引——你不需要額外註冊

**缺點**：
- 需要使用者手動 clone 或下載
- 沒有統一的安裝指令
- 發現性（discoverability）較低——使用者在 GitHub 上找到你的技能需要運氣

GitHub 適合：**你想分享但還不確定是否值得上 registry 的實驗性技能**，或是**你打算長期維護、希望完全掌控發布流程的技能**。

### 16.1.2 agentskill.sh Registry：一鍵安裝

**agentskill.sh** 是 Agent Skills 社群的命令列商店，類似於 npm 之於 JavaScript、Homebrew 之於 macOS。它的核心價值是一條指令完成安裝：

```bash
agentskill.sh install code-review
```

安裝過程自動完成三件事：
1. 從來源倉庫下載 SKILL.md 及相關資源
2. 放到當前專案或使用者目錄的正確位置
3. 顯示使用說明

對使用者來說，這是最低摩擦的安裝體驗。對發布者來說，發布到 agentskill.sh 也不需要複雜的審核流程——只要你的技能符合格式規範，就可以被索引。

> **⚠️ 注意**：agentskill.sh 本身不儲存你的技能檔案。它是一個索引層——你的技能仍然託管在 GitHub 或其他 Git 倉庫，agentskill.sh 只是讓它能被搜尋到、並且能透過一條指令安裝。

**什麼時候適合上 registry？**
- 你的技能已經通過了基本測試（觸發率 > 0.5，指令遵循度穩定）
- 你願意維護它（至少回應 issue）
- 你希望被最多人使用

### 16.1.3 私有 Registry：企業內部發布

企業團隊通常不需要把技能發布到公開 registry。他們需要的是**內部發布管道**——讓團隊成員可以安裝公司專屬的技能。

目前私有發布主要有三種做法：

| 方式 | 做法 | 適合 |
|------|------|------|
| **內部 Git 倉庫** | 在公司 GitLab/Bitbucket 上建立技能倉庫，團隊成員手動 clone | 小團隊（< 10 人） |
| **私有 agentskill.sh registry** | ⚠️ agentskill.sh 尚未正式支援私有 registry（預計 2026 Q3） | 中大型團隊 |
| **專案內嵌** | 直接把技能目錄放進專案 repo 的 `.opencode/skills/` 下 | 專案特定技能 |

對於大多數團隊，「專案內嵌」其實是最務實的做法。把技能直接放在專案倉庫中：
- 版本與專案同步——不需要額外的發布流程
- 新成員 clone 專案時自動獲得所有技能
- PR review 機制涵蓋技能變更

```bash
your-project/
├── .opencode/
│   └── skills/
│       ├── deploy-workflow/    # 部屬流程技能
│       ├── code-review/        # 程式碼審查技能
│       └── logging-guide/      # 日誌查閱技能
├── src/
└── README.md
```

---

## 16.2 準備發布：建立技能倉庫

不論你選哪個管道，發布前的準備工作是一樣的。一個乾淨、完整的技能倉庫，會讓使用者（和未來的你）少很多困惑。

### 16.2.1 README.md：給人類看的說明

這是最多人忽略的環節——你的 SKILL.md 是給 Agent 讀的，但你的 README.md 是給**人類**讀的。

使用者在安裝你的技能之前，會先看 README 來決定「這東西值不值得裝」。一個好的 README 應該回答四個問題：

```
1. 這是什麼？        → 專案名稱 + 一句話描述
2. 解決什麼問題？    → 使用場景說明
3. 怎麼安裝？        → 安裝指令
4. 怎麼用？          → 快速範例
```

一個參考模板：

```markdown
# code-review

> AI Agent 專用的 Pull Request 審查技能。自動檢查程式碼風格、潛在 bug、安全漏洞。

## 安裝

```bash
agentskill.sh install code-review
```

## 快速開始

安裝後，在支援 Agent Skills 的平台（Claude Code、Cursor、Copilot CLI 等）中，
直接對 Agent 說「幫我 review 這個 PR」，Agent 就會自動載入本技能。

## 功能

- 檢查程式碼風格是否符合專案慣例
- 標記潛在的邏輯錯誤與邊界情況
- 掃描常見的安全漏洞（SQL injection、XSS 等）
- 生成結構化的 review comment

## 授權

MIT

## 貢獻

歡迎提交 Issue 或 PR。請參見 CONTRIBUTING.md。
```

**關鍵區別**：README.md 是**行銷文件**——它要讓人在 30 秒內決定安裝。SKILL.md 是**指令文件**——它要讓 Agent 在執行時知道每一步做什麼。兩者目的完全不同，不要混在一起寫。

### 16.2.2 LICENSE：保護你的權益

開源不等於「沒有授權」。事實上，**沒有 LICENSE 檔案的倉庫，在法律上預設為「保留所有權利」——別人不能合法使用你的程式碼。**

這一點對 Agent Skills 特別重要，因為：
- SKILL.md 的內容是「指令」而不是「程式碼」，在某些法律體系中其著作權定位較模糊
- 使用者需要明確知道「我可不可以修改這個技能？能不能商用？」
- 未來的 agentskill.sh registry 可能會要求 LICENSE 才能發布

我將在 16.6 詳細討論授權條款的選擇。這裡的重點很簡單：**發布前，加一個 LICENSE 檔案。**

### 16.2.3 examples/：使用範例

一個使用範例比十行說明更有說服力。在倉庫中加入 `examples/` 目錄，放一個完整的實際應用案例。

對於 Agent Skills，「使用範例」不是程式碼範例，而是**提示詞範例**——展示使用者應該對 Agent 說什麼來觸發這個技能：

```markdown
# examples/basic-usage.md

## 範例 1：基本審查

使用者說：
```
幫我 review 這個 PR：#42
```

Agent 會：
1. 讀取 PR #42 的 diff
2. 逐檔案檢查程式碼
3. 輸出結構化的 review comment

## 範例 2：指定審查重點

使用者說：
```
幫我 review 這個 PR：#56，特別注意安全性問題
```

Agent 會：
1. 讀取 PR #56 的 diff
2. 優先檢查 OWASP Top 10 相關的漏洞模式
3. 在 review comment 中標記「安全」類別的問題
```

---

## 16.3 發布到 agentskill.sh

當你的技能準備好後，發布到 agentskill.sh 的流程非常直接。

### 16.3.1 發布流程

```
本地開發 → 推送至 GitHub → agentskill.sh publish → 審核（可選）→ 上架
```

具體步驟如下：

#### 步驟 1：準備倉庫

確認你的 GitHub 倉庫包含以下檔案：

- `SKILL.md` — 必要，技能核心
- `README.md` — 強烈建議
- `LICENSE` — 建議
- `agentskill.json` — 建議，registry 中繼資料（見下節）

#### 步驟 2：發布指令

```bash
agentskill.sh publish
```

這個指令會：
1. 偵測當前目錄是否為 Git 倉庫
2. 讀取 SKILL.md 的 name 和 description
3. 檢查必要的欄位是否完整
4. 將你的技能提交到 registry 索引
5. 回傳一個發布 URL

#### 步驟 3：確認上架

```bash
agentskill.sh search "你的技能名稱"
```

搜尋結果中應該出現你的技能。如果沒有，檢查：
- SKILL.md 的 `name` 是否與其他技能衝突？
- `description` 是否太短（< 20 字元）？
- Git 遠端倉庫是否設為 public？

> ⚠️ **關於審核機制**：截至撰寫本文時，agentskill.sh 的發布是**自動化的**——符合格式規範就會上架，不需要人工審核。但 registry 團隊保留對低品質或惡意技能的移除權力。這與 npm 的策略類似。

### 16.3.2 agentskill.json：中繼資料

雖然 agentskill.sh 可以從 SKILL.md 自動讀取 `name` 和 `description`，但如果你想要更豐富的呈現（分類、標籤、作者資訊），你需要一個額外的 `agentskill.json`：

```json
{
  "name": "code-review",
  "version": "1.2.0",
  "description": "AI Agent 專用的 Pull Request 審查技能",
  "author": "Your Name <email@example.com>",
  "repository": "https://github.com/yourname/code-review",
  "license": "MIT",
  "tags": ["code-review", "pr-review", "quality-assurance"],
  "categories": ["development", "quality"],
  "minClientVersion": "1.0.0",
  "compatibility": {
    "platforms": ["claude-code", "cursor", "copilot-cli", "gemini-cli", "opencode"]
  },
  "skillset": "developer-tools"
}
```

各欄位說明：

| 欄位 | 必要 | 說明 |
|------|------|------|
| `name` | ✅ | 與 SKILL.md 的 name 一致 |
| `version` | ✅ | Semantic Version（見 16.5） |
| `description` | ✅ | 與 SKILL.md 的 description 一致 |
| `author` | ❌ | 維護者聯絡資訊 |
| `repository` | ❌ | 原始碼倉庫 URL |
| `license` | ❌ | SPDX 授權識別碼（如 MIT、Apache-2.0） |
| `tags` | ❌ | 搜尋關鍵字，最多 10 個 |
| `categories` | ❌ | 分類：`development`、`devops`、`security`、`writing` 等 |
| `minClientVersion` | ❌ | 最低 agentskill.sh 客戶端版本 |
| `compatibility` | ❌ | 宣告支援的平台列表 |
| `skillset` | ❌ | 所屬的 Skillset 名稱（見 16.4） |

### 16.3.3 版本更新

發布新版本：

```bash
# 更新版本號（自動推斷）
agentskill.sh publish --patch   # 1.0.0 → 1.0.1
agentskill.sh publish --minor   # 1.0.0 → 1.1.0
agentskill.sh publish --major   # 1.0.0 → 2.0.0

# 或手動指定版本
agentskill.sh publish --version 1.3.0
```

---

## 16.4 Skillset：打包相關技能

單一技能解決單一問題。但真實的開發工作流程通常需要多個技能協同——程式碼審查需要 linting 知識、需要安全檢查、需要測試覆蓋率評估。

**Skillset** 就是為這個而設計的：將多個相關技能打包成一個主題包，使用者一條指令安裝完整工具組。

### 16.4.1 Skillset 的結構

一個 Skillset 本質上是一個 JSON 或 YAML 清單檔案，宣告了包含哪些技能：

```json
// skillset.json — 以 web-development 為例
{
  "name": "web-development",
  "version": "2.1.0",
  "description": "Web 開發者必備技能包 — 前端、後端、安全、部署",
  "skills": [
    {
      "name": "code-review",
      "version": "^1.2.0",
      "source": "https://github.com/yourname/code-review"
    },
    {
      "name": "accessibility-check",
      "version": "^0.4.0",
      "source": "https://github.com/yourname/a11y-check"
    },
    {
      "name": "api-design-review",
      "version": "^2.0.0",
      "source": "https://github.com/yourname/api-design"
    },
    {
      "name": "dockerfile-lint",
      "version": "^1.0.0",
      "source": "https://github.com/yourname/dockerfile-lint"
    }
  ],
  "compatibility": {
    "minCliVersion": "1.2.0"
  }
}
```

### 16.4.2 安裝 Skillset

使用者只需要一條指令：

```bash
agentskill.sh install-skillset web-development
```

這條指令會：
1. 解析 skillset.json
2. 依序安裝所有列出的技能
3. 如果某個技能已安裝，檢查版本是否符合範圍
4. 顯示安裝摘要

### 16.4.3 設計好的 Skillset

好的 Skillset 不是「把所有技能列在一起」，而是有明確的主題和邊界：

| 好的 Skillset | 不好的 Skillset |
|---------------|-----------------|
| `python-dev` — Python 開發相關技能 | `my-favorites` — 我喜歡的技能大雜燴 |
| `security-basics` — 安全檢查相關技能 | `security` — 所有安全技能（太大包） |
| `ci-cd-pipeline` — CI/CD 管線相關技能 | `useful-stuff` — 有用的東西（太模糊） |

**設計原則**：
- 每個 Skillset 解決一個**具體的領域問題**（「讓 Agent 會做 Python 開發」）
- 技能數量控制在 **5-15 個**——太少沒必要打包，太多安裝太久
- 版本範圍使用 **Caret（^）**——相容性更新自動接受，重大更新不自動升級
- 定期更新——如果技能生態變了，Skillset 也要跟著調整

---

## 16.5 Semantic Versioning for Skills

你的 Skill 會隨著時間演進。你會修正描述詞、調整步驟順序、新增 Gotchas——每一次變更都有可能影響使用者的體驗。

**Semantic Versioning（語意化版本）** 為版本號賦予意義，讓使用者一看就知道「這次更新影響多大」。

### 16.5.1 格式

```
MAJOR.MINOR.PATCH
  │      │      └── PATCH：向後相容的錯誤修正
  │      └──────── MINOR：向後相容的功能新增
  └─────────────── MAJOR：不向後相容的重大變更
```

### 16.5.2 對應到 Skill 的變更類型

Agent Skills 的版本號語意與一般軟體有些不同。以下是具體對照：

#### PATCH（1.0.0 → 1.0.1）

適用於不影響功能的正向變更：
- 修正錯字或文法錯誤
- 更新已失效的外部連結
- 調整範例中過時的指令
- 補充一個新的 Gotcha（只要不改變既有步驟）

#### MINOR（1.0.0 → 1.1.0）

適用於新增功能但不破壞現有使用方式：
- 新增一個可選步驟
- 加入新的使用情境範例
- 擴充 description 以提升觸發率
- 新增相容平台宣告
- 加入新的 scripts 輔助工具

#### MAJOR（1.0.0 → 2.0.0）

適用於不向後相容的變更：
- 移除或重新命名步驟
- 改變 description 的語意（可能導致觸發行為改變）
- 變更指令的執行順序
- 刪除原有的 scripts 或 resources
- 改名（name 欄位變更）

### 16.5.3 版本鎖定

使用者在安裝技能時，可以指定版本範圍：

```bash
# 安裝特定版本
agentskill.sh install code-review@1.2.0

# 安裝 minor 範圍內最新版
agentskill.sh install code-review@^1.0.0

# 安裝 major 範圍內最新版
agentskill.sh install code-review@~1.0.0
```

這在團隊協作中特別重要——確保所有成員使用相同版本的技能，避免「你的 Agent 行為跟我的不一樣」的混亂。

---

## 16.6 License 的選擇

授權條款決定了別人可以對你的技能做什麼。雖然 Agent Skills 的內容是「指令」而非「程式碼」，但一個明確的 LICENSE 檔案仍然是專業發布的必要元件。

### 16.6.1 三種常見授權

| 授權 | 允許修改 | 允許商用 | 必須標註出處 | 衍生作品必須相同授權 |
|------|----------|----------|--------------|---------------------|
| **MIT** | ✅ | ✅ | ✅ | ❌ |
| **Apache 2.0** | ✅ | ✅ | ✅ | ❌（但專利授權有額外保障） |
| **GPL 3.0** | ✅ | ✅ | ✅ | ✅（Copyleft） |

### 16.6.2 對 Agent Skills 的建議

**MIT** 是目前 Agent Skills 生態系中最常見的授權（約占 80%+ 的開源技能）。原因很直接：

- Agent Skills 的核心價值是**被廣泛使用**，而非限制使用方式
- MIT 的寬鬆條款讓任何人都可以安心採用，不需要諮詢律師
- 它要求保留著作權聲明——你的貢獻仍然被標註

一個簡單的判斷流程：

```
你的技能是為了解決通用問題嗎？
├── 是 → 希望被廣泛使用？ → MIT
│   └── 需要專利保護？ → Apache 2.0
└── 否 → 希望強制衍生作品開源？ → GPL 3.0
    └── 無所謂 → MIT
```

> **⚠️ 我不是律師，以上不構成法律建議。** 如果你的組織有法律部門，請諮詢他們。開源授權涉及智慧財產權，各國法律解釋可能不同。

### 16.6.3 加入 LICENSE 檔案

最簡單的方式是直接複製授權全文到 `LICENSE` 檔案：

```bash
# MIT 授權
curl -O https://raw.githubusercontent.com/licenses/license-templates/master/templates/MIT.txt
```

確保檔案中的 `[year]` 和 `[fullname]` 已填寫為你的資訊。

---

## 16.7 讓技能被找到：Description 與可發現性

發布只是第一步。如果你的技能不被找到，它就等於不存在。

### 16.7.1 搜尋引擎最佳化（SEO）for Agent Skills

在 agentskill.sh 上，搜尋比對的是：
- 技能名稱（name）
- 描述（description）
- 標籤（tags，來自 agentskill.json）

其中 **description** 是最重要的搜尋排序因子——它同時影響 Agent 的觸發和使用者的搜尋。

一個對搜尋友善的 description 策略：

```
❌ "Helps with code quality."
   → 太模糊，不確定什麼時候該觸發

✅ "Review Pull Requests for code style issues, potential bugs, and security 
    vulnerabilities. Use when asked to review PRs, check code quality, or 
    audit changes before merging."
   → 具體、包含搜尋關鍵字、明確觸發時機
```

### 16.7.2 標籤策略

在 `agentskill.json` 中的 `tags` 是你的第二層可發現性工具：

```json
{
  "tags": [
    "code-review",
    "pr-review", 
    "quality-assurance",
    "security-review",
    "code-quality",
    "pull-request"
  ]
}
```

**原則**：
- 使用使用者會搜尋的詞，而不是你自己發明的分類
- 包含同義詞：`code-review` 和 `pr-review` 都放
- 不超過 10 個——太多會稀釋權重

### 16.7.3 生態系曝光

除了 agentskill.sh 本身的搜尋，你也可以主動讓你的技能被更多人看到：

- 在 GitHub 上為倉庫加上 `agentskills`、`agent-skills` 等主題標籤
- 在社群 Discord/Slack 中分享你的技能
- 在技術部落格撰寫教學文章（「我寫了一個 XX 技能」）
- 提交到 [agentskills.io](https://agentskills.io) 的精選技能列表

---

## 16.8 社群最佳實務

發布後，你的技能就進入了社群生態。以下是讓你的技能和你的聲譽都保持良好狀態的建議。

### 16.8.1 回應 Issue

使用者會回報問題——可能是觸發率不夠、步驟不清楚、或特定平台上的相容性問題。

| 使用者說 | 可能的 root cause | 你的回應 |
|----------|-------------------|----------|
| 「Agent 不理我」 | Description 觸發不足 | 檢查觸發率測試，擴充 description |
| 「它做了 A 而不是 B」 | 指令模糊 | 增加具體步驟和範例 |
| 「在 XX 平台上不能用」 | 平台特定問題 | 確認相容性，加入 platform-specific notes |
| 「改了一下就好用了」 | 使用者貢獻改進 | 感謝並邀請發 PR |

### 16.8.2 接受貢獻

好的技能會吸引貢獻者——這是開源的美妙之處。建立一個簡單的 `CONTRIBUTING.md`：

```markdown
# Contributing

感謝你願意貢獻這個技能！

## 回報問題

請在 GitHub Issues 中描述：
1. 你使用的平台（Claude Code / Cursor / 其他）
2. 你對 Agent 說了什麼
3. Agent 做了什麼（你預期的 vs 實際發生的）

## 提交 PR

1. Fork 這個倉庫
2. 建立一個 feature branch
3. 修改 SKILL.md 或相關檔案
4. 確保 description 的觸發測試仍然通過
5. 提交 PR

## 觸發測試

提交前，請執行：
```bash
agentskill.sh test-trigger --skill . --queries test-queries.json
```

觸發率應 > 0.5。
```

### 16.8.3 維護節奏

開源技能不需要每天更新，但需要**可預期的維護節奏**：

- **即時回應**：安全性問題或重大 bug（24 小時內確認）
- **定期批次**：功能請求或小改進（每 2-4 週一次批次處理）
- **版本發布**：每累積 3-5 個變更後發一個新版本

如果你無法繼續維護，請在 README 中明確說明（「此技能已不再維護，歡迎 fork」），比讓它慢慢腐朽更好。

---

## 16.9 ⚠️ 生態系現狀與未來趨勢

Agent Skills 的發布生態仍在快速演化中。以下是撰寫本文時的觀察與預測：

| 項目 | 現狀（2026 中） | ⚠️ 預測趨勢 |
|------|----------------|--------------|
| registry 數量 | 1 個公開（agentskill.sh） | 2026 年底可能出現 3-5 個 registry |
| 私有 registry 支援 | 尚未正式支援 | 預計 2026 Q3-Q4 推出 |
| 技能總數 | 2,600+ | 2026 年底可能突破 10,000 |
| Skillset 數量 | < 50 | 快速增長中 |
| 企業內部採用 | 少數先行者 | 預計 2027 年普及 |

這些數字和日期是基於當前生態的增長速度推估的。實際情況可能不同——但方向是明確的：**Agent Skills 的發布與分享基礎設施正在快速成熟。**

---

## [DIAGRAM: 發布工作流程 — 從本地開發到 registry 上架]

```
                       ┌──────────────┐
                       │  本地開發環境   │
                       │  SKILL.md     │
                       │  scripts/     │
                       │  references/  │
                       └──────┬───────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │   觸發率測試       │
                    │   agentskill.sh   │
                    │   test-trigger    │
                    └──────┬────────────┘
                           │
                    ╔══════╧══════════╗
                    ║  測試通過？       ║
                    ╚══════╤══════════╝
                     ┌─────┴─────┐
                     ▼           ▼
                 修正技能      推送至 GitHub
                               │
                               ▼
                    ┌───────────────────┐
                    │   建立 GitHub      │
                    │   Release          │
                    │   (版本標籤)        │
                    └──────┬────────────┘
                           │
                           ▼
                    ┌───────────────────┐
                    │   agentskill.sh    │
                    │   publish          │
                    └──────┬────────────┘
                           │
                    ╔══════╧══════════╗
                    ║ 格式驗證通過？    ║
                    ╚══════╤══════════╝
                     ┌─────┴─────┐
                     ▼           ▼
                  修正格式      自動上架
                               │
                               ▼
                    ┌───────────────────┐
                    │   確認可被搜尋到    │
                    │   agentskill.sh    │
                    │   search <名稱>    │
                    └───────────────────┘
```

---

## 16.10 實戰：發布一個技能到 agentskill.sh

我們用一個具體案例，從頭到尾走一遍發布流程。

### 情境

你寫了一個叫做 `docker-log-analyzer` 的技能——它讓 Agent 能夠分析 Docker 容器日誌，自動找出常見錯誤模式。你已經本地測試過，觸發率 > 0.6。現在要發布。

### 步驟 1：確認倉庫結構

```
docker-log-analyzer/
├── SKILL.md
├── README.md
├── LICENSE (MIT)
├── agentskill.json
├── examples/
│   └── basic-usage.md
└── scripts/
    └── parse-log-levels.py
```

### 步驟 2：檢查 SKILL.md 的必填欄位

```yaml
name: docker-log-analyzer
description: >
  Analyze Docker container logs to identify common error patterns, crash
  loops, resource issues, and misconfigurations. Use when investigating
  container failures, debugging deployment issues, or reviewing logs.
```

### 步驟 3：設定 agentskill.json

```json
{
  "name": "docker-log-analyzer",
  "version": "1.0.0",
  "description": "Analyze Docker container logs to identify common error patterns",
  "author": "Jane Doe <jane@example.com>",
  "repository": "https://github.com/janedoe/docker-log-analyzer",
  "license": "MIT",
  "tags": ["docker", "logs", "debugging", "containers", "troubleshooting"],
  "categories": ["devops", "debugging"]
}
```

### 步驟 4：建立 GitHub Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

在 GitHub 上建立 Release（包含 release notes）。

### 步驟 5：發布

```bash
agentskill.sh publish
```

出現成功訊息：

```
✓ 技能 "docker-log-analyzer" v1.0.0 已成功發布
  查看：https://agentskill.sh/skills/docker-log-analyzer
  安裝：agentskill.sh install docker-log-analyzer
```

### 步驟 6：驗證

```bash
agentskill.sh search "docker logs"
```

結果中應該出現你的技能。

---

## 本章摘要

1. **三種發布管道各有適用場景**：GitHub 適合實驗性技能和完全掌控的需求；agentskill.sh 提供最低摩擦的使用者安裝體驗；私有 registry（或專案內嵌）適合企業內部使用。

2. **發布前的準備工作決定使用者體驗**：README.md 回答「這是什麼、怎麼安裝」；LICENSE 保護你的權益；examples/ 讓使用者快速理解用途。

3. **agentskill.sh 的發布流程是自動化的**：只要技能符合格式規範，就可以上架。額外的 `agentskill.json` 提供更豐富的中繼資料，幫助使用者搜尋到你的技能。

4. **Skillset 將相關技能打包成主題包**：一條指令安裝完整工具組。設計時應有明確的主題邊界，技能數量控制在 5-15 個。

5. **Semantic Versioning 讓版本變更有意義**：PATCH 是修正、MINOR 是新增、MAJOR 是不相容變更。使用版本鎖定確保團隊一致性。

6. **MIT 是 Agent Skills 生態中最常見的授權**：寬鬆、簡單、適合希望被廣泛使用的技能。Apache 2.0 提供額外的專利保護，GPL 3.0 強制衍生作品開源。

7. **Description 同時影響 Agent 觸發和使用者搜尋**：使用具體的語言、包含關鍵字、明確觸發時機，是技能被找到的關鍵。

8. **發布只是開始，維護才是長期工作**：回應 Issue、接納貢獻、保持可預期的維護節奏。如果無法繼續，誠實告知比讓技能腐朽更好。

---

## 練習題

### Q1（發布管道選擇）
你的團隊開發了一套內部部署流程的 Agent Skills，包含前置檢查、滾動更新、健康檢查、回滾四個技能。這些技能包含公司的基礎設施細節，不適合公開。你應該選擇哪一種發布方式？請說明理由。

<details class="exercise-hint">
<summary>💡 提示</summary>
考慮安全性與安裝便利性的平衡。
</details>

### Q2（Skillset 設計）
參考 Q1 的四個技能，請設計一個 `deployment-workflow` Skillset 的 `agentskill.json` 草稿。包含：
- Skillset 名稱與描述
- 四個技能的相依關係（假設版本皆為 1.x）
- 適當的相容性設定

<details class="exercise-hint">
<summary>💡 提示</summary>
版本範圍使用 Caret（^）。
</details>

### Q3（語意化版本判斷）
以下是 `docker-log-analyzer` 技能的三次變更，請分別判斷應該 bump MAJOR、MINOR 還是 PATCH：

(a) 修正 SKILL.md 中一個失效的 Docker 指令連結
(b) 新增一個步驟：在分析日誌前先檢查容器是否在執行
(c) 將 `name` 從 `docker-log-analyzer` 改為 `container-log-analyzer`

<details class="exercise-hint">
<summary>💡 提示</summary>
回顧 16.5.2 的變更類型對照表。
</details>

### Q4（授權選擇）
你寫了一個 `interview-question-generator` 技能，希望被廣泛使用，但你不想讓別人把它包成商業產品販賣。你應該選擇哪一種授權？為什麼？

<details class="exercise-hint">
<summary>💡 提示</summary>
沒有任何授權可以完全禁止商業使用——你需要理解每種授權在商用上的限制差異。
</details>

### Q5（Description 優化）
以下是三個不夠好的 description，請改寫成對搜尋和觸發都更友善的版本：

(a) `"Helps with git."`
(b) `"Database backup helper."`
(c) `"Useful for writing tests."`

<details class="exercise-hint">
<summary>💡 提示</summary>
加入具體的使用情境、觸發時機、和搜尋關鍵字。
</details>

### 進階挑戰（Q6）
將你之前寫過的任何一個 SKILL.md（或本章的 docker-log-analyzer 案例）準備好發布：

1. 建立完整的發布目錄（SKILL.md + README.md + LICENSE + agentskill.json + examples/）
2. 撰寫 README.md，確保它在 30 秒內讓人理解這個技能是做什麼的
3. 選擇一個開源授權（建議 MIT），將完整的授權條款放入 LICENSE
4. 設定 `agentskill.json`，包含 tags、categories、compatibility
5. 寫一個 `examples/basic-usage.md`，包含至少兩個使用範例

完成後，你應該有一個可以直接發布到 agentskill.sh 的完整技能倉庫。

---

## 延伸閱讀

| 資源 | 說明 |
|------|------|
| [agentskill.sh 官方文件](https://agentskill.sh/docs) | 發布指令、格式驗證、版本管理的完整參考 |
| [GitHub 開源指南](https://opensource.guide/) | 關於開源專案維護、社群經營的綜合指南 |
| [choosealicense.com](https://choosealicense.com/) | GitHub 推出的授權選擇工具，簡單問答幫你選授權 |
| [SemVer 官方規格](https://semver.org/) | Semantic Versioning 2.0.0 完整規格 |
| [Chapter 8：Description 優化](https://agentskills-course.example.com/ch8) | Description 撰寫技巧的深入探討，與發布後的可發現性直接相關 |

---

> **發布不是終點，是起點。** 你的技能不會在發布那一刻就完美——它會在使用者的回饋中、在 Issue 的討論中、在 PR 的貢獻中，逐漸變得更成熟。

← [上一章：Skills+MCP+Subagents](/課程/05-03-skills-mcp-subagents) | [下一章：社群與貢獻](/課程/06-02-contributing) →
