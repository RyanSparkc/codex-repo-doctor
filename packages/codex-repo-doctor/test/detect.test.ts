import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { detectProject, formatDoctorReport } from '../src/detect.ts';

const withTempDir = (fn: (root: string) => void): void => {
  const root = mkdtempSync(join(tmpdir(), 'codex-repo-doctor-'));

  try {
    fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

const writeText = (root: string, path: string, content: string): void => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content, 'utf8');
};

const writeRecommendedCodexConfig = (root: string): void => {
  writeText(
    root,
    '.codex/config.toml',
    `sandbox_mode = "workspace-write"
approval_policy = "on-request"
approvals_reviewer = "user"

[windows]
sandbox = "elevated"
`
  );
};

const writeReadyRepo = (root: string): void => {
  writeText(
    root,
    'package.json',
    JSON.stringify({
      scripts: {
        test: 'node --test',
        build: 'tsc -p tsconfig.json',
        lint: 'eslint .',
        typecheck: 'tsc --noEmit'
      },
      dependencies: {
        react: '^19.0.0',
        vite: '^7.0.0'
      },
      devDependencies: {
        typescript: '^6.0.0'
      }
    })
  );
  writeText(root, 'pnpm-lock.yaml', '');
  writeText(root, 'tsconfig.json', '{}');
  writeText(
    root,
    '.gitignore',
    `node_modules/
.env
.env.*
*.log
logs/
dist/
build/
coverage/
.next/
`
  );
  writeText(root, 'README.md', '# Ready repository');
  writeText(root, 'AGENTS.md', '# Agent guidance');
  writeRecommendedCodexConfig(root);
  writeText(root, '.github/PULL_REQUEST_TEMPLATE.md', '## Verification\n\n- [ ] pnpm test\n');
  writeText(root, '.github/workflows/ci.yml', 'name: ci\n');
  writeText(root, 'docs/maintainer/review-checklist.md', '# Review checklist\n');
};

const statusFor = (root: string, label: string) => detectProject(root).checks.find((check) => check.label === label)?.status;

test('doctor detects package manager, frameworks, and scripts used in readiness scoring', () => {
  withTempDir((root) => {
    writeText(
      root,
      'package.json',
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
          typescript: '^6.0.0'
        }
      })
    );
    writeText(root, 'pnpm-lock.yaml', '');
    writeText(root, 'tsconfig.json', '{}');

    const detection = detectProject(root);

    assert.equal(detection.packageManager, 'pnpm');
    assert.deepEqual(detection.frameworks, ['react', 'vite', 'typescript']);
    assert.equal(detection.checks.find((check) => check.label === 'test script')?.category, 'Automation');
    assert.equal(statusFor(root, 'test script'), 'pass');
    assert.equal(statusFor(root, 'lint script'), 'warn');
  });
});

test('doctor report shows readiness summary, counts, grouped categories, and fixes', () => {
  withTempDir((root) => {
    const report = formatDoctorReport(detectProject(root));

    assert.match(report, /^Codex Repo Doctor/m);
    assert.match(report, /Score: \d+%/);
    assert.match(report, /Level: Not ready/);
    assert.match(report, /Counts: \d+ pass, \d+ warn, \d+ fail/);
    assert.match(report, /Codex config:/);
    assert.match(report, /Repository hygiene:/);
    assert.match(report, /Automation:/);
    assert.match(report, /Agent workflow:/);
    assert.match(report, /Fix:/);
  });
});

test('doctor passes recommended Codex project config checks', () => {
  withTempDir((root) => {
    writeRecommendedCodexConfig(root);

    const detection = detectProject(root);

    assert.equal(statusFor(root, 'Codex config file'), 'pass');
    assert.equal(statusFor(root, 'Codex sandbox mode'), 'pass');
    assert.equal(statusFor(root, 'Codex approval policy'), 'pass');
    assert.equal(statusFor(root, 'Codex approvals reviewer'), 'pass');
    assert.equal(statusFor(root, 'Codex Windows sandbox'), 'pass');
    assert.equal(detection.checks.find((check) => check.label === 'Codex approvals reviewer')?.category, 'Codex config');
  });
});

test('doctor fails Codex config values that disable reviewable sandbox protection', () => {
  withTempDir((root) => {
    writeText(
      root,
      '.codex/config.toml',
      `sandbox_mode = "danger-full-access"
approval_policy = "never"
approvals_reviewer = "user"

[windows]
sandbox = "unelevated"
`
    );

    assert.equal(statusFor(root, 'Codex sandbox mode'), 'fail');
    assert.equal(statusFor(root, 'Codex approval policy'), 'fail');
    assert.equal(statusFor(root, 'Codex Windows sandbox'), 'warn');
  });
});

test('doctor warns when gitignore is missing', () => {
  withTempDir((root) => {
    writeText(root, 'package.json', JSON.stringify({ scripts: {} }));

    assert.equal(statusFor(root, '.gitignore'), 'warn');
  });
});

test('doctor warns when gitignore misses node_modules or env patterns', () => {
  withTempDir((root) => {
    writeText(root, '.gitignore', 'dist/\n*.log\n');

    assert.equal(statusFor(root, '.gitignore node_modules'), 'warn');
    assert.equal(statusFor(root, '.gitignore env files'), 'warn');
  });
});

test('doctor fails when root env files are present', () => {
  withTempDir((root) => {
    writeText(root, '.env.local', 'SECRET=value\n');

    assert.equal(statusFor(root, 'root env files'), 'fail');
  });
});

test('doctor marks a fully prepared repository Ready', () => {
  withTempDir((root) => {
    writeReadyRepo(root);

    const detection = detectProject(root);
    const report = formatDoctorReport(detection);

    assert.equal(detection.summary.level, 'Ready');
    assert.equal(detection.summary.score, 100);
    assert.equal(detection.summary.fail, 0);
    assert.match(report, /Level: Ready/);
    assert.doesNotMatch(report, /\[(warn|fail)\]/);
  });
});

test('doctor marks an empty repository Not ready', () => {
  withTempDir((root) => {
    const detection = detectProject(root);

    assert.equal(detection.summary.level, 'Not ready');
    assert.ok(detection.summary.score < 70);
    assert.ok(detection.summary.fail > 0);
  });
});
