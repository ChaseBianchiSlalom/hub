# Team AI Hub

`Hub` is a single-team AI operating repository. The repo itself is the team boundary. This repo is the pilot made for the **AEM Team**.

The goal is to keep team AI assets lightweight, shareable, and portable across tools. The design target is a simple MCP-like layer: predictable folders, markdown instructions, small YAML manifests, and thin adapters.

This repository now includes a local TypeScript POC CLI that can:

- discover canonical assets
- resolve asset dependencies
- run scenario-backed demos
- export working bundles for `generic`, `codex`, `claude-code`, `chatgpt`, `vscode`, and `github-copilot`

## Structure

```text
.
├── docs/
├── adapters/
│   ├── codex/
│   ├── claude-code/
│   ├── github-copilot/
│   ├── chat-gpt/
│   ├── ide/
│   │   ├── vscode/
│   │   └── intellij/
│   └── generic/
├── agents/
│   ├── implementation-lead/
│   ├── project-operator/
│   └── solution-architect/
├── contexts/
├── playbooks/
│   └── ai-feature-delivery/
├── skills/
│   ├── brief-to-backlog/
│   ├── delivery-risk-scan/
│   └── repo-onboarding/
├── sops/
│   ├── engagment-intake/
│   └── repo-kickoff/
├── scripts/
├── src/
├── tests/
└── README.md
```

## Operating Model

- One repo equals one functional team.
- Each asset lives in its own directory.
- Each asset has a markdown instruction body and a small YAML manifest.
- Adapters translate the same canonical assets into different tool environments.
- The canonical layer stays intentionally simple so it is easy to share, copy, vendor, or index.

## Asset Types

- `skills`: bounded repeatable capabilities
- `agents`: role-based operating profiles
- `sops`: repeatable procedures
- `playbooks`: workflow bundles
- `contexts`: durable team reference material
- `adapters`: tool-specific translation notes or export logic

## Light MCP Principle

This repo should behave like a light MCP for team AI operations:

- tools can discover assets by folder and manifest
- tools can read the markdown body directly
- dependencies are declared explicitly in YAML
- no heavy registry or database is required

If a runtime can read files, parse YAML, and follow references, it should be able to consume this repo.

## Current Documents

- Architecture and operating spec: [docs/team-ai-hub-spec.md](/Users/chasebianchi/codex/projects/adobe-ai-hub/docs/team-ai-hub-spec.md)
- Adapter export standard: [docs/adapter-export-standard.md](/Users/chasebianchi/codex/projects/adobe-ai-hub/docs/adapter-export-standard.md)
- V1 taxonomy and real use cases: [docs/v1-taxonomy.md](/Users/chasebianchi/codex/projects/adobe-ai-hub/docs/v1-taxonomy.md)
- Example scenarios: [docs/examples/README.md](/Users/chasebianchi/codex/projects/adobe-ai-hub/docs/examples/README.md)
- Security hardening plan: [docs/security-hardening-plan.md](/Users/chasebianchi/codex/projects/adobe-ai-hub/docs/security-hardening-plan.md)
- Source policy context: [docs/policies/slalom-ai-acceptable-use-policy.pdf](/Users/chasebianchi/codex/projects/adobe-ai-hub/docs/policies/slalom-ai-acceptable-use-policy.pdf)

## POC CLI

Run the local CLI directly:

```bash
./bin/ai-hub validate
./bin/ai-hub list
./bin/ai-hub resolve ai-feature-delivery
./bin/ai-hub demo project-operator --scenario project-operator-poc
./bin/ai-hub export codex
./bin/ai-hub export codex project-operator --scenario project-operator-poc
./bin/ai-hub export codex --out /tmp/codex-hub
./bin/ai-hub export codex project-operator --scenario project-operator-poc --out /tmp/project-operator-codex
./bin/ai-hub export claude-code
./bin/ai-hub export claude-code project-operator --scenario project-operator-poc
./bin/ai-hub export claude-code --out /tmp/claude-hub
./bin/ai-hub export claude-code project-operator --scenario project-operator-poc --out /tmp/project-operator-claude
./bin/ai-hub export github-copilot
./bin/ai-hub export github-copilot --out /tmp/copilot-hub
./bin/ai-hub export github-copilot project-operator --scenario project-operator-poc --out /tmp/project-operator-copilot
./bin/ai-hub install-local --shell-setup
```

