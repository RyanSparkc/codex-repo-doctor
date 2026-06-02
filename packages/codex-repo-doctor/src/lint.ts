import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { initTemplates, skillTemplates } from './templates.ts';

export interface LintIssue {
  label: string;
  path: string;
  detail: string;
}

export interface LintResult {
  root: string;
  issues: LintIssue[];
}

interface WorkflowAsset {
  sourcePath: string;
  targetPath: string;
}

const workflowAssets: WorkflowAsset[] = [
  {
    sourcePath: 'packages/maintainer-workflow-templates/templates/agents/default.AGENTS.md',
    targetPath: 'AGENTS.md'
  },
  {
    sourcePath: 'packages/maintainer-workflow-templates/templates/github/PULL_REQUEST_TEMPLATE.md',
    targetPath: '.github/PULL_REQUEST_TEMPLATE.md'
  },
  {
    sourcePath: 'packages/maintainer-workflow-templates/templates/codex/config.toml',
    targetPath: '.codex/config.toml'
  },
  {
    sourcePath: 'packages/maintainer-workflow-templates/templates/docs/maintainer/ai-workflow.md',
    targetPath: 'docs/maintainer/ai-workflow.md'
  },
  {
    sourcePath: 'packages/maintainer-workflow-templates/templates/docs/maintainer/review-checklist.md',
    targetPath: 'docs/maintainer/review-checklist.md'
  },
  {
    sourcePath: 'packages/maintainer-workflow-templates/templates/config/ai-maintainer.config.json',
    targetPath: 'ai-maintainer.config.json'
  }
];

const pluginName = 'codex-repo-doctor';
const pluginRootPath = `plugins/${pluginName}`;
const pluginManifestPath = `${pluginRootPath}/.codex-plugin/plugin.json`;
const marketplacePath = '.agents/plugins/marketplace.json';
const defaultRepoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const collectRelativeFiles = (root: string, segments: string[] = []): string[] => {
  const current = join(root, ...segments);

  if (!existsSync(current)) {
    return [];
  }

  const entries = readdirSync(current, { withFileTypes: true }).toSorted((left, right) => left.name.localeCompare(right.name));
  const files: string[] = [];

  for (const entry of entries) {
    const nextSegments = [...segments, entry.name];

    if (entry.isDirectory()) {
      files.push(...collectRelativeFiles(root, nextSegments));
      continue;
    }

    if (entry.isFile()) {
      files.push(nextSegments.join('/'));
    }
  }

  return files;
};

const frontmatterValue = (content: string, key: string): string | undefined => {
  const lines = content.split(/\r?\n/);

  if (lines[0] !== '---') {
    return undefined;
  }

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (line === '---') {
      return undefined;
    }

    const separatorIndex = line.indexOf(':');

    if (separatorIndex === -1) {
      continue;
    }

    if (line.slice(0, separatorIndex).trim() === key) {
      return line.slice(separatorIndex + 1).trim();
    }
  }

  return undefined;
};

export const validateSkillFrontmatter = (path: string, content: string): LintIssue[] => {
  const issues: LintIssue[] = [];
  const name = frontmatterValue(content, 'name');
  const description = frontmatterValue(content, 'description');

  if (!name) {
    issues.push({
      label: 'skill name frontmatter',
      path,
      detail: 'SKILL.md must include a frontmatter name.'
    });
  }

  if (!description) {
    issues.push({
      label: 'skill description frontmatter',
      path,
      detail: 'SKILL.md must include a frontmatter description.'
    });
  } else if (!description.includes('Use when')) {
    issues.push({
      label: 'skill description trigger context',
      path,
      detail: 'Skill description must include trigger context using "Use when".'
    });
  }

  return issues;
};

const validateSkillAssets = (root: string, generatedSkillFiles: Map<string, string>): LintIssue[] => {
  const issues: LintIssue[] = [];
  const skillsRoot = join(root, 'packages/frontend-review-skills/skills');

  for (const skillName of readdirSync(skillsRoot).toSorted()) {
    const skillRoot = join(skillsRoot, skillName);
    const skillPath = join(skillRoot, 'SKILL.md');
    const targetRoot = `.agents/skills/${skillName}`;

    if (!existsSync(skillPath)) {
      issues.push({
        label: 'skill entrypoint',
        path: `packages/frontend-review-skills/skills/${skillName}/SKILL.md`,
        detail: 'Skill directory must contain SKILL.md.'
      });
      continue;
    }

    issues.push(
      ...validateSkillFrontmatter(
        `packages/frontend-review-skills/skills/${skillName}/SKILL.md`,
        readFileSync(skillPath, 'utf8')
      )
    );

    for (const relativePath of collectRelativeFiles(skillRoot)) {
      const targetPath = `${targetRoot}/${relativePath}`;

      if (!generatedSkillFiles.has(targetPath)) {
        issues.push({
          label: 'optional skill asset',
          path: targetPath,
          detail: 'add skill output must include every package skill asset.'
        });
        continue;
      }

      const sourceContent = readFileSync(join(skillRoot, ...relativePath.split('/')), 'utf8');

      if (generatedSkillFiles.get(targetPath) !== sourceContent) {
        issues.push({
          label: 'optional skill asset content',
          path: targetPath,
          detail: 'Optional skill asset content must match the package source.'
        });
      }
    }
  }

  return issues;
};

