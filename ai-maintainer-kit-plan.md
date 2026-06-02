# AI Maintainer Kit 製作計畫

> 目標：建立一個給 TypeScript / Frontend / Node OSS 專案使用的 AI 維護工作流工具包，幫專案快速導入 `AGENTS.md`、AI review skills、PR review、docs sync、release check、test gap analysis 與前端 UI 驗證流程。

---

## 1. 專案定位

### 專案名稱

暫定：

```txt
ai-maintainer-kit
```

### 一句話定位

```txt
AI Maintainer Kit helps TypeScript frontend OSS projects add repeatable AI-assisted workflows: AGENTS.md, frontend review skills, PR review checklist, docs sync, release check, and test gap analysis.
```

中文理解：

> 幫 TypeScript / React / Vue 開源專案快速導入 AI 維護流程。

### 不要定位成

```txt
AI prompt collection
```

這樣太弱，會像是 prompt 收集包，而不是有維護價值的 OSS 工具。

### 正確定位

```txt
A reusable AI maintainer workflow kit for TypeScript frontend OSS repositories.
```

---

## 2. 專案總目標

這個 repo 不是單純模板包，而是三層結構：

```txt
CLI 安裝器
  ↓
AI skills
  ↓
OSS maintainer workflow templates
```

目標是讓使用者在自己的 repo 裡執行：

```bash
npx create-ai-maintainer-kit init
```

然後自動產生：

```txt
AGENTS.md
.agents/skills/*
.github/PULL_REQUEST_TEMPLATE.md
.github/workflows/*
docs/maintainer/*
ai-maintainer.config.json
```

---

## 3. Monorepo 架構

```txt
ai-maintainer-kit/
├─ packages/
│  ├─ create-ai-maintainer-kit/
│  ├─ frontend-review-skills/
│  └─ maintainer-workflow-templates/
├─ examples/
│  ├─ react-vite-demo/
│  └─ vue-vite-demo/
├─ docs/
│  ├─ getting-started.md
│  ├─ skills.md
│  ├─ workflows.md
│  ├─ frontend-review.md
│  └─ codex-oss-application-notes.md
├─ .github/
│  ├─ workflows/
│  └─ ISSUE_TEMPLATE/
├─ AGENTS.md
├─ CONTRIBUTING.md
├─ CHANGELOG.md
├─ README.md
├─ package.json
├─ pnpm-workspace.yaml
└─ tsconfig.base.json
```

---

## 4. 三個核心 package 分工

| Package | 負責內容 | 對外價值 |
|---|---|---|
| `create-ai-maintainer-kit` | CLI 安裝器 / 產生器 | 讓使用者一鍵導入整套 workflow |
| `frontend-review-skills` | 前端 AI review skills | 讓 Codex / Claude Code 能穩定做前端審查 |
| `maintainer-workflow-templates` | AGENTS.md、PR template、GitHub workflow、maintainer docs | 標準化 OSS 維護流程 |

---

# 5. Package 1：`create-ai-maintainer-kit`

## 5.1 功能定位

這是整個 repo 最重要的入口。

它要解決的問題：

- 使用者不知道 `AGENTS.md` 要寫什麼
- 使用者不知道 AI skills 要放哪裡
- 使用者不知道 PR review prompt 要怎麼設計
- 使用者不知道 release check 要檢查什麼
- 使用者不知道前端專案怎麼導入 AI review workflow

所以 CLI 的核心價值是：

> 使用者不用懂 AI maintainer workflow，跑一次 CLI 就能把基本維護流程導入 repo。

---

## 5.2 CLI 指令設計

### `init`

```bash
npx create-ai-maintainer-kit init
```

互動式問答：

```txt
? Project type
  React + Vite
  Vue + Vite
  Next.js
  Node + Express

? Package manager
  pnpm
  npm
  yarn

? Select workflows
  [x] AGENTS.md
  [x] Frontend PR Review Skill
  [x] Test Gap Analysis Skill
  [x] Docs Sync Skill
  [x] PR Template
```

產生檔案：

```txt
AGENTS.md
.agents/skills/frontend-pr-review/SKILL.md
.agents/skills/test-gap-analysis/SKILL.md
.agents/skills/docs-sync/SKILL.md
.github/PULL_REQUEST_TEMPLATE.md
docs/maintainer/review-checklist.md
ai-maintainer.config.json
```

