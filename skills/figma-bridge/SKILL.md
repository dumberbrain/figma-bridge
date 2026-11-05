---
name: figma-bridge
description: >-
  Read the Figma file open in Figma desktop through the local figma-bridge MCP server
  (figma_* tools) or its CLI. Use when the user mentions Figma, a design file, a screen,
  frame, page or component, design tokens or variables, or asks to turn a design into code.
  Read-only, local, no API token.
---

# figma-bridge

figma-bridge connects the agent to the file the user has open in Figma desktop: a Figma
plugin talks to a local relay, and the relay serves the `figma_*` MCP tools and the
`figma-bridge` CLI. Use it to list pages and screens, see a screen as an image, and read
structure, variables, styles, CSS and text.

## Constraints

- **Read-only.** Nothing in the document can be created, edited or deleted. The only call
  with a visible effect is `figma_select`, which moves Figma's page, selection and zoom.
- **No API token, no paid plan, no rate limit.** It reads the open file through the plugin.
- **Local only.** The relay listens on 127.0.0.1; design data moves between Figma desktop,
  the relay and this agent.
- **Files land in the output root only**: the folder the agent or CLI started in, or
  `FIGMA_BRIDGE_ROOT`. Default folder: `figma-bridge-out/`. Paths outside it are refused.
- **Figma desktop**, with the figma-bridge plugin window **open** for as long as you work.

When the user asks to…

- *change something in Figma*: say the bridge is read-only and cannot change the file.
  Offer code, or a list of changes they can make by hand.
- *save outside the project*: explain the output root; they can set `FIGMA_BRIDGE_ROOT`
  when registering the server.
- *know whether the design leaves the machine*: it moves only between Figma desktop, the local
  relay and this agent, plus whatever the agent itself sends to its model provider.

## Rules

1. **Check the connection first.** Before the first Figma read in a conversation, and again
   after any "not connected" or "plugin closed" error, call `figma_ping`. It names the file,
   the page and the selection; tell the user which file you are reading. If it fails, call
   `figma_health` and follow [troubleshooting](references/troubleshooting.md). Do not retry
   blindly or work around a missing plugin.
2. **Never invent design values.** Colours, sizes, spacing, fonts and text come from tool
   output. If something could not be read, say so instead of estimating it from an image.
3. **Cheapest first.** Locate before you read: see [Find the node](#find-the-node).
4. **Shallow first.** Start `figma_node` / `figma_selection` at `depth: 2`; go deeper only on
   the child you need.
5. **Big answers are saved to a file.** An answer over ~64 kB comes back as a path inside
   `figma-bridge-out/` plus an outline. Read only the part you need from that file.
6. **No `figma_*` tools?** Use the CLI ([Without MCP tools](#without-mcp-tools)), or tell
   the user how to register the server (see [troubleshooting](references/troubleshooting.md)).

## Find the node

Go down this ladder and stop as soon as you have the id:

1. `figma_pages`: page names and ids.
2. `figma_screens` (frames, components and instances that act as screens, with size),
   `figma_index` (top-level nodes of one page), or `figma_find` (search by name).
   - `page: "*"` searches the whole document; the default is the current page.
   - `figma_find` takes a substring or `/regex/i`, an optional `type`
     (`FRAME,COMPONENT,COMPONENT_SET,INSTANCE,TEXT…`), and `limit` (use ≤ 20 when locating).
   - No hits: widen before giving up (all pages, regex, drop `type`).
   - Several hits: show name, page and size and ask, or pick the obvious one and say which.
3. Read the node: `figma_node` (structure, `depth: 2` first), `figma_css` (Figma's computed
   CSS), `figma_text` (every text layer with its style).
4. Look at it: `figma_view` (image, longest edge 1568 px), or export it with `figma_svg` /
   `figma_png`.

Ids:

- Node ids look like `12:345`. In a Figma URL they appear as `node-id=12-345`; convert the
  `-` to `:`.
- `figma_node` accepts several ids separated by commas.
- `figma_selection` reads whatever the user has selected, so when they say "this" or "the
  selected frame", use it instead of searching.

Tall screens: scaled to 1568 px, a long page becomes too narrow to read. `figma_view` lists
the screen's children, so view the sections by id.

Vector geometry is not in `figma_node` output; use `figma_svg`.

## What to do for…

| User wants | Tool sequence | Details |
| --- | --- | --- |
| "Is Figma connected?" | `figma_ping` → (`figma_health` if it fails) | [troubleshooting](references/troubleshooting.md) |
| What is selected | `figma_selection` (`depth: 2`) | |
| Pages / screens | `figma_pages`, `figma_screens` | |
| Find X | `figma_find` → `figma_view` to confirm | [Find the node](#find-the-node) |
| Describe a screen | locate → `figma_view` → `figma_node` → `figma_text` | [recipe](references/workflows.md#describe-a-screen) |
| Tokens as CSS variables | `figma_variables` → `figma_styles` | [recipe](references/workflows.md#design-tokens-as-css-variables) |
| Build a component | `figma_view` + `figma_node` + `figma_css` + `figma_text` (+ `figma_sets`) | [recipe](references/workflows.md#build-a-component-from-a-node) |
| Whole page into the project | `figma_capture` | [recipe](references/workflows.md#capture-a-page-into-the-project) |
| Icons / assets | `figma_icons`, `figma_svg`, `figma_png` | [recipe](references/workflows.md#export-icons) |
| Show a node in Figma | `figma_select` | navigation only |

## Without MCP tools

Every tool is also a CLI command, so an agent that has a shell but no MCP tools can still
use the bridge:

```sh
npx @ubuligan/figma-bridge <name> [id] [--flag value] [-o file]
```

- `figma_screens {page: "*"}` → `npx @ubuligan/figma-bridge screens --page "*"`
- `figma_node {id: "12:345", depth: 2}` → `npx @ubuligan/figma-bridge node 12:345 --depth 2`
- `figma_view {id: "12:345"}` → `npx @ubuligan/figma-bridge view 12:345 -o shot.png`, then
  open the image.
- `-o file` saves the answer; with `.png` / `.svg`, `png`, `svg` and `view` write the image
  itself.
- The answer goes to stdout as JSON and progress goes to stderr. Exit codes: `0` ok,
  `1` failure, `2` usage error.
- `npx @ubuligan/figma-bridge <name> --help` shows the flags.
- A command starts the relay itself if Claude Code or `figma-bridge serve` is not running.

## More

- [references/tools.md](references/tools.md): every tool with its cost, when to use it, and
  recommended arguments. Open it when unsure which tool fits.
- [references/workflows.md](references/workflows.md): step-by-step recipes for describing a
  screen, design tokens, building components, capturing a page and exporting icons.
- [references/troubleshooting.md](references/troubleshooting.md): every error message with
  its fix. Open it when a call fails.
