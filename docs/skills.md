# Optional Skills

Codex Repo Doctor does not install skills during default `init`. These skills are kept as optional workflow examples that can be added with `codex-repo-doctor add skill <name>`.

## frontend-pr-review

Reviews frontend changes for component responsibility, state ownership, UI states, accessibility, responsive behavior, and missing tests.

## test-gap-analysis

Maps changed behavior to existing tests and proposes minimal missing test cases.

## docs-sync

Checks whether README, docs, examples, CLI options, package scripts, and release notes still match repository behavior.

## Skill Design Rules

- Keep `SKILL.md` concise.
- Put detailed checklists under `references/`.
- Include trigger context in the frontmatter `description`.
- Prefer output formats that can be copied into PR notes.
