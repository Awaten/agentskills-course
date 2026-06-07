---
title: "Chapter 9：在 Skill 中使用 Scripts — 執行外部程式"
description: "學習如何在 Agent Skill 中整合 Python Scripts，讓 Agent 超越文字生成，精確操作真實世界的檔案、API 與資料處理任務。"
outline: [2, 3]
---

# Chapter 9：在 Skill 中使用 Scripts — 執行外部程式

---

## 學習目標

完成本章後，你將能夠：

1. **判斷** 何時該在 Skill 中使用 Script vs 純文字指令，並理解兩者的取捨
2. **撰寫** 符合 Agent 執行標準的 Script：包含 `__name__`、argparse、錯誤處理、`--help`
3. **整合** Script 與 SKILL.md，設計清晰的 Execution 章節來引導 Agent 正確執行
4. **選擇** 適當的 I/O 模式（JSON stdin/stdout、檔案傳遞、命令列引數）
5. **設計** 錯誤處理與復原策略，包含 exit code 合約與驗證循環
6. **排查** Script 整合中的常見問題：路徑、環境、權限、平台差異

---

## 9.1 為什麼 Script 屬於 Skill：超越文字生成

### 9.1.1 LLM 的天花板

到目前為止，你在本書中學會的 Agent Skills 都有一個共同點：**它們是純文字的指令集**。Agent 閱讀 SKILL.md，理解步驟，然後用自己的語言能力完成任務。

但 LLM 有它的天花板。有些事情，文字生成再強也做不好：

| 任務 | LLM 做的事 | 為什麼不該讓 LLM 做 |
|------|-----------|-------------------|
| 計算 MD5 雜湊值 | 在腦中「推論」雜湊結果 | 語言模型沒有計算能力，會產生幻覺 |
| 處理 10,000 行 CSV | 嘗試用「想像」的方式分析 | Context Window 放不下，且數字精度不足 |
| 呼叫系統 API（FFI） | 無法直接呼叫 | 模型沒有執行環境的權限 |
| 精確的字串處理 | 用 Python 風格的「偽代碼」描述 | 結果不可重現，每次執行可能不同 |
| **二進位檔案操作** | 無法讀取 | LLM 不吃二進位資料 |

> ⚠️ **一個常被忽略的事實**：如果你讓 Agent 計算一個檔案的 MD5，它可能會「推論」出一個看似合理的雜湊值——但那完全是幻覺（Hallucination）。這種錯誤極難被發現，因為在沒有對照組的情況下，人類不會去質疑一個「看起來像 MD5」的字串。

**Scripts 存在的理由很簡單：讓 Agent 可以精確地操作真實世界，而不只是「描述」該如何操作。**

### 9.1.2「純指令」vs「Script」的選擇框架

不是所有 Skill 都需要 Script。一個好的選擇標準是：

```
這項任務需要…
├── 精確的計算或資料處理？→ Script
├── 操作檔案系統或二進位資料？→ Script
├── 呼叫外部 API 或系統工具？→ Script
├── 處理大量資料（> 100 筆）？→ Script
└── 以上皆非 → 純 SKILL.md 文字指令即可
```

舉例來說：

- ✅ **需要 Script**：批次調整圖片尺寸、爬取網站資料、解析 PDF、產生加密簽章、大量檔案重新命名
- ❌ **不需要 Script**：決定發佈策略、撰寫程式碼、分析 Git log、制定專案架構

> ⚠️ **界線模糊時**：可以先寫純文字版本，當你發現 Agent 在某一類操作上反覆出錯（例如每次都算出不同的數字），那就是加入 Script 的信號。

---

## 9.2 支援的 Script 類型

Agent Skills 不限制 Script 的語言——只要目標環境能執行就行。以下是實務上最常見的幾種：

### 9.2.1 Python（最推薦）

**為什麼 Python 是首選？**

```
Python 推薦原因
├── 跨平台（Windows / macOS / Linux）
├── 幾乎所有開發環境都已安裝
├── 豐富的標準函式庫（json、argparse、pathlib…）
├── AI Agent 訓練資料中涵蓋大量 Python，理解和除錯成本最低
└── pip 生態系完善，第三方套件隨手可得
```

**基本要求**：Python 3.8+（考慮到 Ubuntu 20.04 LTS 仍廣泛使用）

```python
#!/usr/bin/env python3
"""Script template — 見 §9.6 完整版"""

import argparse
import json
import sys


def main():
    parser = argparse.ArgumentParser(description="處理 XYZ 任務")
    parser.add_argument("--input", required=True, help="輸入檔案路徑")
    parser.add_argument("--output", required=True, help="輸出檔案路徑")
    parser.add_argument("--verbose", action="store_true", help="詳細輸出")
    args = parser.parse_args()

    try:
        # 主要邏輯
        result = {"status": "ok", "message": "處理完成"}
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        if args.verbose:
            print(f"輸出寫入：{args.output}")

    except Exception as e:
        print(f"錯誤：{e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
```

### 9.2.2 Node.js / TypeScript

適合前端生態系中的任務，例如處理 `package.json`、執行 Webpack/Vite 相關操作：

```javascript
#!/usr/bin/env node
// scripts/process-package.js

const fs = require('fs');
const path = require('path');

const [,, inputPath] = process.argv;

if (!inputPath) {
  console.error('使用方式：node process-package.js <package.json 路徑>');
  process.exit(1);
}
```

