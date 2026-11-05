# Feature Specification: figma-bridge Agent Skill

**Feature Branch**: `002-figma-bridge-agent-skill`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Agent skill for figma-bridge: a SKILL.md (plus any supporting files) shipped in this repo that teaches AI agents (Claude Code, Cursor, Copilot, etc.) when and how to use the figma-bridge MCP tools (figma_ping, figma_pages, figma_index, figma_screens, figma_find, figma_node, figma_selection, figma_view, figma_sets, variables/styles/css/text tools). It should cover: detecting/handling a disconnected plugin (ping first, setup guidance), cheapest-first navigation (index/screens/find before node/view), token-efficient reading (depth limits, view maxEdge), common workflows (describe a screen, extract design tokens as CSS variables, build a component from a node, capture a page into the project), and install instructions so it can be listed free on skill marketplaces like Agensi. Read-only, no API token, local-only constraints must be stated."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Agent handles connection state before doing work (Priority: P1)

A developer with the skill installed asks their agent something about the open Figma file
("Show me the Login screen"). Before reading anything, the agent checks that the bridge and the
Figma plugin are connected. If they are not, the agent stops and tells the developer exactly what
to do (open the plugin in Figma desktop, install or update the plugin, register the server,
free or change the port) instead of guessing, retrying blindly or inventing design details.

**Why this priority**: A disconnected plugin is the most common first-run failure. Without this,
every other workflow fails confusingly, and the agent may hallucinate design content.

**Independent Test**: With the plugin window closed, ask the agent a Figma question. It should
report the disconnected state and give the correct next step in one reply, without reading any
other tool.

**Acceptance Scenarios**:

1. **Given** the plugin is closed, **When** the developer asks about a screen, **Then** the agent
   checks connection first, reports "not connected" and tells them to run the plugin in Figma
   desktop and keep its window open.
2. **Given** the plugin is out of date relative to the server, **When** any request is made,
   **Then** the agent tells the developer to reinstall the plugin files and re-run the plugin.
3. **Given** the bridge tools are not available to the agent at all, **When** a Figma question is
   asked, **Then** the agent explains how to register the server for their agent and does not
   fall back to fabricated content.
4. **Given** everything is connected, **When** the developer asks a question, **Then** the agent
   proceeds and names the file and page it is reading.

---

### User Story 2 - Agent finds the right node cheaply (Priority: P1)

The developer refers to a design element by its human name ("the Checkout page", "the primary
button"). The agent locates it using the cheapest lookups first (page list, top-level index,
screen list, name search) and only then fetches full structure or an image of the specific node,
with sensible depth and image-size limits.

**Why this priority**: Full node dumps and images are large. Reading them indiscriminately wastes
the agent's context, slows answers and can exceed limits on large files. This is the core value
the skill adds over raw tool access.

**Independent Test**: In a multi-page file, ask "describe the Settings screen". Inspect the tool
call log: lookups must precede any full dump or image, and only the matched node is fetched.

**Acceptance Scenarios**:

1. **Given** a named screen, **When** the agent looks for it, **Then** it uses list/index/search
   tools before any full node dump or image.
2. **Given** a search returns several matches, **When** the name is ambiguous, **Then** the agent
   shows the candidates (name, page, size) and asks, or picks the obvious one and says which.
3. **Given** a node must be read, **When** the agent fetches its structure, **Then** it starts
   with a shallow depth and goes deeper only on the parts it needs.
4. **Given** a very tall screen, **When** its image is too narrow to read, **Then** the agent
   views child sections by id instead of the whole screen.
5. **Given** an answer was too large and saved to a file, **When** the agent receives a path and
   outline, **Then** it reads only the relevant part of that file.

---

### User Story 3 - Agent completes common design-to-code workflows (Priority: P2)

The developer asks for one of the frequent tasks: describe a screen's layout, export the file's
design tokens as CSS custom properties, build a UI component that matches a node, or capture a
whole page into the project. The agent follows a known, efficient sequence for each and produces
output grounded in the actual file data.

**Why this priority**: These are the outcomes users install the tool for. Recipes make results
consistent across agents, but they depend on Stories 1 and 2 working first.

**Independent Test**: Run each of the four requests against a sample file and compare the result
with the file: values (colours, spacing, type, text) must match the source, not be approximated.

**Acceptance Scenarios**:

