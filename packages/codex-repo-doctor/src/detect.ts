import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type CheckStatus = 'pass' | 'warn' | 'fail';
export type CheckCategory = 'Codex config' | 'Repository hygiene' | 'Automation' | 'Agent workflow';
export type ReadinessLevel = 'Ready' | 'Needs attention' | 'Not ready';

export interface DoctorCheck {
  category: CheckCategory;
  label: string;
  status: CheckStatus;
  detail?: string;
  fix?: string;
}

export interface DetectionSummary {
  score: number;
  level: ReadinessLevel;
  pass: number;
  warn: number;
  fail: number;
}

export interface Detection {
  root: string;
  packageManager: string;
  frameworks: string[];
  checks: DoctorCheck[];
  summary: DetectionSummary;
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

const categories: CheckCategory[] = ['Codex config', 'Repository hygiene', 'Automation', 'Agent workflow'];

const readPackageJson = (root: string): PackageJson | null => {
  const path = join(root, 'package.json');

  if (!existsSync(path)) {
    return null;
  }

  return JSON.parse(readFileSync(path, 'utf8')) as PackageJson;
};

const hasFile = (root: string, path: string): boolean => existsSync(join(root, path));

const hasAnyFile = (root: string, paths: string[]): boolean => paths.some((path) => hasFile(root, path));

const check = (
  category: CheckCategory,
  label: string,
  status: CheckStatus,
  detail?: string,
  fix?: string
): DoctorCheck => ({
  category,
  label,
  status,
  detail,
  fix
});

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

  return check(
    'Automation',
    `${scriptName} script`,
    hasScript ? 'pass' : importance,
    hasScript ? pkg?.scripts?.[scriptName] : `No package.json script named "${scriptName}".`,
    hasScript ? undefined : `Add a package.json "${scriptName}" script so Codex can run deterministic verification.`
  );
};

const expectedValueCheck = (
  label: string,
  value: string | undefined,
  expected: string,
  failValue: string,
  failDetail: string,
  fix: string
): DoctorCheck => {
  if (value === expected) {
    return check('Codex config', label, 'pass', value);
  }

  if (value === failValue) {
    return check('Codex config', label, 'fail', failDetail, fix);
  }

  return check(
    'Codex config',
    label,
    'warn',
    value ? `Found "${value}"; recommended "${expected}".` : `Set ${label} to "${expected}".`,
    fix
  );
};

const recommendedValueCheck = (label: string, value: string | undefined, expected: string, fix: string): DoctorCheck => {
  if (value === expected) {
    return check('Codex config', label, 'pass', value);
  }

  return check(
    'Codex config',
    label,
    'warn',
    value ? `Found "${value}"; recommended "${expected}".` : `Set ${label} to "${expected}".`,
    fix
  );
};

const codexConfigChecks = (root: string): DoctorCheck[] => {
  const path = join(root, '.codex/config.toml');

  if (!existsSync(path)) {
    return [
      check(
        'Codex config',
        'Codex config file',
        'warn',
        'Add .codex/config.toml so agent sandbox and approval expectations are explicit.',
        'Create .codex/config.toml with workspace-write sandboxing and on-request approvals.'
      )
    ];
  }

  const config = parseTomlStrings(readFileSync(path, 'utf8'));

  return [
    check('Codex config', 'Codex config file', 'pass', '.codex/config.toml found.'),
    expectedValueCheck(
      'Codex sandbox mode',
      config.values.sandbox_mode,
      'workspace-write',
      'danger-full-access',
      'danger-full-access grants unrestricted filesystem access; use workspace-write for repo readiness.',
      'Set sandbox_mode = "workspace-write".'
    ),
    expectedValueCheck(
      'Codex approval policy',
      config.values.approval_policy,
      'on-request',
      'never',
      'never prevents explicit review for privileged commands; use on-request.',
      'Set approval_policy = "on-request".'
    ),
    recommendedValueCheck(
      'Codex approvals reviewer',
      config.values.approvals_reviewer,
      'user',
      'Set approvals_reviewer = "user".'
    ),
    recommendedValueCheck(
      'Codex Windows sandbox',
      config.sections.windows?.sandbox,
      'elevated',
      'Set [windows] sandbox = "elevated" when using Codex on Windows.'
    )
  ];
};

