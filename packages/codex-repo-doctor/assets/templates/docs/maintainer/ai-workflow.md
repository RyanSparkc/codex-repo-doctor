# Codex Maintenance Workflow

Use this workflow when asking Codex to make or review non-trivial repository changes:

1. Read `AGENTS.md`, the changed files, and nearby ownership boundaries before editing.
2. Prefer deterministic code for rules that do not require semantic judgment.
3. Run `codex-repo-doctor doctor --root .` when checking repository readiness.
4. Run the repository's documented verification commands before reporting completion.
5. Use optional skills such as `frontend-pr-review`, `test-gap-analysis`, or `docs-sync` only when the change calls for that workflow.
6. Record what changed, what was verified, what was skipped, and what remains risky.