Supported export adapters:

- `generic`
- `codex`
- `claude-code`
- `chatgpt`
- `vscode`
- `github-copilot`

## Codex Global Context

`codex` now exports the whole hub to your global Codex context when no asset is provided:

```bash
ai-hub export codex
```

This installs all Codex-compatible assets into `~/.codex/AGENTS.md` and writes supporting files under `~/.codex/ai-hub/current/`.

For a focused global export, provide an asset and scenario:

```bash
ai-hub export codex project-operator --scenario project-operator-poc
```

Both global forms update only a managed AI Hub block inside `~/.codex/AGENTS.md`.

If you want a repo-local or temp export bundle instead, pass `--out` explicitly:

```bash
ai-hub export codex --out /tmp/codex-hub
ai-hub export codex project-operator --scenario project-operator-poc --out /tmp/project-operator-codex
```

Your existing `~/.codex/AGENTS.md` content is preserved. The installer replaces only the section between:

```md
<!-- adobe-ai-hub:start -->
...
<!-- adobe-ai-hub:end -->
```

You can target a different Codex home for testing:

```bash
ai-hub export codex project-operator --scenario project-operator-poc --codex-home /tmp/codex-home
```

## Claude Code Memory

`claude-code` exports the whole hub to your Claude Code user memory when no asset is provided:

```bash
ai-hub export claude-code
```

This installs all Claude Code-compatible assets into `~/.claude/CLAUDE.md` and writes supporting files under `~/.claude/ai-hub/current/`.

For a focused global export, provide an asset and scenario:

```bash
ai-hub export claude-code project-operator --scenario project-operator-poc
```

Both global forms update only a managed AI Hub block inside `~/.claude/CLAUDE.md`. Existing Claude memory outside the managed block is preserved.

If you want a repo-local or temp export bundle instead, pass `--out` explicitly:

```bash
ai-hub export claude-code --out /tmp/claude-hub
ai-hub export claude-code project-operator --scenario project-operator-poc --out /tmp/project-operator-claude
```

The generated `CLAUDE.md` uses Claude Code's `@path` import syntax to load supporting asset files from the generated `context/assets/` directory.

You can target a different Claude home for testing:

```bash
ai-hub export claude-code --claude-home /tmp/claude-home
```

## GitHub Copilot Context

`github-copilot` exports the whole hub to local GitHub Copilot instruction surfaces when no asset is provided:

```bash
ai-hub export github-copilot
```

This writes:

- VS Code user instructions: `~/.copilot/instructions/adobe-ai-hub.instructions.md`
- JetBrains global instructions: `~/.config/github-copilot/intellij/global-copilot-instructions.md`
- supporting generated context: `~/.copilot/ai-hub/current/`

The JetBrains file is updated through a managed AI Hub block, so existing global Copilot instructions outside the block are preserved. The VS Code file is adapter-owned and can be regenerated safely.

For a repository-ready bundle instead, pass `--out`:

```bash
ai-hub export github-copilot --out /tmp/copilot-hub
```

That bundle contains `.github/copilot-instructions.md`, `.github/instructions/adobe-ai-hub.instructions.md`, `.github/prompts/adobe-ai-hub.prompt.md`, and `.github/ai-hub/` support files.

For a focused scenario bundle:

```bash
ai-hub export github-copilot project-operator --scenario project-operator-poc --out /tmp/project-operator-copilot
```

You can target alternate install locations for testing:

```bash
ai-hub export github-copilot --copilot-home /tmp/copilot-home --jetbrains-copilot-dir /tmp/jetbrains-copilot
```

## Local Install

To make `ai-hub` available from anywhere on your laptop, create a local wrapper into a bin directory:

```bash
./bin/ai-hub install-local --shell-setup
```

You can also use:

```bash
./scripts/install-local.sh
```

By default this installs to `~/bin` and updates your shell rc file idempotently.

## Validation

Run:

```bash
./scripts/validate-hub.sh
./bin/ai-hub validate
node --experimental-strip-types --test tests/**/*.test.ts
```

The shell validator checks the repo shape. The CLI validator also verifies asset manifests and dependency references. The test suite covers the loader, resolver, adapters, and end-to-end CLI flows.
