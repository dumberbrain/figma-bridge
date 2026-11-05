---

description: "Task list for figma-bridge Agent Skill"
---

# Tasks: figma-bridge Agent Skill

**Input**: Design documents from `specs/002-figma-bridge-agent-skill/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included. FR-016 requires automated drift and packaging tests, and plan gate G2
requires a pinning test for every contract. Tests use `node:test` only (no dependencies).

**Organization**: Tasks are grouped by user story so each story can be implemented and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story from spec.md (US1–US5)
- Paths are repo-relative from the repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Folders and package metadata the later phases write into.

- [X] T001 Create folders `skills/figma-bridge/references/`, `.claude-plugin/` and `docs/` at the repository root (empty placeholders are not needed; later tasks create the files)
- [X] T002 Update `package.json`: `files` → `["bin/", "bridge/", "skills/", "CHANGELOG.md"]`, append keywords `"agent-skill"` and `"claude-code-skill"`, set `version` to `1.1.0` (per [contracts/distribution.md](./contracts/distribution.md) §1)
- [X] T003 [P] Add the 5 new paths to `ALLOW` in `scripts/check-pack.mjs`: `bridge/lib/skill-files.mjs`, `skills/figma-bridge/SKILL.md`, `skills/figma-bridge/references/tools.md`, `skills/figma-bridge/references/workflows.md`, `skills/figma-bridge/references/troubleshooting.md`; update the header comment to mention spec 002. The pack test stays red until US1–US4 create the files; this is expected.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The skill file skeleton and the content-contract test harness every story extends.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Create `skills/figma-bridge/SKILL.md` with the front matter from [contracts/skill-package.md](./contracts/skill-package.md) (`name: figma-bridge`, folded `description: >-` naming Figma, design file, screen/frame/page/component, design tokens/variables, design to code, read-only/local/no token) and the six empty section headings in order: `## Constraints`, `## Rules`, `## Find the node`, `## What to do for…`, `## Without MCP tools`, `## More`
- [X] T005 Create empty stubs `skills/figma-bridge/references/tools.md`, `skills/figma-bridge/references/workflows.md`, `skills/figma-bridge/references/troubleshooting.md`, each with a `# <Title>` heading and one line linking back to `../SKILL.md`
- [X] T006 Create `test/helpers/skill.mjs` exporting: `SKILL_DIR` (absolute path to `skills/figma-bridge`), `SKILL_FILES` (the 4 relative paths), `readSkill(rel)`, and `frontMatter(text)`, a dependency-free parser that reads the block between the first two `---` lines, supports `key: value` and folded `key: >-` multi-line values, and returns `{ data, body }` (research R6)
- [X] T007 Create `test/skill.test.mjs` with the base content contract: all 4 files exist; `name` matches `^[a-z0-9-]{1,64}$` and equals the folder name `figma-bridge`; `description` is 1–1024 characters and contains "Figma"; `SKILL.md` ≤ 200 lines and each reference ≤ 300 lines; the six `##` sections appear in order; every relative Markdown link `](…)` in the 4 files resolves to one of the 4 files; no word from `FORBIDDEN` in `scripts/check-pack.mjs` appears (export `FORBIDDEN` from that script, or copy the list into `test/helpers/skill.mjs` with a comment that it must stay in sync)

**Checkpoint**: `node --test test/skill.test.mjs` passes on the skeleton. Stories can start.

---

## Phase 3: User Story 1 - Agent handles connection state before doing work (Priority: P1) 🎯 MVP

**Goal**: The agent checks connection first and maps every known failure to the exact user fix (FR-003, FR-004, FR-011).

**Independent Test**: Quickstart V3. With the plugin closed, a Figma question gets "not connected" plus the Figma menu path in the first reply, and no other tool is called.

### Tests for User Story 1

- [X] T008 [P] [US1] In `test/skill.test.mjs` add the test "troubleshooting covers every known failure": `references/troubleshooting.md` contains a fragment for each required symptom from [data-model.md](./data-model.md) §TroubleshootingEntry (`NOT connected`, `older than this server`, `protocol`, `port`, `waiting for Claude or the CLI`, `Refusing to write outside`, tools missing, two files, slow first call, 45 s)
- [X] T009 [P] [US1] In `test/skill.test.mjs` add the test "rules section mandates connection check and no invented values": the `## Rules` section of `SKILL.md` mentions `figma_ping`, `figma_health` and a never-invent rule (match "never invent" or "do not invent", case-insensitive)

