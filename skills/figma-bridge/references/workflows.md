# Workflows

Back to [SKILL.md](../SKILL.md). Every recipe starts with a connection check (`figma_ping`)
unless one already succeeded in this conversation. Values come from tool output; never estimate
a colour, size or font from the image alone.

## Describe a screen

Triggers: "Show me the Login screen", "Describe the checkout layout", "What's on this frame?"

**Steps**

1. Locate the screen: `figma_screens` (add `page: "*"` if it is not on the current page) or
   `figma_find`. For "this" or "selected", use `figma_selection` instead.
2. `figma_view`: see it.
3. `figma_node` with `depth: 2`: regions, auto-layout direction, spacing and sizes.
4. `figma_text`: the exact copy and type styles.
5. Go deeper (`figma_node` on one child, or `figma_view` on a section) only where the user
   asks.

**Output**: a structured description: purpose, layout regions top to bottom, key components
and states, text content, notable values (colours, spacing, type) taken from the tool output.

**Fallback**: tall screen → view the child sections listed by `figma_view`. No image support →
describe from `figma_node` and `figma_text`, and say the image was not viewed.

## Design tokens as CSS variables

Triggers: "Give me the colours as CSS variables", "Export the design tokens", "Make a theme
file from Figma".

**Steps**

1. `figma_variables`: collections, modes and resolved values.
2. Look in the project for an existing tokens file (CSS custom properties, Tailwind theme,
   SCSS map, JS object). Match its format and naming if there is one.
3. Name each token in kebab-case from its Figma path: `Colors/Brand/Primary` →
   `--colors-brand-primary`. Put the original Figma name in a comment, so the token can be
   traced back.
4. Modes: write the default mode in `:root { … }` and every other mode in
   `[data-theme="<mode>"] { … }` (for example `dark`). Use the project's theming convention if
   it has one.
5. Aliases: keep the reference (`var(--colors-blue-500)`) when both tokens are exported;
   otherwise use the resolved value.
6. Add `figma_styles` for text, effect and grid styles that variables do not cover (font
   shorthand, shadows).

**Output**: a CSS file (or an edit to the project's tokens file) and a short summary: number of
tokens per collection, the modes, and anything skipped.

**Fallback**: no variables → build tokens from `figma_styles`. Neither → collect repeated
values from `figma_css` of key components and say that the tokens were inferred, not defined
in Figma.

## Build a component from a node

Triggers: "Build the primary Button", "Turn node 12:345 into a React component", "Implement
this card".

**Steps**

1. Locate the node (for a component set, `figma_sets` gives the variant axes and ids).
2. `figma_view`: see it, and each important variant.
3. `figma_node` with `depth: 2`–`3`: structure, auto-layout, sizing.
4. `figma_css`: Figma's computed CSS for the root and the key children.
5. `figma_text`: copy and typography.
6. Icons inside it → `figma_svg` (save inside the project with `-o` on the CLI, or write the
   returned markup).
7. Write the component in the project's existing stack and conventions (framework, styling,
   file layout). Map variant axes to props. Use existing tokens or variables where a value
   matches; do not hard-code a value that has a token.
8. Compare: `figma_view` again, and check the code against it.

**Output**: the component file(s), plus a short list of values with no matching token and any
details that could not be read.

**Fallback**: `figma_css` empty for a node type → derive from `figma_node` fills, strokes,
padding and radius. Unknown stack → ask the user, or write plain HTML and CSS.

## Capture a page into the project

Triggers: "Capture the Design System page", "Save the whole file for reference", "Dump the
screens into the repo".

**Steps**

1. `figma_pages` to confirm the page name.
2. `figma_capture` with `page: "<name>"`. Use `previews: false` if images are not needed;
   `depth` (default 5) sets how deep each component set is serialised.
3. Wait: big pages can take minutes.

**Output**: files inside the output root (default `figma-bridge-out/`): variables, styles,
component sets, the screen list and one preview PNG per screen. Tell the user what was written
and where, and suggest adding `figma-bridge-out/` to `.gitignore`.

**Fallback**: the whole file is too big or slow → capture page by page. "Refusing to write
outside …" → use a folder inside the project (see [troubleshooting](troubleshooting.md)).

## Export icons

Triggers: "Export all icons as SVG", "Get the calendar icon", "Download the icon set".

**Steps**

1. Find the icons: `figma_find` with `type: "COMPONENT"` and a name pattern, or the page that
   holds them.
2. Many icons → `figma_icons` with `page` and/or `match` (or `map` with an `icon-map.json`).
3. One icon → `figma_svg` for its id.

**Output**: `.svg` files, by default in `figma-bridge-out/svg`, named after the components (or
the map). Report the count and the folder.

**Fallback**: no icon components → export the frames that hold them with `figma_svg`. Text in
an icon → `outlineText: true`.