---

### `add skill`

```bash
npx create-ai-maintainer-kit add skill frontend-pr-review
npx create-ai-maintainer-kit add skill test-gap-analysis
npx create-ai-maintainer-kit add skill docs-sync
```

用途：

> 讓已經初始化過的 repo 可以額外補 skill。

---

### `doctor`

```bash
npx create-ai-maintainer-kit doctor
```

輸出範例：

```txt
✓ package.json found
✓ React detected
✓ TypeScript detected
✓ pnpm detected
✓ test script found
⚠ typecheck script not found
⚠ no Playwright config found
✗ CONTRIBUTING.md not found
```

這個功能很重要，因為它讓工具不只是複製檔案，而是可以幫 repo 做基本健康檢查。

---

## 5.3 CLI 需要偵測的內容

| 偵測項目 | 用途 |
|---|---|
| `package.json` | 判斷 scripts、dependencies |
| `pnpm-lock.yaml` / `package-lock.json` / `yarn.lock` | 判斷 package manager |
| `vite.config.*` | 判斷 Vite |
| `next.config.*` | 判斷 Next.js |
| `vue` dependency | 判斷 Vue |
| `react` dependency | 判斷 React |
| `playwright.config.*` | 判斷是否支援 UI verification |
| `tsconfig.json` | 判斷 TypeScript |
| `.github/workflows` | 判斷是否已有 CI |
| `changeset` / `semantic-release` | 判斷 release flow |

---

## 5.4 第一版 MVP

第一版先做：

```txt
init
add skill
doctor
```

不要一開始做太多。

MVP 成功標準：

```txt
一個 React / Vue 專案跑完 CLI 後，
Codex / Claude Code 可以讀 AGENTS.md，
可以用 frontend-pr-review skill 做 review，
並且有 PR template 與 review checklist 可以使用。
```

---

# 6. Package 2：`frontend-review-skills`

## 6.1 功能定位

這是整個 repo 的技術核心，也是最能放大前端經驗的地方。

它不是 runtime 套件，而是一包可複製到 `.agents/skills` 的 AI skills。

---

## 6.2 Package 結構

```txt
packages/frontend-review-skills/
  skills/
    frontend-pr-review/
      SKILL.md
      references/
        react-checklist.md
        vue-checklist.md
        accessibility-checklist.md
        responsive-checklist.md

    test-gap-analysis/
      SKILL.md
      references/
        testing-checklist.md

    docs-sync/
      SKILL.md
      references/
        docs-sync-checklist.md

    responsive-review/
      SKILL.md
      references/
        responsive-checklist.md

    accessibility-review/
      SKILL.md
      references/
        a11y-checklist.md

    state-management-review/
      SKILL.md
      references/
        react-state.md
        vue-pinia.md

    ui-flow-verification/
      SKILL.md
      references/
        playwright-guide.md
        viewport-checklist.md
```

---

## 6.3 Skill 1：`frontend-pr-review`

### 用途

檢查 React / Vue 前端 PR 的元件設計、狀態管理、UI 狀態、a11y、RWD、測試缺口。

### 檢查內容

| 類別 | 具體檢查 |
|---|---|
| 元件拆分 | 元件是否過大、責任是否混雜 |
| props 設計 | props 是否過多、命名是否清楚 |
| state | state 是否放錯層、是否能下放 |
| loading / error / empty | API 狀態是否完整 |
| 表單 | validation、錯誤提示、disabled 狀態 |
| event handler | 命名、重複邏輯、side effect |
| hook / composable | 是否能抽出共用邏輯 |
| CSS / RWD | class 是否混亂、RWD 是否可維護 |
| a11y | button、label、focus、alt |
| 測試 | 是否缺 unit / integration / e2e |

### 輸出格式

```md
## Review Summary

## High Risk Issues

## Medium Risk Issues

## Missing Tests

## Suggested Changes

## Verification Steps
```

---

## 6.4 Skill 2：`test-gap-analysis`

### 用途

分析 PR 改了哪些行為，但缺少哪些測試。

### 輸出格式

```md
## Changed Behavior

## Existing Test Coverage

## Missing Test Cases

## Suggested Test Files

## Minimal Test Plan
```

### 範例測試建議

```txt
- should show loading state while fetching products
- should show empty state when product list is empty
- should prevent submit when required fields are missing
- should preserve cart items after refresh
```

