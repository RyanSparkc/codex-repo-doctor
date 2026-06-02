# AGENTS.md

## Project Overview

This repository uses AI-assisted maintainer workflows for review, docs sync, and test gap analysis.

## Commands

- Install dependencies: `pnpm install`
- Run tests: `pnpm test`
- Build: `pnpm build`

## Review Expectations

Before completing non-trivial work:

1. Explain what changed.
2. Run relevant verification.
3. Mention tests that were not run.
4. Call out risks and follow-up work.

## Frontend Rules

- Handle loading, error, empty, and success states.
- Preserve keyboard accessibility.
- Check mobile layouts when UI changes.
- Keep state close to where it is used unless shared state is justified.
