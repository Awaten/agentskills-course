---
title: "秘笈 S4：7 個寫出高效 Instructions 的套路 — 讓 Agent 第一次就做對"
description: "7 個實戰驗證的 Instruction Patterns（Gotchas、輸出模板、校驗循環、PVE、Checklist、預設值、程序式），讓 Agent 不再鬼打牆。"
outline: [2, 3]
---

# 秘笈 S4：7 個寫出高效 Instructions 的套路 — 讓 Agent 第一次就做對

> **「多花三分鐘寫 Instruction，省下三小時來回鬼打牆。」**
> —— 某位被 Agent 氣到寫了 200 行 SKILL.md 的工程師

你有沒有這種經驗：跟 Agent 描述同一件事講了五次，它還是用不同的錯誤方式搞砸？

不是你運氣不好。是你給的 Instructions 太模糊。

寫 Instructions 不是寫作文，是**寫程式**。差別在哪？寫作文靠讀者領悟，寫程式靠編譯器執行。Agent 就是那個編譯器——它不會猜你的弦外之音，它只執行你寫下的每一行。

這篇秘笈，我整理了 **7 個實戰套路**。每一個都來自真實的 SKILL.md，每一個都曾經把我從「跟 Agent 吵架」救到「躺著看它做完」。

[IMAGE: 一個人寫下短短幾行 instruction，對面機器人點頭比讚。旁邊時鐘顯示「節省 3 小時」。風格：平面插畫，溫暖色調]

---

## Pattern 1：Gotchas（避坑清單）—— 寫 Agent 不知道的，不是寫它知道的

這是七個套路裡**價值最高**的一個。Why？

因為 Agent 的訓練資料裡有大量的「常識」，但它不知道你專案的**例外**。你不需要教它 Python 怎麼寫，但你需要告訴它：「這個專案的 user ID 不叫 `user_id`，叫 `emp_code`。」

Gotchas 的本質是：**環境特定的事實，Agent 不問就不會知道。**

**❌ Before：寫 Agent 已經知道的**
```markdown
## Steps
1. Fetch the user data from the API.
2. Validate the response.
3. Update the database.
```

**✅ After：寫 Agent 不知道的坑**
```markdown
## Gotchas（必讀，否則會炸）

- ⚠️ `/api/users` 回傳的 `id` 欄位其實是員工編號，不是資料庫 PK
- ⚠️ `/health` 只檢查 web server，不檢查資料庫連線。真正要看的是 `/readyz`
- ⚠️ 刪除使用者後必須同時清除 Redis cache，API 不會自動做
- ⚠️ 測試環境的 rate limit 是 10 req/min，不是文件寫的 1000
```

看出差別了嗎？第一份 Instructions 寫了等於沒寫。第二份直接把 Agent 會踩的雷排好。

> **Gotchas 是 Instructions 的保險桿。沒有它，Agent 會用最華麗的方式撞牆。**

---

## Pattern 2：輸出格式模板（Output Format Templates）—— 給例子，不要給形容詞

「請輸出 JSON 格式」—— Agent 會給你 JSON，但欄位名可能叫 `result`、`data`、`content`、`responseData`，隨它心情。

**給模板。**

**❌ Before：描述格式**
```markdown
輸出一個包含使用者資訊的 JSON 物件，要有姓名、Email、角色和狀態。
```

**✅ After：給具體模板**
````markdown
## Output Format

你必須嚴格按照以下格式回傳，不得增減欄位：

```json
{
  "name": "string",
  "email": "string",
  "role": "admin | editor | viewer",
  "status": "active | suspended | pending",
  "last_login": "ISO 8601 datetime or null"
}
```

⚠️ `role` 只能是這三種值，不要自己發明。`last_login` 如果是 null 代表從未登入。
````

模板不只是格式參考，它還是**語言協定**。你跟 Agent 之間就不會因為叫 `user_role` 還是 `role` 而吵架。

[IMAGE: 左右對比圖。左邊：模糊描述 → Agent 產出混亂結果。右邊：給模板 → Agent 產出完全一致。風格：極簡流程圖]

---