const readGitignorePatterns = (root: string): string[] | null => {
  const path = join(root, '.gitignore');

  if (!existsSync(path)) {
    return null;
  }

  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.replaceAll('\\', '/').replace(/^\/+/, ''));
};

const stripsTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const hasExactPattern = (patterns: string[], expected: string): boolean => {
  const normalizedExpected = stripsTrailingSlash(expected);
  return patterns.some((pattern) => stripsTrailingSlash(pattern) === normalizedExpected);
};

const hasAnyPattern = (patterns: string[], expected: string[]): boolean => {
  return expected.some((pattern) => hasExactPattern(patterns, pattern));
};

const gitignoreChecks = (root: string): DoctorCheck[] => {
  const patterns = readGitignorePatterns(root);

  if (!patterns) {
    return [
      check(
        'Repository hygiene',
        '.gitignore',
        'warn',
        '.gitignore is missing.',
        'Add .gitignore with node_modules/, .env, .env.*, logs, and common build output.'
      )
    ];
  }

  const envIgnores = hasExactPattern(patterns, '.env') && hasExactPattern(patterns, '.env.*');
  const logIgnores = hasAnyPattern(patterns, ['*.log', 'logs']);
  const buildIgnores = hasAnyPattern(patterns, ['dist', 'build', 'coverage', '.next', 'out']);

  return [
    check('Repository hygiene', '.gitignore', 'pass', '.gitignore found.'),
    check(
      'Repository hygiene',
      '.gitignore node_modules',
      hasExactPattern(patterns, 'node_modules') ? 'pass' : 'warn',
      hasExactPattern(patterns, 'node_modules') ? 'node_modules is ignored.' : 'node_modules is not ignored.',
      'Add node_modules/ to .gitignore.'
    ),
    check(
      'Repository hygiene',
      '.gitignore env files',
      envIgnores ? 'pass' : 'warn',
      envIgnores ? '.env and .env.* are ignored.' : '.env and .env.* are not both ignored.',
      'Add .env and .env.* to .gitignore.'
    ),
    check(
      'Repository hygiene',
      '.gitignore logs and build output',
      logIgnores && buildIgnores ? 'pass' : 'warn',
      logIgnores && buildIgnores ? 'Logs and common build output are ignored.' : 'Logs or common build output are not ignored.',
      'Add patterns such as *.log, logs/, dist/, build/, coverage/, or .next/ to .gitignore.'
    )
  ];
};

const rootEnvFileCheck = (root: string): DoctorCheck => {
  const envFiles = ['.env', '.env.local', '.env.production', '.env.development'].filter((path) => hasFile(root, path));

  if (envFiles.length === 0) {
    return check('Repository hygiene', 'root env files', 'pass', 'No common root env files found.');
  }

  return check(
    'Repository hygiene',
    'root env files',
    'fail',
    `Found ${envFiles.join(', ')}.`,
    'Move secrets out of the repository root and keep env files untracked.'
  );
};

const readmeCheck = (root: string): DoctorCheck => {
  return check(
    'Repository hygiene',
    'README',
    hasFile(root, 'README.md') ? 'pass' : 'warn',
    hasFile(root, 'README.md') ? 'README.md found.' : 'README.md is missing.',
    'Add README.md with setup and verification instructions.'
  );
};

const prTemplateCheck = (root: string): DoctorCheck => {
  const path = join(root, '.github/PULL_REQUEST_TEMPLATE.md');

  if (!existsSync(path)) {
    return check(
      'Agent workflow',
      'PR template verification',
      'warn',
      'PR template is missing.',
      'Add .github/PULL_REQUEST_TEMPLATE.md with a Test Plan or Verification section.'
    );
  }

  const content = readFileSync(path, 'utf8');
  const hasVerification = /\b(Test Plan|Verification)\b/i.test(content);

  return check(
    'Agent workflow',
    'PR template verification',
    hasVerification ? 'pass' : 'warn',
    hasVerification ? 'PR template includes verification expectations.' : 'PR template does not mention Test Plan or Verification.',
    'Add a Test Plan or Verification section to the PR template.'
  );
};

