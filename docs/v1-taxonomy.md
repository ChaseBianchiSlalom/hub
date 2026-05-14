# V1 Taxonomy

## Goal

Define the first practical asset set for a single-team AI hub that is optimized for shareability, IDE-heavy workflows, and light MCP-style consumption.

This repo assumes an Adobe practice team doing delivery, architecture, implementation, and code-adjacent consulting work.

## Design Constraint

The taxonomy needs to work even when the downstream tool is simple.

That means each asset should be:

- understandable as a standalone markdown file
- describable by a very small YAML manifest
- useful inside Codex, Claude Code, GitHub Copilot, ChatGPT, VS Code, or IntelliJ with minimal adapter logic

## V1 Assets In This Repo

### Skills

- `brief-to-backlog`
  Converts an ambiguous request into goals, assumptions, risks, and a first execution slice.
- `repo-onboarding`
  Builds a fast mental model of an unfamiliar codebase and its change surface.
- `delivery-risk-scan`
  Surfaces delivery, testing, dependency, and rollout risks early.

### Agents

- `project-operator`
  Coordinates work from vague brief through scoped execution.
- `solution-architect`
  Frames technical direction, constraints, and tradeoffs.
- `implementation-lead`
  Sequences concrete repo work after direction is chosen.

### SOPs

- `engagment-intake`
  Standardizes how a new request becomes a defined workstream.
- `repo-kickoff`
  Standardizes how a repo is entered safely before edits begin.

### Playbooks

- `ai-feature-delivery`
  Bundles intake, planning, repo understanding, implementation sequencing, and risk review into one repeatable workflow.

## Why These First

This set gives the team a credible end-to-end path:

1. intake the work
2. turn the brief into a usable slice
3. frame technical direction
4. orient in the repo
5. sequence implementation
6. scan for delivery risk

That is enough to prove whether the hub meaningfully improves execution before more assets are added.

## Real Use Cases

### New Client Request

Use:

- `engagment-intake`
- `brief-to-backlog`
- `project-operator`
- `solution-architect`

Outcome:

- the team gets a scoped first slice with explicit assumptions and risks

### Engineer Starts In An Unfamiliar Repo

Use:

- `repo-kickoff`
- `repo-onboarding`
- `implementation-lead`

Outcome:

- the engineer gets a safer and faster entry path into the codebase

### AI Feature Needs Delivery Planning

Use:

- `ai-feature-delivery`

Outcome:

- the team gets a reusable workflow instead of rebuilding the same operating logic from scratch

## Next Assets To Add

If the first wave proves useful, the next likely additions are:

- `architecture-decision-draft`
- `pr-review-risk-check`
- `review-operator`
- `pr-review-gate`
- `app-modernization-discovery`

These are useful, but they should come after the current set proves its value in real work.

## Taxonomy Rules

### Skills

Use skills for bounded repeatable capabilities.

### Agents

Use agents for durable operating roles, not arbitrary personas.

### SOPs

Use SOPs for mandatory procedural steps and exit criteria.

### Playbooks

Use playbooks when a workflow needs multiple assets coordinated together.

## What To Avoid

- dozens of overlapping skills
- heavy vendor-specific config in the canonical layer
- project-specific memory mixed into the shared team repo
- complex registries or databases for basic discovery

## Connector Implication

Because the taxonomy is intentionally simple, connector work later should mostly be packaging and presentation work:

- Codex and Claude Code can likely consume assets fairly directly
- GitHub Copilot and IDE consumers will probably need thinner prompt bundles or helper files
- ChatGPT may rely on extracted playbooks or curated instruction sets
- any generic consumer should be able to walk the folders and follow dependencies