---

## 6.5 Skill 3：`docs-sync`

### 用途

檢查 README / docs 是否跟程式碼不同步。

### 檢查內容

```txt
README command 是否仍存在
package scripts 是否跟文件一致
CLI options 是否跟 docs 一致
exported API 是否有文件
examples 是否可以執行
deprecated API 是否仍出現在 docs
```

### 輸出格式

```md
## Docs Drift Summary

## Outdated Sections

## Missing Documentation

## Suggested Updates
```

---

## 6.6 Skill 4：`responsive-review`

### 用途

專門檢查 RWD 問題。

### 建議 viewport

```txt
375px mobile
768px tablet
1024px laptop
1440px desktop
```

### 檢查內容

```txt
header 是否爆版
card grid 是否斷裂
modal 是否超出螢幕
button 是否過小
table 是否可讀
圖片比例是否跑掉
文字是否超出
```

---

## 6.7 Skill 5：`accessibility-review`

### 用途

專門檢查基本 a11y 問題。

### 檢查內容

```txt
button 是否真的用 button
input 是否有 label
圖片是否有 alt
focus state 是否可見
keyboard navigation 是否正常
ARIA 是否誤用
互動元件是否可用鍵盤操作
```

---

## 6.8 Skill 6：`state-management-review`

### 用途

針對 React / Vue 狀態管理做 review。

### React 檢查

```txt
useEffect dependency 是否錯
derived state 是否不必要
server state 是否誤放 local state
context 是否過度使用
memo / useMemo / useCallback 是否亂用
```

### Vue 檢查

```txt
ref / reactive 是否合理
computed 是否可取代 watch
watch 是否造成 side effect 混亂
Pinia store 是否塞太多 UI state
composable 是否可以抽出
UI state 是否不該放進全域 store
```

---

## 6.9 Skill 7：`ui-flow-verification`

### 用途

讓 AI 可以針對前端互動流程提出驗證步驟。

第一版不用真的自動控制 Playwright，先產生可執行檢查計畫。

### 適合流程

```txt
登入
註冊
購物車
checkout
搜尋
篩選
表單送出
modal
drawer
mobile nav
```

### 輸出格式

```md
## Flow Under Test

## Required Test Data

## Manual Verification Steps

## Playwright Test Suggestions

## Mobile Viewport Checks

## Expected Risks
```

---

# 7. Package 3：`maintainer-workflow-templates`

## 7.1 功能定位

這個 package 是模板庫，不直接給使用者操作，而是被 `create-ai-maintainer-kit` 複製出去。

---

## 7.2 Package 結構

```txt
packages/maintainer-workflow-templates/
  templates/
    agents/
      react-vite.AGENTS.md
      vue-vite.AGENTS.md
      nextjs.AGENTS.md
      node-express.AGENTS.md

    github/
      PULL_REQUEST_TEMPLATE.md
      workflows/
        ai-pr-review.yml
        docs-sync.yml
        release-check.yml

    docs/
      maintainer/
        ai-workflow.md
        review-checklist.md
        release-process.md
        contribution-guide.md

    config/
      ai-maintainer.config.json
```

---

## 7.3 Template 1：`AGENTS.md`

### 內容區塊

```md
# AGENTS.md

## Project Overview

## Commands

## Code Style

## Review Expectations

## Frontend Rules

## Testing Rules

## Directory Notes
```

### 範例內容

```md
# AGENTS.md

## Project Overview

This is a React + Vite + TypeScript project.

## Commands

- Install dependencies: `pnpm install`
- Start dev server: `pnpm dev`
- Run lint: `pnpm lint`
- Run typecheck: `pnpm typecheck`
- Run tests: `pnpm test`
- Build: `pnpm build`

## Code Style

- Prefer small components with clear responsibilities.
- Keep data fetching outside presentational components when possible.
- Avoid unnecessary abstractions.
- Do not refactor unrelated files.

## Review Expectations

Before completing any non-trivial change:

1. Explain what changed.
2. Run the relevant verification command.
3. Mention any tests that were not run.
4. Call out risks and follow-up work.

## Frontend Rules

- Handle loading, error, empty, and success states.
- Keep form validation visible and user-friendly.
- Preserve keyboard accessibility.
- Check mobile viewport when UI layout changes.

## Directory Notes

- `src/components`: reusable UI components.
- `src/features`: feature-specific logic.
- `src/hooks`: shared React hooks.
- `src/api`: API clients and request helpers.
```

