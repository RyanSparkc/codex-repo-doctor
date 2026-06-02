# Contributing

Codex Repo Doctor is small on purpose. Contributions should make repository readiness easier to inspect, install, or verify.

## Local Verification

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm doctor
```

## Pull Request Expectations

- Keep changes focused.
- Add or update tests when CLI behavior changes.
- Update docs when generated files, commands, package metadata, or workflow semantics change.
- Do not add runtime dependencies unless the value is clear and documented.
- Preserve existing files during `init`; overwriting user files must stay opt-in.

## Skill Contributions

Optional skills live under `packages/frontend-review-skills/skills/`. Keep `SKILL.md` concise and put detailed checklists in `references/`. The frontmatter `description` must clearly say when the skill should trigger.
