import { createRequire } from 'node:module';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type SkillName = 'frontend-pr-review' | 'test-gap-analysis' | 'docs-sync';

export interface GeneratedFile {
  path: string;
  content: string;
}

const skillNames: SkillName[] = ['frontend-pr-review', 'test-gap-analysis', 'docs-sync'];
const currentDir = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const resolvePackageRoot = (packageName: string): string => {
  const workspacePackageRoot = join(currentDir, '..', '..', packageName);

  if (existsSync(join(workspacePackageRoot, 'package.json'))) {
    return workspacePackageRoot;
  }

  return dirname(require.resolve(`${packageName}/package.json`));
};

const collectFiles = (sourceRoot: string, targetRoot: string, segments: string[] = []): GeneratedFile[] => {
  const entries = readdirSync(join(sourceRoot, ...segments), { withFileTypes: true }).toSorted((left, right) =>
    left.name.localeCompare(right.name)
  );
  const files: GeneratedFile[] = [];

  for (const entry of entries) {
    const nextSegments = [...segments, entry.name];

    if (entry.isDirectory()) {
      files.push(...collectFiles(sourceRoot, targetRoot, nextSegments));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    files.push({
      path: `${targetRoot}/${nextSegments.join('/')}`,
      content: readFileSync(join(sourceRoot, ...nextSegments), 'utf8')
    });
  }

  return files;
};

const readTemplate = (packageRoot: string, sourcePath: string, targetPath: string): GeneratedFile => {
  return {
    path: targetPath,
    content: readFileSync(join(packageRoot, sourcePath), 'utf8')
  };
};

const frontendReviewSkillsRoot = resolvePackageRoot('frontend-review-skills');
const maintainerWorkflowTemplatesRoot = resolvePackageRoot('maintainer-workflow-templates');

export const skillTemplates: Record<SkillName, GeneratedFile[]> = Object.fromEntries(
  skillNames.map((skillName) => [
    skillName,
    collectFiles(join(frontendReviewSkillsRoot, 'skills', skillName), `.agents/skills/${skillName}`)
  ])
) as Record<SkillName, GeneratedFile[]>;

const workflowTemplates = (): GeneratedFile[] => [
  readTemplate(maintainerWorkflowTemplatesRoot, 'templates/agents/default.AGENTS.md', 'AGENTS.md'),
  readTemplate(maintainerWorkflowTemplatesRoot, 'templates/github/PULL_REQUEST_TEMPLATE.md', '.github/PULL_REQUEST_TEMPLATE.md'),
  readTemplate(maintainerWorkflowTemplatesRoot, 'templates/codex/config.toml', '.codex/config.toml'),
  readTemplate(
    maintainerWorkflowTemplatesRoot,
    'templates/docs/maintainer/ai-workflow.md',
    'docs/maintainer/ai-workflow.md'
  ),
  readTemplate(
    maintainerWorkflowTemplatesRoot,
    'templates/docs/maintainer/review-checklist.md',
    'docs/maintainer/review-checklist.md'
  ),
  readTemplate(maintainerWorkflowTemplatesRoot, 'templates/config/ai-maintainer.config.json', 'ai-maintainer.config.json')
];

export const initTemplates = (): GeneratedFile[] => [
  ...workflowTemplates(),
  ...skillTemplates['frontend-pr-review'],
  ...skillTemplates['test-gap-analysis'],
  ...skillTemplates['docs-sync']
];

export const isSkillName = (value: string): value is SkillName => {
  return skillNames.includes(value as SkillName);
};