## Pattern 3：校驗循環（Validation Loops）—— 做 → 檢查 → 修 → 繼續

Agent 跟人類一樣會犯錯。差別在於：人類犯了錯會自己發現，Agent 不會——它會帶著錯誤自信滿滿地繼續下一步。

解法：**在校驗之前，不允許繼續。**

**❌ Before：直線流程**
```markdown
1. 讀取 CSV 檔案
2. 清理資料
3. 寫入資料庫
```

**✅ After：加上校驗關卡**
```markdown
## Validation Loop（強制）

對**每一個步驟**，你必須執行以下循環：

1. **Do**：執行該步驟
2. **Check**：驗證輸出是否符合預期
   - 檔案存在嗎？內容不為空嗎？格式正確嗎？
   - 如果是 API 呼叫，檢查 HTTP status 和 response body
3. **Fix**：如果驗證失敗，修正後回到 Step 1
4. **Proceed**：只有驗證通過，才能進到下一個步驟

⚠️ 沒有跳過驗證的選項。沒有「看起來應該沒問題」。驗證沒過就是沒過。
```

這看起來很基本，但它解決了 Agent 最常見的致命缺點：**盲目樂觀**。

> **Validation loop 是 Agent 的 safety net。沒有它，小錯會變成大災難。**

---

## Pattern 4：Plan-Validate-Execute（PVE）—— 破壞性操作的保險

刪除資料、清空資源、覆蓋檔案——這些操作，你不會想讓 Agent 直接動手。

PVE 模式強制 Agent 先提出計畫，等你或系統確認，才執行。

````markdown
## Plan-Validate-Execute（所有破壞性操作必用）

### Step 1：Plan
先列出你打算做的事，**不要執行任何修改**。

例如：
```
Plan: 刪除 users 表中所有 status=inactive 且 last_login > 365 天的帳號
影響筆數：~1,200
風險：中 — 這些帳號可能仍有關聯的 order 記錄
回滾方式：備份表已建立為 users_backup_20260101
```

### Step 2：Validate
驗證你的計畫：
- 影響筆數合理嗎？（不是意外爆增或爆減）
- 有備份機制嗎？
- 有關聯資料需要處理嗎？

### Step 3：Execute
只有驗證通過，才執行。執行後再次驗證結果。
````

這個套路最適合：資料庫操作、檔案系統操作、生產環境變更。

[IMAGE: 三道閘門示意圖。第一道「Plan」寫計畫，第二道「Validate」打勾，第三道「Execute」綠燈。風格：工業安全風]

---

## Pattern 5：Checklists —— 多步驟流程的命脈

人類飛行員起飛前要 check 清單，不是因為他們記不住，而是因為**在壓力下，所有人都會忘東西**。

Agent 也一樣。步驟一多，它就開始省略。

```markdown
## Pre-flight Checklist（必須逐項確認，不得跳過）

- [ ] 1. `.env` 檔案存在且包含所有必要變數（DB_URL、API_KEY、SECRET）
- [ ] 2. 目標資料夾 `output/` 存在，如不存在則建立
- [ ] 3. 昨天的最後執行記錄存在於 `publish_history.json`（沒有的話中止）
- [ ] 4. 本週尚未發布過相同主題（比對 `zh_summary` 相似度）
- [ ] 5. 網路連線可達 api.example.com（`curl -o /dev/null -s -w "%{http_code}"`）
```

**Checklist 的關鍵：每項都要可驗證。** 不要寫「確保網路正常」，要寫「用 curl 確認 HTTP 200」。

> **Checklist 讓 Agent 從「憑感覺做」變成「按 SOP 走」——跟人類一樣，清單寫下來就不會漏。**

---

## Pattern 6：Defaults Not Menus（給預設值，不是給選單）

最懶的 Instructions 長這樣：「你可以用 A 方法或 B 方法，看情況決定。」

Agent 看到這種 instruction，會花 30 秒「思考」選哪個，然後選錯的機率是 50%。

**不要給 Agent 選擇權。直接告訴它用哪個。**

**❌ Before：選單式**
```markdown
你要用 requests 或 httpx 來發 API 請求都可以，看你習慣。
```

