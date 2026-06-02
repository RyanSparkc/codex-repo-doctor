import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface DoctorCheck {
  label: string;
  status: CheckStatus;
  detail?: string;
}

export interface Detection {
  root: string;
  packageManager: string;
  frameworks: string[];
  checks: DoctorCheck[];
}

interface PackageJson {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const readPackageJson = (root: string): PackageJson | null => {
  const path = join(root, 'package.json');

  if (!existsSync(path)) {
    return null;
  }

  return JSON.parse(readFileSync(path, 'utf8')) as PackageJson;
};

const hasFile = (root: string, path: string): boolean => existsSync(join(root, path));

const hasAnyFile = (root: string, paths: string[]): boolean => paths.some((path) => hasFile(root, path));

const hasDependency = (pkg: PackageJson | null, name: string): boolean => {
  if (!pkg) {
    return false;
  }

  return Boolean(pkg.dependencies?.[name] || pkg.devDependencies?.[name]);
};

const detectPackageManager = (root: string): string => {
  if (hasFile(root, 'pnpm-lock.yaml')) {
    return 'pnpm';
  }

  if (hasFile(root, 'package-lock.json')) {
    return 'npm';
  }

  if (hasFile(root, 'yarn.lock')) {
    return 'yarn';
  }

  return 'unknown';
};

const detectFrameworks = (root: string, pkg: PackageJson | null): string[] => {
  const frameworks: string[] = [];

  if (hasDependency(pkg, 'react')) {
    frameworks.push('react');
  }

  if (hasDependency(pkg, 'vue')) {
    frameworks.push('vue');
  }

  if (hasDependency(pkg, 'next') || hasAnyFile(root, ['next.config.js', 'next.config.mjs', 'next.config.ts'])) {
    frameworks.push('next');
  }

  if (hasDependency(pkg, 'vite') || hasAnyFile(root, ['vite.config.js', 'vite.config.mjs', 'vite.config.ts'])) {
    frameworks.push('vite');
  }

  if (hasAnyFile(root, ['tsconfig.json', 'tsconfig.base.json'])) {
    frameworks.push('typescript');
  }

  return frameworks.length > 0 ? frameworks : ['unknown'];
};

const scriptCheck = (pkg: PackageJson | null, scriptName: string, importance: CheckStatus): DoctorCheck => {
  const hasScript = Boolean(pkg?.scripts?.[scriptName]);

  return {
    label: `${scriptName} script`,
    status: hasScript ? 'pass' : importance,
    detail: hasScript ? pkg?.scripts?.[scriptName] : `No package.json script named "${scriptName}".`
  };
};

export const detectProject = (root: string): Detection => {
  const pkg = readPackageJson(root);
  const packageManager = detectPackageManager(root);
  const frameworks = detectFrameworks(root, pkg);

  const checks: DoctorCheck[] = [
    {
      label: 'package.json',
      status: pkg ? 'pass' : 'fail',
      detail: pkg ? 'Found package.json.' : 'No package.json found.'
    },
    {
      label: 'package manager',
      status: packageManager === 'unknown' ? 'warn' : 'pass',
      detail: packageManager
    },
    scriptCheck(pkg, 'test', 'warn'),
    scriptCheck(pkg, 'build', 'warn'),
    scriptCheck(pkg, 'lint', 'warn'),
    scriptCheck(pkg, 'typecheck', 'warn'),
    {
      label: 'AGENTS.md',
      status: hasFile(root, 'AGENTS.md') ? 'pass' : 'warn',
      detail: hasFile(root, 'AGENTS.md') ? 'Repo guidance found.' : 'Add AGENTS.md for durable agent instructions.'
    },
    {
      label: 'PR template',
      status: hasFile(root, '.github/PULL_REQUEST_TEMPLATE.md') ? 'pass' : 'warn',
      detail: hasFile(root, '.github/PULL_REQUEST_TEMPLATE.md') ? 'PR template found.' : 'Add a PR template with verification expectations.'
    },
    {
      label: 'CI workflow',
      status: hasAnyFile(root, ['.github/workflows/ci.yml', '.github/workflows/ci.yaml']) ? 'pass' : 'warn',
      detail: hasAnyFile(root, ['.github/workflows/ci.yml', '.github/workflows/ci.yaml']) ? 'CI workflow found.' : 'Add CI to prove maintenance quality.'
    },
    {
      label: 'Playwright config',
      status: hasAnyFile(root, ['playwright.config.ts', 'playwright.config.js']) ? 'pass' : 'warn',
      detail: hasAnyFile(root, ['playwright.config.ts', 'playwright.config.js']) ? 'UI verification signal found.' : 'Optional: add Playwright for frontend flow verification.'
    },
    {
      label: 'Maintainer docs',
      status: hasFile(root, 'docs/maintainer/review-checklist.md') ? 'pass' : 'warn',
      detail: hasFile(root, 'docs/maintainer/review-checklist.md') ? 'Maintainer checklist found.' : 'Add maintainer workflow docs.'
    }
  ];

  return {
    root,
    packageManager,
    frameworks,
    checks
  };
};

export const formatDoctorReport = (detection: Detection): string => {
  const lines = [
    'AI Maintainer Kit doctor',
    `Root: ${detection.root}`,
    `Package manager: ${detection.packageManager}`,
    `Framework signals: ${detection.frameworks.join(', ')}`,
    ''
  ];

  for (const check of detection.checks) {
    lines.push(`[${check.status}] ${check.label}${check.detail ? ` - ${check.detail}` : ''}`);
  }

  return lines.join('\n');
};
