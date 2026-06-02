# AI Maintainer Kit

AI Maintainer Kit helps TypeScript frontend OSS maintainers add repeatable AI-assisted workflows: `AGENTS.md`, frontend PR review skills, docs sync, release checks, and test gap analysis.

This is not a prompt collection. It is a maintainer workflow kit that gives repositories durable instructions, reusable skills, review templates, and a lightweight CLI health check.

## Why This Exists

Many OSS projects want Codex or other coding agents to help with review, documentation drift, release readiness, and test gaps, but the workflow is often improvised. This kit gives maintainers a small, inspectable baseline that can be installed into React, Vue, Next.js, and Node repositories.

## Current MVP

- `create-ai-maintainer-kit doctor` inspects a repository for maintainer workflow readiness.
- `create-ai-maintainer-kit init` writes an `AGENTS.md`, three skills, a PR template, and maintainer docs without overwriting existing files.
- Repo-local skills cover frontend PR review, test gap analysis, and docs sync.
- Templates are intentionally plain Markdown so maintainers can review and edit them.

## Quick Start

From this repository:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm lint
pnpm build
node packages/create-ai-maintainer-kit/src/index.ts doctor --root .
node packages/create-ai-maintainer-kit/src/index.ts init --root path/to/your/repo
```

After publishing the CLI package, the intended entrypoint is:

```bash
npx create-ai-maintainer-kit doctor
npx create-ai-maintainer-kit init
```

## What Gets Generated

```txt
AGENTS.md
.agents/skills/frontend-pr-review/SKILL.md
.agents/skills/frontend-pr-review/references/accessibility-checklist.md
.agents/skills/frontend-pr-review/references/react-checklist.md
.agents/skills/frontend-pr-review/references/responsive-checklist.md
.agents/skills/frontend-pr-review/references/vue-checklist.md
.agents/skills/test-gap-analysis/SKILL.md
.agents/skills/test-gap-analysis/references/testing-checklist.md
.agents/skills/docs-sync/SKILL.md
.agents/skills/docs-sync/references/docs-sync-checklist.md
.github/PULL_REQUEST_TEMPLATE.md
docs/maintainer/ai-workflow.md
docs/maintainer/review-checklist.md
ai-maintainer.config.json
```

## Current Limitations

- The CLI runs TypeScript directly with Node native type stripping, so Node `>=22.6` is required.
- `build` currently means `typecheck`; the CLI is not bundled for v0.1.
- The three bundled skills are the v0.1 focus. New skill categories are deferred until the core review, test-gap, and docs-sync workflows are deeper.

## Supported Project Signals

The doctor command checks:

- `package.json`
- package manager lockfiles
- React, Vue, Next.js, Vite, and TypeScript signals
- test, build, lint, and typecheck scripts
- Playwright config
- GitHub workflow and PR template presence
- `AGENTS.md`, docs, and maintainer workflow files

## Roadmap

- v0.1: CLI `init`, CLI `doctor`, three core skills, React/Vue AGENTS templates, PR template.
- v0.2: responsive review, accessibility review, state management review, UI flow verification.
- v0.3: release check workflow, docs sync workflow, changeset support, example repositories.
- v0.4: real adoption examples, sample PR reviews, npm publishing evidence.

## Codex for OSS Application Notes

This project is being prepared as a public OSS maintainer workflow project. OpenAI's Codex for Open Source program looks for active OSS maintainers, meaningful usage, ecosystem importance, and evidence of active maintenance. See [docs/codex-oss-application-notes.md](docs/codex-oss-application-notes.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