---

## 7.4 Template 2：PR Template

```md
## Summary

## Changes

## Screenshots / Videos

## Test Plan

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Manual browser check
- [ ] Mobile viewport check

## AI Review Checklist

- [ ] Loading / error / empty states checked
- [ ] Accessibility checked
- [ ] Responsive layout checked
- [ ] Docs updated if needed
- [ ] Release note needed?
```

---

## 7.5 Template 3：Review Checklist

內容：

```txt
Component responsibility
State management
API loading/error/empty states
Form validation
Accessibility
Responsive layout
Testing
Documentation
```

---

## 7.6 Template 4：`ai-pr-review.yml`

第一版不一定要真的呼叫 OpenAI API，可以先提供 workflow template。

功能目標：

```txt
PR opened / synchronize 時觸發
抓 changed files
要求 AI 只 review changed scope
輸出 high risk / medium risk / missing tests
留言到 PR
```

---

## 7.7 Template 5：`release-check.yml`

檢查：

```txt
是否更新 CHANGELOG
是否更新 version
是否有 breaking change
是否補 migration guide
是否通過 tests/build
是否 docs 有同步
```

輸出格式：

```md
## Release Readiness

## Blocking Issues

## Non-blocking Issues

## Suggested Changelog Entry

## Migration Notes
```

---

## 7.8 Template 6：Maintainer Docs

CLI 會產生：

```txt
docs/maintainer/ai-workflow.md
docs/maintainer/release-process.md
docs/maintainer/review-checklist.md
docs/maintainer/contribution-guide.md
```

用途：

| 文件 | 功能 |
|---|---|
| `ai-workflow.md` | 告訴 contributor / maintainer 怎麼使用 AI workflow |
| `release-process.md` | release 前要跑哪些檢查 |
| `review-checklist.md` | 人工 review 與 AI review 的共同標準 |
| `contribution-guide.md` | 如何送 PR、如何補測試、如何寫 changeset |

---

# 8. 技術選型

| 項目 | 選擇 |
|---|---|
| Monorepo | pnpm workspace |
| 語言 | TypeScript |
| CLI | Node.js + commander 或 cac |
| 互動問答 | `@inquirer/prompts` |
| 測試 | Vitest |
| 打包 | tsup |
| 格式化 | Prettier |
| Lint | ESLint |
| Release | Changesets |
| 文件 | Markdown 先，不急著做網站 |
| 範例專案 | React + Vite、Vue + Vite |

先不要做：

```txt
VS Code Extension
MCP Server
GitHub App
雲端服務
登入系統
SaaS 化
```

---

# 9. 8 週製作計畫

## 總覽

```txt
第 1-2 週：Repo 架構 + CLI MVP
第 3-4 週：AGENTS.md / Skills / Templates
第 5-6 週：Frontend Review 能力做深
第 7 週：文件、範例 repo、demo
第 8 週：發布 npm、寫文章、開始累積使用證據
```

---

## 第 1 週：建立 monorepo 骨架

### 目標

先把 repo 變成像樣的 OSS 專案，不要一開始就寫一堆功能。

### 要做的事

```txt
1. 建立 GitHub repo
2. 建立 pnpm workspace
3. 建立三個 packages
4. 設定 TypeScript
5. 設定 Vitest
6. 設定 tsup
7. 設定 Changesets
8. 建立 README / CONTRIBUTING / LICENSE / CHANGELOG
9. 建立基本 CI
```

### 驗收條件

```bash
pnpm install
pnpm build
pnpm test
```

都可以正常跑。

---

## 第 2 週：做 CLI MVP

### 目標

完成 `create-ai-maintainer-kit` 的第一版。

### 要做的事

```txt
1. 實作 init command
2. 實作 add skill command
3. 實作 doctor command
4. 實作 package manager 偵測
5. 實作 React / Vue / Next / Node 偵測
6. 實作檔案產生邏輯
7. 避免覆蓋既有檔案，必要時詢問確認
```

### 驗收條件

```bash
npx create-ai-maintainer-kit init
npx create-ai-maintainer-kit doctor
```

可以在 demo repo 產生正確檔案。

---

