// Shared helpers for the agent-skill tests (specs/002-figma-bridge-agent-skill).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const SKILL_DIR = fileURLToPath(new URL('../../skills/figma-bridge/', import.meta.url));

export const SKILL_FILES = [
  'SKILL.md',
  'references/tools.md',
  'references/workflows.md',
  'references/troubleshooting.md',
];

// Keep in sync with FORBIDDEN in scripts/check-pack.mjs (that script runs on
// import, so the list cannot be imported from it).
export const FORBIDDEN = [
  'cbar',
  'template5',
  'figma-cbar',
  'redesign-figma',
  'tools/figma-bridge',
  'spec.js',
  'gen-icons',
  'fetch-rest.sh',
  'extract-colors',
  'extract-semantic',
];

/** @param {string} rel path relative to the skill folder */
export const readSkill = (rel) => readFileSync(path.join(SKILL_DIR, rel), 'utf8');

/**
 * Minimal front-matter parser: `key: value` and folded `key: >-` blocks.
 * Enough for the two keys the skill format needs; no YAML dependency.
 * @param {string} text
 * @returns {{ data: Record<string, string>, body: string }}
 */
export function frontMatter(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  if (lines[0] !== '---') return { data: {}, body: text };
  const end = lines.indexOf('---', 1);
  if (end === -1) return { data: {}, body: text };

  const data = {};
  let key = null;
  let folded = [];
  const flush = () => {
    if (key) data[key] = folded.join(' ').trim();
    key = null;
    folded = [];
  };

  for (const line of lines.slice(1, end)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m && !line.startsWith(' ')) {
      flush();
      if (/^[>|][-+]?$/.test(m[2])) {
        key = m[1];
      } else {
        data[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2').trim();
      }
    } else if (key) {
      folded.push(line.trim());
    }
  }
  flush();
  return { data, body: lines.slice(end + 1).join('\n') };
}

/**
 * The text of one `## Heading` section of a Markdown body (up to the next `## `).
 * @param {string} body
 * @param {string} heading without the leading `## `
 */
export function section(body, heading) {
  const lines = body.split('\n');
  const start = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (start === -1) return '';
  const rest = lines.slice(start + 1);
  const next = rest.findIndex((l) => l.startsWith('## '));
  return (next === -1 ? rest : rest.slice(0, next)).join('\n');
}
