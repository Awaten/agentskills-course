---
title: "第 14 章：Skill 與外部系統整合 — API 與 MCP"
description: "學習 Skill 如何與外部系統整合，包含直接 API 呼叫、MCP 協定、環境變數管理、檔案式資料交換與資料庫安全存取模式。"
outline: [2, 3]
---

# 第 14 章：Skill 與外部系統整合 — API 與 MCP

到目前為止，你學會的 Skills 都有一個共同假設：**Agent 需要的所有資訊，都存在 SKILL.md 裡面，或是 Agent 自己能推理出來。**

但真實世界不是這樣的。

一個「分析 GitHub 專案健康度」的 Skill，需要去 GitHub API 拉資料。一個「監控伺服器狀態」的 Skill，需要連到 Prometheus 或 CloudWatch。一個「發布貼文到 Facebook」的 Skill，需要呼叫 Facebook Graph API。

這一章要解決的問題很簡單：**當 Skill 需要的資料不在 Agent 的腦袋裡、也不在 SKILL.md 的文字中時，該怎麼辦？**

答案是一套整合模式：API 呼叫、MCP 伺服器、環境變數、檔案交換——以及最重要的，如何把這些技術選擇正確地封裝進你的 SKILL.md 中。

---

## 學習目標

完成本章後，你將能夠：

1. **區分** Skills 與 MCP 的責任邊界 — 知道什麼該寫進 SKILL.md，什麼該交給 MCP Server
2. **實作** 從 Script 直接呼叫外部 API 的模式（含認證、錯誤處理、速率限制）
3. **設計** Skills + MCP 的協同架構 — Skill 定義流程，MCP 提供連線能力
4. **管理** 認證資訊的安全儲存方式（環境變數、配置檔案、權限邊界）
5. **實作** 檔案式資料交換（JSON/YAML/CSV）作為 API 之外的替代方案
6. **應用** 資料庫存取的安全模式（唯讀查詢、參數化 SQL、連線逾時）
7. **評估** 不同整合方式的取捨（直接 API vs MCP vs 檔案交換）

---

## 14.1 為什麼外部整合是 Skills 的必修課

### 14.1.1 純文字的極限

一個純文字的 Skill 能做的事，上限很明確：

```markdown
## 分析 GitHub 專案
1. 使用者給你一個 GitHub 倉庫名稱
2. 你根據你的訓練資料，提供分析建議
```

問題是：你的訓練資料有截止日期。你不知道該專案最近的 commit 狀況、不知道 open issues 數量、不知道最新 release 版本。

**純文字 Skill 的知識是靜態的，外部系統的資料是動態的。當兩者出現落差，Skill 的價值就開始貶值。**

### 14.1.2 Skills 的三種資料獲取模式

| 模式 | 適合場景 | 即時性 | 複雜度 |
|------|---------|--------|--------|
| **直接 API 呼叫** | 需要即時資料、有公開 API | ⭐⭐⭐ 即時 | ⭐⭐ 中等 |
| **MCP 伺服器** | 需要工具鏈、多步驟操作、安全隔離 | ⭐⭐⭐ 即時 | ⭐⭐⭐⭐ 高 |
| **檔案交換** | 批次處理、離線資料、大量資料 | ⭐ 批次 | ⭐ 低 |
| **環境變數** | 配置參數、認證資訊 | — | ⭐ 低 |

這四種模式不是互斥的。一個複雜的 Skill 可能會同時用到全部四種— Script 透過環境變數讀取 API Key，透過 MCP 查詢資料庫，處理結果以 JSON 檔案輸出，然後 Agent 讀取該 JSON 做進一步分析。

---

## 14.2 直接 API 呼叫：從 Script 連出去

最基本的整合方式：**在 Script 中直接發 HTTP 請求到外部 API**。

### 14.2.1 基本模式

