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
  const root = mkdtempSync(join(tmpdir(), 'codex-repo-doctor-'));

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

const copyPackages = (root: string): void => {
  mkdirSync(join(root, 'packages'), { recursive: true });
  cpSync(join(repoRoot, 'packages/frontend-review-skills'), join(root, 'packages/frontend-review-skills'), {
    recursive: true
  });
  cpSync(
    join(repoRoot, 'packages/maintainer-workflow-templates'),
    join(root, 'packages/maintainer-workflow-templates'),
    { recursive: true }
  );
};

const copyGeneratedPackageAssets = (root: string): void => {
  cpSync(join(repoRoot, 'packages/codex-repo-doctor'), join(root, 'packages/codex-repo-doctor'), {
    recursive: true,
    filter: (source) =>
      !source.includes(`${join('packages', 'codex-repo-doctor', 'test')}`) &&
      !source.includes(`${join('packages', 'codex-repo-doctor', 'node_modules')}`)
  });
};

const copyPluginWrapper = (root: string): void => {
  mkdirSync(join(root, 'plugins'), { recursive: true });
  cpSync(join(repoRoot, 'plugins/codex-repo-doctor'), join(root, 'plugins/codex-repo-doctor'), {
    recursive: true
  });
  mkdirSync(join(root, '.agents/plugins'), { recursive: true });
  cpSync(join(repoRoot, '.agents/plugins/marketplace.json'), join(root, '.agents/plugins/marketplace.json'));
};

test('lint passes when readiness core and optional skill templates stay synchronized', () => {
  const result = lintMaintainerKit(repoRoot);

  assert.deepEqual(result.issues, []);
  assert.match(formatLintReport(result), /\[pass\] Codex Repo Doctor assets/);
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

test('lint detects root dogfood readiness core assets drifting from generated templates', () => {
  withTempDir((root) => {
    copyPackages(root);
    copyGeneratedPackageAssets(root);
    copyPluginWrapper(root);
    writeGeneratedFiles(root);
    writeFileSync(join(root, 'ai-maintainer.config.json'), '{"version":1,"skills":["drifted"]}\n', 'utf8');

    const result = lintMaintainerKit(root);

    assert.deepEqual(
      result.issues.map((issue) => issue.label),
      ['dogfood asset content']
    );
    assert.equal(result.issues[0]?.path, 'ai-maintainer.config.json');
  });
});

test('lint does not require root dogfood copies of optional skills', () => {
  withTempDir((root) => {
    copyPackages(root);
    copyGeneratedPackageAssets(root);
    copyPluginWrapper(root);
    writeGeneratedFiles(root);

    const result = lintMaintainerKit(root);

    assert.deepEqual(result.issues, []);
  });
});

test('lint detects a missing Codex Repo Doctor plugin wrapper', () => {
  withTempDir((root) => {
    copyPackages(root);
    copyGeneratedPackageAssets(root);
    writeGeneratedFiles(root);

    const result = lintMaintainerKit(root);

    assert.deepEqual(
      result.issues.map((issue) => issue.label),
      ['plugin manifest']
    );
    assert.equal(result.issues[0]?.path, 'plugins/codex-repo-doctor/.codex-plugin/plugin.json');
  });
});

test('lint detects plugin optional skill assets drifting from package source', () => {
  withTempDir((root) => {
    copyPackages(root);
    copyGeneratedPackageAssets(root);
    copyPluginWrapper(root);
    writeGeneratedFiles(root);
    writeFileSync(join(root, 'plugins/codex-repo-doctor/skills/docs-sync/SKILL.md'), 'drifted skill guidance', 'utf8');

    const result = lintMaintainerKit(root);

    assert.deepEqual(
      result.issues.map((issue) => issue.label),
      ['plugin optional skill asset content']
    );
    assert.equal(result.issues[0]?.path, 'plugins/codex-repo-doctor/skills/docs-sync/SKILL.md');
  });
});
