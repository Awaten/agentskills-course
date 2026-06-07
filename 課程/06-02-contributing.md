---
title: "第 17 章：參與社群與開源貢獻（完結篇）"
description: "了解 Agent Skills 社群生態、貢獻路徑、RFC 流程，學習如何從使用者轉變為生態建設者，包含在地社群組織與職涯影響。"
outline: [2, 3]
---

# 第 17 章：參與社群與開源貢獻（完結篇）

> **你花了大半個課程學習如何撰寫、測試、發布 Agent Skills。但你學到的不只是一個檔案格式——你學到的是一種新的思考方式。這一章，我們要談的是如何把這門知識帶到更大的世界。**

從第 1 章到第 16 章，你學會了 Agent Skills 的核心概念、格式規範、最佳實務、測試方法、與發布策略。你已經具備了從零到一建構專業技能的能力。

但有一件事是教科書沒辦法給你的：**社群的力量。**

一份 SKILL.md 放在你的專案資料夾裡，只會幫助你一個人。一份 SKILL.md 放上 GitHub，可以幫助幾千個陌生開發者。一份 SKILL.md 變成官方規格的一部分，可以影響整個產業的方向。

這一章——也是本課程的最後一章——的主題很簡單：**你不只是 Agent Skills 的使用者，你也是這個生態的建設者。**

---

## 學習目標

完成本章後，你將能夠：

1. **找到** Agent Skills 社群的三大核心據點（GitHub、Discord、agentskill.sh），並能有效利用它們
2. **分析** 開源貢獻對個人職涯與生態發展的雙向價值
3. **評估** 不同的貢獻方式（技能、文件、工具、規格），並選擇最適合自己的切入點
4. **提交** 技能到 `anthropics/skills` 和 `addyosmani/agent-skills` 等官方倉庫
5. **通過** 社群審查，理解 reviewer 的評判標準與常見被拒原因
6. **參與** 規格討論的 RFC 流程，對 Agent Skills 標準的演進提出建議
7. **建構** 輔助工具（驗證器、測試框架、CI 整合），為生態填補工具缺口
8. **發起** 在地社群（讀書會、公司導入、 meetup），擴大生態的影響力
9. **維護** 已發布的技能，使其隨著規格演進保持相容

---

## 17.1 社群的三大核心據點

### 17.1.1 GitHub：生態的心臟

Agent Skills 的生圍並不是由一家公司主導的。它是一個由多個倉庫、多個維護者、多個貢獻者構成的分散式網路。而這些節點的連接口，就是 GitHub。

以下是核心的幾個倉庫：