const validateWorkflowAssets = (root: string, generatedFiles: Map<string, string>): LintIssue[] => {
  const issues: LintIssue[] = [];

  for (const asset of workflowAssets) {
    const sourcePath = join(root, asset.sourcePath);

    if (!existsSync(sourcePath)) {
      issues.push({
        label: 'workflow template asset',
        path: asset.sourcePath,
        detail: 'Required workflow template asset is missing.'
      });
      continue;
    }

    if (!generatedFiles.has(asset.targetPath)) {
      issues.push({
        label: 'generated workflow template',
        path: asset.targetPath,
        detail: 'init output must include every required workflow template.'
      });
      continue;
    }

    const sourceContent = readFileSync(sourcePath, 'utf8');

    if (generatedFiles.get(asset.targetPath) !== sourceContent) {
      issues.push({
        label: 'generated workflow template content',
        path: asset.targetPath,
        detail: 'Generated workflow template content must match the package source.'
      });
    }
  }

  return issues;
};

const shouldDogfoodAsset = (path: string): boolean => {
  return workflowAssets.some((asset) => asset.targetPath === path);
};

const validateDogfoodAssets = (root: string, generatedFiles: Map<string, string>): LintIssue[] => {
  const issues: LintIssue[] = [];

  for (const [path, content] of generatedFiles) {
    if (!shouldDogfoodAsset(path)) {
      continue;
    }

    const targetPath = join(root, path);

    if (!existsSync(targetPath)) {
      issues.push({
        label: 'dogfood asset',
        path,
        detail: 'This repository should include the files its init command installs for target repositories.'
      });
      continue;
    }

    if (readFileSync(targetPath, 'utf8') !== content) {
      issues.push({
        label: 'dogfood asset content',
        path,
        detail: 'Root dogfood asset content must match the generated template.'
      });
    }
  }

  return issues;
};

const parseJsonObject = (root: string, path: string): Record<string, unknown> | undefined => {
  const value = JSON.parse(readFileSync(join(root, path), 'utf8')) as unknown;

  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
};

const validatePluginManifest = (root: string): LintIssue[] => {
  const issues: LintIssue[] = [];
  const path = join(root, pluginManifestPath);

  if (!existsSync(path)) {
    return [
      {
        label: 'plugin manifest',
        path: pluginManifestPath,
        detail: 'Codex Repo Doctor plugin manifest is missing.'
      }
    ];
  }

  const manifest = parseJsonObject(root, pluginManifestPath);

  if (!manifest) {
    return [
      {
        label: 'plugin manifest json',
        path: pluginManifestPath,
        detail: 'Plugin manifest must contain a JSON object.'
      }
    ];
  }

  if (JSON.stringify(manifest).includes('[TODO:')) {
    issues.push({
      label: 'plugin manifest placeholder',
      path: pluginManifestPath,
      detail: 'Plugin manifest must not contain placeholder text.'
    });
  }

  const expectedFields: [string, unknown][] = [
    ['name', pluginName],
    ['version', '0.1.0'],
    ['description', 'Codex repository readiness workflow bundle'],
    ['skills', './skills/']
  ];

  for (const [field, expected] of expectedFields) {
    if (manifest[field] !== expected) {
      issues.push({
        label: 'plugin manifest field',
        path: pluginManifestPath,
        detail: `Plugin manifest field "${field}" must be ${JSON.stringify(expected)}.`
      });
    }
  }

  for (const unsupportedField of ['apps', 'mcpServers', 'hooks']) {
    if (unsupportedField in manifest) {
      issues.push({
        label: 'plugin manifest unsupported field',
        path: pluginManifestPath,
        detail: `v0.1 plugin must not declare "${unsupportedField}".`
      });
    }
  }

  return issues;
};

