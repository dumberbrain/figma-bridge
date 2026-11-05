# Marketplace listing: figma-bridge

Copy for skill directories and marketplaces (Agensi, Claude Code plugin marketplaces and
similar). Listings are free and non-exclusive; the source of truth is the GitHub repository.

## Title

figma-bridge: read live Figma files from your AI agent

## Tagline

Let your agent see and read the Figma file you have open: local, read-only, no API token.

## Description

figma-bridge connects your AI agent to the file open in Figma desktop. A small Figma plugin
talks to a local MCP server (and CLI), and this skill teaches the agent how to use it well:

- **Check the connection first.** The agent checks the plugin before it reads anything, and
  when something is missing it tells you the exact fix instead of guessing.
- **Find before reading.** It locates screens and components with cheap lookups, then reads
  only the node you need, with depth and image-size limits. Answers stay small and fast.
- **Design-to-code recipes.** Describe a screen, export variables as CSS custom properties
  (with light/dark modes), build a component that matches a node in your project's own stack,
  capture a page into the repo, export icons as SVG.
- **Grounded values.** Colours, spacing, type and copy come from Figma's data, including
  Figma's own computed CSS. The agent does not estimate them from a screenshot.

It works with any agent that reads Agent Skills (folder with `SKILL.md`). It is fully tested
with Claude Code. Agents without MCP can use the same commands through the CLI.

## Requirements

- Figma **desktop** (development plugins cannot be imported in the browser)
- Node.js 22.12 or newer
- The figma-bridge Figma plugin: `npx @ubuligan/figma-bridge plugin install`, then
  **Plugins → Development → Import plugin from manifest…** (only once)
- The figma-bridge MCP server registered with your agent, or shell access for the CLI

## Example prompts

- "Is Figma connected?"
- "List the pages and the screens on *Checkout*."
- "Show me the *Login* screen and describe its layout."
- "What colour and text variables does this file define? Give me CSS custom properties."
- "Get Figma's CSS for node 12:345 and build it as a React component."

## Privacy

- Read-only: it cannot create, change or delete anything in your Figma file. The only visible
  effect is optional navigation (switching page, selecting and zooming to a node).
- Local only: the relay listens on 127.0.0.1. Design data moves only between Figma desktop,
  the local relay and your agent. Your agent's model provider sees what the agent sends it,
  as with any other tool.
- No API token, no Figma account access, no telemetry.
- Files are written only inside your project's output folder.

## License & price

MIT. Free.

## Links

- GitHub: https://github.com/javidselimov/figma-bridge
- npm: https://www.npmjs.com/package/@ubuligan/figma-bridge

## Install

**Claude Code plugin (skill + MCP server in one step)**

```
/plugin marketplace add javidselimov/figma-bridge
/plugin install figma-bridge@figma-bridge
```

**Skill only, with the CLI**

```sh
npx @ubuligan/figma-bridge skill install            # ~/.claude/skills/figma-bridge
npx @ubuligan/figma-bridge skill install --project  # ./.claude/skills/figma-bridge
npx @ubuligan/figma-bridge skill install --dir <your agent's skills folder>
```

**Manual**: copy `skills/figma-bridge/` from the repository into your agent's skills folder.

Then set up the plugin and the server once: `npx @ubuligan/figma-bridge setup` prints every
step with your real paths.
