# AGENTS.md

## Project Overview

AI Maintainer Kit is a Node + TypeScript OSS workflow kit for frontend maintainers. It provides a small CLI plus repo-local skills and templates for AI-assisted review, docs sync, and test gap analysis.

## Commands

- Run CLI doctor: `node packages/create-ai-maintainer-kit/src/index.ts doctor --root .`
- Run tests: `node --test packages/create-ai-maintainer-kit/test/*.test.ts`

## Code Style

- Prefer small focused modules.
- Use Node built-in APIs before adding dependencies.
- Use `.ts` extensions in local imports because the CLI runs with Node type stripping.
- Do not overwrite user files during generator commands unless an explicit option is added and tested.
- Do not refactor unrelated files.

## Review Expectations

Before completing non-trivial changes:

1. Explain what changed.
2. Run the relevant verification command.
3. Mention tests that were not run.
4. Call out application-readiness gaps separately from code completeness.

## Skill Rules

- Repo-local skills live under `packages/frontend-review-skills/skills/`.
- Generated skills should keep `SKILL.md` concise and move detailed checklists into `references/`.
- Skill frontmatter descriptions must include trigger contexts.

## Testing Rules

- CLI behavior changes require `node:test` coverage.
- Tests should verify user-facing behavior, not only implementation details.
- Generator tests must assert existing files are not overwritten.
