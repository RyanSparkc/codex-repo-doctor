import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { addSkill, initProject } from '../src/init.ts';
import { initTemplates } from '../src/templates.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const demoTargetFixture = join(dirname(fileURLToPath(import.meta.url)), 'fixtures/demo-target');

const withTempDir = (fn: (root: string) => void): void => {
  const root = mkdtempSync(join(tmpdir(), 'codex-repo-doctor-'));

  try {
    fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

test('init writes readiness core without overwriting existing guidance or installing skills by default', () => {
  withTempDir((root) => {
    writeFileSync(join(root, 'AGENTS.md'), 'existing guidance', 'utf8');

    const result = initProject(root);

    assert.ok(result.skipped.includes('AGENTS.md'));
    assert.ok(result.created.includes('.github/PULL_REQUEST_TEMPLATE.md'));
    assert.ok(result.created.includes('.codex/config.toml'));
    assert.ok(result.created.includes('docs/maintainer/ai-workflow.md'));
    assert.ok(result.created.includes('docs/maintainer/review-checklist.md'));
    assert.ok(result.created.includes('ai-maintainer.config.json'));
    assert.ok(!result.created.some((path) => path.startsWith('.agents/skills/')));
    assert.ok(!existsSync(join(root, '.agents/skills/frontend-pr-review/SKILL.md')));
    assert.deepEqual(JSON.parse(readFileSync(join(root, 'ai-maintainer.config.json'), 'utf8')), {
      version: 1,
      skills: []
    });
    assert.equal(readFileSync(join(root, 'AGENTS.md'), 'utf8'), 'existing guidance');
  });
});

test('init installs the Codex readiness core into a demo target repo', () => {
  withTempDir((root) => {
    const target = join(root, 'demo-target');
    cpSync(demoTargetFixture, target, { recursive: true });

    const result = initProject(target);

    assert.ok(result.created.includes('AGENTS.md'));
    assert.ok(result.created.includes('.github/PULL_REQUEST_TEMPLATE.md'));
    assert.ok(result.created.includes('.codex/config.toml'));
    assert.ok(result.created.includes('docs/maintainer/ai-workflow.md'));
    assert.ok(result.created.includes('docs/maintainer/review-checklist.md'));
    assert.ok(result.created.includes('ai-maintainer.config.json'));
    assert.ok(!result.created.some((path) => path.startsWith('.agents/skills/')));
    assert.ok(!existsSync(join(target, '.agents/skills/docs-sync/SKILL.md')));
    assert.equal(readFileSync(join(target, 'package.json'), 'utf8'), readFileSync(join(demoTargetFixture, 'package.json'), 'utf8'));
  });
});

test('addSkill installs a single known optional skill and rejects unknown names', () => {
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

test('init output stays synchronized with readiness template assets only', () => {
  const files = new Map(initTemplates().map((file) => [file.path, file.content]));

  assert.equal(
    files.get('.github/PULL_REQUEST_TEMPLATE.md'),
    readFileSync(
      join(repoRoot, 'packages/maintainer-workflow-templates/templates/github/PULL_REQUEST_TEMPLATE.md'),
      'utf8'
    )
  );
  assert.equal(
    files.get('.codex/config.toml'),
    readFileSync(join(repoRoot, 'packages/maintainer-workflow-templates/templates/codex/config.toml'), 'utf8')
  );
  assert.equal(
    files.get('docs/maintainer/review-checklist.md'),
    readFileSync(
      join(repoRoot, 'packages/maintainer-workflow-templates/templates/docs/maintainer/review-checklist.md'),
      'utf8'
    )
  );
  assert.equal(
    files.get('ai-maintainer.config.json'),
    readFileSync(join(repoRoot, 'packages/maintainer-workflow-templates/templates/config/ai-maintainer.config.json'), 'utf8')
  );
  assert.ok(!files.has('.agents/skills/frontend-pr-review/SKILL.md'));
});
