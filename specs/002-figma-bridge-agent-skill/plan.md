# Implementation Plan: figma-bridge Agent Skill

**Branch**: `002-figma-bridge-agent-skill` | **Date**: 2026-11-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-figma-bridge-agent-skill/spec.md`

## Summary

Ship an Agent Skill (`skills/figma-bridge/`) in the existing `@ubuligan/figma-bridge` package.
It teaches any skill-aware agent how to use the bridge well: check connection first, locate
nodes cheapest-first, read with depth/size limits, follow four design-to-code recipes, and
respect the read-only / local-only boundaries. The skill is one short `SKILL.md` plus three
reference files the agent opens on demand (tool catalogue, workflows, troubleshooting).

Distribution: a new local CLI command `figma-bridge skill install|path` copies the skill into
`~/.claude/skills/` (or `./.claude/skills/` with `--project`, or any `--dir`), mirroring
`plugin install`. The repo also becomes a Claude Code plugin marketplace
(`.claude-plugin/`) so one install brings both the skill and the MCP server. Marketplace listing
copy lives in `docs/skill-listing.md`. A new `node:test` suite pins the skill to the command
registry, so the tool list can never drift from what `mcp.mjs` exposes. Release as **1.1.0**
(additive).

## Technical Context

**Language/Version**: Markdown (skill content, YAML front matter); JavaScript ES2022 ESM with `// @ts-check` for the install command; Node.js `>=22.12.0`

**Primary Dependencies**: none — Node built-ins only (`node:fs/promises`, `node:path`, `node:os`, `node:test`); front matter parsed with a ~15-line local parser, not a YAML library (G3)

**Storage**: skill source in `skills/figma-bridge/` (repo + tarball); installed copies in `~/.claude/skills/figma-bridge/`, `<cwd>/.claude/skills/figma-bridge/` or a user-given `--dir`

**Testing**: `node --test` — new `test/skill.test.mjs` (front matter, size budget, tool-catalogue ↔ registry drift, link integrity, forbidden words), `test/skill-files.test.mjs` (install/path), extra cases in `cli.test.mjs` / `commands.test.mjs`; `scripts/check-pack.mjs` allow-list extended

**Target Platform**: any agent that reads the Agent Skills folder format; Claude Code fully supported and tested; Copilot / Cursor / Codex documented best-effort (paths verified in quickstart V7)

**Project Type**: content + small CLI extension to an existing CLI / MCP / Figma-plugin npm package

**Performance Goals**: `SKILL.md` ≤ 200 lines and ≤ ~2,000 tokens so loading it is cheap (FR-017); each reference file ≤ 300 lines; `skill install` < 1 s

**Constraints**: zero dependencies; no install scripts (skill is copied only on explicit command); skill text must not promise any write to the Figma document; tool names must match `mcpCommands()` exactly; same text must work for MCP (`figma_<name>`) and CLI (`figma-bridge <name>`) users

**Scale/Scope**: 4 Markdown files (~600 lines), 1 listing doc, 1 plugin manifest pair, ~80 LOC JS, ~150 LOC tests; 1 new command (`skill`); 21 MCP tools documented

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template. As in
[001 plan](../001-npm-figma-bridge/plan.md), the project's de-facto gates G1–G8 apply:

| # | Gate | Pre-design | Post-design |
| --- | --- | --- | --- |
| G1 | **Minimal public surface** | PASS — one new CLI command, no new `exports` | PASS — [contracts/cli-skill.md](./contracts/cli-skill.md) |
| G2 | **Every public interface has a contract and a pinning test** | PASS (planned) | PASS — skill package → `skill.test.mjs`; CLI → `skill-files.test.mjs`, `cli.test.mjs`; tarball → `pack.test.mjs` |
| G3 | **Zero runtime deps, no install scripts** | PASS — local front-matter parser (R6) | PASS |
| G4 | **Secure by default** | PASS — skill states read-only/local; install writes only to the chosen skills folder | PASS — [contracts/skill-package.md](./contracts/skill-package.md) §Content rules |
| G5 | **Semver discipline** | PASS — additive → 1.1.0, CHANGELOG entry | PASS |
| G6 | **Shipped contents audited** | PASS — allow-list gains 4 skill files | PASS — package-surface contract amended |
| G7 | **Cross-platform** | PASS — `os.homedir()` + `path.join`; CI matrix unchanged | PASS |
| G8 | **No unverified claims** | PASS — third-party agent paths and plugin-manifest schema marked to verify | PASS — quickstart V6, V7 |

No violations → Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-figma-bridge-agent-skill/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── skill-package.md      # SKILL.md + references: front matter, sections, content rules
│   ├── cli-skill.md          # `figma-bridge skill install|path`
│   └── distribution.md       # tarball allow-list delta, Claude plugin marketplace, listing doc
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
skills/
└── figma-bridge/
    ├── SKILL.md                     # NEW — front matter + core rules + decision flow (≤200 lines)
    └── references/
        ├── tools.md                 # NEW — one entry per figma_* tool (drift-tested)
        ├── workflows.md             # NEW — describe / tokens / component / capture / icons
        └── troubleshooting.md       # NEW — message → cause → user action

.claude-plugin/
├── plugin.json                      # NEW — Claude Code plugin: skill + MCP server
└── marketplace.json                 # NEW — repo as a one-plugin marketplace

bridge/
├── cli.mjs                          # CHANGED — `skill` command handler
└── lib/
    ├── commands.mjs                 # CHANGED — `skill` entry (where: 'local')
    ├── skill-files.mjs              # NEW — install / skillPath / installedSkill
    └── tasks.mjs                    # CHANGED — setupReport shows skill state + step

docs/
└── skill-listing.md                 # NEW — marketplace copy (not shipped in tarball)

scripts/check-pack.mjs               # CHANGED — allow-list + skills/
test/
├── skill.test.mjs                   # NEW — content contract + drift
├── skill-files.test.mjs             # NEW — install / path
├── cli.test.mjs                     # CHANGED — `skill install|path` end to end
└── commands.test.mjs                # CHANGED — `skill` is local, not an MCP tool

package.json                         # CHANGED — files += "skills/", version 1.1.0
README.md                            # CHANGED — "Agent skill" section
CHANGELOG.md                         # CHANGED — 1.1.0
```

**Structure Decision**: The skill lives at `skills/figma-bridge/` in the repo root — the layout
skill marketplaces, GitHub browsing and Claude Code plugins all expect — and is added to
`files` so npm ships it. Code follows the existing pattern: registry entry in `commands.mjs`,
file logic in a `lib/*-files.mjs` module modelled on `plugin-files.mjs`, handler in `cli.mjs`.

## Complexity Tracking

No gate violations.
