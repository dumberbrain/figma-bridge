# Research: figma-bridge Agent Skill

All Technical Context unknowns are resolved below. Items that depend on third-party behaviour
not checked in-session are marked **verify** and have a step in [quickstart.md](./quickstart.md).

## R1 — Skill format

- **Decision**: Agent Skills folder format: `figma-bridge/SKILL.md` with YAML front matter
  (`name`, `description`) and a Markdown body; extra detail in `references/*.md` linked from the
  body with relative links.
- **Rationale**: This is the format Claude Code loads natively, and other agents (Copilot,
  Cursor, Codex and others) and skill marketplaces have adopted the same folder layout. Only
  `name` + `description` are pre-loaded; the body and references load on demand. That is the
  progressive disclosure FR-017 needs.
- **Alternatives**: one big `SKILL.md` (rejected: every activation pays for all recipes);
  per-agent rule files such as `.cursorrules` or `copilot-instructions.md` (rejected: N copies
  drift apart; they can link to the skill instead).

## R2 — Location in the repo

- **Decision**: `skills/figma-bridge/` at the repo root, added to `package.json#files`.
- **Rationale**: Marketplaces and humans look for `skills/<name>/SKILL.md`; Claude Code plugins
  discover skills in `<plugin-root>/skills/`. Shipping it in the tarball lets `skill install`
  copy from the package, as `plugin install` does today.
