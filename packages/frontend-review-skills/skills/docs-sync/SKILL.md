---
name: docs-sync
description: Detect drift between code and documentation, especially README commands, package scripts, CLI options, exported APIs, examples, and release notes. Use when CLI behavior, public API, examples, install steps, or configuration changes.
---

# Docs Sync

Compare documentation against the current repository behavior. Prefer exact file and command references. Treat CLI options, generated files, package scripts, and public examples as high-risk drift surfaces.

## Workflow

1. Identify changed public behavior.
2. Compare README, docs, examples, and package scripts.
3. Report outdated or missing documentation.
4. Suggest focused documentation edits.

## References

- Read `references/docs-sync-checklist.md` for common drift checks.

## Integrated Example

```md
## Docs Drift Summary

- README still says `init` generates only `SKILL.md`, but the CLI now installs skill `references/` files too.

## Outdated Sections

- `README.md`: update the generated file tree to include `.agents/skills/docs-sync/references/docs-sync-checklist.md`.

## Suggested Updates

- Re-run the CLI in a temp repo and copy the verified generated file list into README.
```

## Output

```md
## Docs Drift Summary

## Outdated Sections

## Missing Documentation

## Suggested Updates
```
