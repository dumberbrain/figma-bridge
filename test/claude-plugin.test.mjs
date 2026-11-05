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
  // `node` is a real executable everywhere; `npx` is `npx.cmd` on Windows and
  // fails with ENOENT when spawned without a shell, which is how plugin MCP
  // servers are started. The plugin root already holds the package code.
  assert.equal(server.command, 'node');
  assert.deepEqual(server.args, ['${CLAUDE_PLUGIN_ROOT}/bin/figma-bridge.mjs', 'mcp']);
});

test('marketplace.json lists the plugin from the repo root', () => {
  const market = read('.claude-plugin/marketplace.json');
  assert.equal(market.plugins[0].name, 'figma-bridge');
  assert.equal(market.plugins[0].source, './');
});
