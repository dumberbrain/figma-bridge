# Troubleshooting

Back to [SKILL.md](../SKILL.md). When a call fails, find the message below and tell the user
the exact action. Do not guess design content while the bridge is down.

## Messages and states

| Symptom | Cause | Tell the user |
| --- | --- | --- |
| `plugin: NOT connected`, or a tool says the plugin is not connected / closed | The figma-bridge plugin is not running in Figma desktop, or its window was closed | Open the file in **Figma desktop** and run **Plugins → Development → figma-bridge**. Keep the plugin window open. |
| "…protocol v0, this server expects v1" or "plugin … is older than this server" | The installed plugin files are from an older package version | Run `npx @ubuligan/figma-bridge plugin install`, then close and re-run the plugin in Figma. Re-importing is not needed. |
| "port 7332 is not available" (or another port) | Another program is using the relay port | Pick a free port and change **both halves**: `npx @ubuligan/figma-bridge plugin install --port 7444`, re-register the server with `-e FIGMA_BRIDGE_PORT=7444`, set `FIGMA_BRIDGE_PORT=7444` for CLI use, then re-run the plugin. |
| The plugin window shows "waiting for Claude or the CLI" | No relay is running yet | Start the agent session that hosts the MCP server, run any CLI command, or run `npx @ubuligan/figma-bridge serve`. |
| "Refusing to write outside …" | The requested output path is outside the output root | Use a path inside the project, or register the server with `-e FIGMA_BRIDGE_ROOT=/path/to/project`. |
| No `figma_*` tools are available to the agent | The MCP server is not registered for this agent | See [Registering the server](#registering-the-server), or use the CLI (`npx @ubuligan/figma-bridge <command>`). |
| Answers come from a different file than expected | The plugin is open in two files at once; the one that polled most recently answers | Check the file name from `figma_ping`; ask the user to close the plugin in the other file. |
| The first call to another page is slow | The first call beyond the current page loads the other pages once (a few seconds on big libraries) | Nothing to fix. Wait for it and do not treat it as a failure. |
| `figma_health` says connected, but calls fail with "plugin closed" | `health` can report the plugin as connected for up to 45 s after its window was closed | Call `figma_ping` again; if it fails, ask the user to reopen the plugin. |
| A tall screen's image is a thin unreadable strip | The image is scaled so the longest edge fits 1568 px | View the child sections by id (`figma_view` lists them). |
| Node output has no vector paths | Vector geometry is not part of `figma_node` | Use `figma_svg` for that node. |

## First-time setup

If nothing has been set up yet, `npx @ubuligan/figma-bridge setup` checks Node, the port and the
plugin, and prints the steps with the user's real paths. In short:

1. `npx @ubuligan/figma-bridge plugin install`: copies the plugin to `~/.figma-bridge/plugin/`
   and prints the `manifest.json` path.
2. In Figma desktop: **Plugins → Development → Import plugin from manifest…** and pick that
   file. This is needed only once. Development plugins cannot be imported in the browser.
3. Register the server (below).
4. Run **Plugins → Development → figma-bridge** and keep the window open. A green dot means it
   found the relay.

Requirements: Figma **desktop** and Node.js 22.12 or newer.

## Registering the server

Claude Code, macOS / Linux:

```sh
claude mcp add figma-bridge -s user -- npx -y @ubuligan/figma-bridge mcp
```

Claude Code, Windows:

```sh
claude mcp add figma-bridge -s user -- cmd /c npx -y @ubuligan/figma-bridge mcp
```

Other MCP clients: add a stdio server with the command `npx` and the arguments
`-y @ubuligan/figma-bridge mcp` (on Windows: the command `cmd` with
`/c npx -y @ubuligan/figma-bridge mcp`). Start a new session after registering.

## Agent without image support

If the agent cannot see images, skip `figma_view`. Rely on `figma_node`, `figma_css` and
`figma_text`, and tell the user that the screen image was not viewed.

## After an update

After a new package version: run `npx @ubuligan/figma-bridge plugin install` and re-run the
plugin. Run `npx @ubuligan/figma-bridge skill install` too if the skill was installed that way.