1. **Given** "describe the Login screen", **When** the agent answers, **Then** it has viewed the
   screen image and read its structure/text, and its description matches both.
2. **Given** "give me the colour and text tokens as CSS variables", **When** the agent answers,
   **Then** it uses the file's variables (and styles if there are no variables), keeps names
   traceable to Figma, resolves aliases, and handles multiple modes (e.g. light/dark).
3. **Given** "build node 12:345 as a component", **When** the agent writes code, **Then** it uses
   the node's image, structure, Figma's computed CSS and text content, follows the project's
   existing stack and conventions, and reuses existing tokens where they match.
4. **Given** "capture the Design System page", **When** the agent runs it, **Then** output lands
   inside the project's output folder and the agent summarises what was written.
5. **Given** a request for icons or vector shapes, **When** the agent needs geometry, **Then** it
   uses SVG export rather than structure dumps.

---

### User Story 4 - Developer installs the skill in their agent (Priority: P2)

A developer discovers the skill on a marketplace or in the README and installs it into their
agent (Claude Code first; other agents that read the same skill format as well). The install
instructions are short, list prerequisites (Figma desktop, Node, the plugin, the server
registration) and work on macOS, Linux and Windows.

**Why this priority**: Required to list the skill publicly and for anyone to benefit from it.
It can be done independently of the skill's content quality.

**Independent Test**: On a clean machine, follow only the published instructions; the agent
should recognise the skill and use it on the next Figma question.

**Acceptance Scenarios**:

1. **Given** a developer using Claude Code, **When** they follow the install steps, **Then** the
   skill is available to the agent in all their projects (or one project, if they choose).
2. **Given** a developer using another agent that reads skill files, **When** they follow the
   generic steps, **Then** they know which folder to put the skill in.
3. **Given** a marketplace listing, **When** a reviewer reads it, **Then** it contains name,
   one-line description, prerequisites, privacy statement, licence and a link to the repository.
4. **Given** a new package version, **When** the developer updates, **Then** the steps tell them
   how to refresh the skill alongside the plugin.

---

### User Story 5 - Agent respects safety boundaries (Priority: P3)

The agent understands and states that the bridge is read-only towards the document, needs no API
token or paid plan, runs only on the local machine, and writes files only inside the project's
output folder. It does not promise to edit designs, and it does not attempt writes outside the
allowed folder.

**Why this priority**: Correct expectations and trust; also needed for a marketplace privacy
statement. Low implementation effort.

**Independent Test**: Ask the agent to "change the button colour in Figma" and to "save the export
to my home folder"; it should decline the first and explain the second's restriction.

**Acceptance Scenarios**:

1. **Given** a request to modify the design, **When** the agent responds, **Then** it explains the
   bridge is read-only and offers what it can do instead (e.g. produce code or a list of changes).
2. **Given** a request to write outside the output root, **When** the agent responds, **Then** it
   explains the restriction and how the developer can change the root.
3. **Given** the developer asks whether their design is sent anywhere, **When** the agent answers,
   **Then** it states that data stays on the machine between Figma, the local relay and the agent
   (aside from what the agent itself sends to its own model provider).

### Edge Cases

- Plugin open in two Figma files at once: the most recently active one answers; the agent should
  confirm the file name from the connection check before working.
- Connection check reports "connected" for up to ~45 s after the plugin window closed: if a later
  call fails with a "plugin closed" error, the agent re-checks and asks to reopen the plugin.
- First call reaching beyond the current page is slow on big libraries: the agent should not treat
  a slow first response as a failure.
- The file has no variables, only styles (or neither): token workflow falls back to styles, then
  to values observed in nodes, and says which source was used.
- Node id given in URL form (`node-id=12-345`) instead of `12:345`: the agent converts it.
- Name search returns zero results: the agent widens the search (all pages, regex, other types)
  before telling the developer.
- Port conflict or custom port: the agent points to the port-change steps; both plugin and server
  must use the same port.
- Agent without image support: the agent relies on structure, CSS and text and says the image was
  not viewed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The skill MUST be a single self-contained skill package (one main instruction file
  plus optional reference files) stored in this repository and published with the npm package.
- **FR-002**: The skill MUST include a name and a description that tells agents to load it
  whenever the user refers to Figma, a design file, screens, frames, components, design tokens or
  turning a design into code.
