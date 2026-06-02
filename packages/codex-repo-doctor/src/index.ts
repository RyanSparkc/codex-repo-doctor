#!/usr/bin/env node
import { resolve } from 'node:path';
import { detectProject, formatDoctorReport } from './detect.ts';
import { addSkill, formatWriteResult, initProject } from './init.ts';

interface ParsedArgs {
  command: string | undefined;
  subcommand: string | undefined;
  root: string;
  skillName: string | undefined;
}

const parseArgs = (argv: string[]): ParsedArgs => {
  const args = [...argv];
  const command = args.shift();
  let subcommand: string | undefined;
  let root = process.cwd();
  let skillName: string | undefined;

  if (command === 'add') {
    subcommand = args.shift();
    skillName = args.shift();
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--root') {
      const value = args[index + 1];

      if (!value) {
        throw new Error('--root requires a path.');
      }

      root = value;
      index += 1;
    }
  }

  return {
    command,
    subcommand,
    root: resolve(root),
    skillName
  };
};

const help = (): string => {
  return `codex-repo-doctor

Usage:
  codex-repo-doctor doctor [--root path]
  codex-repo-doctor init [--root path]
  codex-repo-doctor add skill <name> [--root path]

Skills:
  frontend-pr-review
  test-gap-analysis
  docs-sync
`;
};

const run = (): void => {
  const args = parseArgs(process.argv.slice(2));

  if (!args.command || args.command === 'help' || args.command === '--help') {
    console.log(help());
    return;
  }

  if (args.command === 'doctor') {
    console.log(formatDoctorReport(detectProject(args.root)));
    return;
  }

  if (args.command === 'init') {
    console.log(formatWriteResult(initProject(args.root)));
    return;
  }

  if (args.command === 'add' && args.subcommand === 'skill') {
    if (!args.skillName) {
      throw new Error('Missing skill name.');
    }

    console.log(formatWriteResult(addSkill(args.root, args.skillName)));
    return;
  }

  throw new Error(`Unknown command "${args.command}".\n\n${help()}`);
};

try {
  run();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
