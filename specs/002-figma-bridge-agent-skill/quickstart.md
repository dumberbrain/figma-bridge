# Quickstart / Validation: figma-bridge Agent Skill

## Prerequisites

- Node ≥ 22.12, Figma desktop, a sample file with ≥ 3 pages, ≥ 1 variable collection with 2
  modes, a component set and one tall screen.
- Plugin installed and imported (`npx @ubuligan/figma-bridge plugin install`).
- Claude Code with the MCP server registered (README step 3).

## V1 — Automated checks

```sh
npm test            # includes skill.test.mjs, skill-files.test.mjs, pack.test.mjs
npm run check:pack  # "pack OK (<n> files)" with 4 skill files + skill-files.mjs
```

Expected: all green on the CI matrix (3 OS × Node 22/24). The drift check fails if a command is
added to `commands.mjs` without a `### figma_<name>` entry ([skill-package.md](./contracts/skill-package.md)).

## V2 — Install command

```sh
node bin/figma-bridge.mjs skill install --dir ./tmp-skills   # prints ./tmp-skills/figma-bridge/SKILL.md
node bin/figma-bridge.mjs skill path --dir ./tmp-skills      # same path, exit 0
node bin/figma-bridge.mjs skill path --dir ./nowhere         # exit 1, hint to install
node bin/figma-bridge.mjs skill install --project --dir x    # exit 2
node bin/figma-bridge.mjs setup                              # shows "skill:" line
```

See [cli-skill.md](./contracts/cli-skill.md) for the exact output.

## V3 — Connection handling (US1, SC-001)

Plugin window **closed**. In a new Claude Code session with the skill installed: "Show me the
Login screen". Expected: the first tool call is `figma_ping` or `figma_health`; the reply says
the plugin is not connected and gives the Figma menu path. No other tools are called. Repeat
×10 with varied wording; ≥ 9 pass.

## V4 — Cheapest-first (US2, SC-002, SC-003)

Plugin open. "Describe the Settings screen". Expected tool order: `figma_ping` →
`figma_screens`/`figma_find` → `figma_view` and/or `figma_node` (depth ≤ 2) → optional
`figma_text`/`figma_css`. Compare the context tokens used with the same prompt with the skill
removed: ≥ 40 % less. Then test the tall screen: the agent views child sections by id.

## V5 — Workflows (US3, SC-004)

1. "Give me the colour and spacing tokens as CSS variables": light/dark modes produce two
   blocks; spot-check 20 values against Figma, ≥ 19 match.
2. "Build the primary Button as a React component" (in a React project): uses `figma_css` +
   `figma_text` + `figma_view`, reuses tokens from step 1.
3. "Capture the Design System page": files appear under `figma-bridge-out/`; the agent
   summarises them.
4. "Change the button colour in Figma": the agent declines (read-only) and offers code (US5).

## V6 — Claude Code plugin (verify before release)

Check the `.claude-plugin/*.json` field names against the current Claude Code plugin docs. Then:

```
/plugin marketplace add <local path or javidselimov/figma-bridge>
/plugin install figma-bridge
```

Expected: the skill is listed and the `figma-bridge` MCP server starts. Test on Windows: if
`npx` fails without `cmd /c`, document the manual path as the Windows route.

## V7 — Other agents (verify before publishing the table)

For each row in the README "other agents" table, confirm the skills folder in that agent's
current docs, run `skill install --dir <folder>`, and check that the agent picks the skill up on
a Figma prompt. Remove rows that cannot be confirmed.

## V8 — First-time user (SC-005)

On a clean machine, follow only `docs/skill-listing.md` → working answer. Time it: < 10 min.