### Implementation for User Story 1

- [X] T010 [US1] Write the `## Constraints` section in `skills/figma-bridge/SKILL.md`: read-only towards the document (only `figma_select` changes the page, selection or zoom); no API token or paid plan; everything stays on this machine (loopback relay); files are written only inside the output root (`FIGMA_BRIDGE_ROOT` or the start folder, default `figma-bridge-out/`); Figma **desktop** with the plugin window kept open. ≤ 12 lines.
- [X] T011 [US1] Write the `## Rules` section in `skills/figma-bridge/SKILL.md`: (1) before the first Figma read in a conversation, and after any "plugin closed / not connected" error, call `figma_ping`; if it fails, call `figma_health` and follow `references/troubleshooting.md`; report the file and page you are reading; (2) never invent design values; if a value could not be read, say so; (3) cheapest first, see `## Find the node`; (4) shallow first; (5) when an answer was saved to a file (path plus outline), read only the part you need. If no `figma_*` tools exist, use the CLI (`## Without MCP tools`) or tell the user how to register the server.
- [X] T012 [US1] Write `skills/figma-bridge/references/troubleshooting.md` as a table `Symptom | Cause | Tell the user` covering every symptom in T008, with exact actions taken from README §Troubleshooting and §Limits: the Figma menu path `Plugins → Development → figma-bridge`; `npx @ubuligan/figma-bridge plugin install` then re-run the plugin; port change with both halves (`plugin install --port N` and `FIGMA_BRIDGE_PORT=N`); `claude mcp add` lines for macOS/Linux and Windows (`cmd /c npx …`); `FIGMA_BRIDGE_ROOT`; plugin open in two files → confirm the file name from `figma_ping`; a slow first cross-page call is normal; `health` can report a stale "connected" for 45 s → re-ping after an error. Add a short "Agent without image support" note: rely on `figma_node`/`figma_css`/`figma_text` and say the image was not viewed.

**Checkpoint**: The skill alone already prevents blind retries and hallucination when the plugin is disconnected.

---

## Phase 4: User Story 2 - Agent finds the right node cheaply (Priority: P1)

**Goal**: Cheapest-first lookup, shallow reads, a complete tool catalogue that matches the server, and a CLI fallback (FR-005, FR-006, FR-007, FR-009, FR-012).

**Independent Test**: Quickstart V4. In a multi-page file, "describe the Settings screen" shows lookups before any `figma_node`/`figma_view`, and depth ≤ 2 first.

### Tests for User Story 2

- [X] T013 [P] [US2] In `test/skill.test.mjs` add the drift test (research R7): import `mcpCommands` from `bridge/lib/commands.mjs`; the set of `### figma_<name>` headings in `references/tools.md` equals `mcpCommands().map(c => 'figma_' + c.name)`; no heading names a `local` command
- [X] T014 [P] [US2] In `test/skill.test.mjs` add the test "every figma_* token is a real tool": scan all 4 skill files for `/\bfigma_[a-z]+\b/g` and assert each token is in the MCP tool set. Exclude the substring `figma_bridge` or the package name if it appears.

### Implementation for User Story 2