**✅ After：預設值 + 簡短備註**
```markdown
## API Client

**使用 httpx（預設）**。理由：
- 支援 async，requests 不支援
- 連線池管理比 requests 好
- 公司內部套件已包裝 httpx 的 retry 邏輯

如果你有特別原因需要用 requests，先說明理由。
```

注意到了嗎？我沒有禁止你用 requests，但**預設值明確、理由清楚**。這在心理學上叫「預設效應」——人類（跟 Agent）都會傾向走默認的路徑。

---

## Pattern 7：Procedural Over Declarative（教 HOW，不是 WHAT）

這是最多人踩的坑。我們習慣說「做一個使用者驗證功能」，但 Agent 需要的是：

```
Step 1: 從表單取得 Email 和密碼
Step 2: 查資料庫比對密碼 hash
Step 3: 產生 JWT token
Step 4: 設定 cookie
Step 5: 回傳 302 redirect
```

**❌ Declarative（宣告式——沒用）：**
```markdown
這個腳本要能夠分析系統日誌並產生報表。
```

**✅ Procedural（程序式——有用）：**
```markdown
## How to analyze logs（程序）

1. 讀取 `/var/log/app/` 底下當日的 `access.log`
2. 用 regex 擷取每一行的 `[status_code]`、`[response_time_ms]`、`[endpoint]`
3. 分類統計：
   - 5xx 錯誤總數 + 各 endpoint 明細
   - 平均 response time > 500ms 的 slow endpoints
   - 請求量 top 10 的 endpoints
4. 輸出為 `report_{date}.md`，格式見下方模板
```

**原因很簡單：Agent 的「常識」來自訓練資料，它知道什麼是「分析日誌」，但它不知道你的日誌格式長怎樣、你關心的指標是什麼。**

> **寫 Instructions 不是在教一個博士生（講概念就懂），是在教一個認真的實習生（要一步一步教）。**

[IMAGE: 對比圖。左邊「做報表」三個字 Agent 歪頭困惑。右邊「Step 1-4」Agent 點頭行動。風格：可愛漫畫風]

---

## 說說我的感受：哪個套路救我最多次？

如果只能選一個，我會選 **Pattern 1：Gotchas**。

為什麼？因為其他六個套路，Agent 頂多做錯或做不好。但 Gotchas 沒寫，Agent 會直接**炸掉生產環境**。

我曾經寫一個資料庫 migration 的 skill，洋洋灑灑寫了步驟、模板、驗證循環，覺得完美了。結果 Agent 在 migration 完之後，順手把舊表格 drop 掉——因為「常識告訴它 migration 後要 cleanup」。

但那個 cleanup 公司有另外的 SOP，不該由 migration 腳本做。

從那天起，我的每個 SKILL.md 開頭都有一段 `## ⚠️ Gotchas`，而且永遠擺在 Steps 前面。

**如果你時間只夠做一件事，寫 Gotchas。**

---

## Next Up

這七個套路，每一個我都用超過十次以上才敢寫出來。不敢說完美，但至少**從此沒跟 Agent 因為 Instructions 吵架過**。

不過 Instructions 寫再好，也只是單一次對話的品質保證。下一篇，我們來聊聊如何把這些套路組裝成一個**完整的發布工作流**——從零到 published，一個 Instruction 搞定。

秘笈 S5：**「從零到發布：寫一個完整的 Agent 工作流」**

敬請期待 🚀

---

*這篇是「Agent Skills 極速學習秘笈」系列的第 4 篇。這個系列用最少的廢話、最多的實例，帶你掌握 Agent Skills 的設計心法。*

---

<div class="vp-doc-navigation">
  <div class="nav-links">
    <a href="/秘笈/03-description-optimization" class="prev">
      ← S3：Description 觸發優化
    </a>
    <a href="/秘笈/05-zero-to-publish" class="next">
      S5：從零到發布實戰 →
    </a>
  </div>
</div>

<style scoped>
.vp-doc-navigation {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--vp-c-divider);
}
.nav-links {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}
.nav-links a {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}
.nav-links a:hover {
  color: var(--vp-c-brand-2);
}
</style>
