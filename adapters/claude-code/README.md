# Claude Code Adapter

## Purpose

Translate canonical team assets into Claude Code-friendly instructions while preserving the same light MCP-style contract used by the rest of the repo.

## Export Shape

- `CLAUDE.md`
- `context/assets/*.md` supporting memory files
- `context/scenario.md` for focused scenario exports

## Global Install Shape

The CLI can install the whole hub into Claude Code user memory:

- Claude Code user memory: `~/.claude/CLAUDE.md`
- generated support files: `~/.claude/ai-hub/current/`

Run:

```bash
ai-hub export claude-code
```

Use `--out <dir>` for a local bundle instead of a global install.

## Mapping

- `skills/*` become reusable task instructions
- `agents/*` become role profiles
- `sops/*` stay as linked procedures
- `playbooks/*` become workflow bootstrap bundles

## Notes

- use Claude Code's `@path` import syntax for supporting asset files
- keep runtime-specific behavior here, not in the canonical assets
- preserve user-authored `~/.claude/CLAUDE.md` content outside the managed AI Hub block
