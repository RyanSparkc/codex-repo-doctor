import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { addSkill, initProject } from '../src/init.ts';
import { initTemplates } from '../src/templates.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const demoTargetFixture = join(repoRoot, 'packages/create-ai-maintainer-kit/test/fixtures/demo-target');

const withTempDir = (fn: (root: string) => void): void => {
  const root = mkdtempSync(join(tmpdir(), 'ai-maintainer-kit-'));

  try {
    fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

test('init writes maintainer workflow files without overwriting existing guidance', () => {
  withTempDir((root) => {
    writeFileSync(join(root, 'AGENTS.md'), 'existing guidance', 'utf8');

    const result = initProject(root);

    assert.ok(result.skipped.includes('AGENTS.md'));
    assert.ok(result.created.includes('.agents/skills/frontend-pr-review/SKILL.md'));
    assert.ok(result.created.includes('.agents/skills/frontend-pr-review/references/react-checklist.md'));
    assert.ok(result.created.includes('.agents/skills/test-gap-analysis/references/testing-checklist.md'));
    assert.ok(result.created.includes('.agents/skills/docs-sync/references/docs-sync-checklist.md'));
    assert.ok(existsSync(join(root, '.github/PULL_REQUEST_TEMPLATE.md')));
    assert.equal(readFileSync(join(root, 'AGENTS.md'), 'utf8'), 'existing guidance');
  });
});

test('init installs the complete maintainer workflow into a demo target repo', () => {
  withTempDir((root) => {
    const target = join(root, 'demo-target');
    cpSync(demoTargetFixture, target, { recursive: true });

    const result = initProject(target);

    assert.ok(result.created.includes('AGENTS.md'));
    assert.ok(result.created.includes('.agents/skills/frontend-pr-review/SKILL.md'));
    assert.ok(result.created.includes('.agents/skills/frontend-pr-review/references/vue-checklist.md'));
    assert.ok(result.created.includes('.agents/skills/test-gap-analysis/references/testing-checklist.md'));
    assert.ok(result.created.includes('.agents/skills/docs-sync/references/docs-sync-checklist.md'));
    assert.ok(result.created.includes('.github/PULL_REQUEST_TEMPLATE.md'));
    assert.ok(result.created.includes('docs/maintainer/ai-workflow.md'));
    assert.ok(result.created.includes('docs/maintainer/review-checklist.md'));
    assert.ok(result.created.includes('ai-maintainer.config.json'));
    assert.equal(readFileSync(join(target, 'package.json'), 'utf8'), readFileSync(join(demoTargetFixture, 'package.json'), 'utf8'));
  });
});

test('addSkill installs a single known skill and rejects unknown names', () => {
  withTempDir((root) => {
    mkdirSync(root, { recursive: true });

    const result = addSkill(root, 'docs-sync');

    assert.deepEqual(result.created.toSorted(), [
      '.agents/skills/docs-sync/SKILL.md',
      '.agents/skills/docs-sync/references/docs-sync-checklist.md'
    ]);
    assert.ok(!existsSync(join(root, '.agents/skills/frontend-pr-review/SKILL.md')));
    assert.throws(() => addSkill(root, 'unknown'), /Unknown skill/);
  });
});

test('addSkill preserves existing skill guidance while filling missing references', () => {
  withTempDir((root) => {
    const skillPath = join(root, '.agents/skills/test-gap-analysis/SKILL.md');
    mkdirSync(dirname(skillPath), { recursive: true });
    writeFileSync(skillPath, 'custom skill guidance', 'utf8');

    const result = addSkill(root, 'test-gap-analysis');

    assert.ok(result.skipped.includes('.agents/skills/test-gap-analysis/SKILL.md'));
    assert.ok(result.created.includes('.agents/skills/test-gap-analysis/references/testing-checklist.md'));
    assert.equal(readFileSync(skillPath, 'utf8'), 'custom skill guidance');
  });
});

test('init output stays synchronized with package template assets', () => {
  const files = new Map(initTemplates().map((file) => [file.path, file.content]));

  assert.equal(
    files.get('.agents/skills/frontend-pr-review/SKILL.md'),
    readFileSync(join(repoRoot, 'packages/frontend-review-skills/skills/frontend-pr-review/SKILL.md'), 'utf8')
  );
  assert.equal(
    files.get('.agents/skills/frontend-pr-review/references/accessibility-checklist.md'),
    readFileSync(
      join(repoRoot, 'packages/frontend-review-skills/skills/frontend-pr-review/references/accessibility-checklist.md'),
      'utf8'
    )
  );
  assert.equal(
    files.get('.github/PULL_REQUEST_TEMPLATE.md'),
    readFileSync(
      join(repoRoot, 'packages/maintainer-workflow-templates/templates/github/PULL_REQUEST_TEMPLATE.md'),
      'utf8'
    )
  );
  assert.equal(
    files.get('docs/maintainer/review-checklist.md'),
    readFileSync(
      join(repoRoot, 'packages/maintainer-workflow-templates/templates/docs/maintainer/review-checklist.md'),
      'utf8'
    )
  );
});