```python
#!/usr/bin/env python3
"""github_stats.py — 查詢 GitHub 專案統計資料"""

import argparse
import json
import sys
import os
import requests  # ⚠️ 需要 pip install requests


def fetch_repo_stats(owner: str, repo: str, token: str = None) -> dict:
    """查詢 GitHub 倉庫的公開統計資料"""
    url = f"https://api.github.com/repos/{owner}/{repo}"
    headers = {"Accept": "application/vnd.github.v3+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        resp = requests.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        return {
            "status": "ok",
            "owner": owner,
            "repo": repo,
            "stars": data.get("stargazers_count", 0),
            "forks": data.get("forks_count", 0),
            "open_issues": data.get("open_issues_count", 0),
            "language": data.get("language"),
            "description": data.get("description", ""),
            "last_updated": data.get("updated_at", ""),
        }

    except requests.exceptions.HTTPError as e:
        if resp.status_code == 403:
            return {"status": "error", "error": "API 速率限制已達上限，請稍後再試"}
        if resp.status_code == 404:
            return {"status": "error", "error": f"倉庫 {owner}/{repo} 不存在"}
        return {"status": "error", "error": f"HTTP {resp.status_code}: {e}"}
    except requests.exceptions.Timeout:
        return {"status": "error", "error": "請求逾時（超過 30 秒）"}
    except requests.exceptions.ConnectionError:
        return {"status": "error", "error": "無法連線至 GitHub API，請檢查網路"}


def main():
    parser = argparse.ArgumentParser(description="查詢 GitHub 專案統計資料")
    parser.add_argument("repo", help="倉庫名稱（格式：owner/repo）")
    parser.add_argument("--token", help="GitHub Personal Access Token（可選，提高速率限制）")
    args = parser.parse_args()

    if "/" not in args.repo:
        print("錯誤：倉庫名稱格式應為 owner/repo，例如 anthropics/skills", file=sys.stderr)
        sys.exit(1)

    owner, repo = args.repo.split("/", 1)
    result = fetch_repo_stats(owner, repo, args.token or os.environ.get("GITHUB_TOKEN"))

    print(json.dumps(result, ensure_ascii=False, indent=2))
    if result["status"] == "error":
        sys.exit(1)


if __name__ == "__main__":
    main()
```

### 14.2.2 SKILL.md 中的 API 宣告

直接 API 呼叫的關鍵在於：**你必須在 SKILL.md 中明確告訴 Agent 這個 Script 依賴外部服務**。Agent 不會自己猜到。

```markdown
## Execution

### 前置條件
- [ ] Python 3.8+ 已安裝
- [ ] `requests` 套件已安裝（`pip install requests`）
- [ ] ⚠️ 網路連線正常（Script 需要連線到 api.github.com）
- [ ] 如果查詢私有倉庫或需要較高速率限制，設定 `GITHUB_TOKEN` 環境變數

### 執行方式
```bash
# 查詢公開倉庫
python scripts/github_stats.py anthropics/skills

# 使用 Token 提高速率限制（從 60 req/hr → 5000 req/hr）
python scripts/github_stats.py anthropics/skills --token $GITHUB_TOKEN
```

### ⚠️ 速率限制注意事項
- 未認證的請求：每小時 60 次（以 IP 計算）
- 使用 Token 認證的請求：每小時 5,000 次
- 如果 Script 回傳 403 錯誤，代表已達速率限制，應等 1 小時後重試
```

> ⚠️ **關於相依套件**：`requests` 是 Python 第三方套件，不是標準函式庫。**你必須在 SKILL.md 中標明安裝方式**，否則 Agent 會在執行時遇到 `ModuleNotFoundError` 且不知道如何處理。如果你希望零相依，可以使用 Python 標準函式庫的 `urllib.request`，但程式碼會冗長許多。

### 14.2.3 速率限制（Rate Limiting）的處理策略

這是 API 整合中最常被忽略、但也最容易導致整合失敗的問題。

```python
def fetch_with_retry(url: str, headers: dict, max_retries: int = 3) -> dict:
    """帶重試機制的 API 請求"""
    import time

    for attempt in range(max_retries):
        resp = requests.get(url, headers=headers, timeout=30)

        if resp.status_code == 429:  # Too Many Requests
            retry_after = int(resp.headers.get("Retry-After", 60))
            print(f"⚠️ 達到速率限制，等待 {retry_after} 秒後重試...",
                  file=sys.stderr)
            time.sleep(retry_after)
            continue

        resp.raise_for_status()
        return resp.json()

    return {"status": "error", "error": f"重試 {max_retries} 次後仍失敗"}
```

**在 SKILL.md 中的處理方式**：

```markdown
### 錯誤處理
| Exit Code | 狀況 | Agent 的反應 |
|-----------|------|-------------|
| 0 | 成功 | 繼續下一步 |
| 1 | API 錯誤（404、403、429） | 檢查錯誤訊息，等待後重試 |
| 2 | 網路錯誤（連線逾時、DNS 解析失敗） | 檢查網路連線後重試 |
```

---

## 14.3 MCP（Model Context Protocol）整合

### 14.3.1 MCP 是什麼（以及它跟 Skills 的關係）

先回顧知識庫中的重要區別：

| | Skills | MCP |
|---|---|---|
| **角色** | 專業知識封裝（Knowledge Encapsulation） | 外部系統連接 |
| **本質** | .md 文字指令 | 通訊協定（JSON-RPC） |
| **告訴 Agent** | 怎麼做這件事 | 怎麼連那個 API |
| **需要寫程式** | 不用 | 要（寫 Server） |
| **資料來源** | 內部知識 | 外部資料 |

