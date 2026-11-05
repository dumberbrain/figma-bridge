// @ts-check
// The agent skill's files on disk.
//
// The skill (skills/figma-bridge/) ships in the package. `skill install` copies
// it into an agent's skills folder, for the same reason the plugin is copied:
// under `npx` the package lives in a cache folder that can disappear. Re-running
// `install` after an upgrade refreshes the files in place.

import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BridgeError, UsageError } from './errors.mjs';
import { NPX } from './protocol.mjs';

const NAME = 'figma-bridge';
const SOURCE = fileURLToPath(new URL(`../../skills/${NAME}/`, import.meta.url));
const FILES = ['SKILL.md', 'references/tools.md', 'references/workflows.md', 'references/troubleshooting.md'];

/** Claude Code's user-wide skills folder. */
export const defaultSkillsRoot = () => path.join(os.homedir(), '.claude', 'skills');

/**
 * The folder the skill goes into. `dir` is a skills root (the skill gets its own
 * subfolder inside it); `project` means `<cwd>/.claude/skills`.
 * @param {{ dir?: string, project?: boolean, cwd?: string }} [options]
 */
export function resolveTarget({ dir, project = false, cwd = process.cwd() } = {}) {
  if (dir && project) throw new UsageError('skill: use either `--dir` or `--project`, not both.');
  const root = dir ? path.resolve(dir) : project ? path.join(path.resolve(cwd), '.claude', 'skills') : defaultSkillsRoot();
  return path.join(root, NAME);
}

/**
 * Copies the skill files into the target, overwriting them. Other files there are left alone.
 * @param {{ dir?: string, project?: boolean, cwd?: string }} [options]
 * @returns {Promise<{ dir: string, skill: string }>}
 */
export async function install(options) {
  const target = resolveTarget(options);
  for (const rel of FILES) {
    const to = path.join(target, rel);
    await mkdir(path.dirname(to), { recursive: true });
    await copyFile(path.join(SOURCE, rel), to);
  }
  return { dir: target, skill: path.join(target, 'SKILL.md') };
}

/**
 * @param {{ dir?: string, project?: boolean, cwd?: string }} [options]
 * @returns {string} absolute SKILL.md path
 */
export function skillPath(options) {
  const target = resolveTarget(options);
  if (!FILES.every((rel) => existsSync(path.join(target, rel)))) {
    throw new BridgeError(`Skill not installed in ${target}. Run: ${NPX} skill install`, 'bad');
  }
  return path.join(target, 'SKILL.md');
}

/** Same as skillPath, but null instead of throwing — for status reports. */
export function installedSkill(options) {
  try {
    return skillPath(options);
  } catch {
    return null;
  }
}
