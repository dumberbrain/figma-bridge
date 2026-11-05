# Contract: `figma-bridge skill`

Extends [001 cli.md](../../001-npm-figma-bridge/contracts/cli.md). Pinned by
`test/skill-files.test.mjs`, `test/cli.test.mjs` and `test/commands.test.mjs`.

## Registry entry

```js
{
  name: 'skill',
  where: 'local',               // CLI only; NOT an MCP tool
  summary: 'install: copy the agent skill into a skills folder (default ~/.claude/skills). path: print where it is.',
  args: {
    action:  { type: 'string',  positional: true, required: true, desc: 'install | path' },
    project: { type: 'boolean', default: false, desc: 'use ./.claude/skills in the current folder' },
    dir:     { type: 'string',  desc: 'skills root folder; figma-bridge/ is created inside it' },
  },
}
```

## Target resolution

| Flags | Target folder |
| --- | --- |
| none | `<homedir>/.claude/skills/figma-bridge` |
| `--project` | `<cwd>/.claude/skills/figma-bridge` |
| `--dir X` | `<resolve(X)>/figma-bridge` |
| `--dir` + `--project` | usage error, exit 2 |

## `skill install`

- Creates the target recursively and copies the 4 files, overwriting them. Other files in the
  target stay.
- stderr: `✓ skill files in <target>`; stdout: `<target>/SKILL.md`.
- Then a hint on stderr: `Restart your agent (or start a new session) to load it.`
- Exit 0; I/O failure → exit 1 with the OS message.

## `skill path`

- stdout: absolute `<target>/SKILL.md` when all 4 files exist, exit 0.
- Otherwise stderr: `Skill not installed in <target>. Run: npx @ubuligan/figma-bridge skill install`,
  exit 1.

## Errors

- Unknown action → `skill: unknown action \`x\` — use \`install\` or \`path\`.`, exit 2.

## Library surface (internal, `bridge/lib/skill-files.mjs`)

```js
export const defaultSkillsRoot: () => string;                       // ~/.claude/skills
export function resolveTarget(o?: { dir?: string, project?: boolean, cwd?: string }): string;
export async function install(o?): Promise<{ dir: string, skill: string }>;
export function skillPath(o?): string;                              // throws BridgeError
export function installedSkill(o?): string | null;                  // for setupReport
```

## setup report delta

New line after `plugin:`:
`skill:   installed → <path>` | `skill:   not installed (optional) — npx @ubuligan/figma-bridge skill install`