**MCP（Model Context Protocol）** 是由 Anthropic 開發的開放協定，定義了 AI Agent 如何與外部工具和資料來源互動。它本質上是個 JSON-RPC 伺服器，Agent（作為 Client）可以透過它：
- 查詢資料庫
- 操作檔案系統
- 呼叫第三方 API
- 執行系統命令（經過安全管控）

### 14.3.2 MCP Server 能提供什麼

一個典型的 MCP Server 會暴露以下三類能力：

```
MCP Server
├── Tools（工具）    → Agent 可以呼叫的工具（例如：search_database、send_email）
├── Resources（資源） → Agent 可以讀取的資料（例如：資料庫 schema、檔案內容）
└── Prompts（提示）   → 預先定義的提示模板（例如：除錯流程、程式碼審查）
```

舉例來說，一個 PostgreSQL MCP Server 會提供：

```json
{
  "tools": [
    {
      "name": "query_database",
      "description": "對 PostgreSQL 資料庫執行 SQL 查詢",
      "inputSchema": {
        "type": "object",
        "properties": {
          "sql": {"type": "string", "description": "SQL 查詢語句"},
          "params": {"type": "array", "description": "查詢參數"}
        }
      }
    },
    {
      "name": "list_tables",
      "description": "列出資料庫中的所有表格"
    }
  ]
}
```

### 14.3.3 一個完整的 MCP Server 最小範例

```python
# mcp_server.py — 一個提供天氣查詢功能的 MCP Server
# ⚠️ 需要 pip install mcp httpx

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import httpx


app = Server("weather-server")


@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_weather",
            description="查詢指定城市的當前天氣",
            inputSchema={
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名稱（中文或英文）",
                    }
                },
                "required": ["city"],
            },
        )
    ]


@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "get_weather":
        city = arguments["city"]
        # 實際上這裡會呼叫真實的天氣 API
        # 此為示範用模擬資料
        return [TextContent(
            type="text",
            text=json.dumps({
                "city": city,
                "temperature": 26,
                "condition": "多雲",
                "humidity": "65%",
            }, ensure_ascii=False)
        )]

    raise ValueError(f"未知工具：{name}")


if __name__ == "__main__":
    import anyio
    anyio.run(stdio_server, app)
```

---

## 14.4 Skills + MCP：協同架構

這可能是本章最重要的一節。

### 14.4.1 責任分界

**Skills 定義流程，MCP 提供工具。兩者不互斥，它們處理不同層次的問題。**

```
Skill（SKILL.md）:
    "分析 GitHub 專案健康度"
    Step 1: 用 fetch_repo_stats MCP 工具取得專案資料  ← 叫 MCP 做事
    Step 2: 分析 star 成長趨勢                         ← 純文字推理
    Step 3: 檢查最近 release 版本                      ← 叫 MCP 做事
    Step 4: 撰寫分析報告                               ← 純文字推理

MCP Server:
    fetch_repo_stats → 連到 GitHub API，回傳資料
    list_recent_releases → 連到 GitHub Releases API，回傳資料
```

### 14.4.2 SKILL.md 中如何參照 MCP

```markdown
---
name: github-health-check
description: >
  Analyze GitHub repository health metrics including stars, issues, releases,
  and commit activity. Use when evaluating open-source projects or auditing
  repository maintenance status.
  Requires the `github-mcp-server` MCP server to be running.
---

## Prerequisites

- ⚠️ **必須**：`github-mcp-server` MCP Server 已啟動並在 MCP 設定檔中註冊
- 如果尚未設定，請執行：`npx @anthropic/github-mcp-server`

## Workflow

### Step 1: Fetch Repository Metadata

使用 MCP 工具 `get_repo` 取得基本資料：

```json
{
  "tool": "get_repo",
  "arguments": {
    "owner": "anthropics",
    "repo": "skills"
  }
}
```

回傳資料包含：stars、forks、open_issues、language、last_updated

### Step 2: Analyze Star Growth Trend

取得 stars 後，評估：
- 專案是快速成長中（近期 stars 增加快）還是趨於穩定？
- stars/language 比例與同類型專案相比如何？

### Step 3: Check Release Frequency

使用 MCP 工具 `list_releases` 取得 release 歷史：

```json
{
  "tool": "list_releases",
  "arguments": {
    "owner": "anthropics",
    "repo": "skills",
    "per_page": 5
  }
}
```

評估指標：
- 最近一次 release 是否在 3 個月內？
- release 間隔是否穩定？（穩定的專案通常有固定發佈節奏）
```

### 14.4.3 為什麼優先選 MCP 而非直接 API？

