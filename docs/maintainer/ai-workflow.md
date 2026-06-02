# AI Maintainer Workflow

Use this workflow when reviewing non-trivial changes:

1. Read the changed files and nearby ownership boundaries.
2. Run `frontend-pr-review` for UI changes.
3. Run `test-gap-analysis` when behavior changed.
4. Run `docs-sync` when public commands, APIs, examples, or workflows changed.
5. Record verification in the PR.
