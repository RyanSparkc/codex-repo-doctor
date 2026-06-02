# Contributing

AI Maintainer Kit is small on purpose. Contributions should make maintainer workflows easier to inspect, install, or verify.

## Local Verification

```bash
node --test packages/create-ai-maintainer-kit/test/*.test.ts
node packages/create-ai-maintainer-kit/src/index.ts doctor --root .
```

## Pull Request Expectations

- Keep changes focused.
- Add or update tests when CLI behavior changes.
- Update docs when generated files, commands, or workflow semantics change.
- Do not add runtime dependencies unless the value is clear and documented.
- Preserve existing files during `init`; overwriting user files must stay opt-in.

## Skill Contributions

For skills, keep `SKILL.md` concise and put detailed checklists in `references/`. The frontmatter `description` must clearly say when the skill should trigger.
