import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type SkillName = 'frontend-pr-review' | 'test-gap-analysis' | 'docs-sync';

export interface GeneratedFile {
  path: string;
  content: string;
}

const skillNames: SkillName[] = ['frontend-pr-review', 'test-gap-analysis', 'docs-sync'];
const currentDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(currentDir, '..');
const assetsRoot = join(packageRoot, 'assets');

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

const frontendReviewSkillsRoot = join(assetsRoot, 'skills');
const maintainerWorkflowTemplatesRoot = join(assetsRoot, 'templates');

export const skillTemplates: Record<SkillName, GeneratedFile[]> = Object.fromEntries(
  skillNames.map((skillName) => [
    skillName,
    collectFiles(join(frontendReviewSkillsRoot, skillName), `.agents/skills/${skillName}`)
  ])
) as Record<SkillName, GeneratedFile[]>;

const workflowTemplates = (): GeneratedFile[] => [
  readTemplate(maintainerWorkflowTemplatesRoot, 'agents/default.AGENTS.md', 'AGENTS.md'),
  readTemplate(maintainerWorkflowTemplatesRoot, 'github/PULL_REQUEST_TEMPLATE.md', '.github/PULL_REQUEST_TEMPLATE.md'),
  readTemplate(maintainerWorkflowTemplatesRoot, 'codex/config.toml', '.codex/config.toml'),
  readTemplate(maintainerWorkflowTemplatesRoot, 'docs/maintainer/ai-workflow.md', 'docs/maintainer/ai-workflow.md'),
  readTemplate(
    maintainerWorkflowTemplatesRoot,
    'docs/maintainer/review-checklist.md',
    'docs/maintainer/review-checklist.md'
  ),
  readTemplate(maintainerWorkflowTemplatesRoot, 'config/ai-maintainer.config.json', 'ai-maintainer.config.json')
];

export const initTemplates = (): GeneratedFile[] => [
  ...workflowTemplates()
];

export const isSkillName = (value: string): value is SkillName => {
  return skillNames.includes(value as SkillName);
};