## 第 3 週：做 templates package

### 目標

完成 `maintainer-workflow-templates` 第一版。

### 要做的事

```txt
1. React + Vite AGENTS.md
2. Vue + Vite AGENTS.md
3. Next.js AGENTS.md
4. Node + Express AGENTS.md
5. PR template
6. review-checklist.md
7. ai-workflow.md
8. ai-maintainer.config.json
```

### 驗收條件

CLI 可以從 templates package 複製模板到目標 repo。

---

## 第 4 週：做 frontend skills 第一版

### 目標

完成最核心的三個 skills。

### Skills

```txt
frontend-pr-review
test-gap-analysis
docs-sync
```

### 驗收條件

每個 skill 都要有：

```txt
SKILL.md
清楚 description
使用情境
檢查清單
固定輸出格式
references
```

---

## 第 5 週：前端 review 能力做深

### 目標

把前端專業度放進工具裡。

### 新增 Skills

```txt
responsive-review
accessibility-review
state-management-review
```

### 驗收條件

每個 skill 都要能回答：

```txt
什麼時候使用
檢查什麼
輸出什麼
怎麼驗證
```

---

## 第 6 週：加入 UI Flow / Playwright 方向

### 目標

完成 `ui-flow-verification`。

### 要做的事

```txt
1. 定義登入 / 註冊 / 購物車 / checkout / 表單流程檢查格式
2. 定義 mobile viewport 檢查
3. 定義 Playwright 測試建議輸出格式
4. 加入範例 prompt
```

### 驗收條件

可以針對一個 checkout flow 產生完整驗證計畫。

---

## 第 7 週：文件、範例 repo、Demo

### 目標

讓 repo 看起來不像半成品。

### 必做文件

```txt
README.md
docs/getting-started.md
docs/skills.md
docs/workflows.md
docs/frontend-review.md
docs/examples.md
docs/faq.md
```

### README 結構

```md
# AI Maintainer Kit

## Why this project exists

## Features

## Quick Start

## What gets generated

## Available Skills

## Supported Project Types

## Examples

## Roadmap

## Contributing
```

### Examples

```txt
examples/
  react-vite-demo/
  vue-vite-demo/
```

每個 example 都要有：

```txt
Before
After
Generated AGENTS.md
Generated skills
Sample review output
```

---

## 第 8 週：發布與累積證據

### 目標

發布第一版並開始累積 OSS 使用證據。

### 發布 npm

至少發布：

```txt
create-ai-maintainer-kit
frontend-review-skills
maintainer-workflow-templates
```

版本：

```txt
v0.1.0
```

### GitHub Release Note

```md
## v0.1.0

### Added

- CLI init command
- CLI doctor command
- Frontend PR review skill
- Test gap analysis skill
- Docs sync skill
- React + Vue AGENTS.md templates
- PR template
```

### 第一篇推廣文章

題目：

```txt
我做了一個給前端 OSS 專案用的 AI Maintainer Kit：讓 Codex / Claude Code 更懂你的 repo
```

內容架構：

```txt
1. 為什麼只靠 prompt 不夠
2. AGENTS.md 解決什麼問題
3. Skill 解決什麼問題
4. CLI 如何初始化
5. React / Vue 專案範例
6. 下一步 roadmap
```

---

# 10. 版本 Roadmap

## v0.1：可安裝 MVP

目標：可以跑、可以產生檔案。

```txt
create-ai-maintainer-kit init
create-ai-maintainer-kit doctor
frontend-pr-review skill
test-gap-analysis skill
docs-sync skill
React / Vue AGENTS.md
PR template
```

---

## v0.2：前端 review 強化

目標：把前端經驗變成工具價值。

```txt
responsive-review
accessibility-review
state-management-review
ui-flow-verification
Next.js template
Node Express template
```

---

## v0.3：OSS 維護流程強化

目標：更像 maintainer toolkit。

```txt
release-check skill
docs/maintainer/release-process.md
GitHub workflow templates
changeset support
CONTRIBUTING template
issue templates
```

---

## v0.4：導入真實專案

目標：產生使用證據。

```txt
導入你的植物電商 repo
導入一個 Vue demo repo
導入一個 React demo repo
產生 sample PR review
錄 demo 影片
寫完整文件
```

---

## v0.5：準備 Codex for OSS 申請材料

目標：能講出「這不是玩具 repo」。

