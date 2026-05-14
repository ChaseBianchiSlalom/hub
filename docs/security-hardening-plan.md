# Security Hardening Plan

## Goal

Harden the AI Hub enough that it nudges teams toward policy-compliant use, without making the hub painful to adopt or too rigid to be useful.

This plan is based on the source policy in [Slalom AI Acceptable Use Policy.pdf](/Users/chasebianchi/codex/projects/adobe-ai-hub/docs/policies/slalom-ai-acceptable-use-policy.pdf) and its summary in [contexts/security/slalom-policy-summary.md](/Users/chasebianchi/codex/projects/adobe-ai-hub/contexts/security/slalom-policy-summary.md).

## Design Principle

Prefer lightweight governance by default:

- clear metadata
- visible warnings
- safe templates
- validation hints
- documented review steps

Avoid heavyweight governance in V1:

- hard approval workflows in the CLI
- identity or entitlement systems
- remote enforcement services
- anything that blocks normal low-risk internal usage by default

## Recommended Policies To Integrate

### 1. Asset Sensitivity Classification

Add a small sensitivity model to canonical assets and scenarios.

Recommended levels:

- `public`
- `internal`
- `confidential`
- `client-restricted`

Recommended policy:

- Default new assets to `internal`.
- Require explicit classification on all canonical assets and scenario fixtures.
- Forbid storing raw secrets, credentials, tokens, and production personal data in any level.

Why this is worth it:

- It is low friction.
- It creates a machine-readable basis for future warnings and export restrictions.
- It aligns directly to the policy’s confidentiality emphasis.

### 2. Approved Runtime Declaration

Keep and strengthen the existing runtime compatibility model so it becomes a lightweight approved-tool signal.

Recommended policy:

- Separate “technically supported” from “approved for sensitive input.”
- Add fields such as:
  - `approved_runtimes`
  - `restricted_runtimes`
- Treat `compatible_runtimes` as technical capability, not governance approval by itself.

Why this is worth it:

- It avoids assuming that because an adapter exists, the tool is approved for all data.
- It preserves usability because users still see export options, but with clearer policy meaning.

### 3. Mandatory Human Review Flags

Add explicit human review expectations to assets that generate deliverables, code, or decisions.

Recommended policy:

- Add manifest flags like:
  - `human_review_required: true`
  - `peer_review_required: true`
  - `security_review_required: true` for code-producing workflows
- Surface these flags in `hub demo` and all exports.

Why this is worth it:

- It directly aligns to the policy’s review requirements.
- It does not block usage; it makes review obligations impossible to miss.

### 4. Client Delivery Data Guardrails

Track whether a workflow may involve client-style data without trying to encode approval workflow inside the hub.

Recommended policy:

- Add:
  - `client_data_allowed: false|true`
  - scenario sensitivity and review metadata
- Handle client approval outside the AI Hub as a human process.
- Do not block exports or require approval confirmation inside the CLI.

Why this is worth it:

- Client-delivery misuse is one of the highest-risk policy violations.
- Data-awareness inside the hub is still useful, even if approval is handled externally.

### 5. Code Generation And Analysis Controls

Mark any code-oriented assets with SDLC expectations.

Recommended policy:

- Add an optional `code_use_policy` section for relevant assets:
  - read and understand all generated code
  - peer review required
  - automated security scanning required
  - external connections must be explicitly explained
- Surface this in Codex and GitHub Copilot exports.

Why this is worth it:

- It maps directly to the policy’s code-generation guidance.
- It fits the current AI Hub use cases very naturally.

### 6. Scenario Hygiene Policy

Treat scenario fixtures as policy-sensitive examples, not throwaway test data.

Recommended policy:

- No real client names, personal data, credentials, or proprietary source snippets in `tests/fixtures/scenarios/`.
- Use synthetic but realistic examples only.
- Add a short scenario authoring guide in the repo.

Why this is worth it:

- Fixtures are easy to forget and easy to leak.
- This is one of the cheapest controls to implement well.

### 7. Export Warning Banners

Every export should carry the right reminder for the target tool.

Recommended policy:

- Include a short banner in generated bundles covering:
  - human review required
  - confidential/client data handling caution
  - tool-specific limitations around IP, ownership, or workflow use

Why this is worth it:

- Warnings travel with the artifact.
- It improves safety without changing user workflow much.

### 8. Exception And Ownership Metadata

Add ownership and exception hooks without implementing a full workflow engine.

Recommended policy:

- Each asset should identify:
  - owner
  - last review date
  - optional `exception_contact`
- Document that exceptions require formal approval outside the hub.

Why this is worth it:

- It supports accountability without building a governance platform.

## Policies I Would Not Implement Yet

These would likely inhibit usage too much for the current maturity level:

- mandatory remote policy checks before every export
- per-user authentication inside the CLI
- hard blocking of all non-approved adapter exports
- content inspection heuristics that attempt to detect all confidential data automatically
- centralized approval queues inside the repo tooling

These may become appropriate later, but they are too heavy for a useful V1.

## Best Next Implementation Sequence

### Phase 1: Metadata And Warnings

- add sensitivity and review metadata to manifests
- add client-data and code-use flags where relevant
- surface these in CLI output and exports

### Phase 2: Validation

- extend `hub validate` to require the new metadata fields
- validate that high-risk scenarios do not omit required review/approval flags

### Phase 3: Documentation And Templates

- add scenario authoring guidance
- add a lightweight asset template for secure defaults
- update adapter docs with approved-use expectations

## Recommended V1 Decisions

If we implement hardening next, the safest low-friction choices are:

1. Add sensitivity classification to all assets and scenarios.
2. Add human review metadata and lightweight client-data flags where applicable.
3. Add export warning banners for Codex, ChatGPT, GitHub Copilot, and VS Code bundles.
4. Keep enforcement warning-first instead of block-first.

That gives the AI Hub practical security posture without undermining the reason it exists.
