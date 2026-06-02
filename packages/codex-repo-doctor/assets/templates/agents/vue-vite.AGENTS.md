# AGENTS.md

## Project Overview

This is a Vue + Vite + TypeScript project.

## Commands

- Install dependencies: `pnpm install`
- Start dev server: `pnpm dev`
- Run tests: `pnpm test`
- Build: `pnpm build`

## Vue Rules

- Prefer `computed` for derived values.
- Use Pinia for shared domain state, not local UI state.
- Handle loading, error, empty, disabled, and success states.
- Preserve keyboard accessibility.
