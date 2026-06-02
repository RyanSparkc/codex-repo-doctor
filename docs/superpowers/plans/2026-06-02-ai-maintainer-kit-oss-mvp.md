# AI Maintainer Kit OSS MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a small, public-ready OSS seed for AI Maintainer Kit that can demonstrate maintainer workflow value and support a future Codex for OSS application.

**Architecture:** Keep v0.1 dependency-free: a Node type-stripped TypeScript CLI, Markdown skills, Markdown templates, and docs. The CLI writes a safe baseline without overwriting existing files and reports repository readiness through `doctor`.

**Tech Stack:** Node 24, native TypeScript type stripping, `node:test`, Markdown templates.

---

### Task 1: Repository Baseline

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `README.md`
- Create: `CONTRIBUTING.md`
- Create: `CHANGELOG.md`
- Create: `LICENSE`
- Create: `AGENTS.md`

- [x] **Step 1: Create public OSS metadata**

Add package metadata, license, workspace config, and verification scripts.

- [x] **Step 2: Document the application truth**

README must say the project is a workflow kit and that Codex for OSS selection still depends on public usage, ecosystem importance, and active maintenance evidence.

### Task 2: CLI MVP

**Files:**
- Create: `packages/create-ai-maintainer-kit/package.json`
- Create: `packages/create-ai-maintainer-kit/src/index.ts`
- Create: `packages/create-ai-maintainer-kit/src/detect.ts`
- Create: `packages/create-ai-maintainer-kit/src/init.ts`
- Create: `packages/create-ai-maintainer-kit/src/templates.ts`
- Create: `packages/create-ai-maintainer-kit/test/detect.test.ts`
- Create: `packages/create-ai-maintainer-kit/test/init.test.ts`

- [ ] **Step 1: Implement `doctor`**

Read repository files and report package manager, framework, script, docs, workflow, and AI-maintainer readiness signals.

- [ ] **Step 2: Implement safe `init`**

Write `AGENTS.md`, three skills, a PR template, maintainer docs, and config. Skip existing files.

- [ ] **Step 3: Implement `add skill`**

Allow installing one known skill at a time without overwriting existing files.

- [ ] **Step 4: Verify with tests**

Run: `node --test packages/create-ai-maintainer-kit/test/*.test.ts`

Expected: all tests pass.

### Task 3: Skill Pack

**Files:**
- Create: `packages/frontend-review-skills/package.json`
- Create: `packages/frontend-review-skills/skills/frontend-pr-review/SKILL.md`
- Create: `packages/frontend-review-skills/skills/frontend-pr-review/references/react-checklist.md`
- Create: `packages/frontend-review-skills/skills/frontend-pr-review/references/vue-checklist.md`
- Create: `packages/frontend-review-skills/skills/frontend-pr-review/references/accessibility-checklist.md`
- Create: `packages/frontend-review-skills/skills/frontend-pr-review/references/responsive-checklist.md`
- Create: `packages/frontend-review-skills/skills/test-gap-analysis/SKILL.md`
- Create: `packages/frontend-review-skills/skills/test-gap-analysis/references/testing-checklist.md`
- Create: `packages/frontend-review-skills/skills/docs-sync/SKILL.md`
- Create: `packages/frontend-review-skills/skills/docs-sync/references/docs-sync-checklist.md`

- [ ] **Step 1: Add concise trigger descriptions**

Each `SKILL.md` frontmatter description must say what the skill does and when it should trigger.

- [ ] **Step 2: Keep detailed checks in references**

Use references for React, Vue, accessibility, responsive, testing, and docs drift checklists.

### Task 4: Maintainer Templates and Docs

**Files:**
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Create: `.github/workflows/ci.yml`
- Create: `docs/getting-started.md`
- Create: `docs/skills.md`
- Create: `docs/workflows.md`
- Create: `docs/codex-oss-application-notes.md`
- Create: `docs/maintainer/ai-workflow.md`
- Create: `docs/maintainer/review-checklist.md`
- Create: `packages/maintainer-workflow-templates/package.json`
- Create: `packages/maintainer-workflow-templates/templates/agents/react-vite.AGENTS.md`
- Create: `packages/maintainer-workflow-templates/templates/agents/vue-vite.AGENTS.md`
- Create: `packages/maintainer-workflow-templates/templates/github/PULL_REQUEST_TEMPLATE.md`
- Create: `packages/maintainer-workflow-templates/templates/docs/maintainer/review-checklist.md`
- Create: `packages/maintainer-workflow-templates/templates/config/ai-maintainer.config.json`

- [ ] **Step 1: Add maintainer-facing docs**

Docs must explain how maintainers use the workflow and how it maps to Codex for OSS criteria.

- [ ] **Step 2: Add template package**

Templates provide source material for future CLI extraction and package publishing.

### Task 5: Verification

**Files:**
- Read: all created files

- [ ] **Step 1: Run tests**

Run: `node --test packages/create-ai-maintainer-kit/test/*.test.ts`

Expected: all tests pass.

- [ ] **Step 2: Run doctor**

Run: `node packages/create-ai-maintainer-kit/src/index.ts doctor --root .`

Expected: report shows core repository signals and any remaining warnings.

- [ ] **Step 3: Report remaining application gaps**

Final report must separate "repo seed complete" from "Codex for OSS threshold not yet guaranteed" and list evidence still needed.