| 考量 | 直接 API 呼叫 | MCP 伺服器 |
|------|-------------|-----------|
| **設定成本** | 低（幾行程式碼） | 高（需要寫 Server + 設定） |
| **安全管控** | 無（Script 直接存取） | ✅ 有（權限邊界、稽核日誌） |
| **重複使用性** | 低（綁在特定 Script） | ✅ 高（跨 Skills 共享） |
| **認證管理** | 混雜在 Script 中 | ✅ Server 集中管理 |
| **開發難度** | ⭐ 低 | ⭐⭐⭐ 中高 |

**實務建議**：
- **一次性或少用**（只在一個 Skill 中用一次）→ 直接 API 呼叫
- **跨 Skills 共用、需要安全管控、需要稽核日誌** → MCP 伺服器
- ⚠️ **如果不是很確定**：先從直接 API 開始。Script 內的 API 呼叫可以後續重構成 MCP Server，但反過來就很痛苦。

---

## 14.5 認證模式（Authentication Patterns）

### 14.5.1 API Key 認證

最常見的認證方式。關鍵問題是：**API Key 放哪裡？**

```python
# ❌ 錯誤：API Key 寫死在程式碼中
API_KEY = "sk-abc123..."  # 千萬不要！

# ✅ 正確：從環境變數讀取
import os
API_KEY = os.environ.get("SERVICE_API_KEY")
if not API_KEY:
    print("錯誤：請設定 SERVICE_API_KEY 環境變數", file=sys.stderr)
    sys.exit(1)

# ✅ 也可以：從命令列參數傳入（但要注意 shell history 會記錄）
parser.add_argument("--api-key", help="API Key（建議優先使用環境變數）")
```

### 14.5.2 OAuth 2.0 模式

OAuth 需要多步驟的認證流程，這對無頭（headless）的 Agent 來說是個挑戰：

```python
def get_oauth_token(client_id: str, client_secret: str, refresh_token: str) -> str:
    """使用 refresh_token 取得新的 access_token"""
    resp = requests.post("https://api.example.com/oauth/token", json={
        "grant_type": "refresh_token",
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
    }, timeout=30)

    if resp.status_code != 200:
        raise Exception(f"OAuth Token 刷新失敗：{resp.status_code}")

    data = resp.json()
    return data["access_token"]
```

> ⚠️ **OAuth 的實務陷阱**：Access Token 通常有有效期（1 小時左右）。如果你的 Script 需要長時間執行，必須實作 Token 自動刷新機制。在 SKILL.md 中，你需要提醒 Agent「如果收到 401 錯誤，代表 Token 已過期，需要重新認證」。

### 14.5.3 SKILL.md 中的認證說明範本

```markdown
## 認證設定

### 必要環境變數
| 變數名稱 | 說明 | 取得方式 |
|---------|------|---------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | https://github.com/settings/tokens |
| `OPENAI_API_KEY` | OpenAI API Key | https://platform.openai.com/api-keys |

### 設定方式
```bash
# Windows PowerShell
$env:GITHUB_TOKEN = "ghp_xxx..."

# macOS / Linux
export GITHUB_TOKEN="ghp_xxx..."
```

### 權限最小化原則
- GitHub Token：只需要 `repo:public_repo` 和 `read:org` 權限
- ⚠️ **不要使用**有 `admin` 或 `delete_repo` 權限的 Token
```

---

## 14.6 環境變數與配置管理

### 14.6.1 .env 檔案模式

對於需要多個環境變數的 Skill，`.env` 檔案是標準做法：

```markdown
## ⚠️ 首次使用前設定

1. 複製環境變數範本：
   ```bash
   cp .env.example .env
   ```

2. 編輯 `.env`，填入你的 API Keys：
   ```
   GITHUB_TOKEN=ghp_xxx
   OPENAI_API_KEY=sk-xxx
   DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
   ```

3. Script 會自動從 `.env` 檔案讀取（使用 `python-dotenv`）
```

### 14.6.2 平台特定的環境設定

```python
# ⚠️ 跨平台路徑處理
from pathlib import Path

# 設定檔的標準位置
config_paths = [
    Path.home() / ".config" / "my-skill" / "config.json",   # Linux
    Path.home() / "Library" / "Application Support" / "my-skill" / "config.json",  # macOS
    Path(os.environ.get("APPDATA", "")) / "my-skill" / "config.json",  # Windows
]

for path in config_paths:
    if path.exists():
        with open(path) as f:
            config = json.load(f)
        break
```

---

## 14.7 檔案式資料交換

當即時 API 不是選項（沒有網路、沒有 API、資料量太大）時，檔案交換是可靠的替代方案。

### 14.7.1 三種格式的選擇

