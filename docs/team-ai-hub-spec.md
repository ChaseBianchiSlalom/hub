# Team AI Hub Spec

## Purpose

This repository is a single-team AI hub. It is meant to hold durable team AI assets in a structure that is easy to share, easy to version, and easy for multiple tools to consume.

The design goal is not a heavy orchestration platform. The design goal is a light and simple MCP-like contract for team AI optimization.

## Core Thesis

The team should own its reusable AI operating knowledge outside any single vendor runtime.

That knowledge should be:

- readable by humans
- machine-discoverable
- easy to copy between projects or environments
- thin enough to adapt to different AI tools without major translation work

## Stack Position

The clean mental model is:

1. Models
   GPT, Claude, Gemini, open models.
2. Tools and runtimes
   Codex, Claude Code, GitHub Copilot, ChatGPT, IDE copilots, internal tooling.
3. Team AI hub
   Shared skills, agents, SOPs, playbooks, and contexts.
4. Project work
   Repos, tickets, delivery artifacts, architecture docs, implementation tasks.

The hub is a portable team instruction layer that sits above raw models and below actual project execution.

## Repo Boundary

One repository should be presumed to represent one functional team.

That means:

- no `teams/<team-id>` nesting
- no company-wide prompt monorepo assumptions in the core contract
- the root folder structure itself is the contract

If another team needs the same pattern, they get their own repo with the same shape.

## Canonical Structure

```text
docs/
adapters/
  codex/
  claude-code/
  github-copilot/
  chat-gpt/
  ide/
    vscode/
    intellij/
  generic/
agents/
contexts/
playbooks/
skills/
sops/
scripts/
README.md
```

Each asset directory should contain:

- one markdown body
- one YAML manifest

Example:

```text
skills/
  repo-onboarding/
    skill.md
    skill.yaml
```

## Design Principles

### 1. Light And Simple MCP

The hub should feel like a lightweight content-addressable contract, not a complex platform. A tool should be able to consume it with very little machinery:

1. list folders
2. parse YAML manifests
3. load markdown bodies
4. resolve dependency ids

If more than that is required, the core contract is probably too heavy.

### 2. Canonical Content First

The source of truth is the markdown and YAML in this repo, not runtime-specific generated files.

### 3. Thin Adapters

Adapters should explain how a target tool consumes the assets. They should not become the place where the real business logic lives.

### 4. Composable Assets

Agents can depend on skills and SOPs. Playbooks can bundle agents, skills, and SOPs. Composition is essential because real delivery work is rarely one prompt deep.

### 5. Shareable By Default

The structure should be simple enough that another team can clone the pattern, vendor a subset of assets, or point a new tool at it without building a platform first.

## What Belongs Here

- stable team instructions
- role-based agent profiles
- repeatable SOPs
- workflow playbooks
- durable team contexts
- adapter guidance for tools

## What Does Not Belong Here

- secrets
- one-off conversation prompts
- heavy project-specific memory
- runtime-specific state that only one tool understands

## Asset Semantics

### Skills

Bounded capabilities such as:

- turning a brief into an execution slice
- onboarding into a repo
- scanning delivery risk

### Agents

Operating roles such as:

- project operator
- solution architect
- implementation lead

### SOPs

Repeatable procedures such as:

- intake
- repo kickoff
- review gates

### Playbooks

Bundles of assets for a larger workflow such as:

- AI feature delivery

### Contexts

Durable reference material such as:

- delivery standards
- glossary
- architecture conventions

## Runtime Strategy

Version 1 should optimize for the tools the team already uses:

- Codex
- Claude Code
- GitHub Copilot
- ChatGPT
- IDE workflows in VS Code and IntelliJ

OpenAI enterprise usage can still matter, but it should not distort the core contract into something heavyweight.

## Adapter Expectations

### Codex

Can likely consume assets more directly, including role-oriented and skill-oriented content.

### Claude Code

Should consume the same assets with minimal repackaging into runtime-friendly instruction bundles.

### GitHub Copilot

Will likely need thinner exports or reference files because the integration surface is narrower.

### ChatGPT

May use curated prompt bundles, linked instructions, or playbook extracts rather than deep repo-native execution.

### IDE Adapters

VS Code and IntelliJ should be treated as consumption surfaces. In practice, that often means:

- workspace bootstrap files
- prompt packs
- reference panels
- lightweight extension or CLI integration later

### Generic

The generic adapter is the fallback contract for any tool that can:

- walk folders
- parse YAML
- read markdown
- follow dependency ids

## Export Standard

Adapters should follow a consistent export model across tools.

The current standard is documented in [docs/adapter-export-standard.md](/Users/chasebianchi/codex/projects/adobe-ai-hub/docs/adapter-export-standard.md).

The most important rules are:

- prefer the tool's global context when it supports durable persistent instructions
- preserve user-authored instructions and update only managed content
- target the tool's native instruction surface
- export resolved bundles, not isolated root files
- keep generated runtime artifacts separate from canonical assets
- provide an explicit local fallback when practical
- fail fast on ambiguous export modes

## Discovery Flow

A runtime or helper script should be able to do this:

1. enumerate top-level asset folders
2. read each `*.yaml` manifest
3. load the matching markdown body
4. resolve dependencies
5. materialize or present the asset for the target environment

That is the simple MCP behavior this repo is aiming for.

## Practical Implications

### Benefits

- portable across runtimes
- reviewable in Git
- easy to share with another team
- low integration overhead

### Tradeoffs

- adapter capabilities will vary by tool
- the team must curate taxonomy carefully
- some runtimes will only support thin consumption patterns

## Version 1 Recommendation

Keep V1 intentionally narrow:

- a few high-value skills
- a few durable agents
- a small number of SOPs
- one core playbook
- adapter notes for the first target tools

Do not build a platform before the taxonomy proves useful.