- **FR-003**: The skill MUST instruct the agent to check connection state before the first Figma
  read in a conversation, and after any "plugin not connected / closed" error.
- **FR-004**: The skill MUST map each known failure message (not connected, outdated plugin,
  protocol mismatch, port unavailable, waiting for client, write refused) to the exact user action
  that fixes it.
- **FR-005**: The skill MUST define a cheapest-first lookup order: connection → pages → page
  index / screens / name search → structure / CSS / text of one node → image or export.
- **FR-006**: The skill MUST give default limits for structure depth and image size, and say when
  to go deeper or view sub-sections instead.
- **FR-007**: The skill MUST explain how to handle answers that were written to a file instead of
  returned inline (read only the relevant part).
- **FR-008**: The skill MUST contain step-by-step recipes for at least: describe a screen, export
  design tokens as CSS custom properties, build a component from a node, capture a page or the
  file into the project, and export icons.
- **FR-009**: The skill MUST list every figma-bridge tool with a one-line "use it when" note, and
  the list MUST match the tools the server actually exposes.
- **FR-010**: The skill MUST state the constraints: read-only towards the document (only
  navigation/selection changes), no API token or paid plan, local-only, writes confined to the
  output root, plugin window must stay open, Figma desktop required.
- **FR-011**: The skill MUST tell the agent never to invent design values; if data could not be
  read, it says so.
- **FR-012**: The skill MUST be usable from the command line as well as through agent tools, for
  agents that have a shell but no tool integration (same command names).
- **FR-013**: The project MUST provide install instructions for Claude Code (user-wide and
  per-project), and generic instructions for other agents that read the same skill format, on
  macOS, Linux and Windows.
- **FR-014**: The project MUST provide a way to install or update the skill with one command from
  the package, consistent with how the plugin files are installed today.
- **FR-015**: The project MUST include marketplace listing copy: title, short and long
  description, prerequisites, example prompts, privacy statement, licence (MIT), price (free) and
  repository link.
- **FR-016**: The automated test suite MUST fail if the skill's tool list drifts from the tools
  the server exposes, or if the skill file is missing from the published package.
- **FR-017**: The main skill file MUST stay short enough to load cheaply (detail moved to
  reference files that the agent opens only when needed).

### Key Entities

- **Skill package**: the main instruction file (name, description, core rules) plus optional
  reference files (tool catalogue, workflow recipes, troubleshooting). Versioned with the npm
  package.
- **Tool catalogue entry**: tool name, what it answers, cost (cheap / medium / expensive), when to
  use it, key options.
- **Workflow recipe**: goal, ordered steps (which tools, in which order), expected output, and
  fallbacks.
- **Troubleshooting entry**: symptom or message, cause, user action.
- **Marketplace listing**: listing metadata and copy that points back to the repository.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 10 test conversations with the plugin closed, the agent identifies the
  disconnected state and gives the correct fix in its first reply in at least 9.
- **SC-002**: For "describe/build screen X" requests on a multi-page sample file, the agent makes
  no full-structure or image read before locating the node in 100% of test runs.
- **SC-003**: Context used to answer "describe screen X" drops by at least 40% compared with the
  same agent without the skill, on the same sample file.
- **SC-004**: Colour, spacing, radius and text values in generated tokens or components match the
  Figma source in at least 95% of checked values.
- **SC-005**: A first-time user goes from reading the install instructions to a working first
  answer in under 10 minutes (plugin and server setup included).
- **SC-006**: The skill is accepted for free listing on at least one public skill marketplace.
- **SC-007**: Zero cases in testing where the agent claims to have changed the Figma file or
  writes outside the output root.

## Assumptions

- Target agents read the common skill format (a folder with a main markdown instruction file and
  front-matter name/description). Claude Code is the primary, fully tested target; others are
  documented on a best-effort basis.
- The skill ships inside the existing npm package and repository; no separate package is created.
- One-command install copies the skill into the agent's skills folder, mirroring the existing
  plugin install command; manual copy remains possible.
- The skill is free and MIT-licensed; marketplace listings are non-exclusive and link back to the
  repository. Paid listing is out of scope.
- The skill describes the current tool set and protocol of this package; adding new bridge tools
  is out of scope.
- Default limits (structure depth, image size) follow the server's existing defaults unless the
  agent has a reason to go further.
- Success criteria SC-001 to SC-004 are checked manually against a sample Figma file; they are not
  part of the automated test suite.