| 格式 | 適合 | 不適合 | Agent 友善度 |
|------|------|--------|------------|
| **JSON** | 巢狀資料、結構化資料 | 大量記錄（>10,000 筆） | ⭐⭐⭐ 最友善 |
| **YAML** | 配置檔、人類可讀設定 | 大型資料集 | ⭐⭐ 中等 |
| **CSV** | 表格資料、試算表 | 巢狀結構 | ⭐⭐ 中等 |

### 14.7.2 JSON 作為 Skill 的中介格式（推薦）

這是最適合 Agent 處理的格式：

```python
#!/usr/bin/env python3
"""process_data.py — 從 JSON 讀取，處理後輸出 JSON"""

import argparse
import json
import sys
from pathlib import Path


def process(input_path: Path, output_path: Path) -> dict:
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 處理邏輯...
    result = {
        "status": "ok",
        "input_file": str(input_path),
        "records_processed": len(data),
        # ... 處理結果
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", "-i", required=True, help="輸入 JSON 檔案")
    parser.add_argument("--output", "-o", required=True, help="輸出 JSON 檔案")
    args = parser.parse_args()

    result = process(Path(args.input), Path(args.output))
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
```

### 14.7.3 SKILL.md 中的 I/O 合約宣告

```markdown
## I/O 合約

### 輸入格式（input.json）
```json
{
  "repositories": [
    {"owner": "anthropics", "name": "skills"},
    {"owner": "getsentry", "name": "skills"}
  ]
}
```

### 輸出格式（output.json）
```json
{
  "status": "ok",
  "total": 2,
  "results": [
    {"repo": "anthropics/skills", "stars": 15000},
    {"repo": "getsentry/skills", "stars": 480}
  ]
}
```

### Agent 讀取輸出的方式
```bash
# 執行處理
python scripts/process_data.py --input input.json --output output.json

# 讀取結果
cat output.json
```
```

---

## 14.8 資料庫存取（含安全防護）

⚠️ **這是安全風險最高的整合方式。一個錯誤的 SQL 查詢可能造成資料遺失或洩漏。**

### 14.8.1 唯讀查詢模式

對大多數 Skill 來說，你只需要**讀取**資料，不需要**寫入**。

```python
#!/usr/bin/env python3
"""query_db.py — 唯讀資料庫查詢"""

import argparse
import json
import sys
import os
import sqlite3  # 標準函式庫，不需額外安裝


def query_readonly(db_path: str, sql: str, params: list = None) -> dict:
    """
    執行唯讀 SQL 查詢。

    ⚠️ 安全規則：
    1. 只允許 SELECT 查詢
    2. 使用參數化查詢（禁止字串拼接）
    3. 限制回傳筆數上限（最多 1000 筆）
    4. 查詢逾時 30 秒
    """
    sql_stripped = sql.strip().upper()

    # ⚠️ 安全防護：禁止非 SELECT 查詢
    if not sql_stripped.startswith("SELECT"):
        return {"status": "error", "error": "只允許 SELECT 查詢"}

    # ⚠️ 安全防護：限制回傳筆數
    MAX_ROWS = 1000

    try:
        # 使用 uri 唯讀模式（SQLite 專用）
        uri = f"file:{db_path}?mode=ro"
        conn = sqlite3.connect(uri, uri=True, timeout=30)
        cursor = conn.cursor()
        cursor.execute(sql, params or [])
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchmany(MAX_ROWS)
        conn.close()

        return {
            "status": "ok",
            "columns": columns,
            "rows": rows,
            "total": len(rows),
            "truncated": len(rows) == MAX_ROWS,
        }

    except sqlite3.OperationalError as e:
        return {"status": "error", "error": f"SQL 錯誤：{e}"}
    except Exception as e:
        return {"status": "error", "error": f"查詢失敗：{e}"}


def main():
    parser = argparse.ArgumentParser(description="唯讀資料庫查詢")
    parser.add_argument("--db", required=True, help="資料庫檔案路徑")
    parser.add_argument("--sql", required=True, help="SQL 查詢語句")
    parser.add_argument("--params", nargs="*", help="查詢參數（選用）")
    args = parser.parse_args()

    result = query_readonly(args.db, args.sql, args.params)
    print(json.dumps(result, ensure_ascii=False, indent=2))

    if result["status"] == "error":
        sys.exit(1)


if __name__ == "__main__":
    main()
```

### 14.8.2 SKILL.md 中的資料庫安全規則