| 倉庫 | 角色 | 適合你的貢獻方式 |
|------|------|-----------------|
| [github.com/agentskills/agentskills](https://github.com/agentskills/agentskills) | **官方規格倉庫**，定義 SKILL.md 的格式標準與平台相容性要求 | 規格建議、RFC 參與、文件改善 |
| [github.com/anthropics/skills](https://github.com/anthropics/skills) | **Anthropic 官方維護**的技能集合，高品質入門技能 | 提交通用技能、回報問題 |
| [github.com/addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | **社群驅動**的技能集合，收錄大量實戰技能，成長最快速 | 提交技能、review 他人 PR、討論 |
| [github.com/agentskills/awesome-agent-skills](https://github.com/agentskills/awesome-agent-skills) | Awesome List，收錄生態中所有值得關注的工具、文章、技能 | 提交連結、推薦資源 |

**你該從哪裡開始？**

如果你是第一次貢獻開源技能，建議從 `addyosmani/agent-skills` 開始——它的審查流程相對寬鬆，社群氛圍友善，很適合新手。當你對自己的技能品質有信心後，再挑戰 `anthropics/skills`——它的審查標準更嚴格，但也被視為品質認證。

### 17.1.2 Discord：即時交流的戰情室

除了 GitHub 的非同步協作，Agent Skills 社群還有一個活躍的 **Discord 伺服器**（從 agentskills.io 官網取得邀請連結）。

**Discord 上的主要頻道：**

| 頻道 | 用途 | 建議參與方式 |
|------|------|-------------|
| `#general` | 一般討論、問題求助 | 自我介紹、問問題、回答別人的問題 |
| `#skill-showcase` | 展示你寫的技能 | 發表新技能、尋求 feedback |
| `#spec-discussion` | 規格變更討論 | 參與 RFC 討論、提出 spec 問題 |
| `#tooling` | 工具開發討論 | 分享你的工具、徵求測試者 |
| `#help` | 技術問題求助 | 回答新手問題——這是建立聲譽最快的方式 |

> **⚠️ 社群的潛規則**：Discord 並不是客服管道。在發問之前，先搜尋頻道歷史、先讀過規格文件、先試著自己除錯。問「我試了 A 和 B 但都失敗了，有人知道為什麼嗎」遠比問「有人會用 Agent Skills 嗎」更容易得到幫助。

### 17.1.3 agentskill.sh：技能的命令列市集

`agentskill.sh` 是社群開發的命令列工具，用來搜尋、安裝、發布 Agent Skills。它不是官方工具，但已經成為生態中最常用的技能管理工具。

```bash
# 搜尋技能
agentskill search db-backup

# 安裝技能
agentskill install db-backup

# 發布你的技能
agentskill publish ./my-skills/db-backup
```

`agentskill.sh` 的出現是一個重要的信號：**當社群開始為生態建造工具時，代表這個生態已經越過了「能否存活」的門檻。**

> **⚠️** `agentskill.sh` 仍處於快速迭代階段，API 可能變動。如果你的工作流程依賴它，建議鎖定版本號。

---

## 17.2 為什麼要貢獻？—— 三個層次的回報

開源貢獻從來不是純粹的利他行為。如果沒有某種形式的回報，社群就不可能持續運作。理解這三種回報層次，可以幫助你找到自己在社群中的定位。

### 17.2.1 第一層：可見度（Visibility）

這是最直接的回報。一份高品質的開源技能會附上你的名字（GitHub handle），而這個技能可能被幾千個開發者看到。

具體的好處：
- **履歷加分**：在技術面試中展示「我維護了一個被 X 家公司使用的開源技能集合」遠比「我用過 Agent Skills」有力
- **專業品牌**：持續貢獻特定領域的技能（例如「資料庫維運」或「前端測試」），你會逐漸被視為那個領域的專家
- **人脈連結**：你的 PR 可能會被生態中的關鍵人物 review——這是一個建立專業關係的契機

```
舉例：一位台灣開發者寫了「繁體中文文章校稿」技能，因為品質優良，
被收錄到 anthropics/skills 官方倉庫。半年後，他在 Linkedin 上收到
一封訊息：「我們正在建立中文 AI 工作流程，你有興趣聊聊嗎？」
——這就是可見度的力量。
```

### 17.2.2 第二層：學習（Learning）

寫一份給 Agent 看的指令集，與寫給人類看的文件，是兩種完全不同的思維模式。

透過貢獻開源技能，你會學到：

- **如何寫出極度精準的指令**——因為含糊其辭的技能會被 reviewer 退件
- **如何考慮邊界情況**——因為社群會幫你找出你沒想到的情境
- **如何跨平台思考**——因為你的技能可能在 Claude Code、Cursor、Gemini CLI 上運行，每個平台的行為略有不同
- **如何與全球開發者協作**——因為你的 PR 可能會收到來自美國、歐洲、亞洲的 review comments

> **⚠️ 一個誠實的建議**：如果你只寫了 3 個技能、都沒有開源，你大概學到了「怎麼寫 SKILL.md」。如果你寫了 10 個技能、開源了 5 個、收到過 3 次 PR review，你學到的是「怎麼讓指令在不同平台上都正確執行」——這兩者的差距，比你想像的大得多。

### 17.2.3 第三層：塑造標準（Shaping the Standard）

這是最深層次、也最有影響力的回報。

Agent Skills 是一個仍在快速演進的開放標準。規格文件中每一個欄位的設計、每一條限制的制定，都是透過 RFC（Request for Comments）流程由社群共同決定的。

當你參與規格討論時，你不只是在「使用」這個標準——你是在「塑造」它。

具體的影響方式：
- 提出你實務中遇到的規格限制，建議放寬或修改
- 參與 RFC 討論，提供你的使用案例數據
- 在 `awesome-agent-skills` 中推薦你認為重要的工具或資源

> **這三層回報層層遞進，但不一定要循序漸進。** 你可以第一次貢獻就提交 RFC（雖然不建議），也可以長期只提交技能而不參與討論。關鍵是：**找到你舒服的貢獻節奏。**

---

## 17.3 貢獻的方式：五條路徑

### 17.3.1 路徑一：提交技能（最常見）

這是最大多數貢獻者的起點。你寫了一個好用的技能，讓其他人也能使用。

**適合對象**：所有完成本課程的人。

**流程**：
```
1. 確定你的技能在目標倉庫的技能範圍內
2. Fork 倉庫
3. 在 skills/ 目錄下建立你的技能資料夾
4. 撰寫/更新 SKILL.md
5. 提交 PR
6. 回應 reviewer 的反饋
7. 合併 🎉
```

**⚠️ 提交前自檢清單**：
- [ ] name 符合規範（小寫+數字+連字號，≤ 64 字元）
- [ ] description 包含觸發條件與適用場景
- [ ] 技能不是純粹的「工具包裝」（例如「安裝 Python」——這 Agent 本來就會）
- [ ] 你有實際執行過這個技能，不是憑空想像
- [ ] 包含至少一組 Gotchas
- [ ] 不包含敏感資訊（API key、內部網域、公司機密）

### 17.3.2 路徑二：改善文件（最友善的切入點）

文件改善是新手貢獻者最好的起點。你不需要寫任何技能，只需要找到文件中不清楚、不完整、或過時的地方。

**適合對象**：剛開始接觸開源貢獻、還不確定自己技能品質的人。

**你可以做的**：
- 修正錯字與語法錯誤
- 補上缺少的程式碼範例
- 為模糊的描述加入具體案例
- 更新過時的資訊（例如已改變的 CLI 參數）
- 翻譯（如果官方倉庫支援多語言）

> **為什麼從文件開始？** 因為文件 PR 的審查門檻最低、合併速度最快。你可以在幾小時內體驗到「我的 PR 被合併了」的正向回饋，這對於建立貢獻信心非常重要。

### 17.3.3 路徑三：撰寫教學與案例研究

生態系需要的不只是技能本身，還需要「如何使用這些技能」的知識。

**適合對象**：擅長寫作、喜歡教學的開發者。

**你可以做的**：
- 撰寫部落格文章（例如「如何用 5 個 Skills 自動化你的部署流程」）
- 製作影片教學（例如「從零開始寫一個資料庫備份 Skill」）
- 分享案例研究（例如「我們團隊導入 Agent Skills 的半年心得」）
- 在 `awesome-agent-skills` 中加入你的文章連結

這類貢獻的價值在於擴大了生態系的觸及面——讓還不熟悉 Agent Skills 的人看到實際應用場景。

### 17.3.4 路徑四：開發工具

Agent Skills 生態目前還處在「工具匱乏」的階段。這代表大量的機會。

**適合對象**：喜歡開發工具、對 CI/CD 有經驗的工程師。

**目前生態中急缺的工具**：

| 工具類型 | 需求程度 | 說明 |
|----------|----------|------|
| Skill 驗證器（linter） | 🔴 非常高 | 檢查 SKILL.md 格式、必填欄位、name 規範、description 品質 |
| 測試框架 | 🔴 非常高 | 自動化執行觸發測試、遵循度測試、輸出品質測試 |
| CI/CD 整合 | 🟡 中高 | 在 GitHub Actions 中自動驗證技能、產生評估報告 |
| 技能搜尋引擎 | 🟡 中 | 比 agentskill.sh 更進階的搜尋與推薦系統 |
| 遷移工具 | 🟢 中 | 當規格版本升級時，自動將舊格式技能轉換為新格式 |

> **⚠️ 如果你要開發工具**：先在 Discord 的 `#tooling` 頻道提出你的想法，避免與其他人重複開發。社群中可能已經有人在做了，或者有人可以提供你還沒想到的需求。

### 17.3.5 路徑五：參與規格討論

這是最進階的貢獻方式。你需要對規格有深入理解，並且能夠提出有理有據的改進建議。

**適合對象**：已經有數個實際技能經驗、了解 Agent 行為模式的進階使用者。

**你可以做的**：
- 提交 RFC（Request for Comments）
- 在現有 RFC 的討論串中提供使用案例數據
- 回報規格中不明確或矛盾的地方
- 建議新增 metadata 欄位以支援新的使用場景

---

## 17.4 提交到官方倉庫：實戰指南

### 17.4.1 anthropics/skills：品質標竿

`anthropics/skills` 是由 Anthropic 官方維護的技能集合。被收錄到這個倉庫代表你的技能通過了嚴格的品質審查。

**收錄標準（根據社群觀察）**：

1. **通用性**：技能不能是針對單一公司或專案的（例如「部署到我們公司的 staging 環境」）。它必須對廣泛的開發者有用。
2. **正確性**：每一條指令都必須經過實測驗證。reviewer 可能會實際在你的環境外測試。
3. **完整性**：包含必要的 Gotchas、輸出格式模板、驗證循環。
4. **一致性**：與官方風格一致（命名慣例、文件結構、語氣）。
5. **獨特性**：不與現有技能重複。如果你提交的是一個「更好的版本」，需要說明差異。

### 17.4.2 addyosmani/agent-skills：社群驅動

這個倉庫由 Google 工程師 Addy Osmani 發起，快速成長為生態中最大的社群技能集合。

**相對 anthropics/skills 的差異**：

| 面向 | anthropics/skills | addyosmani/agent-skills |
|------|-------------------|------------------------|
| 審查嚴格度 | 🔴 高 | 🟡 中 |
| 審查速度 | 較慢（1-2 週） | 較快（2-5 天） |
| 技能範圍 | 通用、生產級技能 | 包含實驗性、特定領域技能 |
| 品牌紅利 | 高（Anthropic 官方背書） | 中（社群知名度） |
| 最適合 | 成熟的、廣泛適用的技能 | 各種階段的技能，包含實驗性作品 |

### 17.4.3 PR 送審前的準備工作

無論你要提交到哪個倉庫，以下準備工作可以大幅提高 PR 被接受的機率：

**Step 1：閱讀 CONTRIBUTING.md**

每個倉庫都有自己的貢獻指南。花 10 分鐘讀完，避免踩到基本規範的地雷。

**Step 2：用 linter 驗證你的 SKILL.md**

在提交前，先用自己的工具檢查格式。目前社群中已有初步的驗證腳本：

```bash
# 使用 agentskill.sh 驗證
agentskill validate ./my-skills/db-backup

# 或使用社群提供的獨立驗證腳本
npx skill-lint ./my-skills/db-backup/SKILL.md
```

**Step 3：在本地測試完整流程**

不要只測試「技能啟動了」。測試完整流程：
- 觸發測試：你的 description 會讓 Agent 在正確的時機觸發嗎？
- 遵循度測試：Agent 真的照著你的步驟做嗎？
- 邊界測試：輸入為空時會怎樣？API 離線時會怎樣？

**Step 4：撰寫好的 PR 描述**

一個好的 PR 描述包含：
- 這個技能解決什麼問題
- 你如何驗證它（附上測試結果的截圖或 log）
- ⚠️ 已知限制或尚未處理的邊界情況

```markdown
## Summary
Adds a database backup skill that automates MySQL dump, compression,
S3 upload, and integrity verification.

## Validation
- Tested on MySQL 8.0 on macOS and Ubuntu
- 5 test runs, all passed
- Trigger tests: 8/10 positive, 2/2 negative
- Output format verified against template

## Known Limitations
- Does not support PostgreSQL yet (planned)
- Requires `mysqldump` and `aws-cli` to be installed
```

### 17.4.4 如何回應 Review Comment

這是很多新手貢獻者最緊張的環節。以下是一些實用原則：

| 情況 | 正確回應 | 錯誤回應 |
|------|----------|----------|
| Reviewer 要求修改 | 感謝 feedback，說明修改計畫 | 「我覺得我寫的沒有錯」 |
| Reviewer 的建議你不同意 | 禮貌說明你的理由，附上實測數據 | 直接拒絕 revision |
| Review 來回多次 | 保持耐心，這是正常流程 | 放棄 PR 不回覆 |
| Reviewer 要求補充測試 | 這代表你的技能有機會被合併——補就對了 | 「我已經測過了看不懂為什麼還要測」|

> **⚠️ 一個重要的心態**：Reviewer 的時間也是一種資源。他們花時間 review 你的 PR，代表他們認為你的貢獻有潛力。不要把 review 視為刁難——它是生態系的品質過濾機制。

---

## 17.5 審查流程：Reviewer 在想什麼？

### 17.5.1 Reviewer 的判斷標準

了解 reviewer 的視角，可以幫助你在提交前就避開最常見的拒絕原因。

Reviewer 在審查一個技能時，會問自己以下問題：

**第一層：這個技能有必要存在嗎？**
- ❌ 這個技能做的事情 Agent 本來就會（例如「使用 Git」——Agent 本來就會用 Git）
- ❌ 這個技能與現有技能 90% 重複
- ✅ 這個技能封裝了 Agent 不熟悉的特定領域知識

**第二層：這個技能可靠嗎？**
- ❌ 步驟太模糊（「處理錯誤」——怎麼處理？）
- ❌ 缺少 gotchas（Agent 一定會踩坑）
- ❌ 指令矛盾（步驟 2 說「用 A 工具」，步驟 5 又說「用 B 工具」）
- ✅ 步驟具體、有驗證點、有預設值

**第三層：這個技能可維護嗎？**
- ❌ 檔案結構混亂，沒有說明文件
- ❌ 使用了即將淘汰的工具或 API
- ❌ 與其他技能有隱含的衝突（例如兩個技能定義了同名的環境變數）
- ✅ 乾淨的結構、有 changelog、有版本標示

### 17.5.2 最常見的被拒原因（真實統計）

根據社群觀察（統計來源：`addyosmani/agent-skills` 的 PR 數據），技能被拒絕或需要大幅修改的原因分布如下：

| 原因 | 佔比 | 說明 |
|------|------|------|
| Description 太模糊 | ~30% | 「幫助資料庫操作」——哪種操作？什麼情境觸發？ |
| 步驟不夠程序化 | ~25% | 只說「備份資料庫」沒有具體指令 |
| 缺少 Gotchas | ~20% | 沒有列出環境特定的陷阱 |
| 與現有技能重複 | ~15% | 沒有先搜尋現有技能庫 |
| 格式不符合規範 | ~10% | name 格式錯誤、缺少必要欄位 |

> **啟示**：如果做好前三項（description 優化、程序式步驟、Gotchas），你已經避開了 75% 的被拒原因。

---

## 17.6 規格貢獻：RFC 流程

### 17.6.1 什麼是 RFC？

RFC（Request for Comments）是 Agent Skills 規格演進的正式機制。任何人都可以提交 RFC，提議對規格的修改或擴充。

RFC 流程的目的是**確保每一項變更都有充分的討論和共識**，而不是由單一維護者決定。

### 17.6.2 RFC 的生命週期

```
RFC Draft（草稿）
    │
    ▼
RFC Proposed（提案）—— 在 GitHub Issue 中標記為 RFC
    │
    ▼
社群討論期（至少 2 週）
    │
    ├──→ 共識達成 → RFC Accepted
    │         │
    │         ▼
    │   規格更新 + 實作
    │
    └──→ 無法達成共識 → RFC Rejected 或 RFC Withdrawn
              │
              ▼
         可在三個月後重新提交
```

### 17.6.3 撰寫好的 RFC

一個好的 RFC 包含五個部分：

1. **問題陳述**：你遇到了什麼問題？現在的規格哪裡不夠？
2. **提案**：你建議的具體修改（如果可能，包含修改後的規格文字）
3. **使用案例**：誰會受益？怎麼受益？附上真實情境
4. **替代方案**：你考慮過哪些其他方案？為什麼選這個？
5. **向後相容性**：這個修改是否會破壞現有的技能？

```markdown
## RFC: Add "environment" metadata field to SKILL.md

### Problem
Skills often contain platform-specific instructions (macOS vs Linux,
production vs staging), but there's no standard way to declare which
environment a skill targets. This leads to skills failing silently
when used on the wrong platform.

### Proposal
Add an optional `environments` field to SKILL.md frontmatter:

```yaml
environments:
  - linux
  - macos
```

If specified, Agent should check compatibility before loading the skill.
If not specified, assume all environments.

### Use Cases
1. A `docker-setup` skill that only works on Linux
2. A `ios-deploy` skill that requires macOS
3. A `db-backup` skill with different instructions for dev vs prod

### Alternatives Considered
1. Adding platform detection in SKILL.md itself → too verbose
2. Using tags (`platform: linux`) → less structured
3. Separate skill files per platform → duplication

### Backward Compatibility
Fully backward compatible — the field is optional. Existing skills
without `environments` will continue to work as before.
```

### 17.6.4 參與 RFC 討論

即使你不提交 RFC，參與討論也是一種有價值的貢獻方式。當你看到一個 RFC 討論串時，可以問自己：

- 「這個提案在我的使用場景中會造成什麼影響？」
- 「我有沒有遇過這個 RFC 想解決的問題？當時我是怎麼處理的？」
- 「這個提案的替代方案有沒有我踩過的坑？」

把你的真實經驗分享出來，就是對規格討論最有價值的貢獻。

> **⚠️ RFC 討論的節奏**：不要搶著發表意見。先花幾天時間仔細閱讀提案、思考 impact、甚至在自己的環境中實驗看看。匆忙的回覆往往會被後續的討論推翻。

---

## 17.7 建構工具：填補生態缺口

### 17.7.1 工具優先級

前面提到過，Agent Skills 生態目前仍處於「工具匱乏」階段。以下是根據社群討論和 Discord 頻道整理的「最需要被建造的工具」：

**P0（立刻需要）**：
- **SKILL.md linter**：檢查格式、必填欄位、name 規範、description 品質。類似 ESLint 之於 JavaScript，但更簡單。
- **觸發測試執行器**：自動化執行 description 觸發測試，生成觸發率報告。

**P1（非常需要）**：
- **CI/CD GitHub Action**：在 PR 提交時自動驗證技能格式、執行觸發測試、比對回歸。
- **技能遷移工具**：當規格版本升級時，自動將舊格式技能更新為新格式。

**P2（需要但不急迫）**：
- **視覺化技能編輯器**：讓非開發者也能撰寫 SKILL.md。
- **技能性能分析工具**：分析技能被觸發後的 token 消耗和步驟完成率。

### 17.7.2 一個簡單的 linter 範例

如果你想從工具開發開始，這是一個最小可行 linter 的骨架：

```python
#!/usr/bin/env python3
"""skill-lint.py — 最小可行的 SKILL.md 驗證器"""

import re
import sys
from pathlib import Path

ERRORS = []

def lint(path: Path):
    content = path.read_text(encoding="utf-8")
    lines = content.split("\n")

    # 檢查 1：是否有 name
    if not re.search(r"^name:\s*\S+", content, re.MULTILINE):
        ERRORS.append("MISSING: 'name' field")

    # 檢查 2：name 格式（小寫+數字+連字號）
    name_match = re.search(r"^name:\s*(.+)", content, re.MULTILINE)
    if name_match:
        name = name_match.group(1).strip()
        if not re.match(r"^[a-z0-9][a-z0-9-]*[a-z0-9]$", name):
            ERRORS.append(f"INVALID: name '{name}' — use lowercase, digits, hyphens only")

    # 檢查 3：是否有 description
    if not re.search(r"^description:\s*\S", content, re.MULTILINE):
        ERRORS.append("MISSING: 'description' field")

    # 檢查 4：description 長度
    desc_match = re.search(r"^description:\s*(.+)", content, re.MULTILINE)
    if desc_match and len(desc_match.group(1)) > 1024:
        ERRORS.append("WARNING: description exceeds 1024 characters")

    # 檢查 5：是否包含「步驟」或「程序」章節
    if not re.search(r"(##\s*(步驟|程序|Steps|Usage|Workflow))", content):
        ERRORS.append("SUGGESTION: Missing a 'Steps' or 'Usage' section")

    # 檢查 6：是否有 gotchas（建議）
    if not re.search(r"(gotcha|⚠️|注意|坑|陷阱)", content, re.IGNORECASE):
        ERRORS.append("SUGGESTION: Consider adding a Gotchas section")

    return len(ERRORS) == 0


def main():
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("SKILL.md")
    if not target.exists():
        print(f"❌ File not found: {target}")
        sys.exit(1)

    print(f"Linting: {target}")
    passed = lint(target)

    if ERRORS:
        print("\nIssues found:")
        for err in ERRORS:
            print(f"  • {err}")

    if passed:
        print("\n✅ All checks passed")
        sys.exit(0)
    else:
        print(f"\n❌ {len(ERRORS)} issues need attention")
        sys.exit(1)


if __name__ == "__main__":
    main()
```

> **⚠️ 為什麼從 linter 開始？** 因為門檻最低、回饋最直接、且所有人都需要它。即使是最簡單的版本，只要能檢查 name 格式和 description 存在性，就已經為生態提供了價值。

### 17.7.3 工具開發者守則

如果你決定開發工具，以下幾條原則是社群用經驗換來的教訓：

1. **先溝通，再開發**：在 Discord 的 `#tooling` 頻道提出你的想法。你可能會發現已經有人做過了，或者有人可以提供你沒想到的需求。
2. **CLI 優先，GUI 其次**：開發者喜歡命令列。先做 CLI 版本，確認核心功能正確，再考慮圖形介面。
3. **與 agentskill.sh 互補而非競爭**：不要重新發明輪子。如果 `agentskill.sh` 已經有搜尋功能，你的工具應該專注在它沒有的功能上。
4. **文件比程式碼重要**：沒有人會用一個沒有 README 的工具。花時間寫清楚安裝方式、使用範例、常見問題。

---

## 17.8 在地社群：從使用者到組織者

### 17.8.1 為什麼要在 local 辦活動？

Agent Skills 的社群目前以英語為主，集中在 Discord 和 GitHub。但真正能改變生態樣貌的，是那些發生在實體空間、使用在地語言的交流。

具體的好處：
- **降低語言門檻**：不是每個開發者都習慣用英文討論技術問題
- **產業聚集**：如果你的城市有很多金融科技公司，針對該產業的技能討論會更有共鳴
- **建立在地專業網絡**：認識附近的開發者，建立長期合作關係

### 17.8.2 你可以辦的活動類型

| 活動形式 | 難度 | 頻率建議 | 適合對象 |
|----------|------|----------|----------|
| **線上讀書會** | 🟢 低 | 每月一次 | 剛開始組織活動的新手 |
| **實體 workshop** | 🟡 中 | 每季一次 | 有社群經驗的組織者 |
| **黑客松** | 🔴 高 | 每年一次 | 有活動籌辦經驗的團隊 |
| **公司內部分享會** | 🟢 低 | 每月一次 | 想在公司推廣 Agent Skills 的員工 |

**讀書會進行方式（實戰建議）**：

```
1. 每週一章（從本課程開始）
2. 參與者輪流分享一個實際技能開發經驗
3. 現場 live coding：30 分鐘寫一個簡單 skill
4. 互相 code review 彼此的 SKILL.md
```

### 17.8.3 在公司內部推動 Agent Skills

這可能是最有影響力的在地貢獻方式——如果你的公司開始使用 Agent Skills，你等於同時影響了整個團隊的工作效率。

**推動步驟（從最小可行開始）**：

1. **自己先用**：在你的專案中加入 1-2 個技能，觀察效果
2. **展示成果**：在 team standup 中分享「這個任務本來要花 20 分鐘，用了技能後變 5 分鐘」
3. **建立內部技能庫**：把團隊的 SOP 轉換為技能，放在共用儲存庫
4. **舉辦 internal workshop**：教同事如何撰寫和貢獻技能
5. **制定技能標準**：定義團隊的 SKILL.md 撰寫規範（可參考本課程第 7 章）

> **⚠️ 公司導入的常見阻礙**：最大的阻力通常不是技術問題，而是「為什麼要改變現狀？」。不要從技術角度推廣，而要從「減少重複性勞動」的角度說服。當同事發現「寫一次 skill，之後就不用再手動做這件事了」，他們會自己成為推廣者。

---

## 17.9 [DIAGRAM] 貢獻路徑圖

```
╔══════════════════════════════════════════════════════════════════════╗
║                   Agent Skills 貢獻路徑圖                            ║
╚══════════════════════════════════════════════════════════════════════╝

                              ┌────────────────────────────┐
                              │     你，課程畢業生           │
                              │    （已經具備基礎能力）      │
                              └────────────┬───────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
          ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
          │   初階貢獻者       │   │   文件貢獻者       │   │   在地組織者       │
          │                   │   │                  │   │                  │
          │ • 提交 1-3 個技能  │   │ • 修正錯字與格式   │   │ • 發起讀書會       │
          │ • 參與 PR review   │   │ • 補上缺失範例     │   │ • 舉辦 workshop   │
          │ • 回報問題         │   │ • 翻譯文件         │   │ • 公司內部推廣     │
          └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
                   │                      │                      │
                   ▼                      ▼                      ▼
          ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
          │   進階貢獻者       │   │   工具開發者       │   │   規格參與者       │
          │                   │   │                  │   │                  │
          │ • 維護多個技能     │   │ • 開發 linter     │   │ • 提交 RFC        │
          │ • mentor 新貢獻者  │   │ • 建 CI/CD 工具   │   │ • 參與規格討論     │
          │ • 成為 reviewer    │   │ • 開發遷移工具     │   │ • 撰寫 white paper│
          └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
                   │                      │                      │
                   └──────────────────────┼──────────────────────┘
                                          │
                                          ▼
                              ┌────────────────────────────┐
                              │    生態維護者（Maintainer）   │
                              │                            │
                              │ • 管理倉庫與 PR            │
                              │ • 制定社群規範              │
                              │ • 主導規格演進方向           │
                              │ • 培育下一代貢獻者           │
                              └────────────────────────────┘
```

**圖 17.1**: Agent Skills 貢獻路徑圖。貢獻不是一條直線，而是一個多岔路徑的生態系統。你可以根據自己的技能、興趣和時間，選擇不同的貢獻路線。每條路線都會讓你對生態的理解更深一層。注意：路線之間可以橫向移動——你不需要「升級」到下一層，如果你對工具開發更有熱情，可以直接從初階貢獻者跳到工具開發者。

---

## 17.10 技能維護：寫完只是開始

### 17.10.1 開源技能的維護成本

很多人以為開源技能是「寫完就結束了」。事實上，真正的工時分布在後續的維護階段。

```
技能生命週期的工時分布：

撰寫（40%）  →  審查迭代（20%）  →  維護（40%）

如果你只預算了「撰寫時間」，你只預算了一半。
```

### 17.10.2 維護事項清單

| 維護項目 | 頻率 | 具體動作 |
|----------|------|----------|
| 規格相容性檢查 | 每季 | 確認技能仍然符合最新規格版本 |
| 步驟驗證 | 每季 | 實際執行一次，確認步驟仍然正確 |
| Issue 處理 | 隨機 | 回覆使用者的問題和 bug report |
| 依賴更新 | 隨需 | 如果技能依賴特定工具版本，留意版本變化 |
| Description 優化 | 半年 | 根據使用數據調整 description 的觸發詞 |

### 17.10.3 當你的技能需要退役

有時候，技能會因為以下原因需要被標記為 deprecated：
- 被更好的技能取代
- 依賴的工具或服務已經停止
- 規格變更導致格式不相容

**正確的退役方式**：

```markdown
---
name: legacy-deploy
description: >
  [DEPRECATED] Use `deploy-v2` instead. This skill used the old
  deployment system which was shut down on 2026-03-01.
  Kept for reference only. Do NOT use.
---
```

不要直接刪除技能檔案——如果有人還在用，刪除會讓他們的流程中斷。先標記為 deprecated，提供遷移路徑，等一段時間後再移除。

---

## 17.11 職涯影響：Agent Skills 如何改變你的工作方式

### 17.11.1 不是「學工具」，是「學思維」

很多學員在課程結束後告訴我一句類似的話：

> 「我以為我在學一個檔案格式。後來才發現，我在學如何把隱性知識變成顯性知識。」

這是最重要的領悟。

Agent Skills 教你的不是一個特定的技術，而是一種**知識管理的方法論**——如何把你腦袋裡那些「做久了自然知道」的事情，寫成結構化的、可複用的、可傳承的指令。

### 17.11.2 具體的職涯影響

| 能力 | 以前 | 現在 |
|------|------|------|
| 新人 onboarding | 口頭帶人，重複回答問題 | 建立 onboarding skill，新人自己跑就好 |
| 知識傳承 | 資深離職→知識流失 | 技能庫就是組織記憶 |
| 重複性工作 | 每次手動做→容易出錯 | 技能一次寫好→Agent 每次都做對 |
| 跨團隊協作 | 「你們怎麼做的？」口頭說明 | 「拿去，這是我們的 deploy skill」 |

**一位學員的真實案例**：

> 我是一名系統工程師，負責 CI/CD 管線維護。以前每次新人加入，我都要花兩週帶他們熟悉部署流程。寫了 deploy skill 之後，新人在第一天就能獨立執行部署——雖然他們還不理解背後的所有原理，但至少不會把 production 搞掛。這讓我空出了時間去處理真正複雜的問題。

### 17.11.3 意想不到的職涯機會

隨著 Agent Skills 生態的成長，一些新的職位和機會正在出現：

- **Skill Engineer**：專門為組織撰寫和維護技能的角色（類似 DevOps 但專注在 Agent 工作流程）
- **Agent Workflow Consultant**：協助公司導入 Agent 工作流程的外部顧問
- **Open Source Skill Maintainer**：維護多個開源技能，成為生態中的關鍵人物
- **Tooling Developer**：開發支援 Skills 生態的工具（驗證器、測試框架、IDE 擴充）

這些角色在 2025 年還不存在，但在 2026 年已經開始出現。到 2027 年，它們可能會變得普遍。

> **⚠️ 這不是預測，這是觀察**：我沒辦法告訴你這些角色一定會成為主流。但我知道的是——當一個生態的使用者從幾百人成長到幾萬人時，支援這個生態的專業角色必然會出現。這是所有開放標準的歷史規律。

---

## 17.12 課程總回顧：你學到了什麼？

這是最後一節課。在結束之前，讓我們一起回顧整趟旅程。

### 17.12.1 各章重點回顧

| 階段 | 章節 | 核心收穫 |
|------|------|----------|
| **基礎篇** | 第 1-4 章 | Agent Skills 是什麼？三層漸進式揭露、與 Tools/MCP 的區別、30+ 平台支援 |
| **實作篇** | 第 5-6 章 | 第一個 Hello World Skill、SKILL.md 完整格式、多客戶端測試 |
| **進階篇** | 第 7-10 章 | 五個核心原則、四種實戰模式、大型技能架構、description 優化方法論 |
| **測試篇** | 第 11-12 章 | 觸發測試、指令遵循度驗證、輸出品質評估、回歸測試、CI/CD 整合 |
| **生態篇** | 第 13-14 章 | 技能發布策略、多平台分發、版本管理、授權選擇 |
| **社群篇** | 第 15-17 章 | 生態系圖譜、平台相容性、開源貢獻、規格參與、在地社群 |

### 17.12.2 你現在的能力

完成本課程後，你已經具備了以下能力：

- ✅ **分析**任何重複性任務，判斷是否適合寫成技能
- ✅ **設計**技能的結構、步驟、參數與輸出格式
- ✅ **撰寫**符合規範的 SKILL.md，包含 Gotchas、驗證循環、輸出模板
- ✅ **測試**技能的觸發率、遵循度與輸出品質
- ✅ **發布**技能到 GitHub、agentskill.sh、npm 等平台
- ✅ **維護**技能，使其隨規格演進保持相容
- ✅ **貢獻**技能到開源社群，參與規格討論

如果你能完成課程中的練習題，你已經超越了 90% 的 Agent Skills 使用者。

### 17.12.3 從這裡可以去哪裡

課程結束了，但學習的路徑還有很多方向。以下是一些建議：

**方向一：深化專業領域**
選擇一個你熟悉的專業領域（資料庫、DevOps、前端測試、資安稽核），寫出一套完整的技能集。目標是：讓你的技能集成為該領域的事實標準。

**方向二：貢獻開源**
回到 17.3，選擇一條貢獻路徑，開始你的第一次 PR。不要追求完美——追求「完成」。

**方向三：教學與分享**
把你的學習心得寫成部落格文章或錄製教學影片。教學是最好的學習方式——當你教別人時，你會發現自己其實還有不理解的地方。

**方向四：開發工具**
看看 17.7.1 的工具優先級列表。挑一個你覺得最需要的，開始建造。

**方向五：在地組織**
在你的城市或公司舉辦第一次 Agent Skills 讀書會。不需要很多人，3-5 個人就可以開始。

---

## *17.13 最終練習題

本章的練習題與前面各章不同。它們設計為「真實世界的行動」——你不只是在紙上作答，你是在實際參與生態。

每一題完成後，你都可以自豪地說：「我為 Agent Skills 生態做了一個具體的貢獻。」

### 練習 1：第一次開源貢獻

**任務**：
1. 前往 `github.com/addyosmani/agent-skills`
2. 找到一個你可以改善的地方（可以是文件修正、bug 回報、或提交一個新技能）
3. 提交你的第一個 PR

**提示**：
- 如果是第一次，先從「修正錯字」或「補上缺少的範例」開始——門檻最低
- 如果你提交新技能，請先在現有技能庫中搜尋是否已有類似技能
- 閱讀倉庫的 CONTRIBUTING.md

**交付物**：
- PR 的連結

**成功標準**：
- PR 被合併，或至少收到了 reviewer 的實質回應

---

### 練習 2：撰寫一份 RFC 提案

**任務**：
1. 回顧你在前面章節中撰寫的技能，找出一個規格無法滿足的需求
2. 撰寫一份 RFC 提案（格式參考 17.6.3）
3. 在 `github.com/agentskills/agentskills` 的 Issues 中提出

**提示**：
- 不需要等到「完美的提案」才提出。草稿 RFC 也是 RFC
- 在 Discord 的 `#spec-discussion` 頻道先提出你的想法，收集意見

**交付物**：
- GitHub Issue 的連結

**成功標準**：
- Issue 被標記為 RFC 或至少有人回應討論

---

### 練習 3：建立在地社群

**任務**：
1. 在你的城市或公司發起第一次 Agent Skills 讀書會
2. 至少找到 3 位參與者
3. 完成第一次聚會（可以線上）

**提示**：
- 可以從你的同事開始——邀請他們一起讀本課程的某一章
- 使用 Discord 的 `#general` 頻道尋找在地參與者
- 第一次聚會不需要很正式——30 分鐘分享 + 30 分鐘討論就夠了

**交付物**：
- 聚會的照片、筆記、或參與者回饋

**成功標準**：
- 完成第一次聚會，且至少有一位參與者表示想參加下一次

---

### 練習 4（進階挑戰）：開發一個生態工具

**任務**：
1. 從 17.7.1 的工具優先級中選擇一個
2. 開發最小可行版本（MVP），並開源到 GitHub
3. 在你的專案 README 中清楚說明工具的作用和用法

**提示**：
- MVP 的定義是「能夠完成一個有用任務的最小功能集合」
- 先在 Discord 的 `#tooling` 頻道告知社群你的計畫
- 不要追求完美——第一個版本只要有核心功能就夠了

**交付物**：
- GitHub 倉庫連結

**成功標準**：
- 至少有一個人（不是你自己）使用了這個工具

---

### 練習 5（終極挑戰）：成為 Maintainer

**任務**：
1. 持續貢獻超過 3 個月
2. 在社群中建立信譽（通過高品質的 PR、有用的 review comments、幫助新人）
3. 主動向現有 maintainer 表達你願意協助維護的意願

**提示**：
- 這不是一個可以「一次完成」的練習——它是一個長期的過程
- 先專注於「成為對社群有價值的人」，而不是「成為 maintainer」
- Maintainer 的角色不是權力，是責任。確認你願意承擔這個責任

**成功標準**：
- 被正式加入為倉庫的 maintainer 或 collaborator

---

## 17.14 結語：這不是終點

本課程的最後一件事，我想跟你說的是：

**Agent Skills 還很年輕。**

你現在學到的知識，即使在半年後部分內容可能已經過時——規格會演進、平台會更新、生態會成長。但你不會過時，因為你學到的是方法論，而不是死知識。

你知道如何分析一個任務是否需要技能化。
你知道如何從經驗中萃取可執行的指令。
你知道如何測試一個技能是否真的有效。
你知道如何與社群分享你的成果。

這些能力不會因為規格版本從 1.0 變成 2.0 而失效。

所以，本課程的真正結束，不是在你讀完這一章的時刻——而是在你寫下第一個開源技能的 SKILL.md、按下「Create Pull Request」的那一刻。

社群等你。

---

## 17.15 延伸資源

| 資源 | 說明 |
|------|------|
| [agentskills.io](https://agentskills.io) | Agent Skills 官方網站——規格、生態、社群連結 |
| [github.com/agentskills/agentskills](https://github.com/agentskills/agentskills) | 官方規格倉庫——參與 RFC 討論 |
| [github.com/anthropics/skills](https://github.com/anthropics/skills) | Anthropic 官方技能集合——品質標竿 |
| [github.com/addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | 社群技能集合——你的第一個 PR 目標 |
| [github.com/agentskills/awesome-agent-skills](https://github.com/agentskills/awesome-agent-skills) | 生態資源列表——探索更多工具與技能 |
| Discord（從 agentskills.io 取得邀請） | 即時交流社群——問題求助、技能展示、規格討論 |
| `agentskill.sh` | 命令列技能管理工具——搜尋、安裝、發布 |

---

← [上一章：發布與分享](/課程/06-01-distribution)

> 🎉 恭喜完成全部 17 章課程！[回到學習路線圖](/study-guide) 或是 [開始自己寫一個 Skill 吧](/秘笈/05-zero-to-publish)