const validateMarketplace = (root: string): LintIssue[] => {
  const path = join(root, marketplacePath);

  if (!existsSync(path)) {
    return [
      {
        label: 'plugin marketplace',
        path: marketplacePath,
        detail: 'Repo marketplace must point at the Codex Repo Doctor plugin folder.'
      }
    ];
  }

  const marketplace = parseJsonObject(root, marketplacePath);
  const plugins = marketplace?.plugins;
  const entry = Array.isArray(plugins)
    ? plugins.find((candidate): candidate is Record<string, unknown> => {
        return Boolean(candidate && typeof candidate === 'object' && !Array.isArray(candidate) && candidate.name === pluginName);
      })
    : undefined;
  const source = entry?.source;
  const policy = entry?.policy;
  const valid =
    entry?.category === 'Productivity' &&
    source &&
    typeof source === 'object' &&
    !Array.isArray(source) &&
    (source as Record<string, unknown>).source === 'local' &&
    (source as Record<string, unknown>).path === `./plugins/${pluginName}` &&
    policy &&
    typeof policy === 'object' &&
    !Array.isArray(policy) &&
    (policy as Record<string, unknown>).installation === 'AVAILABLE' &&
    (policy as Record<string, unknown>).authentication === 'ON_INSTALL';

  return valid
    ? []
    : [
        {
          label: 'plugin marketplace entry',
          path: marketplacePath,
          detail: 'Marketplace must include a local available Codex Repo Doctor plugin entry.'
        }
      ];
};

const validateRepoReadinessSkill = (root: string): LintIssue[] => {
  const skillPath = `${pluginRootPath}/skills/repo-readiness/SKILL.md`;
  const path = join(root, skillPath);

  if (!existsSync(path)) {
    return [
      {
        label: 'plugin repo-readiness skill',
        path: skillPath,
        detail: 'Plugin must include the repo-readiness skill.'
      }
    ];
  }

  const content = readFileSync(path, 'utf8');
  const issues = validateSkillFrontmatter(skillPath, content);

  if (!content.includes('codex-repo-doctor doctor --root .')) {
    issues.push({
      label: 'plugin repo-readiness deterministic command',
      path: skillPath,
      detail: 'repo-readiness must require the deterministic doctor command before LLM judgment.'
    });
  }

  return issues;
};

const validatePluginSkillAssets = (root: string): LintIssue[] => {
  const issues: LintIssue[] = [];
  const skillsRoot = join(root, 'packages/frontend-review-skills/skills');

  for (const skillName of readdirSync(skillsRoot).toSorted()) {
    const skillRoot = join(skillsRoot, skillName);
    const pluginSkillRoot = join(root, pluginRootPath, 'skills', skillName);

    for (const relativePath of collectRelativeFiles(skillRoot)) {
      const targetPath = `${pluginRootPath}/skills/${skillName}/${relativePath}`;
      const sourceContent = readFileSync(join(skillRoot, ...relativePath.split('/')), 'utf8');
      const target = join(pluginSkillRoot, ...relativePath.split('/'));

      if (!existsSync(target)) {
        issues.push({
          label: 'plugin optional skill asset',
          path: targetPath,
          detail: 'Plugin must include every optional skill asset from the package source.'
        });
        continue;
      }

      if (readFileSync(target, 'utf8') !== sourceContent) {
        issues.push({
          label: 'plugin optional skill asset content',
          path: targetPath,
          detail: 'Plugin optional skill asset content must match the package source.'
        });
      }
    }
  }

  return issues;
};

const validatePluginAssets = (root: string): LintIssue[] => {
  const manifestIssues = validatePluginManifest(root);

  if (manifestIssues.some((issue) => issue.label === 'plugin manifest')) {
    return manifestIssues;
  }

  return [...manifestIssues, ...validateMarketplace(root), ...validateRepoReadinessSkill(root), ...validatePluginSkillAssets(root)];
};

export const lintMaintainerKit = (root = defaultRepoRoot): LintResult => {
  const generatedFiles = new Map(initTemplates().map((file) => [file.path, file.content]));
  const generatedSkillFiles = new Map(
    Object.values(skillTemplates)
      .flat()
      .map((file) => [file.path, file.content])
  );
  const issues = [
    ...validateSkillAssets(root, generatedSkillFiles),
    ...validateWorkflowAssets(root, generatedFiles),
    ...validateDogfoodAssets(root, generatedFiles),
    ...validatePluginAssets(root)
  ];

  return {
    root,
    issues
  };
};

export const formatLintReport = (result: LintResult): string => {
  if (result.issues.length === 0) {
    return `Codex Repo Doctor lint\nRoot: ${result.root}\n[pass] Codex Repo Doctor assets`;
  }

  const lines = [`Codex Repo Doctor lint`, `Root: ${result.root}`];

  for (const issue of result.issues) {
    lines.push(`[fail] ${issue.label} - ${issue.path} - ${issue.detail}`);
  }

  return lines.join('\n');
};

const isDirectRun = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href === import.meta.url : false;

if (isDirectRun) {
  const result = lintMaintainerKit();
  console.log(formatLintReport(result));

  if (result.issues.length > 0) {
    process.exitCode = 1;
  }
}
