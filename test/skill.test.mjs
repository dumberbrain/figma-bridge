// Skill package contract: specs/002-figma-bridge-agent-skill/contracts/skill-package.md

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { COMMANDS, mcpCommands } from '../bridge/lib/commands.mjs';
import { FORBIDDEN, SKILL_DIR, SKILL_FILES, frontMatter, readSkill, section } from './helpers/skill.mjs';

const SECTIONS = ['Constraints', 'Rules', 'Find the node', 'What to do for…', 'Without MCP tools', 'More'];
const TOOLS = new Set(mcpCommands().map((c) => `figma_${c.name}`));
const LOCAL = COMMANDS.filter((c) => c.where === 'local').map((c) => `figma_${c.name}`);

const skill = () => frontMatter(readSkill('SKILL.md'));
const lineCount = (text) => text.replace(/\n$/, '').split('\n').length;

/** GitHub-style heading anchor. */
const slug = (heading) =>
  heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-');

const anchors = (text) =>
  new Set(
    text
      .split('\n')
      .filter((l) => /^#{1,6} /.test(l))
      .map((l) => slug(l.replace(/^#+ /, '')))
  );

// ── base contract ─────────────────────────────────────────────────────────

test('every skill file exists', () => {
  for (const rel of SKILL_FILES) assert.ok(existsSync(path.join(SKILL_DIR, rel)), rel);
});

test('front matter: name matches the folder, description names Figma', () => {
  const { data } = skill();
  assert.match(data.name, /^[a-z0-9-]{1,64}$/);
  assert.equal(data.name, path.basename(SKILL_DIR));
  assert.ok(data.description, 'description is required');
  assert.ok(data.description.length >= 1 && data.description.length <= 1024, `${data.description.length} chars`);
  assert.match(data.description, /Figma/);
});

test('size budget: SKILL.md ≤ 200 lines, each reference ≤ 300 lines', () => {
  assert.ok(lineCount(readSkill('SKILL.md')) <= 200, `SKILL.md has ${lineCount(readSkill('SKILL.md'))} lines`);
  for (const rel of SKILL_FILES.slice(1)) {
    assert.ok(lineCount(readSkill(rel)) <= 300, `${rel} has ${lineCount(readSkill(rel))} lines`);
  }
});

test('SKILL.md has the required sections in order', () => {
  const headings = skill()
    .body.split('\n')
    .filter((l) => l.startsWith('## '))
    .map((l) => l.slice(3).trim());
  let at = -1;
  for (const want of SECTIONS) {
    const i = headings.indexOf(want);
    assert.ok(i > at, `"## ${want}" missing or out of order (got: ${headings.join(' | ')})`);
    at = i;
  }
});

test('every relative link resolves to a skill file (and anchor)', () => {
  for (const rel of SKILL_FILES) {
    const text = readSkill(rel);
    for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^[a-z]+:/i.test(target)) continue; // http(s):, mailto:
      const [file, anchor] = target.split('#');
      const resolved = file ? path.posix.normalize(path.posix.join(path.posix.dirname(rel), file)) : rel;
      assert.ok(SKILL_FILES.includes(resolved), `${rel} links to ${target}, which is not a skill file`);
      if (anchor) assert.ok(anchors(readSkill(resolved)).has(anchor), `${rel} links to missing anchor ${target}`);
    }
  }
});

test('no private-project words', () => {
  for (const rel of SKILL_FILES) {
    const text = readSkill(rel).toLowerCase();
    for (const word of FORBIDDEN) assert.ok(!text.includes(word), `${rel} mentions "${word}"`);
  }
});

// ── US1: connection state ─────────────────────────────────────────────────

test('troubleshooting covers every known failure', () => {
  const text = readSkill('references/troubleshooting.md');
  const symptoms = [
    /NOT connected/,
    /older than this server/,
    /protocol v/,
    /port \S+ is not available/,
    /waiting for Claude or the CLI/,
    /Refusing to write outside/,
    /figma_\*`? tools/,
    /two files/i,
    /first call .*(slow|seconds)/i,
    /45 s/,
  ];
  for (const re of symptoms) assert.match(text, re);
});

test('rules mandate a connection check and forbid invented values', () => {
  const rules = section(skill().body, 'Rules');
  assert.match(rules, /figma_ping/);
  assert.match(rules, /figma_health/);
  assert.match(rules, /(never|do not|don't) invent/i);
});

// ── US2: tool catalogue matches the server ────────────────────────────────

test('tools.md has exactly one entry per MCP tool', () => {
  const headings = readSkill('references/tools.md')
    .split('\n')
    .filter((l) => l.startsWith('### '))
    .map((l) => l.slice(4).trim());
  assert.equal(new Set(headings).size, headings.length, 'duplicate tool heading');
  assert.deepEqual(new Set(headings), TOOLS);
  for (const local of LOCAL) assert.ok(!headings.includes(local), `${local} is CLI-only`);
});

test('every figma_* name in the skill is a real tool', () => {
  for (const rel of SKILL_FILES) {
    for (const [name] of readSkill(rel).matchAll(/\bfigma_[a-z]+\b/g)) {
      assert.ok(TOOLS.has(name), `${rel} mentions unknown tool ${name}`);
    }
  }
});

// ── US3: workflows ────────────────────────────────────────────────────────

test('workflows.md has every recipe with steps, output and fallback', () => {
  const text = readSkill('references/workflows.md');
  for (const recipe of [
    'Describe a screen',
    'Design tokens as CSS variables',
    'Build a component from a node',
    'Capture a page into the project',
    'Export icons',
  ]) {
    const body = section(text, recipe);
    assert.ok(body, `missing "## ${recipe}"`);
    for (const label of ['**Steps**', '**Output**', '**Fallback**']) assert.ok(body.includes(label), `${recipe}: ${label}`);
  }
});

// ── US5: safety wording ───────────────────────────────────────────────────

test('the skill never promises to modify the document', () => {
  const promises = [
    'edit the design',
    'modify the figma file',
    'write to figma',
    'update the figma file',
    'change the design in figma',
  ];
  for (const rel of SKILL_FILES) {
    for (const line of readSkill(rel).toLowerCase().split('\n')) {
      if (/cannot|can't|read-only|not /.test(line)) continue;
      for (const p of promises) assert.ok(!line.includes(p), `${rel}: "${line.trim()}"`);
    }
  }
});
