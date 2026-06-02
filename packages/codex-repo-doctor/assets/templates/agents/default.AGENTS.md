# AGENTS.md

## Project Overview

This repository uses Codex Repo Doctor readiness conventions so Codex can assist with maintenance in a safe, reviewable, and verifiable way.

## Commands

- Install dependencies: `pnpm install`
- Run tests: `pnpm test`
- Run lint: `pnpm lint`
- Run typecheck: `pnpm typecheck`
- Build: `pnpm build`

## Work Rules

- Prefer small focused changes.
- Use deterministic code for routing, retries, permission checks, status handling, and data transforms.
- Do not overwrite user files during generator commands unless an explicit option is added and tested.
- Keep verification commands easy to rerun from the repository root.
- Call out skipped checks, partial work, and remaining application-readiness gaps.

## Review Expectations

Before completing non-trivial work:

1. Explain what changed.
2. Run relevant verification.
3. Mention tests that were not run.
4. Call out risks and follow-up work.
