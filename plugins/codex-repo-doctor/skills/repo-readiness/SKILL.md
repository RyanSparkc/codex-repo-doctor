---
name: repo-readiness
description: Use when checking whether a repository is ready for safe, reviewable Codex-assisted maintenance with Codex Repo Doctor.
---

# Repo Readiness

Use this workflow when the user asks whether a repository is ready for Codex-assisted work, wants a readiness audit, or asks to prepare a repository for repeatable Codex maintenance.

## Required First Step

Run the deterministic CLI before making readiness judgments:

```bash
codex-repo-doctor doctor --root .
```

If the CLI is not installed, use the repository-local source command from the Codex Repo Doctor checkout:

```bash
node packages/codex-repo-doctor/src/index.ts doctor --root .
```

## Rules

- Treat CLI output as the source of truth for sandbox, approval, gitignore, env-file, automation, and agent workflow checks.
- Do not use LLM judgment to replace deterministic routing, retry, permission, status-code, gitignore, or env-file rules.
- Report pass, warn, and fail items separately.
- Make focused fixes only after identifying the specific failed or warned check.
- Re-run the doctor command after changes and call out anything not verified.

## Output

Summarize:

- readiness level and score
- failures that block readiness
- warnings that remain
- verification commands run
- skipped checks or uncertainty
