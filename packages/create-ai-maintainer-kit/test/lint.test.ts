import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { formatLintReport, lintMaintainerKit, validateSkillFrontmatter } from '../src/lint.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

test('lint passes when package skills and generated templates stay synchronized', () => {
  const result = lintMaintainerKit(repoRoot);

  assert.deepEqual(result.issues, []);
  assert.match(formatLintReport(result), /\[pass\] maintainer kit assets/);
});

test('skill frontmatter descriptions must include trigger context', () => {
  const issues = validateSkillFrontmatter(
    'packages/frontend-review-skills/skills/example/SKILL.md',
    `---
name: example
description: Reviews frontend changes.
---

# Example
`
  );

  assert.deepEqual(
    issues.map((issue) => issue.label),
    ['skill description trigger context']
  );
});
