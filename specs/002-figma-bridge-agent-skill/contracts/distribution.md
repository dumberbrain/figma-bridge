# Contract: Distribution

## 1. npm tarball (amends 001 package-surface.md)

`package.json`:

```diff
- "version": "1.0.1",
+ "version": "1.1.0",
- "files": ["bin/", "bridge/", "CHANGELOG.md"],
+ "files": ["bin/", "bridge/", "skills/", "CHANGELOG.md"],
+ keywords += "agent-skill", "claude-code-skill"
```

Allow-list additions (in `scripts/check-pack.mjs#ALLOW`):

```
bridge/lib/skill-files.mjs
skills/figma-bridge/SKILL.md
skills/figma-bridge/references/tools.md
skills/figma-bridge/references/workflows.md
skills/figma-bridge/references/troubleshooting.md
```

Not shipped: `.claude-plugin/**`, `docs/**`. The existing allow-list check ensures this.

## 2. Claude Code plugin marketplace (repo only)

`.claude-plugin/plugin.json` (shape; field names **verify** against current docs, quickstart V6):

```json
{
  "name": "figma-bridge",
  "version": "1.1.0",
  "description": "Read the Figma file open in Figma desktop — skill + local MCP server, no API token.",
  "author": { "name": "Javid Salimov" },
  "license": "MIT",
  "repository": "https://github.com/javidselimov/figma-bridge",
  "mcpServers": {
    "figma-bridge": { "command": "npx", "args": ["-y", "@ubuligan/figma-bridge", "mcp"] }
  }
}
```

The skill comes from `skills/` at the plugin root (repo root).

`.claude-plugin/marketplace.json`:

```json
{
  "name": "figma-bridge",
  "owner": { "name": "Javid Salimov" },
  "plugins": [{ "name": "figma-bridge", "source": "./", "description": "…" }]
}
```

Rules (tested): `plugin.json#version` == `package.json#version`; both files are valid JSON;
the plugin name is `figma-bridge`.

## 3. Marketplace listing (`docs/skill-listing.md`)

Required headings: Title · Tagline · Description · Requirements · Example prompts · Privacy ·
License & price · Links · Install. The tagline is ≤ 120 characters. Privacy says: design data
moves only between Figma desktop, the local relay on 127.0.0.1 and the agent; the agent's own
model provider sees what the agent sends it.

## 4. README

New section `## Agent skill` after "What you can ask Claude": what it does in one sentence, the
three install paths (Claude plugin, `skill install`, manual copy / `--dir`), and a link to the
other-agents table (R8). The `Commands` setup line gains `skill install|path`.
