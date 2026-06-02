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

interface ParsedToml {
  values: Record<string, string>;
  sections: Record<string, Record<string, string>>;
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

const parseTomlStrings = (content: string): ParsedToml => {
  const parsed: ParsedToml = {
    values: {},
    sections: {}
  };
  let currentSection: string | undefined;

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const sectionMatch = /^\[([A-Za-z0-9_.-]+)\]$/.exec(trimmed);

    if (sectionMatch) {
      currentSection = sectionMatch[1];
      parsed.sections[currentSection] ??= {};
      continue;
    }

    const valueMatch = /^([A-Za-z0-9_.-]+)\s*=\s*"([^"]*)"$/.exec(trimmed);

    if (!valueMatch) {
      continue;
    }

    const target = currentSection ? parsed.sections[currentSection] : parsed.values;
    target[valueMatch[1]] = valueMatch[2];
  }

  return parsed;
};

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

const expectedValueCheck = (
  label: string,
  value: string | undefined,
  expected: string,
  failValue: string,
  failDetail: string
): DoctorCheck => {
  if (value === expected) {
    return {
      label,
      status: 'pass',
      detail: value
    };
  }

  if (value === failValue) {
    return {
      label,
      status: 'fail',
      detail: failDetail
    };
  }

  return {
    label,
    status: 'warn',
    detail: value ? `Found "${value}"; recommended "${expected}".` : `Set ${label} to "${expected}".`
  };
};

const recommendedValueCheck = (label: string, value: string | undefined, expected: string): DoctorCheck => {
  if (value === expected) {
    return {
      label,
      status: 'pass',
      detail: value
    };
  }

  return {
    label,
    status: 'warn',
    detail: value ? `Found "${value}"; recommended "${expected}".` : `Set ${label} to "${expected}".`
  };
};

const codexConfigChecks = (root: string): DoctorCheck[] => {
  const path = join(root, '.codex/config.toml');

  if (!existsSync(path)) {
    return [
      {
        label: 'Codex config',
        status: 'warn',
        detail: 'Add .codex/config.toml so agent sandbox and approval expectations are explicit.'
      }
    ];
  }

  const config = parseTomlStrings(readFileSync(path, 'utf8'));

  return [
    {
      label: 'Codex config',
      status: 'pass',
      detail: '.codex/config.toml found.'
    },
    expectedValueCheck(
      'Codex sandbox mode',
      config.values.sandbox_mode,
      'workspace-write',
      'danger-full-access',
      'danger-full-access grants unrestricted filesystem access; use workspace-write for OSS readiness.'
    ),
    expectedValueCheck(
      'Codex approval policy',
      config.values.approval_policy,
      'on-request',
      'never',
      'never prevents explicit review for privileged commands; use on-request.'
    ),
    recommendedValueCheck('Codex Windows sandbox', config.sections.windows?.sandbox, 'elevated')
  ];
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
    ...codexConfigChecks(root),
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