> ⚠️ **注意**：Node.js 的 `process.argv` 方式比 Python 的 argparse 更容易出錯。建議使用 `yargs` 或 `commander` 套件來處理參數，或者乾脆用 Python。

### 9.2.3 Bash / Shell Script（⚠️ 謹慎使用）

**使用前提**：你 100% 確定目標執行環境是 Unix-like（Linux / macOS）。

```bash
#!/bin/bash
set -euo pipefail
# ⚠️ 這個 Script 只能在 Linux/macOS 執行
# Windows 需要 WSL 或 Git Bash
```

⚠️ **不建議在跨平台 Skill 中使用 Bash**，原因：
- Windows 的 PowerShell 語法完全不同
- 路徑分隔符號（`/` vs `\`）需要處理
- 很多 Unix 工具（`grep`、`awk`、`sed`）在 Windows 預設不安裝

### 9.2.4 編譯式二進位檔（Go、Rust、C++）

適用於高效能需求或需要系統層級存取的任務：

```
scripts/
├── pdf-extract.exe    # Windows 編譯版本
├── pdf-extract-linux  # Linux 編譯版本
└── pdf-extract-macos  # macOS 編譯版本
```

⚠️ **維護成本最高**：需要為多個平台編譯、檔案體積大、難以 review 原始碼。

**判斷標準**：如果不是真的需要（每秒處理 10,000+ 文件、需要直接操作 GPU），優先選擇 Python。

---

## 9.3 Script 的四個必要結構

一個「Agent-Friendly」的 Script 必須包含以下四個元素。缺任何一個，Agent 在執行時就可能卡住或出錯。

### 9.3.1 `if __name__ == "__main__"`（或等價的主入口）

**為什麼必要**：沒有主入口區塊，Script 在 import 時就會執行，無法被其他模組引用，也無法進行單元測試。

```python
# ✅ 正確
def main():
    # 主要邏輯
    pass

if __name__ == "__main__":
    main()

# ❌ 錯誤：全部寫在頂層
import sys
import json
# …（這些程式碼在 import 時就會執行）
```

### 9.3.2 argparse（或等價的參數解析）

**為什麼必要**：Agent 需要知道它可以傳入哪些參數。固定的 CLI 介面讓操作可以預測和組合。

```python
# ✅ 正確：完整的 argparse
parser = argparse.ArgumentParser(description="批次調整圖片尺寸")
parser.add_argument("input_dir", help="輸入目錄")
parser.add_argument("--width", type=int, default=800, help="目標寬度（預設: 800）")
parser.add_argument("--height", type=int, default=600, help="目標高度（預設: 600）")
parser.add_argument("--quality", type=int, default=85, help="JPEG 品質（0-100）")
parser.add_argument("--output", "-o", default="./output", help="輸出目錄")
parser.add_argument("--verbose", action="store_true", help="詳細輸出")

# ❌ 錯誤：環境變數 + 隨意擺放的 sys.argv
import os
width = os.environ.get("WIDTH", 800)  # Agent 不一定會想到設 env var
quality = int(sys.argv[1]) if len(sys.argv) > 1 else 85  # 難以閱讀
```

### 9.3.3 清晰的錯誤訊息（stderr + exit code）

**為什麼必要**：Agent 透過 exit code 和 stderr 來判斷 Script 是否成功。沒有這些，Agent 會盲目地假設一切順利。

```python
# ✅ 正確
import sys
import json