- [X] T015 [US2] Write `skills/figma-bridge/references/tools.md`: an intro with a cost legend (cheap / medium / expensive, research R5), then one `### figma_<name>` entry for each of the 21 MCP tools in `bridge/lib/commands.mjs` order (`ping, pages, index, screens, find, node, selection, sets, components, variables, styles, css, text, svg, png, view, select, capture, dump, icons, health`). Each entry has the fields from [data-model.md](./data-model.md) §ToolEntry: CLI equivalent, what it answers, cost, use when, key args with recommended defaults (`node`/`selection` depth 2 first; `find` limit ≤ 20 when locating; `view` maxEdge default 1568; `select` is navigation only; `dump` is an alias of `capture`). ≤ 300 lines.
- [X] T016 [US2] Write the `## Find the node` section in `skills/figma-bridge/SKILL.md`: the ladder `figma_pages → figma_index | figma_screens | figma_find → figma_node (depth 2) / figma_css / figma_text → figma_view / figma_svg / figma_png`; `page: "*"` to search all pages, `/regex/i` queries, and widening an empty search (all pages, regex, drop the type filter) before saying "not found"; ambiguous matches: list name, page and size, then ask, or pick the obvious one and say which; node id normalisation (`node-id=12-345` in a URL → `12:345`); tall screens: `figma_view` returns child ids, so view sections instead; vector geometry comes from `figma_svg`, not from `figma_node`.
- [X] T017 [US2] Write the `## Without MCP tools` section in `skills/figma-bridge/SKILL.md`: mapping `figma_<name>` ⇔ `npx @ubuligan/figma-bridge <name>` (same args as `--flags`, the id positional), `-o file` to save (`.png`/`.svg` write the artefact itself), stdout is JSON and stderr is progress, exit codes `0`/`1`/`2`, `figma-bridge <name> --help`; the command starts the relay itself if needed.

**Checkpoint**: US1 + US2 make a usable MVP skill: safe start plus efficient reading.

---

## Phase 5: User Story 3 - Agent completes common design-to-code workflows (Priority: P2)

**Goal**: Recipes for describe-screen, design-tokens-css, build-component, capture-page and export-icons (FR-008).

**Independent Test**: Quickstart V5 steps 1–3. Values in the output match Figma (spot-check ≥ 95 %).

### Tests for User Story 3

- [X] T018 [P] [US3] In `test/skill.test.mjs` add the test "workflows has every recipe": `references/workflows.md` has `##` headings for the 5 recipe goals from [data-model.md](./data-model.md) §WorkflowRecipe, and each recipe section contains `Steps`, `Output` and `Fallback` labels

### Implementation for User Story 3

- [X] T019 [US3] Write `skills/figma-bridge/references/workflows.md` with the 5 recipes. Each has 2–3 trigger phrases, ordered steps naming the `figma_*` tool and why, the output, and at least one fallback. Step 1 is always "connection check if not done yet". Grounding rule: values come from tool output, never estimated from the image alone.
  - **Describe a screen**: locate → `figma_view` → `figma_node` depth 2 → `figma_text`; describe layout, hierarchy, text and states; tall screen → view sections.
  - **Design tokens as CSS variables**: `figma_variables` (resolve aliases, one `:root` block for the default mode plus `[data-theme="<mode>"]` blocks for other modes; kebab-case names derived from `Collection/Group/Name`; keep a comment with the original Figma name); no variables → `figma_styles`; neither → collect values from `figma_css` of key nodes and say so; check the project for an existing tokens file and match its format.
  - **Build a component from a node**: `figma_view` + `figma_node` (depth 2–3) + `figma_css` + `figma_text`; for a component set, `figma_sets` for the variant axes → props; follow the project's stack and conventions (detect the framework and styling from the repo); reuse existing tokens; icons via `figma_svg`; finish with a short list of values that could not be matched.
  - **Capture a page into the project**: `figma_capture` with `page` (and `previews: false` if images are not needed); output goes to `figma-bridge-out/` inside the output root; summarise the files written; for big files, prefer capturing one page.
  - **Export icons**: `figma_icons` with `page`/`match` (or `map`); output to `figma-bridge-out/svg`; single icon → `figma_svg` with `-o`.
  ≤ 300 lines.
- [X] T020 [US3] Write the `## What to do for…` section in `skills/figma-bridge/SKILL.md`: a table `User wants | Tool sequence | Details`, with rows for: is Figma connected; what is selected (`figma_selection`, depth 2); list pages/screens; find X; describe screen; tokens → CSS; build component; capture page; export icons/assets; jump to a node in Figma (`figma_select`). Workflow rows link to `references/workflows.md#…` anchors.
- [X] T021 [US3] Write the `## More` section in `skills/figma-bridge/SKILL.md`: one line each linking `references/tools.md`, `references/workflows.md`, `references/troubleshooting.md`, and saying when to open them. Then confirm `SKILL.md` is ≤ 200 lines (trim prose into references if over).