const calculateSummary = (checks: DoctorCheck[]): DetectionSummary => {
  const pass = checks.filter((item) => item.status === 'pass').length;
  const warn = checks.filter((item) => item.status === 'warn').length;
  const fail = checks.filter((item) => item.status === 'fail').length;
  const score = Math.round(((pass + warn * 0.5) / checks.length) * 100);
  const level: ReadinessLevel = fail > 0 || score < 70 ? 'Not ready' : score >= 90 ? 'Ready' : 'Needs attention';

  return {
    score,
    level,
    pass,
    warn,
    fail
  };
};

export const detectProject = (root: string): Detection => {
  const pkg = readPackageJson(root);
  const packageManager = detectPackageManager(root);
  const frameworks = detectFrameworks(root, pkg);

  const checks: DoctorCheck[] = [
    ...codexConfigChecks(root),
    ...gitignoreChecks(root),
    rootEnvFileCheck(root),
    readmeCheck(root),
    check(
      'Automation',
      'package.json',
      pkg ? 'pass' : 'fail',
      pkg ? 'Found package.json.' : 'No package.json found.',
      'Add package.json or run doctor from the repository root.'
    ),
    check(
      'Automation',
      'package manager',
      packageManager === 'unknown' ? 'warn' : 'pass',
      packageManager,
      'Commit a package manager lockfile such as pnpm-lock.yaml, package-lock.json, or yarn.lock.'
    ),
    scriptCheck(pkg, 'test', 'warn'),
    scriptCheck(pkg, 'build', 'warn'),
    scriptCheck(pkg, 'lint', 'warn'),
    scriptCheck(pkg, 'typecheck', 'warn'),
    check(
      'Automation',
      'CI workflow',
      hasAnyFile(root, ['.github/workflows/ci.yml', '.github/workflows/ci.yaml']) ? 'pass' : 'warn',
      hasAnyFile(root, ['.github/workflows/ci.yml', '.github/workflows/ci.yaml']) ? 'CI workflow found.' : 'No CI workflow found.',
      'Add a CI workflow that runs the deterministic verification commands.'
    ),
    check(
      'Agent workflow',
      'AGENTS.md',
      hasFile(root, 'AGENTS.md') ? 'pass' : 'warn',
      hasFile(root, 'AGENTS.md') ? 'Repo guidance found.' : 'Add AGENTS.md for durable agent instructions.',
      'Add AGENTS.md with repository-specific instructions for Codex.'
    ),
    prTemplateCheck(root),
    check(
      'Agent workflow',
      'Maintainer docs',
      hasFile(root, 'docs/maintainer/review-checklist.md') ? 'pass' : 'warn',
      hasFile(root, 'docs/maintainer/review-checklist.md') ? 'Maintainer checklist found.' : 'Add maintainer workflow docs.',
      'Add docs/maintainer/review-checklist.md with the verification checklist for agent-assisted changes.'
    )
  ];

  return {
    root,
    packageManager,
    frameworks,
    checks,
    summary: calculateSummary(checks)
  };
};

export const formatDoctorReport = (detection: Detection): string => {
  const lines = [
    'Codex Repo Doctor',
    `Root: ${detection.root}`,
    `Package manager: ${detection.packageManager}`,
    `Framework signals: ${detection.frameworks.join(', ')}`,
    `Score: ${detection.summary.score}%`,
    `Level: ${detection.summary.level}`,
    `Counts: ${detection.summary.pass} pass, ${detection.summary.warn} warn, ${detection.summary.fail} fail`,
    ''
  ];

  for (const category of categories) {
    lines.push(`${category}:`);

    for (const item of detection.checks.filter((candidate) => candidate.category === category)) {
      lines.push(`[${item.status}] ${item.label}${item.detail ? ` - ${item.detail}` : ''}`);

      if (item.status !== 'pass' && item.fix) {
        lines.push(`  Fix: ${item.fix}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n').trimEnd();
};
