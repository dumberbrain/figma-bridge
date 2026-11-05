// `skill install | path` file logic: specs/002-figma-bridge-agent-skill/contracts/cli-skill.md

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { BridgeError, UsageError } from '../bridge/lib/errors.mjs';
import { defaultSkillsRoot, install, installedSkill, resolveTarget, skillPath } from '../bridge/lib/skill-files.mjs';
import { SKILL_DIR, SKILL_FILES } from './helpers/skill.mjs';

let root;

before(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'fb-skill-'));
});

after(async () => {
  await rm(root, { recursive: true, force: true });
});

test('resolveTarget: default, --project, --dir, and both', () => {
  assert.equal(defaultSkillsRoot(), path.join(os.homedir(), '.claude', 'skills'));
  assert.equal(resolveTarget(), path.join(os.homedir(), '.claude', 'skills', 'figma-bridge'));
  assert.equal(resolveTarget({ project: true, cwd: root }), path.join(root, '.claude', 'skills', 'figma-bridge'));
  assert.equal(resolveTarget({ dir: path.join(root, 'x') }), path.join(root, 'x', 'figma-bridge'));
  assert.throws(() => resolveTarget({ dir: root, project: true }), UsageError);
});

test('install copies every skill file byte for byte and keeps other files', async () => {
  const skills = path.join(root, 'a');
  const target = path.join(skills, 'figma-bridge');
  await mkdir(target, { recursive: true });
  await writeFile(path.join(target, 'NOTES.md'), 'mine');

  const done = await install({ dir: skills });
  assert.equal(done.dir, target);
  assert.equal(done.skill, path.join(target, 'SKILL.md'));
  for (const rel of SKILL_FILES) {
    assert.deepEqual(await readFile(path.join(target, rel)), await readFile(path.join(SKILL_DIR, rel)), rel);
  }
  assert.equal(await readFile(path.join(target, 'NOTES.md'), 'utf8'), 'mine');
});

test('re-install overwrites a modified skill file', async () => {
  const skills = path.join(root, 'b');
  const { skill } = await install({ dir: skills });
  await writeFile(skill, 'stale');
  await install({ dir: skills });
  assert.equal(await readFile(skill, 'utf8'), await readFile(path.join(SKILL_DIR, 'SKILL.md'), 'utf8'));
});

test('skillPath / installedSkill: complete, partial, absent', async () => {
  const skills = path.join(root, 'c');
  const { skill, dir } = await install({ dir: skills });
  assert.equal(skillPath({ dir: skills }), skill);
  assert.equal(installedSkill({ dir: skills }), skill);

  await unlink(path.join(dir, 'references', 'tools.md'));
  assert.throws(
    () => skillPath({ dir: skills }),
    (e) => e instanceof BridgeError && /skill install/.test(e.message)
  );
  assert.equal(installedSkill({ dir: skills }), null);
  assert.equal(installedSkill({ dir: path.join(root, 'nowhere') }), null);
  assert.ok(!existsSync(path.join(root, 'nowhere')));
});
