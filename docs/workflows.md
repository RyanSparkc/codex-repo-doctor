# Workflows

## Readiness Check

1. Run `codex-repo-doctor doctor --root .`.
2. Review the grouped output: Codex config, repository hygiene, automation, and agent workflow.
3. Fix failures before treating the repository as ready for Codex-assisted maintenance.
4. Fix warnings when they block repeatable verification or safe review.

## Readiness Init

1. Run `codex-repo-doctor init --root path/to/repo`.
2. Review generated files before committing them.
3. Keep existing files when `init` reports `[skipped]`.
4. Re-run the doctor command and record the score, level, and remaining warnings.

## Optional Skill Workflows

Optional skills are examples for focused review work:

- Run `frontend-pr-review` for UI-heavy changes.
- Run `test-gap-analysis` when behavior changed and coverage is uncertain.
- Run `docs-sync` when commands, public APIs, examples, or workflow semantics changed.

Install them explicitly with `codex-repo-doctor add skill <name>`.