```markdown
## ⚠️ 資料庫安全規則（嚴格遵守）

1. **唯讀原則**：此 Script 只執行 SELECT 查詢，不支援 INSERT/UPDATE/DELETE
2. **參數化查詢**：永遠使用 `--params` 傳入使用者輸入，**禁止**字串拼接 SQL
3. **回傳上限**：最多 1000 筆，超過時 `truncated` 欄位為 `true`
4. **連線逾時**：30 秒自動中斷，防止長時間查詢鎖定資料庫
5. **資料庫路徑**：只允許存取已明確指定的資料庫檔案

### 錯誤處理
| Exit Code | 狀況 | 處理方式 |
|-----------|------|---------|
| 0 | 查詢成功 | 讀取 JSON 結果中的 `rows` |
| 1 | 查詢失敗（SQL 錯誤、權限不足） | 檢查 SQL 語法後重試 |
```

> ⚠️ **PostgreSQL / MySQL 連線**：上述範例使用 SQLite 作為示範。對於 PostgreSQL，你需要 `pip install psycopg2-binary` 並使用連線字串（`DATABASE_URL` 環境變數），同時**絕對不要將連線字串寫死在程式碼中**。

---

## 14.9 Webhook 模式（接收外部觸發）

有些進階的 Skills 不只「主動去拉資料」，還會「被動等資料送過來」。

### 14.9.1 Webhook 在 Skill 生態中的角色

Webhook 最常見的使用場景是：

1. **CI/CD 觸發**：當 GitHub Actions 完成時，自動觸發一個分析 Skill
2. **排程觸發**：每天早上 8 點，自動執行資料同步 Skill
3. **事件驅動**：當監控系統發出警報時，自動觸發除錯 Skill

### 14.9.2 SKILL.md 中的 Webhook 說明

```markdown
## Webhook 設定（選用）

如果你希望此 Skill 被自動觸發，可以設定 Webhook：

### GitHub Actions 整合
```yaml
# .github/workflows/trigger-skill.yml
on:
  schedule:
    - cron: '0 8 * * *'  # 每天早上 8 點
  workflow_dispatch:       # 也可手動觸發

jobs:
  run-skill:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Analysis
        run: python scripts/analyze.py
        env:
          API_KEY: ${{ secrets.API_KEY }}
```

### Agent 收到 Webhook 觸發時的行為
1. 讀取觸發事件中的上下文資訊（例如：哪個專案、哪個事件類型）
2. 根據事件類型決定執行哪個流程
3. 執行完成後，將結果回寫到 Webhook 來源（例如：在 GitHub Issue 中留言）
```

---

## 14.10 [DIAGRAM: Skill + MCP + API 互動架構]

```
                          ┌─────────────────────────────────────────┐
                          │             Agent 工作階段                │
                          └─────────────────────────────────────────┘
                                       │              │
                           ┌───────────┴──────────┐   │
                           │     SKILL.md 載入     │   │
                           │   (description 觸發)   │   │
                           └───────────┬──────────┘   │
                                       │              │
                           ┌───────────┴──────────┐   │
                           │   讀取 Workflow 步驟   │   │
                           │   Step 1: 叫 MCP 工具  │   │
                           │   Step 2: 文字推理      │   │
                           │   Step 3: 執行 Script   │   │
                           └───────────┬──────────┘   │
                                       │              │
              ┌────────────────────────┼──────────────┼──────────┐
              │                        │              │          │
              ▼                        ▼              ▼          │
   ┌──────────────────┐   ┌──────────────────┐   ┌──────────┐   │
   │   MCP Client     │   │   執行 Script     │   │ 讀取檔案  │   │
   │   (內建於 Agent)  │   │   (Python/shell)  │   │ (JSON/CSV)│   │
   └────────┬─────────┘   └────────┬─────────┘   └────┬─────┘   │
            │                      │                   │          │
            ▼                      ▼                   ▼          │
   ┌──────────────────┐   ┌──────────────────┐   ┌──────────┐   │
   │   MCP Server     │   │  直接 API 呼叫    │   │ 本地檔案  │   │
   │   (JSON-RPC)     │   │  (HTTP Request)  │   │ 系統     │   │
   └────────┬─────────┘   └────────┬─────────┘   └──────────┘   │
            │                      │                             │
            ▼                      ▼                             │
   ┌──────────────────┐   ┌──────────────────┐                  │
   │  外部服務        │   │  外部 API        │                  │
   │  - 資料庫        │   │  - GitHub API    │                  │
   │  - 檔案系統      │   │  - OpenAI API    │                  │
   │  - 第三方工具    │   │  - Slack API     │                  │
   └──────────────────┘   └──────────────────┘                  │
                                                                 │
            ┌───────────────────────────────────────────────────┘
            │
            ▼
   ┌──────────────────┐
   │   環境變數層      │
   │  .env / Secrets  │
   │  API Keys        │
   │  資料庫連線字串   │
   └──────────────────┘
```