**Checkpoint**: The skill covers the full design-to-code loop. Run `node --test test/skill.test.mjs`.

---

## Phase 6: User Story 4 - Developer installs the skill in their agent (Priority: P2)

**Goal**: One-command install/update, a Claude Code plugin marketplace, README docs and marketplace listing copy (FR-013, FR-014, FR-015).

**Independent Test**: Quickstart V2 (CLI) and V6 (plugin). On a clean machine the skill appears in Claude Code and is used on the next Figma prompt.

### Tests for User Story 4

- [X] T022 [P] [US4] Create `test/skill-files.test.mjs` for `bridge/lib/skill-files.mjs` (per [contracts/cli-skill.md](./contracts/cli-skill.md)): `resolveTarget()` default → `<homedir>/.claude/skills/figma-bridge`, `{ project: true, cwd }` → `<cwd>/.claude/skills/figma-bridge`, `{ dir }` → `<resolve(dir)>/figma-bridge`, `{ dir, project }` → throws `UsageError`; `install({ dir: tmp })` copies 4 files that are byte-identical to the sources and keeps an unrelated existing file; re-install overwrites a modified `SKILL.md`; `skillPath()` returns the `SKILL.md` path when complete and throws `BridgeError` mentioning `skill install` when a file is missing; `installedSkill()` returns null instead of throwing. Use `fs.mkdtemp(os.tmpdir())` and clean up.
- [X] T023 [P] [US4] In `test/commands.test.mjs`: add `'skill'` to the list asserted absent from `mcpCommands()` (line ~45) and assert `positionals(byName('skill'))` deep-equals `['action']`
- [X] T024 [P] [US4] In `test/cli.test.mjs` add the test "skill install / path", modelled on the existing "plugin install / path" test (line ~112): `skill install --dir <tmp>` exits 0 and stdout ends with `figma-bridge/SKILL.md`; `skill path --dir <tmp>` prints the same path; `skill path --dir <empty>` exits 1 and stderr matches `/skill install/`; `skill install --project --dir x` exits 2; `skill wobble` exits 2 with the unknown-action message; `setup` stdout contains `skill:`
- [X] T025 [P] [US4] Create `test/claude-plugin.test.mjs`: `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` parse as JSON; `plugin.json` `name` is `figma-bridge` and `version` equals `package.json#version`; `mcpServers['figma-bridge'].args` includes `@ubuligan/figma-bridge` and `mcp`; `marketplace.json.plugins[0]` has `name: 'figma-bridge'` and `source: './'`

### Implementation for User Story 4

