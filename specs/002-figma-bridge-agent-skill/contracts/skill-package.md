# Contract: Skill package (`skills/figma-bridge/`)

Pinned by `test/skill.test.mjs`. Renaming the skill or removing a reference file is a semver
major event; adding content is a patch/minor event.

## Files

```
skills/figma-bridge/SKILL.md
skills/figma-bridge/references/tools.md
skills/figma-bridge/references/workflows.md
skills/figma-bridge/references/troubleshooting.md
```

## SKILL.md front matter

```yaml
---
name: figma-bridge
description: >-
  Read the Figma file open in Figma desktop through the local figma-bridge MCP server
  (figma_* tools) or CLI. Use when the user mentions Figma, a design file, a screen, frame,
  page or component, design tokens or variables, or asks to turn a design into code.
  Read-only, local, no API token.
---
```

- `name` == folder name, `^[a-z0-9-]{1,64}$`.
- `description` 1–1024 characters, contains "Figma".
- No other keys required. Unknown keys are allowed, but the test does not rely on them.

## SKILL.md body: required sections (in order)

1. `## Constraints`: read-only towards the document (only `figma_select` moves the view); no
   API token or paid plan; runs on this machine only; files are written only inside the output
   root; Figma **desktop** with the plugin window open.
2. `## Rules`: connection check first (`figma_ping`, or `figma_health` if ping fails); never
   invent values; cheapest first; shallow first; read saved-to-file answers only partly.
3. `## Find the node`: lookup ladder `pages → index | screens | find → node/css/text → view/svg/png`,
   node-id normalisation, how to handle ambiguous results.
4. `## What to do for…`: decision table from request to tool sequence to reference link.
5. `## Without MCP tools`: CLI mapping `figma_<name>` ⇔ `npx @ubuligan/figma-bridge <name>`,
   `-o` for files, exit codes.
6. `## More`: links to the three references.

## Content rules

- Every `figma_\w+` token names a tool in `mcpCommands()`.
- `references/tools.md` has exactly one `### figma_<name>` heading per MCP tool, and none for
  local commands.
- All relative links resolve to one of the four files.
- `SKILL.md` ≤ 200 lines; each reference ≤ 300 lines.
- No private-project words (list in `scripts/check-pack.mjs#FORBIDDEN`).
- No promise to modify the document (deny-list phrases in the test).
- Tool-agnostic wording: say "the agent" and "the user"; Claude-specific notes are allowed only
  in clearly labelled lines.
