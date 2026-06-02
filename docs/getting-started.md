# Getting Started

Run the doctor command in a repository:

```bash
node packages/codex-repo-doctor/src/index.ts doctor --root .
```

Install the readiness core into another repository:

```bash
node packages/codex-repo-doctor/src/index.ts init --root path/to/repo
```

The generator skips existing files and does not install skills by default. Review generated files before committing them.

## Add Optional Skills

```bash
node packages/codex-repo-doctor/src/index.ts add skill frontend-pr-review --root path/to/repo
node packages/codex-repo-doctor/src/index.ts add skill test-gap-analysis --root path/to/repo
node packages/codex-repo-doctor/src/index.ts add skill docs-sync --root path/to/repo
```
