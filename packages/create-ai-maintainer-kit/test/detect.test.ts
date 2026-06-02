import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { detectProject, formatDoctorReport } from '../src/detect.ts';

const withTempDir = (fn: (root: string) => void): void => {
  const root = mkdtempSync(join(tmpdir(), 'ai-maintainer-kit-'));

  try {
    fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

test('doctor detects package manager, frameworks, and scripts that matter to maintainers', () => {
  withTempDir((root) => {
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({
        scripts: {
          test: 'node --test',
          build: 'vite build'
        },
        dependencies: {
          react: '^19.0.0',
          vite: '^7.0.0'
        },
        devDependencies: {
          typescript: '^5.0.0'
        }
      }),
      'utf8'
    );
    writeFileSync(join(root, 'pnpm-lock.yaml'), '', 'utf8');
    writeFileSync(join(root, 'tsconfig.json'), '{}', 'utf8');

    const detection = detectProject(root);

    assert.equal(detection.packageManager, 'pnpm');
    assert.deepEqual(detection.frameworks, ['react', 'vite', 'typescript']);
    assert.equal(detection.checks.find((check) => check.label === 'test script')?.status, 'pass');
    assert.equal(detection.checks.find((check) => check.label === 'lint script')?.status, 'warn');
  });
});

test('doctor report exposes missing maintainer workflow signals', () => {
  withTempDir((root) => {
    const report = formatDoctorReport(detectProject(root));

    assert.match(report, /\[fail\] package\.json/);
    assert.match(report, /\[warn\] AGENTS\.md/);
    assert.match(report, /\[warn\] PR template/);
  });
});

test('doctor can pass every maintainer workflow signal when the target repo provides them', () => {
  withTempDir((root) => {
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({
        scripts: {
          test: 'node --test',
          build: 'vite build',
          lint: 'eslint .',
          typecheck: 'tsc --noEmit'
        },
        devDependencies: {
          typescript: '^6.0.0',
          vite: '^7.0.0'
        }
      }),
      'utf8'
    );
    writeFileSync(join(root, 'pnpm-lock.yaml'), '', 'utf8');
    writeFileSync(join(root, 'tsconfig.json'), '{}', 'utf8');
    writeFileSync(join(root, 'AGENTS.md'), '# Guidance', 'utf8');
    writeFileSync(join(root, 'playwright.config.ts'), 'export default {};', 'utf8');
    mkdirSync(join(root, '.github/workflows'), { recursive: true });
    writeFileSync(join(root, '.github/PULL_REQUEST_TEMPLATE.md'), '## Test Plan', 'utf8');
    writeFileSync(join(root, '.github/workflows/ci.yml'), 'name: ci', 'utf8');
    mkdirSync(join(root, 'docs/maintainer'), { recursive: true });
    writeFileSync(join(root, 'docs/maintainer/review-checklist.md'), '# Review', 'utf8');

    const detection = detectProject(root);
    const report = formatDoctorReport(detection);

    assert.deepEqual(
      detection.checks.map((check) => check.status),
      detection.checks.map(() => 'pass')
    );
    assert.doesNotMatch(report, /\[(warn|fail)\]/);
  });
});
