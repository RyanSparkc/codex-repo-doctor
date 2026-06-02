# Codex Repo Doctor

Codex Repo Doctor checks whether a repository is ready for Codex to help safely, reviewably, and verifiably.

It is a small Node + TypeScript CLI for repository readiness. The core workflow is deterministic: inspect repo hygiene, Codex config, automation, and agent workflow files; report a score and readiness level; install a minimal readiness baseline without overwriting existing files.

## Current MVP

- `codex-repo-doctor doctor` scores repository readiness.
- `codex-repo-doctor init` writes only the readiness core: `AGENTS.md`, Codex config, PR template, maintainer docs, and config JSON.
- `codex-repo-doctor add skill <name>` installs optional workflow examples.
- Doctor checks use deterministic file and config rules. There are no network checks, live git remote checks, or LLM-based judgments.

## Quick Start

From this repository:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm lint
pnpm build
node packages/codex-repo-doctor/src/index.ts doctor --root .
node packages/codex-repo-doctor/src/index.ts init --root path/to/your/repo
```

The npm package is prepared for this public entrypoint:

```bash
npx codex-repo-doctor doctor
npx codex-repo-doctor init --root path/to/repo
npx codex-repo-doctor add skill docs-sync --root path/to/repo
```

## What `init` Generates

```txt
AGENTS.md
.codex/config.toml
.github/PULL_REQUEST_TEMPLATE.md
docs/maintainer/ai-workflow.md
docs/maintainer/review-checklist.md
ai-maintainer.config.json
```

`init` skips existing files. Optional skills are installed only with `add skill`.

## Optional Skills

The package still includes optional workflow examples:

- `frontend-pr-review`
- `test-gap-analysis`
- `docs-sync`

They are useful examples, not the default product surface.

## Codex Plugin Wrapper

The CLI is the deterministic engine. It reads files, applies fixed readiness rules, writes templates without overwriting existing files, and reports pass, warn, and fail states.

The plugin is a Codex workflow distribution layer under `plugins/codex-repo-doctor`. It does not replace the CLI and does not add MCP servers, apps, or hooks in v0.1.

Skills are triggerable workflows inside the plugin:

- `repo-readiness` runs `codex-repo-doctor doctor --root .` before making readiness judgments.
- `frontend-pr-review`, `test-gap-analysis`, and `docs-sync` mirror the optional package skill examples.

The repo marketplace entry lives at `.agents/plugins/marketplace.json` and points to `./plugins/codex-repo-doctor`.

## Doctor Checks

The doctor command reports grouped checks:

- Codex config
- Repository hygiene
- Automation
- Agent workflow

Scores are equal-weighted:

- pass = 1
- warn = 0.5
- fail = 0

Readiness levels:

- `Ready`: score >= 90 and no failures
- `Needs attention`: score >= 70 and no failures
- `Not ready`: any failure or score < 70

## Codex Project Config

Recommended low-risk defaults:

```toml
sandbox_mode = "workspace-write"
approval_policy = "on-request"
approvals_reviewer = "user"

[windows]
sandbox = "elevated"
```

The doctor command warns when `.codex/config.toml` is missing, fails `danger-full-access` and `approval_policy = "never"`, and warns when recommended Codex config keys are missing or set differently.

## Current Limitations

- Workspace development can run the TypeScript source directly on Node `>=22.6`.
- The npm package ships compiled JavaScript in `dist`; the CLI is not bundled for v0.1.
- The doctor intentionally avoids network, live remote, and semantic code quality checks.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