def process_file(path):
    try:
        # …
        return {"status": "ok"}
    except FileNotFoundError as e:
        print(f"錯誤：找不到檔案 — {e}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"錯誤：JSON 格式不正確 — {e}", file=sys.stderr)
        sys.exit(2)
    except Exception as e:
        print(f"錯誤：未預期的異常 — {e}", file=sys.stderr)
        sys.exit(99)

# ❌ 錯誤
def process_file(path):
    try:
        # …
        pass
    except:
        pass  # 吃掉錯誤，Agent 以為成功了
```

### 9.3.4 `--help` 輸出

**為什麼必要**：Agent 在執行前通常會先跑一次 `script.py --help` 來確認參數。`--help` 是 argparse 自動提供的，但如果你用 `sys.argv` 手動解析，就要自己實作。

```bash
# Agent 的典型行為
$ python scripts/resize_images.py --help
usage: resize_images.py [-h] [--width WIDTH] [--height HEIGHT] [--quality QUALITY]
                        [--output OUTPUT] [--verbose]
                        input_dir

批次調整圖片尺寸

positional arguments:
  input_dir              輸入目錄

options:
  -h, --help             show this help message and exit
  --width WIDTH          目標寬度（預設: 800）
  --height HEIGHT        目標高度（預設: 600）
  --quality QUALITY      JPEG 品質（0-100）
  --output OUTPUT        輸出目錄（預設: ./output）
  --verbose               詳細輸出
```

Agent 看到這個輸出，就能正確地構造執行命令。沒有 `--help`，Agent 就必須去猜——而猜的結果往往是錯的。

---

## 9.4 整合：SKILL.md 如何參照 Script

有了 Script 之後，你需要教 Agent **如何正確地使用它**。這不是單純地寫「執行 script.py」——你需要告訴 Agent 很多它不會自己知道的細節。

### 9.4.1 Scripts 目錄結構慣例

```markdown
my-skill/
├── SKILL.md               # 必要：技能指令
├── scripts/               # 選用：可執行程式碼
│   ├── resize_images.py   # 主要處理 Script
│   ├── validate_results.py # 驗證輔助 Script
│   └── requirements.txt   # ⚠️ 如果用到第三方套件
└── references/            # 選用：參考文件
```

> ⚠️ **第三方相依**：如果你的 Script 用到了不是標準函式庫的套件（例如 `pillow`、`requests`），**一定要提供 `requirements.txt`**，並在 Execution 章節中註明安裝方式。Agent 在找不到套件時不會自動去 `pip install`——它只會回報一個看不懂的 `ModuleNotFoundError`。

### 9.4.2 Execution 章節：如何告訴 Agent 執行 Script

這是 SKILL.md 中最關鍵的章節之一。一個完整的 Execution 章節應該包含：

```markdown
## Execution

### Script 位置
- 所有 Script 都在 `scripts/` 目錄下
- 使用 **絕對路徑** 或相對於 SKILL.md 的路徑執行
- ⚠️ 不要用 `cd scripts/` 切換目錄——直接用完整路徑

### 執行方式
```bash
python scripts/resize_images.py \
    --width 800 --height 600 \
    --quality 85 \
    --output ./output \
    ./input
```

### 前置檢查（執行前必做）
- [ ] Python 3.8+ 已安裝（`python --version`）
- [ ] 必要套件已安裝（`pip install -r scripts/requirements.txt`）
- [ ] 輸入資料夾存在且包含檔案
- [ ] 輸出資料夾不存在或為空（避免覆寫）

### 執行後驗證（執行後必做）
- [ ] Script exit code 為 0（`$?` 或 `$LASTEXITCODE`）
- [ ] 輸出檔案存在且大小大於 0
- [ ] 檢查 stderr 是否為空（如有輸出代表有警告）
- [ ] 使用 `scripts/validate_results.py` 進行二次驗證

### 常見錯誤與處理

| Exit Code | 含義 | 處理方式 |
|-----------|------|---------|
| 0 | 成功 | 繼續下一步 |
| 1 | 找不到檔案 | 檢查輸入路徑 |
| 2 | JSON 格式錯誤 | 檢查輸入檔案 |
| 99 | 未預期錯誤 | 停止並通知人類 |
```

**為什麼要把這些寫進 SKILL.md？** 因為 Agent 不會自己想到：
- 要先檢查 Python 版本
- 要先 `pip install`
- 要檢查 exit code
- 執行後要驗證輸出

這些對人類來說是「常識」的事，對 Agent 來說不是。

---

## 9.5 I/O 模式：Script 與 Agent 的資料交換

Script 執行完之後，Agent 需要知道結果。有三種主要的資料交換模式：

### 9.5.1 JSON stdin/stdout（推薦）

最靈活的方式：Script 透過 stdout 輸出 JSON，Agent 讀取並解析。

```python
#!/usr/bin/env python3
"""analyze_logs.py — 分析日誌並輸出 JSON 結果"""

import argparse
import json
import sys
from pathlib import Path


def analyze_logs(log_path: Path) -> dict:
    """分析日誌檔案，回傳結構化結果"""
    if not log_path.exists():
        return {"status": "error", "error": f"檔案不存在：{log_path}"}

    total_lines = 0
    error_lines = 0
    slow_requests = []

    with open(log_path, "r", encoding="utf-8") as f:
        for line in f:
            total_lines += 1
            if "ERROR" in line:
                error_lines += 1
            # 解析回應時間…
            # （略）

    return {
        "status": "ok",
        "summary": {
            "total_lines": total_lines,
            "error_count": error_lines,
            "error_rate": round(error_lines / total_lines * 100, 2) if total_lines else 0,
        },
        "slow_requests": slow_requests[:10],  # 只回傳前 10 筆
    }


def main():
    parser = argparse.ArgumentParser(description="分析日誌檔案")
    parser.add_argument("log_path", help="日誌檔案路徑")
    args = parser.parse_args()

    result = analyze_logs(Path(args.log_path))

    # ✅ 輸出 JSON 到 stdout
    print(json.dumps(result, ensure_ascii=False, indent=2))

    if result["status"] == "error":
        sys.exit(1)


if __name__ == "__main__":
    main()
```

**Agent 端的使用方式**：

```bash
# Agent 執行 Script
python scripts/analyze_logs.py /var/log/app/access.log > /tmp/analysis_result.json

# Agent 讀取結果檔案
cat /tmp/analysis_result.json
# → {"status": "ok", "summary": {"total_lines": 15234, "error_count": 23, ...}}
```

**優點**：
- 輸出完全結構化，Agent 可直接理解
- 支援複雜的巢狀資料
- 可以用檔案暫存結果，跨步驟傳遞資料

⚠️ **注意**：確保 JSON 輸出使用 `ensure_ascii=False`，否則中文會變成 `\uXXXX`。另外，記得設定 `indent=2` 讓 Agent 閱讀——不是為了人類，而是為了讓 Agent 的 tokenizer 更有效地理解結構。

### 9.5.2 檔案傳遞（適合大批量資料）

當輸出太大，無法塞進 stdout 時（例如處理 10,000 張圖片），使用檔案作為中介：

```
Script 流程：
1. 讀取 input/ 目錄中的所有檔案
2. 逐一處理
3. 結果寫入 output/ 目錄
4. 輸出 summary.json（僅摘要，非完整資料）
```

**SKILL.md 中的說明**：

```markdown
## I/O 協定

- 輸入：`input/` 目錄中的原始檔案
- 輸出：處理後的檔案寫入 `output/` 目錄
- 摘要：Script 完成後會在 `output/summary.json` 產生處理摘要
- Agent 應讀取 `output/summary.json` 來確認處理結果，不要逐個檢查輸出檔案

### summary.json 格式
```json
{
  "status": "ok | partial | failed",
  "total": 1000,
  "succeeded": 998,
  "failed": 2,
  "errors": [
    {"file": "corrupted.jpg", "error": "無法讀取檔案頭"}
  ]
}
```
```

### 9.5.3 命令列引數（適合簡單參數）

當參數數量少（≤ 5 個）且都是簡單型別時，直接傳引數：

```bash
python scripts/greeting.py --name "Leo" --lang zh-TW
# → {"message": "你好，Leo！"}
```

**不適合命令列引數的情況**：
- 參數包含巢狀結構 → 用 JSON stdin/stdout
- 參數包含檔案內容 → 用檔案傳遞
- 參數超過 5 個 → 用 JSON stdin/stdout

---

## 9.6 完整的 Script 範本（可直接複製使用）

```python
#!/usr/bin/env python3
"""
Script 範本 — 遵循 Agent Skills 標準
======================================
使用方式：
    python scripts/template.py --input <path> [--output <path>] [--verbose]

功能：
    [在此描述 Script 的功能]

Exit Codes:
    0 — 成功
    1 — 輸入錯誤（檔案不存在、格式錯誤）
    2 — 執行錯誤（IO 失敗、權限不足）
    99 — 未預期的錯誤
"""

import argparse
import json
import sys
from pathlib import Path


def process(input_path: Path, output_path: Path, verbose: bool = False) -> dict:
    """
    主要處理邏輯。

    Args:
        input_path: 輸入檔案或目錄路徑
        output_path: 輸出檔案或目錄路徑
        verbose: 是否輸出詳細資訊到 stderr

    Returns:
        包含處理結果的 dict，至少包含 "status" 欄位

    Raises:
        FileNotFoundError: 輸入路徑不存在
        PermissionError: 無權限讀寫
    """
    if not input_path.exists():
        raise FileNotFoundError(f"輸入路徑不存在：{input_path}")

    if verbose:
        print(f"處理中：{input_path} → {output_path}", file=sys.stderr)

    # --- 主要邏輯寫在這裡 ---
    result = {
        "status": "ok",
        "input": str(input_path),
        "output": str(output_path),
        "message": "處理完成",
    }

    # 寫入輸出檔案
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    return result


def main():
    parser = argparse.ArgumentParser(
        description="[在此描述 Script 的功能]",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exit Codes:
  0  成功
  1  輸入錯誤（檔案不存在、格式錯誤）
  2  執行錯誤（IO 失敗、權限不足）
  99 未預期的錯誤

範例：
  python scripts/template.py --input ./data --output ./result
        """,
    )
    parser.add_argument("--input", "-i", required=True, help="輸入路徑（檔案或目錄）")
    parser.add_argument("--output", "-o", default="./output", help="輸出路徑（預設: ./output）")
    parser.add_argument("--verbose", "-v", action="store_true", help="詳細輸出")
    args = parser.parse_args()

    try:
        result = process(
            input_path=Path(args.input),
            output_path=Path(args.output),
            verbose=args.verbose,
        )

        # 輸出 JSON 結果到 stdout
        print(json.dumps(result, ensure_ascii=False, indent=2))

    except FileNotFoundError as e:
        print(f"錯誤：{e}", file=sys.stderr)
        sys.exit(1)
    except PermissionError as e:
        print(f"錯誤：權限不足 — {e}", file=sys.stderr)
        sys.exit(2)
    except Exception as e:
        print(f"錯誤（未預期）：{e}", file=sys.stderr)
        if args.verbose:
            import traceback
            traceback.print_exc(file=sys.stderr)
        sys.exit(99)


if __name__ == "__main__":
    main()
```

---

## 9.7 實例：一個 PDF 處理 Skill（完整整合）

這是一個真實世界的案例，展示所有元件如何協同運作。

### 目錄結構

```markdown
pdf-extract/
├── SKILL.md
└── scripts/
    ├── extract_text.py       # 主要處理 Script
    └── requirements.txt      # 相依套件
```

### SKILL.md

```markdown
---
name: pdf-extract
description: >
  Extract text and metadata from PDF files using Python and PyMuPDF.
  Use when you need to read, analyze, or extract content from PDF documents.
  Supports batch processing of multiple PDFs.
---

## Execution

### 前置條件（執行前檢查）
- [ ] Python 3.8+ 已安裝（`python --version`）
- [ ] 相依套件已安裝（`pip install -r scripts/requirements.txt`）
- [ ] 目標 PDF 檔案存在且可讀取

### 執行方式

```bash
# 單一檔案
python scripts/extract_text.py --input report.pdf --output extracted/

# 批次處理
python scripts/extract_text.py --input ./pdfs/ --output extracted/ --batch
```

### 處理流程

1. **讀取 PDF**：Script 使用 PyMuPDF（fitz）開啟檔案
2. **提取文字**：逐頁提取，保留段落結構
3. **提取中繼資料**：作者、建立日期、頁數
4. **輸出**：每個 PDF 產生一個 `.txt` 檔案 + 一個 `summary.json`

### 驗證（執行後必做）

- [ ] exit code 為 0
- [ ] 輸出目錄包含對應的 `.txt` 檔案
- [ ] `summary.json` 存在且包含 "pages_extracted" 欄位
- [ ] 提取的文字不為空（`wc -l output/*.txt`）

### 錯誤處理

| 狀況 | 處理方式 |
|------|---------|
| PDF 加密需要密碼 | 跳過該檔案，記錄到 `errors.json`，不中斷批次處理 |
| 單頁提取失敗 | 跳過該頁，繼續其他頁面 |
| 所有檔案都失敗 | exit code 1，輸出說明 |
```

### scripts/extract_text.py（部分）

```python
#!/usr/bin/env python3
"""extract_text.py — 從 PDF 提取文字與中繼資料"""

import argparse
import json
import sys
from pathlib import Path


def extract_pdf(pdf_path: Path, output_dir: Path) -> dict:
    """提取單一 PDF 的文字與中繼資料"""
    try:
        import fitz  # PyMuPDF
    except ImportError:
        print("錯誤：需要安裝 PyMuPDF（pip install pymupdf）", file=sys.stderr)
        sys.exit(2)

    doc = fitz.open(pdf_path)
    metadata = doc.metadata
    pages_text = []

    for page_num, page in enumerate(doc):
        text = page.get_text()
        pages_text.append({
            "page": page_num + 1,
            "char_count": len(text),
        })

    # 輸出為 .txt
    output_path = output_dir / f"{pdf_path.stem}.txt"
    full_text = "\n\n".join(
        f"--- 第 {p['page']} 頁 ---\n{doc[p['page'] - 1].get_text()}"
        for p in pages_text
    )
    output_path.write_text(full_text, encoding="utf-8")

    doc.close()

    return {
        "file": pdf_path.name,
        "pages": len(pages_text),
        "char_count": sum(p["char_count"] for p in pages_text),
        "metadata": {
            "title": metadata.get("title", ""),
            "author": metadata.get("author", ""),
            "pages": len(pages_text),
        },
        # 此處不包含完整文字，完整文字在 .txt 檔案中
    }
```

> ⚠️ **實際上線的 PDF 提取**：真實世界的 PDF 處理遠比這個範例複雜——包含表格提取、圖片 OCR、非標準編碼、從掃描檔 OCR 等。這個範例是為了教學目的簡化過的版本。在正式使用前，建議先用 5-10 份代表性 PDF 測試。

---

## 9.8 Error Handling：為 Agent 設計的錯誤合約

Agent 不是人類——它不會「大概看一下」錯誤訊息然後做出合理判斷。它需要**明確的合約**來知道錯誤發生時該怎麼辦。

### 9.8.1 統一的 Exit Code 協定

```markdown
| Exit Code | 含義 | Agent 的反應 |
|-----------|------|-------------|
| 0 | 成功 | 繼續下一步 |
| 1 | 輸入錯誤（找不到檔案、格式錯誤） | 檢查輸入參數後重試 |
| 2 | 環境錯誤（缺少套件、Python 版本不符） | 安裝相依套件後重試 |
| 3 | 部分成功（部分檔案成功、部分失敗） | 繼續，但記錄失敗項目 |
| 99 | 未預期的內部錯誤 | 停止流程，通知人類 |
```

**為什麼要統一？** 如果每個 Script 的自訂 exit code 都不同，Agent 就無法建立一致的錯誤處理策略。統一的協定讓錯誤處理可以寫進 SKILL.md 的 Execution 章節，一次適用所有 Script。

### 9.8.2 stderr / stdout 分離原則

```python
# ✅ 正確
import sys

# 正常輸出 → stdout
print(json.dumps(result))

# 錯誤訊息 → stderr
print(f"警告：檔案 {path} 為空，已跳過", file=sys.stderr)

# 除錯資訊（只有 --verbose 時）→ stderr
if args.verbose:
    print(f"處理進度：{i}/{total}", file=sys.stderr)
```

**為什麼？**
- **stdout**：Agent 會讀取 stdout 的內容當作 Script 的「回傳值」
- **stderr**：Agent 會檢查 stderr 是否有內容，當作「是否出了問題」的判斷依據

如果 Script 把錯誤訊息印到 stdout，Agent 的 JSON 解析就會失敗。

### 9.8.3 Fallback 指令

在 SKILL.md 中加入「如果 Script 執行失敗怎麼辦」的指示：

```markdown
## 錯誤復原流程

如果 Script 執行失敗（exit code ≠ 0）：

1. **檢查 stderr**：確認錯誤類型
2. **如果 exit code = 1**（輸入錯誤）：驗證輸入路徑和檔案格式
3. **如果 exit code = 2**（環境錯誤）：執行 `pip install -r scripts/requirements.txt`
4. **如果 exit code = 99**（未預期錯誤）：停止流程，呼叫人類介入
5. **重試次數上限**：同一錯誤連續發生 3 次則強制停止

⚠️ 不要自動重試「未預期錯誤」（exit 99）——這可能掩蓋了真正的問題。
```

---

## 9.9 驗證：在整合前獨立測試 Script

這是最常被跳過、但最重要的步驟。

### 9.9.1 獨立測試清單

在將 Script 整合進 SKILL.md 之前，先在命令列中手動測試：

```
[ ] python script.py --help → 輸出正確
[ ] python script.py --input valid_file → exit 0，輸出正確
[ ] python script.py --input non_existent_file → exit 1，stderr 有錯誤訊息
[ ] python script.py --input empty_file → exit 0 或 exit 1（取決於設計），行為合理
[ ] python script.py （不給參數） → exit 2，提示缺少必要參數
[ ] python script.py --input valid_file --output /root/protected/ → exit 2，無權限錯誤
[ ] 在 Script 所在目錄以外的地方執行 → 仍然正常工作（路徑獨立性測試）
```

### 9.9.2 特別要注意的測試情境

```markdown
| 測試情境 | 為什麼重要 | 預期行為 |
|---------|-----------|---------|
| 檔案路徑包含空格 | Agent 產生的路徑可能含空格 | Script 必須正確處理 |
| 檔案路徑包含中文 | Windows 編碼問題 | 使用 `pathlib` 而非 `os.path` |
| 空檔案（0 bytes） | Agent 可能產生空檔案 | 不能直接 crash |
| 大量輸入（1000+ 檔案） | 批次處理壓力測試 | 不能 OOM，要有進度顯示 |
| 網路斷線（如果用到 API） | 依賴外部服務時 | 優雅降級 + 清楚錯誤資訊 |
```

---

## 9.10 常見陷阱（Gotchas）

以下是 Script 整合中最常踩到的坑，每一條都有真實案例支撐：

### 陷阱 1：路徑問題

**症狀**：Script 在專案根目錄下執行正常，但在其他目錄執行時找不到檔案。

**原因**：Script 使用相對路徑時，是相對於「執行時的當前工作目錄」，不是相對於 Script 檔案本身。

```python
# ❌ 錯誤：依賴當前工作目錄
script_dir = "."  # 不確定指向哪裡
config_path = "./config.json"

# ✅ 正確：相對於 Script 所在位置
from pathlib import Path
script_dir = Path(__file__).parent  # 永遠指向 scripts/ 目錄
config_path = script_dir / ".." / "config.json"  # 回到專案根目錄
```

**在 SKILL.md 中的防範**：

```markdown
## ⚠️ 路徑注意事項
- 所有 Script 都已經使用 `Path(__file__).parent` 來處理相對路徑
- 你可以在**任何目錄下**執行 Script，不需要 `cd` 到 scripts/
- 如果你在執行時看到 FileNotFoundError，先檢查路徑是否包含空格
```

### 陷阱 2：環境差異（Windows vs Unix）

**症狀**：在 macOS 上測試通過，但在 Windows 上無法執行。

**常見差異**：

| 項目 | Unix (macOS/Linux) | Windows |
|------|-------------------|---------|
| 路徑分隔符號 | `/` | `\` |
| Python 指令 | `python3` | `python`（有時是 `py`） |
| 換行符號 | `\n` | `\r\n` |
| 執行權限 | `chmod +x` | 沒有「執行權限」概念 |
| shebang | `#!/usr/bin/env python3` | 不支援（但 Python launcher 會處理） |

**解決方案：在 SKILL.md 中指定跨平台執行方式**：

```markdown
## 執行方式（跨平台）

```bash
# Windows
python scripts\script.py --input data\file.txt

# macOS / Linux
python3 scripts/script.py --input data/file.txt
```

**⚠️ 如果你希望 Script 真正跨平台，永遠使用 `pathlib.Path` 而非 `os.path.join`。`pathlib` 會自動根據作業系統選擇正確的路徑分隔符號。**

### 陷阱 3：權限問題

**症狀**：Script 執行到一半因權限不足而失敗。

**原因**：Agent 可能用不同的使用者身份執行，或者目標目錄沒有寫入權限。

**防範方式**：

```python
# 在 Script 開始時檢查權限
import os

output_dir = Path(args.output)
try:
    output_dir.mkdir(parents=True, exist_ok=True)
    # 嘗試寫入測試檔案
    test_file = output_dir / ".write_test"
    test_file.write_text("ok")
    test_file.unlink()
except PermissionError:
    print(f"錯誤：沒有寫入 {output_dir} 的權限", file=sys.stderr)
    sys.exit(2)
```

### 陷阱 4：副檔名 `python` vs `python3`

⚠️ **Windows 上通常只有 `python`，macOS 上 `python` 可能指向 Python 2**。

**安全做法**：在 SKILL.md 中同時列出兩種方式：

```bash
# 先用 python3，不行就用 python
python3 scripts/script.py --input data.txt
# 如果上面失敗（Windows、某些 Linux）
python scripts/script.py --input data.txt
```

### 陷阱 5：Script 在背景執行時沒有輸出

**症狀**：Agent 執行了 Script，但 stdout 沒有輸出任何東西。

**可能原因**：
- Script 的輸出被 buffer 住了（尤其是 Python 的 print 在 pipe 到檔案時會 buffer）
- Script 內部 crash 但錯誤被吃掉了（沒有 `try/except`）

**解決方案**：

```python
# 在 Script 最前面關閉 buffering
print("...", flush=True)  # 每個 print 都強制 flush

# 或者在執行時用 -u 參數
python -u scripts/script.py
```

---

## 9.11 Validation：在 SKILL.md 中加入驗證步驟

單純「執行 Script」是不夠的——Agent 需要知道「如何確認 Script 真的成功完成了」。

### 驗證範本

```markdown
## 執行後驗證

### Step 1：檢查 Exit Code
```bash
echo $?  # macOS / Linux
# 或
echo $LASTEXITCODE  # Windows PowerShell
```
期望值：`0`

### Step 2：檢查輸出
```bash
# 檢查輸出檔案是否存在且非空
ls -lh output/summary.json
wc -l output/*.txt
```

### Step 3：檢查內容正確性
```bash
# 用另一個驗證 Script 檢查
python scripts/validate_results.py --input output/
```

### Step 4：檢查 stderr 是否有警告
```bash
# 重新執行，把 stderr 導向檔案
python scripts/extract_text.py --input input.pdf --output output/ 2>stderr.log
cat stderr.log
# 如果有內容，代表有警告需要關注
```

---

## 9.12 [DIAGRAM: Agent → SKILL.md → Script 互動流程]

```
                       ┌──────────────────────────────────────┐
                       │            Agent 工作階段              │
                       └──────────────────────────────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │   載入 SKILL.md            │
                          │   (被 description 觸發)     │
                          └─────────────┬─────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │   閱讀 Execution 章節       │
                          │   • 前置條件檢查            │
                          │   • Script 路徑與參數       │
                          │   • 錯誤處理合約            │
                          │   • 驗證步驟                │
                          └─────────────┬─────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │   檢查環境就緒              │
                          │   • Python 版本             │
                          │   • pip 套件安裝             │
                          │   • 輸入資料存在             │
                          └─────────────┬─────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │   執行 Script              │
                          │   python scripts/xxx.py    │
                          │   --input A --output B     │
                          └─────────────┬─────────────┘
                                        │
                     ┌──────────────────┼──────────────────┐
                     │                  │                  │
                     ▼                  ▼                  ▼
               ┌────────────┐   ┌────────────┐   ┌────────────┐
               │ Exit Code  │   │   stdout   │   │   stderr   │
               │ = 0?       │   │ JSON 結果   │   │ 錯誤訊息   │
               └──────┬─────┘   └──────┬─────┘   └──────┬─────┘
                      │                │                │
                      └────────────────┼────────────────┘
                                       │
                          ┌────────────┴────────────┐
                          │   Agent 解析輸出          │
                          │   • 讀取 JSON             │
                          │   • 確認 status 欄位       │
                          │   • 記錄結果到 Context     │
                          └────────────┬────────────┘
                                       │
                          ┌────────────┴────────────┐
                          │   執行驗證步驟            │
                          │   • 檢查輸出檔案          │
                          │   • 用驗證 Script 確認    │
                          └────────────┬────────────┘
                                       │
                     ┌─────────────────┼─────────────────┐
                     │                 │                 │
                     ▼                 ▼                 ▼
               ┌────────────┐   ┌────────────┐   ┌────────────┐
               │ 通過 →     │   │ 可修復 →   │   │ 不可修復 → │
               │ 繼續下一步  │   │ 修正後重試  │   │ 通知人類   │
               └────────────┘   └────────────┘   └────────────┘
```

**圖 9.1**: Agent 與 Script 的完整互動流程。SKILL.md 作為中介層，定義了所有互動合約。注意 Script 的輸出（stdout + stderr + exit code）是 Agent 判斷成功與否的唯一依據。

---

## 9.13 總結

### 為什麼 Script 屬於 Skill

1. **LLM 有天然限制**：精確計算、批量處理、二進位操作、系統呼叫——這些是文字生成模型做不到的事
2. **Script 擴展了 Agent 的能力邊界**：讓 Agent 從「描述如何做」進化為「實際執行」
3. **決策框架**：需要精確計算/大量資料/系統操作 → 用 Script；純知識/策略/流程 → 純文字指令即可

### Script 的四個必要結構

| 結構 | 目的 | 不加會怎樣 |
|------|------|-----------|
| `if __name__ == "__main__"` | 主入口 | 無法 import/測試 |
| `argparse` | 參數介面 | Agent 不知道要傳什麼參數 |
| stderr + exit code | 錯誤通報 | Agent 會假設一切順利 |
| `--help` | 自我說明 | Agent 只能猜參數 |

### 整合要點

1. **Execution 章節**是 SKILL.md 與 Script 的橋樑——包含前置檢查、執行指令、驗證步驟、錯誤處理
2. **I/O 模式三選一**：JSON stdin/stdout（推薦）、檔案傳遞（大批量）、命令列引數（簡單參數）
3. **統一錯誤合約**：0=成功、1=輸入錯誤、2=環境錯誤、99=未預期錯誤
4. **執行後驗證不可省略**：exit code + 檔案存在 + 內容正確性
5. **獨立測試 Script**：在整合進 SKILL.md 之前，先手動測試所有邊界情況

### 常見陷阱速查

| 陷阱 | 症狀 | 解法 |
|------|------|------|
| 路徑問題 | 在不同目錄執行時失敗 | 使用 `Path(__file__).parent` |
| 平台差異 | Windows 下無法執行 | 用 `pathlib` 處理路徑，SKILL.md 中標明兩種指令 |
| 權限問題 | 執行到一半因權限不足失敗 | Script 啟動時先測試寫入權限 |
| Buffer 問題 | stdout 沒有輸出 | 使用 `flush=True` 或 `python -u` |
| 第三方套件 | ModuleNotFoundError | 提供 `requirements.txt` + 在 Execution 中標明安裝步驟 |

---

## 練習題

### Q1（概念理解）

請簡要說明 Agent Skills 中的 Script 與純文字指令（SKILL.md 中的步驟描述）各自適合處理什麼類型的任務？你判斷的標準是什麼？

**提示**：思考 LLM 擅長與不擅長的事。如果你要計算 1,000 個檔案的 SHA256 雜湊值，你會用 Script 還是純文字指令？為什麼？

---

### Q2（結構實作）

以下是一個不完整的 Script。請補上缺少的必要結構，並說明為什麼這些結構對 Agent 執行很重要：

```python
import sys
import json

def count_words(text):
    return len(text.split())

text = sys.stdin.read()
result = {"word_count": count_words(text)}
print(result)
```

**提示**：至少缺少 4 個必要結構。對照 §9.3 的列表逐一檢查。

---

### Q3（錯誤處理設計）

你有一個處理圖片的 Script，可能會遇到以下錯誤情境：

- 輸入檔案不是圖片格式（例如使用者傳了一個 `.pdf`）
- 圖片檔案損壞無法開啟
- 輸出目錄的磁碟空間不足
- 使用者沒有提供任何參數

請為上述每個情境設計：
1. 適當的 exit code（參考 §9.8.1 的協定）
2. 輸出到 stderr 的錯誤訊息
3. Agent 應該如何處理這個錯誤（重試？跳過？停止？）

---

### Q4（Execution 章節設計）

假設你有一個 `scripts/merge_csv.py`，功能是合併多個 CSV 檔案。請為這個 Script 撰寫一個完整的 SKILL.md Execution 章節，包含：

- 前置條件檢查清單
- 執行方式（包含參數說明）
- 執行後驗證步驟
- 至少 2 條 Gotchas（路徑、編碼、平台相關）

Script 的使用方式：
```bash
python scripts/merge_csv.py --input-dir ./raw_data/ --output merged.csv --delimiter "|"
```

**提示**：回想 §9.4 的 Execution 章節結構。不要只寫執行指令——Agent 需要知道檢查什麼、驗證什麼、以及哪裡可能出錯。

---

### Q5（進階挑戰：端到端實作）

為以下任務建立完整的 Skill：

> **任務**：一個日誌旋轉（Log Rotation）工具。每天掃描 `/var/log/app/` 目錄，將超過 7 天未修改的 `.log` 檔案壓縮成 `.gz`，並將壓縮後的檔案移到 `/var/log/app/archive/`。

你需要產出：
1. `scripts/rotate_logs.py` — 完整的 Python Script（含 argparse、錯誤處理、--help）
2. `SKILL.md` 的完整 Execution 章節（含前置檢查、執行方式、驗證步驟、錯誤處理）

**特別要求**：
- 處理權限問題（可能沒有寫入 archive/ 的權限）
- 處理空目錄的情況（沒有任何 .log 檔案）
- 處理檔案被其他行程鎖定的情況
- 提供安全的「試執行」模式（`--dry-run`）

**自我驗證清單**：
- [ ] `python scripts/rotate_logs.py --help` 輸出是否清楚？
- [ ] 在沒有 .log 檔案的目錄執行 → exit code 0（不是錯誤）
- [ ] 在沒有權限的目錄執行 → exit code 2
- [ ] 在正常情況下執行 → exit code 0，產生 .gz 檔案
- [ ] `--dry-run` 模式不實際壓縮任何檔案

---

## 延伸閱讀

| 資源 | 說明 |
|------|------|
| [argparse 官方文件](https://docs.python.org/3/library/argparse.html) | Python 標準函式庫的參數解析模組，所有 Script 都該用 |
| [pathlib 官方文件](https://docs.python.org/3/library/pathlib.html) | 跨平台路徑處理，取代過時的 `os.path` |
| [Python Exit Codes Convention](https://docs.python.org/3/library/sys.html#sys.exit) | 關於 exit code 的官方說明 |
| Chapter 7：撰寫高效 Skill 的最佳實務 | 本章的「驗證循環」和「PVE 模式」可以直接套用在 Script 執行流程中 |
| Chapter 10：大型 Skill 架構設計 | 下一章將深入探討當 Skill 超過 5000 tokens 時的模組化策略、子技能編排與版本管理 |

---

*下一章：Chapter 10 — 大型 Skill 架構設計。我們將探討模組化拆分策略、子技能之間的編排機制、參考文件的組織方式，以及如何用 Semantic Versioning 管理技能演化。*

← [Chapter 8：Description 優化](/課程/03-02-description-optimization) | [Chapter 10：大型 Skill 架構](/課程/03-04-large-skill-architecture) →