- **Alternatives**: `bridge/skill/` (shipped automatically, but invisible to marketplaces and to
  the plugin loader); a separate npm package (rejected in the spec's Assumptions).

## R3 — Install mechanism

- **Decision**: New local command `figma-bridge skill install [--project] [--dir <path>]` and
  `figma-bridge skill path [--project] [--dir <path>]`. Default target is
  `~/.claude/skills/figma-bridge/`; `--project` uses `<cwd>/.claude/skills/figma-bridge/`;
  `--dir` gives the *skills root*, and `figma-bridge/` is appended. Copies the fixed file list
  and overwrites those files; other files in the folder stay. Prints the path and a next step.
- **Rationale**: Mirrors `plugin install` (same mental model, same `--dir`, same "re-run after
  upgrade"). `--dir` covers agents whose skills folder differs, with no hard-coded list to keep
  current.
- **Alternatives**: `postinstall` copy (violates G3 and surprises users); symlink into the npx
  cache (breaks when the cache is cleaned, the same reason the plugin is copied, see 001 R5);
  `--agent cursor|copilot` presets (rejected for now: their paths change, and `--dir` is enough).

## R4 — Claude Code plugin marketplace

- **Decision**: Add `.claude-plugin/plugin.json` (name, version, description, author, MCP server
  `figma-bridge` → `npx -y @ubuligan/figma-bridge mcp`) and `.claude-plugin/marketplace.json`
  listing that single plugin with `source: "./"`. Users run
  `/plugin marketplace add javidselimov/figma-bridge` then `/plugin install figma-bridge`.
  These files are **not** shipped in the npm tarball.
- **Rationale**: One step gives the skill and the MCP registration together, which shortens
  SC-005's time to first answer. The MCP server is declared inside `plugin.json`, not in a root
  `.mcp.json`, so contributors who open this repo in Claude Code are not prompted to start it.
- **Windows**: the plugin's MCP command is `npx`. If Windows needs `cmd /c` as it does for
  `claude mcp add`, the README keeps the manual path as the documented fallback. **verify** (V6).
- **Alternatives**: skill-only install (still supported through R3); a separate marketplace repo
  (more overhead for one plugin).
- **verify**: exact `plugin.json` / `marketplace.json` field names against current Claude Code
  docs before release (V6).

## R5 — Skill content design

- **Decision**: `SKILL.md` holds what must apply on every activation:
  1. the constraints block (read-only, local, no token, output root, plugin window open, desktop);
  2. the golden rules: check connection first; never invent values; cheapest first; shallow first;
  3. a decision table "user wants X → tool sequence → open reference Y";
  4. MCP ↔ CLI name mapping (`figma_<name>` ⇔ `npx @ubuligan/figma-bridge <name>`);
  5. node-id normalisation (`node-id=12-345` → `12:345`).

  Recipes, the full tool catalogue and troubleshooting go to `references/`.
- **Cost tiers** for the catalogue: *cheap* = `ping`, `health`, `pages`, `index`, `screens`,
  `find`, `sets`, `components`, `styles`; *medium* = `css`, `text`, `variables`, `selection`/
  `node` at depth ≤ 2, `view`; *expensive* = `node` deep, `svg`, `png`, `capture`/`dump`,
  `icons`. `select` is the only call that changes anything visible in Figma (navigation only).
- **Defaults**: start `node`/`selection` at `depth: 2`, go deeper only on the subtree needed;
  `view` keeps the server default `maxEdge` 1568 and views child ids for tall screens;
  `find` uses `limit` ≤ 20 when only locating.
- **Rationale**: Matches the tool behaviour documented in README §Limits and in the MCP
  `instructions` string; it puts each rule where the spec's user stories need it.

## R6 — Front-matter parsing without dependencies

- **Decision**: The test reads the block between the first two `---` lines and parses
  `key: value` lines (and a folded `description: >-` block) with a small local function. Only
  `name` and `description` are needed.
- **Rationale**: G3 (zero deps). The front matter is ours and stays simple; the test pins it.
- **Alternatives**: `yaml` dev-dependency (breaks "no dev deps either").

## R7 — Drift protection (FR-016)

- **Decision**: `test/skill.test.mjs` asserts:
  - the set of `### figma_<name>` headings in `references/tools.md` equals
    `mcpCommands().map(c => 'figma_' + c.name)`;
  - every `figma_\w+` token anywhere in the skill names a real tool;
  - every relative link in the skill resolves to a shipped file;
  - `name` matches `^[a-z0-9-]{1,64}$` and equals the folder name; `description` is 1–1024
    characters and mentions "Figma";
  - `SKILL.md` ≤ 200 lines, each reference ≤ 300 lines;
  - no forbidden private-project words (same list as `check-pack.mjs`);
  - no wording that promises edits to the document (simple deny-list: "edit the design",
    "modify the Figma file", "write to Figma").
  `check-pack.mjs` gets the 4 skill paths in `ALLOW`, so a missing file fails the pack test.
- **Rationale**: A new command added to `commands.mjs` without a catalogue entry turns CI red.

## R8 — Other agents (best-effort docs)

- **Decision**: The README and listing say "any agent that reads Agent Skills: copy the folder,
  or `figma-bridge skill install --dir <that agent's skills folder>`", with a short table of
  known folders marked "check your agent's docs". Example rows: Claude Code
  `~/.claude/skills` / `.claude/skills` (tested); GitHub Copilot in VS Code `.github/skills`;
  Cursor and Codex per their docs. **verify** (V7) before publishing the table; drop any row
  that cannot be confirmed.
- **Rationale**: The spec makes other agents best-effort. `--dir` means there is no per-agent
  code to maintain.

## R9 — Marketplace listing

- **Decision**: `docs/skill-listing.md` with title, one-line description (≤ 120 chars), long
  description, prerequisites, 5 example prompts, privacy statement, licence MIT, price Free,
  repository/npm links and install snippets. Not shipped in the tarball. Same copy is reused for
  Agensi and other directories (non-exclusive).
- **Rationale**: FR-015. Keeping it in the repo keeps the listing versioned with the skill.

## R10 — Setup report

- **Decision**: `setupReport()` gains a `skill:` line (installed → path, or not installed) and
  an optional step `figma-bridge skill install`. Pure read, as before.
- **Rationale**: First-time users see the skill without reading the README; costs ~5 lines.

## R11 — Versioning

- **Decision**: 1.1.0 (minor): new command, new shipped files, no behaviour change.
  `plugin.json#version` matches `package.json#version`; a test asserts they are equal.
