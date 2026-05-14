# Codex Adapter

## Purpose

Translate canonical team assets into Codex-friendly conventions without making Codex the source of truth.

## Design Bias

Codex is one of the richer target runtimes, so this adapter can stay thin. Prefer direct consumption of canonical markdown and YAML over heavy export steps.

## Likely Mapping

- `skills/*` map to skill-like task assets
- `agents/*` map to role profiles or reusable operating presets
- `sops/*` stay as referenced procedures
- `playbooks/*` become workflow bootstraps

## Notes

- Prefer references over duplicated prompt text.
- If Codex later needs stricter packaging, add generation logic here rather than changing the canonical asset layout.
