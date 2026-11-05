# Validation record: figma-bridge Agent Skill

**Created**: 2026-11-05
**Feature**: [spec.md](../spec.md) · [quickstart.md](../quickstart.md)

## Automated (V1)

- [x] `npm test`: 88/88 pass (local, Windows 10, Node 23.5)
- [x] `npm run check:pack`: `pack OK (23 files)`, which includes 4 skill files and `skill-files.mjs`; no `.claude-plugin/` or `docs/` files

## Install command (V2)

- [x] `skill install --dir <tmp>`: exit 0, prints `<tmp>/figma-bridge/SKILL.md`
- [x] `skill path --dir <tmp>`: same path, exit 0
- [x] `skill path --dir <missing>`: exit 1 with the `skill install` hint
- [x] `skill install --project --dir x`: exit 2
- [x] `setup` shows the `skill:` line and step 5

## Manual, needs Figma desktop + sample file (T039)

- [ ] V3 connection handling: ≥ 9/10 (SC-001)
- [ ] V4 cheapest-first + ≥ 40 % context saving (SC-002, SC-003)
- [ ] V5 workflows: ≥ 95 % value match (SC-004); read-only refusal (US5)

## Release verification (T040)

V6, Claude Code plugin. Docs check done 2026-11-05 against code.claude.com plugin manifest,
marketplace and loading references:

- [x] `plugin.json` fields match the docs: `name` (kebab-case, not reserved), `version`,
  `description`, `author` object, `homepage` URL, `repository` **string**, `license`,
  `keywords`, inline `mcpServers` object
- [x] `skills/<name>/SKILL.md` at the plugin root is auto-discovered
- [x] `marketplace.json`: `name`, `owner.name`, `plugins[]`; `"source": "./"` is valid for a
  root plugin; `figma-bridge` is not a reserved marketplace name
- [x] Install commands: `/plugin marketplace add javidselimov/figma-bridge`, then
  `/plugin install figma-bridge@figma-bridge` (the part after `@` is the marketplace `name`)
- [x] No root lockfile, so Claude Code's automatic Node dependency install for plugins does not
  run (it triggers only when the plugin root has `package.json` **and** a lockfile)
- [x] Windows: `npx` spawned without a shell fails with `ENOENT` (reproduced 2026-11-05; the
  plugin showed `CONNECTION_CLOSED`). Fixed: the plugin now runs
  `node ${CLAUDE_PLUGIN_ROOT}/bin/figma-bridge.mjs mcp`, and the MCP handshake works from the
  plugin cache. Still to do: reinstall the plugin and confirm in Claude Code
- [ ] End-to-end `/plugin install` on macOS/Linux after pushing to GitHub
- Note: the plugin cache copies the whole repo, including `figma-bridge-site/`. This works, but
  it is heavy. Consider a slimmer plugin source later if install size matters.
- Note: the plugin exposes the tools as `mcp__plugin_figma-bridge_figma-bridge__figma_*`. The
  skill's `figma_*` names still match as suffixes.

V7, other agents:

- [ ] Not done. The README uses only the generic "check your agent's docs" line and lists no
  unverified folder paths.