- [X] T026 [US4] Create `bridge/lib/skill-files.mjs` (`// @ts-check`, modelled on `bridge/lib/plugin-files.mjs`): `SOURCE = new URL('../../skills/figma-bridge/', import.meta.url)`; `FILES` = the 4 relative paths; export `defaultSkillsRoot()` (`path.join(os.homedir(), '.claude', 'skills')`), `resolveTarget({ dir, project, cwd = process.cwd() })` (throws `UsageError` when both `dir` and `project` are set), `install(o)` (mkdir recursive for the target and `references/`, copyFile each, return `{ dir, skill }`), `skillPath(o)` (throws `BridgeError` with `Skill not installed in <dir>. Run: ${NPX} skill install`, kind `'bad'`), `installedSkill(o)` (null on error). Import `UsageError`/`BridgeError` from `./errors.mjs` and `NPX` from `./protocol.mjs`.
- [X] T027 [US4] Add the `skill` entry to `COMMANDS` in `bridge/lib/commands.mjs` directly after `plugin`, exactly as in [contracts/cli-skill.md](./contracts/cli-skill.md) §Registry entry (`where: 'local'`, args `action` positional required, `project` boolean default false, `dir` string)
- [X] T028 [US4] Add the `skill` handler in `bridge/cli.mjs` next to the `plugin install | path` block (~line 136): import `install as installSkill, skillPath` from `./lib/skill-files.mjs`; `install` → `err('✓ skill files in <dir>')`, `out(<dir>/SKILL.md)`, `err('Restart your agent (or start a new session) to load it.')`; `path` → `out(skillPath(...))`; any other action → `UsageError('skill: unknown action \`x\` — use \`install\` or \`path\`.')`. Pass `{ dir: args.dir, project: args.project }`.
- [X] T029 [US4] Update `setupReport()` in `bridge/lib/tasks.mjs`: import `installedSkill`; after the `plugin:` line add `skill:   installed → <path>` or `skill:   not installed (optional) — ${NPX} skill install`; add step `  5. (optional) ${NPX} skill install, so your agent knows how to use these tools` (or mark it `(done)`)
- [X] T030 [P] [US4] Create `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` with the shapes in [contracts/distribution.md](./contracts/distribution.md) §2 (version `1.1.0`). Before finalising, check the field names against the current Claude Code plugin documentation (quickstart V6) and adjust both the files and T025 if the schema differs.
- [X] T031 [P] [US4] Create `docs/skill-listing.md` with the headings from [contracts/distribution.md](./contracts/distribution.md) §3: Title "figma-bridge — read live Figma files from your AI agent"; Tagline ≤ 120 characters; Description; Requirements (Figma desktop, Node 22.12+, plugin, MCP server or CLI); 5 example prompts (from the README "What you can ask Claude"); Privacy; License MIT / Price Free; Links (GitHub, npm `@ubuligan/figma-bridge`); Install (Claude plugin marketplace, `npx @ubuligan/figma-bridge skill install`, manual copy of `skills/figma-bridge/` or `--dir`)
- [X] T032 [US4] Update `README.md`: add a `## Agent skill` section after "What you can ask Claude", with one sentence on what it does, the three install paths (Claude plugin `/plugin marketplace add javidselimov/figma-bridge` + `/plugin install figma-bridge`; `npx @ubuligan/figma-bridge skill install [--project]`; manual copy or `--dir <agent skills folder>`), an "other agents" table per research R8 (Claude Code tested; other rows only after quickstart V7 confirms them, otherwise a single "check your agent's docs for its skills folder" line), and "re-run `skill install` after updating"; change the setup-commands line to `setup`, `plugin install|path`, `skill install|path`, `serve`, `mcp`; in "Updating", mention re-running `skill install`

**Checkpoint**: `npm test` is green including `pack.test.mjs`, since all skill files now exist.

---

## Phase 7: User Story 5 - Agent respects safety boundaries (Priority: P3)

**Goal**: The agent never claims to edit Figma, explains the output-root restriction and states the privacy boundary (FR-010).

**Independent Test**: Quickstart V5 step 4. "Change the button colour in Figma" is declined with an alternative; "save to my home folder" gets the restriction explained.

### Tests for User Story 5

- [X] T033 [P] [US5] In `test/skill.test.mjs` add the test "no promise to modify the document": none of the 4 files contains (case-insensitive) `edit the design`, `modify the figma file`, `write to figma`, `update the figma file`, `change the design in figma` outside a sentence that also contains `cannot` or `can't` or `read-only` (check per line)

### Implementation for User Story 5

- [X] T034 [US5] Add a "When the user asks to…" block at the end of `## Constraints` in `skills/figma-bridge/SKILL.md`: change the design → say the bridge is read-only and offer code or a list of changes to make by hand; save outside the project → explain the output root and `FIGMA_BRIDGE_ROOT`; "is my design sent anywhere?" → design data moves only between Figma desktop, the local relay on 127.0.0.1 and this agent, plus whatever the agent sends to its own model provider. Keep `SKILL.md` ≤ 200 lines.

