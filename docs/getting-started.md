# Getting Started

Run the doctor command in a repository:

```bash
node packages/create-ai-maintainer-kit/src/index.ts doctor --root .
```

Install the baseline workflow into another repository:

```bash
node packages/create-ai-maintainer-kit/src/index.ts init --root path/to/repo
```

The generator skips existing files. Review generated files before committing them.

## Add One Skill

```bash
node packages/create-ai-maintainer-kit/src/index.ts add skill frontend-pr-review --root path/to/repo
node packages/create-ai-maintainer-kit/src/index.ts add skill test-gap-analysis --root path/to/repo
node packages/create-ai-maintainer-kit/src/index.ts add skill docs-sync --root path/to/repo
```
