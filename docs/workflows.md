# Workflows

## PR Review

1. Read the changed files.
2. Run `frontend-pr-review` for UI changes.
3. Run `test-gap-analysis` for behavior changes.
4. Add findings to the PR with severity and verification steps.

## Docs Sync

1. Identify changed public behavior.
2. Compare README, docs, examples, and package scripts.
3. Update stale commands, options, examples, and release notes.

## Release Readiness

For a future v0.3 workflow, release checks should verify:

- Version bump.
- Changelog entry.
- Passing tests and build.
- Updated docs.
- Migration notes for breaking changes.