```txt
整理 adoption evidence
整理 npm downloads
整理 GitHub stars / forks
整理 issue / PR 維護紀錄
整理 roadmap
整理 API credits 用途
整理申請表回答
```

---

# 11. 每週工作分配

假設週一到週五每天 4 小時，週末不排。

## 每天建議節奏

```txt
30 分鐘：整理今日目標
2 小時：實作
45 分鐘：測試 / 修 bug
30 分鐘：寫 docs / changelog
15 分鐘：commit / issue update
```

注意：

> 不要整天只寫 code。OSS repo 最重要的是文件、範例、維護紀錄。

---

# 12. GitHub Issue 規劃

## Milestone：v0.1

```txt
[CLI] Setup pnpm workspace
[CLI] Implement init command
[CLI] Implement doctor command
[Templates] Add React AGENTS.md template
[Templates] Add Vue AGENTS.md template
[Templates] Add PR template
[Skills] Add frontend-pr-review skill
[Skills] Add test-gap-analysis skill
[Skills] Add docs-sync skill
[Docs] Write getting started guide
[Examples] Add react-vite-demo
[Release] Publish v0.1.0
```

## Milestone：v0.2

```txt
[Skills] Add responsive-review
[Skills] Add accessibility-review
[Skills] Add state-management-review
[Skills] Add ui-flow-verification
[Templates] Add Next.js AGENTS.md
[Docs] Add frontend review guide
```

## Milestone：v0.3

```txt
[Workflow] Add release-check template
[Workflow] Add docs-sync workflow template
[Workflow] Add GitHub Actions examples
[Docs] Add release process guide
[Examples] Add Vue demo
```

---

# 13. 建議實作順序

不要照 package 順序做。  
要照「能不能早點看到成果」做。

## 正確順序

```txt
1. 先手刻一份 AGENTS.md
2. 手刻 frontend-pr-review/SKILL.md
3. 手刻 PR template
4. 放到一個 demo repo 測試
5. 確認內容真的有用
6. 再做 CLI 把它自動產生
7. 再抽成 packages
8. 最後才補 GitHub workflow
```

原因：

> 先驗證內容有沒有價值，再工具化。

不要一開始就陷入 CLI 架構設計，結果產生的東西沒人想用。

---

# 14. 最小可展示 Demo

第一個 demo 可以用 React / Vite 專案。

## Demo 流程

```bash
npx create-ai-maintainer-kit init
```

產生檔案後，開一個 demo PR：

```txt
新增 ProductCard 元件
新增 loading 狀態
故意缺 empty state
故意少 a11y label
故意沒有測試
```

然後用 skill review，輸出：

```md
## High Risk Issues

- ProductCard handles data formatting, UI rendering, and navigation in one component.
- Empty state is missing when product list is empty.

## Missing Tests

- should render empty state when product list is empty
- should disable submit button while loading
```

這種 demo 很有說服力。

---

# 15. Codex for OSS 申請前要累積的證據

不建議 v0.1 就申請。

至少等到：

```txt
v0.3 以上
有 npm package
有 2-3 個 release
有 example repos
有 README / docs
有 issue / PR 紀錄
有一些 stars / forks / downloads
有實際使用案例
```

---

## 申請時可以主打

```txt
This project helps TypeScript frontend OSS maintainers adopt repeatable AI-assisted maintenance workflows, including AGENTS.md setup, frontend PR review, docs sync, release checks, and test gap analysis.
```

## API credits 用途

```txt
API credits will be used to run AI-assisted PR review, docs drift checks, release readiness checks, and test gap analysis for this repository and its example projects.
```

---

# 16. 第一個實作任務

不要先開 CLI。

第一步先建立這 3 個核心內容：

```txt
1. React / Vue 通用 AGENTS.md
2. frontend-pr-review/SKILL.md
3. PULL_REQUEST_TEMPLATE.md
```

這三個內容如果寫不好，後面 CLI 做得再漂亮也沒用。

---

# 17. 下一步建議

下一份文件可以繼續拆成：

```txt
ai-maintainer-kit v0.1 詳細規格書
```

內容包含：

```txt
功能需求
目錄結構
CLI 指令設計
產生檔案內容
Skill.md 初版
Issue 清單
README 初版
```

這樣可以直接丟給 Codex / Claude Code 開始實作。