**圖 14.1**: Skill 與外部系統的三種整合路徑。左側 MCP 路徑適合跨 Skills 共用的安全存取，中間直接 API 路徑適合一次性整合，右側檔案路徑適合批次/離線處理。底部環境變數層是所有路徑的共同基礎。

---

## 14.11 安全注意事項

### 14.11.1 憑證儲存：絕對禁止與必須遵守

```markdown
## ⚠️ 安全規範（嚴格遵守）

### ❌ 絕對禁止
- 將 API Key、Token、密碼寫死在 SKILL.md 或 Script 中
- 將 `.env` 檔案提交到 Git 倉庫（已加入 `.gitignore` 除外）
- 在命令列參數中直接傳入敏感資訊（會被 shell history 記錄）

### ✅ 正確做法
- API Key → 環境變數（`os.environ.get("KEY")`）
- 資料庫連線 → 連線字串環境變數（`DATABASE_URL`）
- 配置檔案 → `.env` + `.gitignore` + `.env.example`（不含真實值）
- 雲端 Secrets → 使用平台原生的 Secrets 管理（GitHub Secrets、AWS Secrets Manager）

### 如果 Script 需要使用 Token
1. 優先從環境變數讀取
2. 其次從 `.env` 檔案讀取（需已安裝 python-dotenv）
3. 最後備援從命令列參數讀取（但要在 SKILL.md 中註明安全風險）
```

### 14.11.2 權限邊界

```markdown
### 權限最小化原則
- 每個 Skill 只要求它真正需要的權限
- 資料庫查詢 → 使用唯讀帳號（不是管理員帳號）
- API Token → 使用最小必要 scope（不是全權限 Token）
- 檔案存取 → 限定在特定目錄（不是整個檔案系統）

### 權限邊界檢查清單
- [ ] 這個 Script 需要網路存取嗎？→ 如果不需要，考慮離線模式
- [ ] 這個 API Key 有寫入權限嗎？→ 如果只需要讀取，使用唯讀 Key
- [ ] 這個資料庫連線有 DDL 權限嗎？→ 應該使用只有 DML 權限的帳號
```

---

## 14.12 實戰決策框架

當你決定在 Skill 中加入外部整合時，用這個流程來決定路徑：

```
需要外部資料？
├── 需要即時資料？
│   ├── 資料來源有 MCP Server？ → 使用 MCP（§14.3）
│   ├── 需要跨 Skills 共用？ → 建立 MCP Server（§14.3）
│   ├── 一次性或少用？ → 直接 API 呼叫（§14.2）
│   └── 沒有網路？ → 檔案交換（§14.7）
├── 需要操作資料庫？
│   ├── 唯讀查詢？ → 安全查詢 Script（§14.8）
│   └── 需要寫入？ → ⚠️ 需要人類審核，使用 MCP 隔離
├── 需要安全管理？
│   ├── API Key 數量少？ → 環境變數（§14.5 + §14.6）
│   └── 需要完整稽核？ → MCP Server（§14.3 + §14.11）
└── 批次處理大量資料？
    └── JSON/CSV 檔案交換（§14.7）
```

---

## 14.13 總結

### 四種整合模式

| 模式 | 適合場景 | 安全等級 | 開發成本 |
|------|---------|---------|---------|
| 直接 API 呼叫 | 一次性或少用整合 | ⭐⭐（你自己管認證） | 低 |
| MCP 伺服器 | 跨 Skills 共用、需安全管控 | ⭐⭐⭐⭐（隔離執行） | 高 |
| 檔案交換 | 批次處理、離線、大量資料 | ⭐⭐⭐（無網路風險） | 低 |
| 環境變數 | 配置參數、認證資訊 | ⭐⭐⭐（不寫死在程式碼） | 低 |

### Skills + MCP 的關鍵區別

- **Skills** 告訴 Agent「做什麼、怎麼做」— 流程、步驟、專業知識
- **MCP** 告訴 Agent「怎麼拿資料、怎麼連那個系統」— 連線、工具、安全隔離
- 兩者互補：用 MCP 取得資料，用 Skill 的知識處理資料

### 安全紅線（絕對不能踩）

1. ❌ API Key / Token 寫死在程式碼中
2. ❌ SQL 字串拼接（永遠使用參數化查詢）
3. ❌ 不必要的寫入權限（使用唯讀 Token / 唯讀資料庫帳號）
4. ❌ 將 `.env` 提交到 Git
5. ❌ 在命令列參數中傳遞敏感資訊

---

## 練習題

### Q1（概念理解）

請說明 Agent Skills 與 MCP 在外部系統整合中的角色差異。什麼情況該用直接 API 呼叫？什麼情況該用 MCP Server？

