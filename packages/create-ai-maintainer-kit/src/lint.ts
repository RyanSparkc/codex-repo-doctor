import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { initTemplates } from './templates.ts';

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

const validateSkillAssets = (root: string, generatedFiles: Map<string, string>): LintIssue[] => {
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

      if (!generatedFiles.has(targetPath)) {
        issues.push({
          label: 'generated skill asset',
          path: targetPath,
          detail: 'init output must include every package skill asset.'
        });
        continue;
      }

      const sourceContent = readFileSync(join(skillRoot, ...relativePath.split('/')), 'utf8');

      if (generatedFiles.get(targetPath) !== sourceContent) {
        issues.push({
          label: 'generated skill asset content',
          path: targetPath,
          detail: 'Generated skill asset content must match the package source.'
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
  return path === '.codex/config.toml' || path === 'ai-maintainer.config.json' || path.startsWith('.agents/skills/');
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

export const lintMaintainerKit = (root = defaultRepoRoot): LintResult => {
  const generatedFiles = new Map(initTemplates().map((file) => [file.path, file.content]));
  const issues = [
    ...validateSkillAssets(root, generatedFiles),
    ...validateWorkflowAssets(root, generatedFiles),
    ...validateDogfoodAssets(root, generatedFiles)
  ];

  return {
    root,
    issues
  };
};

export const formatLintReport = (result: LintResult): string => {
  if (result.issues.length === 0) {
    return `AI Maintainer Kit lint\nRoot: ${result.root}\n[pass] maintainer kit assets`;
  }

  const lines = [`AI Maintainer Kit lint`, `Root: ${result.root}`];

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
