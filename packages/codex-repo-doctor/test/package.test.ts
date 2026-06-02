import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const packageJsonPath = join(repoRoot, 'packages/codex-repo-doctor/package.json');

interface PackageJson {
  bin?: Record<string, string>;
  bugs?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  files?: string[];
  homepage?: string;
  keywords?: string[];
  publishConfig?: Record<string, string>;
  repository?: Record<string, string>;
}

const readPackageJson = (): PackageJson => JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJson;

test('npm package metadata describes the public Codex Repo Doctor package', () => {
  const pkg = readPackageJson();

  assert.deepEqual(pkg.repository, {
    type: 'git',
    url: 'git+https://github.com/RyanSparkc/codex-repo-doctor.git'
  });
  assert.equal(pkg.homepage, 'https://github.com/RyanSparkc/codex-repo-doctor#readme');
  assert.equal(pkg.bugs?.url, 'https://github.com/RyanSparkc/codex-repo-doctor/issues');
  assert.equal(pkg.publishConfig?.access, 'public');
  assert.ok(pkg.keywords?.includes('codex'));
  assert.ok(pkg.keywords?.includes('repository-readiness'));
});

test('npm package can be packed without workspace runtime dependencies', () => {
  const pkg = readPackageJson();
  const runtimeDependencies = Object.entries(pkg.dependencies ?? {});

  assert.deepEqual(
    runtimeDependencies.filter(([, version]) => version.startsWith('workspace:')),
    []
  );
  assert.deepEqual(pkg.bin, {
    'codex-repo-doctor': 'dist/index.js'
  });
  assert.ok(pkg.files?.includes('dist'));
  assert.ok(pkg.files?.includes('assets'));
  assert.ok(pkg.files?.includes('package.json'));
});
