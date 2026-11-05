// Claude Code plugin marketplace files: specs/002-figma-bridge-agent-skill/contracts/distribution.md §2

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (rel) => JSON.parse(readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8'));

test('plugin.json names the plugin, matches the package version and starts the MCP server', () => {
  const plugin = read('.claude-plugin/plugin.json');
  const pkg = read('package.json');
  assert.equal(plugin.name, 'figma-bridge');
  assert.equal(plugin.version, pkg.version);
  const server = plugin.mcpServers?.['figma-bridge'];
  assert.ok(server, 'mcpServers.figma-bridge');
  assert.ok(server.args.includes('@ubuligan/figma-bridge'));
  assert.ok(server.args.includes('mcp'));
});

test('marketplace.json lists the plugin from the repo root', () => {
  const market = read('.claude-plugin/marketplace.json');
  assert.equal(market.plugins[0].name, 'figma-bridge');
  assert.equal(market.plugins[0].source, './');
});
