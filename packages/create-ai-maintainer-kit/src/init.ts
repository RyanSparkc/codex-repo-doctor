import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { initTemplates, isSkillName, skillTemplates } from './templates.ts';

export interface WriteResult {
  created: string[];
  skipped: string[];
}

const writeGeneratedFiles = (root: string, files: { path: string; content: string }[]): WriteResult => {
  const result: WriteResult = {
    created: [],
    skipped: []
  };

  for (const file of files) {
    const target = join(root, file.path);

    if (existsSync(target)) {
      result.skipped.push(file.path);
      continue;
    }

    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, file.content, 'utf8');
    result.created.push(file.path);
  }

  return result;
};

export const initProject = (root: string): WriteResult => {
  return writeGeneratedFiles(root, initTemplates());
};

export const addSkill = (root: string, skillName: string): WriteResult => {
  if (!isSkillName(skillName)) {
    throw new Error(`Unknown skill "${skillName}". Available skills: ${Object.keys(skillTemplates).join(', ')}`);
  }

  return writeGeneratedFiles(root, skillTemplates[skillName]);
};

export const formatWriteResult = (result: WriteResult): string => {
  const lines = ['AI Maintainer Kit init result'];

  for (const path of result.created) {
    lines.push(`[created] ${path}`);
  }

  for (const path of result.skipped) {
    lines.push(`[skipped] ${path}`);
  }

  return lines.join('\n');
};