<details class="exercise-hint">
<summary>💡 提示</summary>
思考「一次性整合」vs「跨 Skills 共用」的場景差異。如果你要寫一個只在自己專案中用一次的 Slack 通知 Skill，你會用哪種方式？
</details>

---

### Q2（API 整合實作）

以下是一個不完整的 API 請求 Script。請補上缺少的錯誤處理和安全考量：

```python
#!/usr/bin/env python3
"""fetch_weather.py — 查詢天氣"""

import requests

def get_weather(city):
    url = f"https://api.weather.example.com/v1/{city}"
    resp = requests.get(url)
    data = resp.json()
    return data

print(get_weather("台北"))
```

請至少指出 4 個問題，並說明如何修正。

<details class="exercise-hint">
<summary>💡 提示</summary>
考慮 API Key 管理、HTTP 錯誤處理、逾時設定、速率限制、輸出格式。
</details>

---

### Q3（決策框架）

你正在設計一個「GitHub 專案儀表板」Skill，需要：

1. 查詢多個 GitHub 倉庫的 stars、forks、issues 數量
2. 將結果寫入一個 SQLite 資料庫作為快取
3. 每天早上 8 點自動更新
4. 這個儀表板可能會被其他 Skills 重複使用

請根據 §14.12 的決策框架，說明你會選擇哪些整合方式，並解釋理由。

---

### Q4（SKILL.md 安全審查）

以下是一個 SKILL.md 的安全相關節錄。請找出所有安全問題：

```markdown
## 認證設定
在執行前，請先設定以下環境變數：
- DB_CONNECTION=postgresql://admin:password123@prod-db.example.com:5432/users
- GITHUB_TOKEN=ghp_abc123...

## 執行方式
python scripts/query.py --sql "SELECT * FROM users WHERE email = '${USER_INPUT}'"
```

---

### Q5（進階挑戰：完整外部整合 Skill）

建立一個「Hacker News 熱門話題分析」Skill，包含：

1. **Script**：`scripts/fetch_hackernews.py`
   - 從 Hacker News API（`https://hacker-news.firebaseio.com/v0/`）抓取熱門文章
   - 輸出結構化 JSON（包含 title、score、url、author、comments_count）
   - 支援 `--limit` 參數控制回傳筆數
   - 支援 `--min-score` 過濾低分文章
   - 正確的錯誤處理和速率限制

2. **SKILL.md Execution 章節**
   - 前置條件（Python、requests、網路）
   - 執行方式與參數說明
   - 輸出格式說明（讓 Agent 知道怎麼讀取結果）
   - 錯誤處理合約
   - ⚠️ Hacker News API 的速率限制（官方文件：未認證每 IP 每分鐘約 60 次）

3. **分析流程**
   - 抓取熱門文章後，依照主題分類（技術、新創、科學、…）
   - 找出今日最高分文章並摘要重點
   - 輸出分析報告

**自我驗證清單**：
- [ ] `python scripts/fetch_hackernews.py --limit 5` → 正確輸出 5 篇文章
- [ ] `python scripts/fetch_hackernews.py --min-score 100` → 只輸出分數 > 100 的文章
- [ ] 中斷網路後執行 → exit code 1，清楚的錯誤訊息
- [ ] Agent 能正確讀取 JSON 輸出並進行後續分析

---

## 延伸閱讀

| 資源 | 說明 |
|------|------|
| [MCP 官方規格](https://modelcontextprotocol.io) | MCP 協定的完整文件，包含 Server/Client 實作指南 |
| [Python requests 官方文件](https://requests.readthedocs.io/) | Python HTTP 請求套件，所有 API 整合的基礎 |
| [python-dotenv](https://github.com/theskumar/python-dotenv) | 從 `.env` 檔案讀取環境變數的標準套件 |
| [SQLite 安全程式設計](https://docs.python.org/3/library/sqlite3.html) | Python 官方 sqlite3 文件，含參數化查詢說明 |
| Chapter 9：在 Skill 中使用 Scripts | 本章是 Script 整合的基礎，API 呼叫本質上就是一種 Script 整合 |
| Chapter 15：Skills、MCP 與 Subagents | 下一章將探討三個元素如何協同組成完整的 AI Agent 系統 |

---

*下一章：Chapter 15 — Skills、MCP 與 Subagents：三位一體的 Agent 架構。我們將探討如何讓多個 Skills 協作、MCP 作為共同基礎設施、Subagents 平行處理——以及這三者如何組成一個完整的 AI Agent 系統。*

← [上一章：平台生態總覽](/課程/05-01-client-landscape) | [下一章：Skills+MCP+Subagents](/課程/05-03-skills-mcp-subagents) →
