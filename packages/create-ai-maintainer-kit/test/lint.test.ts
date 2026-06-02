import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { formatLintReport, lintMaintainerKit, validateSkillFrontmatter } from '../src/lint.ts';
import { initTemplates } from '../src/templates.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const withTempDir = (fn: (root: string) => void): void => {
  const root = mkdtempSync(join(tmpdir(), 'ai-maintainer-kit-'));

  try {
    fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

const writeGeneratedFiles = (root: string): void => {
  for (const file of initTemplates()) {
    const target = join(root, file.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, file.content, 'utf8');
  }
};

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

test('lint detects root dogfood skill assets drifting from generated templates', () => {
  withTempDir((root) => {
    mkdirSync(join(root, 'packages'), { recursive: true });
    cpSync(join(repoRoot, 'packages/frontend-review-skills'), join(root, 'packages/frontend-review-skills'), {
      recursive: true
    });
    cpSync(
      join(repoRoot, 'packages/maintainer-workflow-templates'),
      join(root, 'packages/maintainer-workflow-templates'),
      { recursive: true }
    );
    writeGeneratedFiles(root);
    writeFileSync(join(root, '.agents/skills/docs-sync/SKILL.md'), 'drifted dogfood skill', 'utf8');

    const result = lintMaintainerKit(root);

    assert.deepEqual(
      result.issues.map((issue) => issue.label),
      ['dogfood asset content']
    );
    assert.equal(result.issues[0]?.path, '.agents/skills/docs-sync/SKILL.md');
  });
});
