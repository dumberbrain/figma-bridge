# Tools

Back to [SKILL.md](../SKILL.md). Every MCP tool `figma_<name>` is also the CLI command
`npx @ubuligan/figma-bridge <name>`; arguments become `--flags` and the id is positional.

Cost legend: **cheap** = small answer, use freely; **medium** = can be large, scope it;
**expensive** = large or slow, use only on the node or page you need.

## Orientation

### figma_ping

- CLI: `figma-bridge ping`
- Answers: which file and page the plugin is on, and what is selected.
- Cost: cheap
- Use when: first call in a conversation, and after any connection error.

### figma_health

- CLI: `figma-bridge health`
- Answers: whether the relay is up, whether the plugin is connected, and what is queued. Never
  touches Figma.
- Cost: cheap
- Use when: `figma_ping` failed and you need to know which half is missing.

### figma_pages

- CLI: `figma-bridge pages`
- Answers: every page with its id.
- Cost: cheap
- Use when: the user names a page, or you need page ids for other calls.

## Locating

### figma_index

- CLI: `figma-bridge index [--page <name|id>]`
- Answers: the top-level nodes of a page (default: the current page).
- Cost: cheap
- Use when: you need ids on one page and the page is not mostly screens.

### figma_screens

- CLI: `figma-bridge screens [--page <name|id|"*">]`
- Answers: every screen (a frame, component or instance placed on the page or directly in a
  section) with its id, page and size.
- Cost: cheap
- Use when: the user refers to a screen by name; `page: "*"` covers the whole file.

### figma_find

- CLI: `figma-bridge find <query> [--type T1,T2] [--page P] [--limit N]`
- Answers: nodes whose name matches a substring or `/regex/i`, optionally filtered by type.
- Cost: cheap (with a limit)
- Use when: locating a named element anywhere.
- Key args: `limit` ≤ 20 when only locating (server default 200); `page: "*"` for all pages.

### figma_sets

- CLI: `figma-bridge sets [--page P]`
- Answers: component sets with their variant axes and variant ids.
- Cost: cheap
- Use when: building a component with variants (axes → props).

### figma_components

- CLI: `figma-bridge components [--page P]`
- Answers: every component with its publish key and parent set.
- Cost: cheap
- Use when: mapping design components to code components.

## Reading

### figma_node

- CLI: `figma-bridge node <id[,id…]> [--depth N]`
- Answers: the node in the exact shape of the REST `GET /v1/files/:key/nodes` response.
- Cost: medium at depth ≤ 2, expensive deeper
- Use when: you need structure: layout, auto-layout, fills, constraints, children.
- Key args: start at `depth: 2` (server default 5; `1` = the node without children); go deeper
  on one child id only. Several ids are allowed, separated by commas.

### figma_selection

- CLI: `figma-bridge selection [--depth N]`
- Answers: the same as `figma_node`, for whatever is selected in Figma.
- Cost: medium at depth ≤ 2
- Use when: the user says "this", "the selected frame" or "what I have selected".
- Key args: `depth: 2` first.

### figma_css

- CLI: `figma-bridge css <id>`
- Answers: Figma's own computed CSS for a node: padding, radius, type, colour.
- Cost: medium
- Use when: writing styles for a component. Prefer it to deriving CSS from `figma_node`.

### figma_text

- CLI: `figma-bridge text <id>`
- Answers: every text layer under a node, with its characters and type style.
- Cost: medium
- Use when: you need the exact copy and typography of a screen or component.

### figma_variables

- CLI: `figma-bridge variables`
- Answers: variable collections, modes and values, with aliases resolved.
- Cost: medium (whole file)
- Use when: design tokens, theming, light/dark modes.

### figma_styles

- CLI: `figma-bridge styles`
- Answers: local paint, text, effect and grid styles with their values.
- Cost: cheap
- Use when: the file has no variables, or you need text/effect styles.

## Seeing and exporting

### figma_view

- CLI: `figma-bridge view <id> [--maxEdge N] -o shot.png`
- Answers: the node as an image scaled so its longest edge fits `maxEdge` (default 1568), plus
  its children's ids.
- Cost: medium
- Use when: you need to *see* a design: describing, checking a match, confirming a search.
- Key args: keep the default; for tall screens, view child sections by id instead.

### figma_png

- CLI: `figma-bridge png <id> [--scale N] [--maxEdge N] -o file.png`
- Answers: a PNG export (base64 in JSON; the CLI writes the file with `-o *.png`).
- Cost: expensive
- Use when: the user wants an image asset in the project. Use `figma_view` just to look.
- Key args: `scale` default 2; `maxEdge` caps the size.

### figma_svg

- CLI: `figma-bridge svg <id> [--outlineText] -o file.svg`
- Answers: SVG markup for a node.
- Cost: expensive for big nodes, cheap for icons
- Use when: icons, illustrations, any vector geometry.
- Key args: `outlineText: true` converts text to paths.

### figma_icons

- CLI: `figma-bridge icons [--page P] [--match M] [--map icon-map.json] [--out dir]`
- Answers: writes one `.svg` per icon component (default folder `figma-bridge-out/svg`).
- Cost: expensive
- Use when: exporting an icon set. Narrow it with `page` / `match`.

### figma_capture

- CLI: `figma-bridge capture [--page P] [--out dir] [--depth N] [--previews false]`
- Answers: writes variables, styles, component sets, the screen list and one preview PNG per
  screen into a folder (default `figma-bridge-out/`), and returns a summary.
- Cost: expensive (minutes on big files)
- Use when: the user wants the design captured into the project for later work.
- Key args: capture one `page` rather than the whole file; `previews: false` skips the PNGs.

### figma_dump

- CLI: `figma-bridge dump …`
- Answers: alias of `figma_capture`, with the same arguments.
- Cost: expensive
- Use when: never needed; prefer `figma_capture`.

## Navigation

### figma_select

- CLI: `figma-bridge select <id>`
- Answers: moves Figma to the node: switches page, selects it and zooms to it. The file
  content stays the same.
- Cost: cheap
- Use when: the user asks to be shown a node in Figma.
