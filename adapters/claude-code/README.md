# Claude Code Adapter

## Purpose

Translate canonical team assets into Claude Code-friendly instructions while preserving the same light MCP-style contract used by the rest of the repo.

## Likely Mapping

- `skills/*` become reusable task instructions
- `agents/*` become role profiles
- `sops/*` stay as linked procedures
- `playbooks/*` become workflow bootstrap bundles

## Notes

- prefer direct file references over duplicated prompt content
- keep runtime-specific behavior here, not in the canonical assets
- if packaging is needed later, generate it from the canonical folders
