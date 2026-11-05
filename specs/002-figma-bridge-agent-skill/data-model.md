# Data Model: figma-bridge Agent Skill

There is no runtime data store. The "entities" are documents and their structure, pinned by
tests ([contracts/skill-package.md](./contracts/skill-package.md)).

## SkillPackage

| Field | Type | Rule |
| --- | --- | --- |
| folder | path | `skills/figma-bridge/`; folder name == `name` |
| name | string | `figma-bridge`; `^[a-z0-9-]{1,64}$` |
| description | string | 1–1024 chars; names triggers: Figma, design file, screen/frame, component, design tokens / variables, design to code; says it requires the figma-bridge MCP server or CLI |
| body | Markdown | `SKILL.md` after front matter; ≤ 200 lines total file |
| references | ReferenceFile[] | exactly `tools.md`, `workflows.md`, `troubleshooting.md` |
| version | — | none in the file; the npm package version applies |

Relationships: body links to every reference at least once; references link back only to each
other or `SKILL.md`.

## ReferenceFile

| Field | Type | Rule |
| --- | --- | --- |
| path | path | `references/<name>.md` |
| lines | int | ≤ 300 |
| links | relative links | all resolve inside `skills/figma-bridge/` |

## ToolEntry (in `references/tools.md`)

| Field | Rule |
| --- | --- |
| heading | `### figma_<name>`; set of headings == `mcpCommands()` |
| cli | `figma-bridge <name> …` equivalent |
| answers | one line, from `commands.mjs#summary` in plain words |
| cost | `cheap` / `medium` / `expensive` (research R5) |
| use when | one line |
| key args | the args that matter, with the recommended default if it differs from the server default |

Validation: no heading for a `local` command (`setup`, `plugin`, `skill`, `serve`, `mcp`).

## WorkflowRecipe (in `references/workflows.md`)

| Field | Rule |
| --- | --- |
| goal | one of: describe-screen, design-tokens-css, build-component, capture-page, export-icons |
| trigger phrases | 2–3 example user requests |
| steps | ordered; each names a `figma_*` tool and why; the first step is always "connection check if not done in this conversation" |
| output | what the agent produces and where (files only inside the output root) |
| fallbacks | at least one, e.g. no variables → styles → observed values, with the source stated |
| grounding rule | "values come from tool output; never estimated from the image alone" |

## TroubleshootingEntry (in `references/troubleshooting.md`)

| Field | Rule |
| --- | --- |
| symptom | exact message fragment or observable state |
| cause | one line |
| user action | exact command or Figma menu path |

Required symptoms (FR-004): plugin not connected / closed; plugin older than server / protocol
mismatch; port not available; plugin "waiting for Claude or the CLI"; "Refusing to write
outside …"; tools missing from the agent entirely; plugin open in two files; slow first
cross-page call; stale "connected" up to 45 s.

## InstalledSkill (filesystem state)

| State | Meaning | Produced by |
| --- | --- | --- |
| absent | no `SKILL.md` in target | — |
| installed | all 4 files present in `<root>/figma-bridge/` | `skill install` |
| partial | some files missing | manual deletion → `skill path` reports not installed; `install` repairs |

Transitions: absent → installed (install); installed → installed (re-install after upgrade
overwrites the 4 files, other files untouched); partial → installed (install).

## MarketplaceListing (`docs/skill-listing.md`)

Fields: title, tagline (≤ 120 chars), long description, prerequisites, example prompts (5),
privacy statement, license (MIT), price (Free), links (GitHub, npm), install snippets
(Claude plugin, `skill install`, manual copy).
