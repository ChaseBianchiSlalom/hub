# Adapter Export Standard

## Purpose

This document captures the export rules that should be reused when integrating the AI Hub with additional tools.

The Codex export path is the current working reference implementation. Other adapters should follow the same operating model unless a target tool makes that impossible.

## Core Principle

The AI Hub owns canonical team AI assets.

Target tools should receive generated exports that are:

- thin
- reproducible
- easy to replace
- aligned with the tool's native instruction surface

The export should adapt the hub to the tool. The tool should not become the new source of truth.

## Export Requirements

### 1. Prefer Global Context When The Tool Supports It

Adapters must export to the AI tool's global instruction context when all of the following are true:

- the tool exposes a durable global context surface
- the surface is meant for persistent user or team guidance
- writing there does not require unsafe or destructive behavior

Why:

- team-level operating instructions are not project-local by default
- users should not have to reinstall the same team behavior per repo
- the export should match where the tool naturally expects durable instructions

Examples:

- Codex: `$CODEX_HOME/AGENTS.md`
- other tools: global instruction files, user profile instruction settings, or shared workspace-level instruction surfaces

If a tool does not support a durable global surface, fall back in this order:

1. workspace-level persistent context
2. repo-level persistent context
3. reusable prompt pack or uploaded knowledge bundle

### 2. Preserve User-Owned Instructions

Adapters must preserve any user-authored instructions that already exist in the target tool.

The export should:

- update only a managed section or managed file
- use explicit markers when writing into a shared file
- avoid replacing unrelated user content

Good pattern:

- preserve the user's main instruction file
- replace only a clearly marked AI Hub block

Bad pattern:

- overwrite the entire instruction file because it is convenient for the adapter

### 3. Use The Tool's Native Instruction Surface

Adapters must target the tool's first-class instruction mechanism when possible.

Examples:

- global instruction files
- repository instruction files
- prompt files recognized by the tool
- uploaded knowledge/context files
- custom GPT instruction and knowledge fields

Do not invent a sidecar format if the tool already has a better native surface.

### 4. Keep Generated State Separate From Canonical State

Generated artifacts should live in adapter-owned output paths, not inside canonical asset folders.

Good pattern:

- canonical assets stay under `agents/`, `skills/`, `sops/`, `playbooks/`, `contexts/`
- generated exports go under a runtime path such as `~/.codex/ai-hub/current/` or a requested `--out` directory

This keeps regeneration safe and keeps the canonical repo reviewable.

### 5. Resolve Dependencies Before Export

Adapters must export a resolved bundle, not just the root asset file.

The minimum export input is:

- one selected root asset
- one selected scenario
- the full ordered dependency chain

This avoids partial exports that silently omit required skills or SOPs.

### 6. Preserve Scenario Context

Adapters should carry scenario context into the export whenever the target tool can use it.

At minimum include:

- selected asset id
- scenario id
- scenario goal
- target task when present
- constraints

This makes the export runnable rather than just descriptive.

### 7. Surface Security Metadata, But Keep Friction Low

Adapters must surface relevant warnings and review requirements from the canonical metadata.

They should not introduce heavy blocking workflow unless the target environment explicitly requires it.

Good pattern:

- warning banners
- review reminders
- visibility into sensitivity and data handling

Bad pattern:

- hard stop approvals in a lightweight CLI by default

### 8. Make Exports Idempotent

Running the same export again should update the same managed output cleanly.

That means:

- stable target paths
- stable markers for managed sections
- no duplicate appended blocks
- no dependence on hidden manual cleanup

### 9. Support Explicit Local Fallbacks

Even when global export is the default, adapters should support an explicit local output mode where practical.

Why:

- testing
- debugging
- temporary project-specific use
- environments where the global surface is unavailable

Codex is the model here:

- default: whole-hub global export
- focused mode: asset and scenario global export
- explicit fallback: `--out <dir>`

### 10. Fail Fast On Ambiguous Commands

Adapters should reject conflicting export modes rather than guess.

Example:

- if a command specifies both global install and local output, the adapter should error

Explicit failure is better than silent ambiguity.

## Integration Process For A New Tool

When adding a new adapter, use this process:

1. Identify the best persistent instruction surface.
2. Decide whether the correct default is global, workspace, repo, or prompt-pack export.
3. Define how user-authored content will be preserved.
4. Map canonical asset types into the tool's native surfaces.
5. Decide where generated support files should live.
6. Implement export as a pure derivation from canonical assets plus scenario input.
7. Add tests for preservation, idempotence, and output shape.

## Asset Mapping Guidance

The exact mapping will vary, but the broad pattern should remain stable:

- `skills` become task capabilities or reusable instructions
- `agents` become durable operating profiles
- `sops` become procedural guidance and review gates
- `playbooks` become bundled workflows or task bootstraps
- `contexts` become reference material or uploaded knowledge

## Tool Selection Hierarchy

When choosing where an export should land, use this hierarchy:

1. Global durable context
2. Workspace durable context
3. Repo durable context
4. Tool-native prompt pack
5. Generic bundle export

Move lower only when the higher option is unsupported or clearly wrong for the tool.

## Testing Requirements

Every adapter should be tested for the following:

- exports are generated from resolved assets, not raw single files
- user-authored instructions are preserved
- rerunning the export updates managed content without duplication
- local fallback output works when supported
- conflicting flags fail clearly
- output paths and filenames are stable
- security warnings and scenario context are included

## Recommended Adapter Output Shape

For most tools, the adapter should produce two layers:

1. primary tool-facing instructions
2. supporting generated context files

This keeps the main instruction surface readable while still allowing richer context when needed.

## Anti-Patterns

Avoid these:

- making runtime exports the new source of truth
- storing secrets in generated exports
- hardcoding project-specific content into team-global exports
- overwriting user-owned instruction files
- requiring a platform service when file-based export is enough
- hiding critical instructions only in undocumented sidecar files

## Current Reference Pattern

Codex is the current reference pattern:

- default export target is the tool's global context
- the no-asset command exports the whole hub
- asset and scenario arguments narrow the export to a focused bundle
- global instructions are preserved
- only a managed block is replaced
- supporting files are regenerated into a stable runtime-owned folder
- a local `--out` mode still exists for debugging and temporary use

Other adapters should copy this pattern unless the target tool has a materially different instruction model.