**Checkpoint**: All 5 stories done. `npm test` green.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T035 [P] Add a `## 1.1.0` entry to `CHANGELOG.md`: Added the agent skill (`skills/figma-bridge/`), the `figma-bridge skill install|path` command, the Claude Code plugin marketplace (`.claude-plugin/`) and the setup report skill line
- [X] T036 [P] Amend `specs/001-npm-figma-bridge/contracts/package-surface.md`: the `files` array, the new allow-list entries, version 1.1.0 and a link to `specs/002-figma-bridge-agent-skill/contracts/distribution.md`
- [X] T037 [P] Extend the MCP `instructions` string in `bridge/mcp.mjs` (~line 139) with one sentence: "Call figma_ping first; if it fails, the plugin is not running in Figma desktop." Update `test/mcp.test.mjs` if it asserts the exact text.
- [X] T038 Run `npm test` and `npm run check:pack` (quickstart V1); fix any failures; confirm `pack OK` lists the 5 new files and no `.claude-plugin/` or `docs/` files
- [ ] T039 Manual validation, quickstart V2–V5 in Claude Code against the sample Figma file; record pass/fail for SC-001–SC-004 in `specs/002-figma-bridge-agent-skill/checklists/validation.md`
- [ ] T040 Release verification, quickstart V6 (Claude plugin install, including Windows) and V7 (other-agent folders); update `README.md`, `docs/skill-listing.md` and `.claude-plugin/plugin.json` with the findings; record the results in `specs/002-figma-bridge-agent-skill/checklists/validation.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none
- **Foundational (Phase 2)**: after Setup; blocks all stories (skeleton + test harness)
- **US1 (Phase 3)** and **US2 (Phase 4)**: after Foundational; independent of each other (different sections and files)
- **US3 (Phase 5)**: after Foundational; links into `tools.md` content but does not need it for its tests. Best done after US2 so recipes reference the final tool notes.
- **US4 (Phase 6)**: after Foundational (it only copies the files that exist); `pack.test.mjs` goes green only once US1–US3 files have content, because they already exist as stubs from T005
- **US5 (Phase 7)**: after US1 (extends `## Constraints`)
- **Polish (Phase 8)**: after all stories

### User Story Dependencies

- US1 ⟂ US2 ⟂ US4 (parallel-safe)
- US3 → soft-depends on US2 (tool notes)
- US5 → depends on US1 (same section)

### Within Each Story

- Tests first (they fail), then implementation, then the checkpoint run
- Edits to `skills/figma-bridge/SKILL.md` are sequential across stories (single file): T010 → T011 → T016 → T017 → T020 → T021 → T034
- Edits to `test/skill.test.mjs` are sequential (single file): T007 → T008/T009 → T013/T014 → T018 → T033. The [P] markers on those test tasks mean parallel *with other files*, not with each other.

### Parallel Opportunities

- T003 ∥ T002
- US1 `troubleshooting.md` (T012) ∥ US2 `tools.md` (T015) ∥ US3 `workflows.md` (T019): three different files
- In US4: T022, T023, T024, T025 in parallel (different test files); T030 ∥ T031 ∥ T026
- Polish: T035 ∥ T036 ∥ T037

---

## Parallel Example: User Story 4

```text
# Tests together (different files):
T022 test/skill-files.test.mjs
T023 test/commands.test.mjs
T024 test/cli.test.mjs
T025 test/claude-plugin.test.mjs

# Then implementation (independent files together):
T026 bridge/lib/skill-files.mjs
T030 .claude-plugin/*.json
T031 docs/skill-listing.md
# followed by T027 → T028 → T029 (registry → CLI → setup), then T032 README
```

## Parallel Example: Content (US1–US3)

```text
T012 skills/figma-bridge/references/troubleshooting.md
T015 skills/figma-bridge/references/tools.md
T019 skills/figma-bridge/references/workflows.md
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phase 1 + Phase 2
2. Phase 3 (US1) → validate with quickstart V3
3. Phase 4 (US2) → validate with quickstart V4
4. **STOP**: the skill can already be copied by hand into `~/.claude/skills/` and used

### Incremental Delivery

1. MVP (US1 + US2) → manual copy works
2. + US3 → design-to-code recipes
3. + US4 → `skill install`, Claude plugin, README, listing → **publish 1.1.0 and submit the listing**
4. + US5 → safety wording hardened (small; can ship with step 3)
5. Polish → release verification V6/V7

### Notes

- Content tasks (T010–T021, T034) are writing tasks: base every fact on `bridge/lib/commands.mjs`, `README.md` and `bridge/mcp.mjs`, not on memory.
- Commit after each phase checkpoint.
