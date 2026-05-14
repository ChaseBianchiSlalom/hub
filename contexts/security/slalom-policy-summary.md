# Slalom AI Policy Summary

Source document: [Slalom AI Acceptable Use Policy.pdf](/Users/chasebianchi/codex/projects/adobe-ai-hub/docs/policies/slalom-ai-acceptable-use-policy.pdf)

## Why It Matters To This Repo

This AI Hub is a distribution layer for reusable prompts, workflows, context, and tool-specific exports. The main risk is not only what the hub contains, but what users may move from the hub into external AI systems.

## High-Signal Policy Themes

### 1. Confidentiality First

- Do not place Slalom or client confidential, proprietary, or sensitive information into AI tools unless the tool and use case are explicitly authorized.
- Treat AI tools like third parties unless the approved environment and data-handling rules are clear.

### 2. Authorized Tooling Matters

- The policy distinguishes between approved enterprise tools and unapproved/open tools.
- Protection level depends on the tenant, account type, and data-handling terms, not just the brand name of the tool.

### 3. Human Review Is Mandatory

- AI output must be reviewed for accuracy, bias, completeness, and quality.
- Code output requires strong SDLC controls, peer review, automated scanning, and developer understanding of all generated lines.

### 4. Client Permission And Contract Terms Matter

- Client delivery use requires explicit written client consent before using AI to process client data or produce deliverables.
- SOW language and client policy alignment are part of the control surface.

### 5. IP And Trade Secret Risk Are Real

- Inputting sensitive or proprietary material into the wrong tool can cause loss of trade secret protection or create IP ambiguity.
- Output ownership and commercial-use terms must be understood.

### 6. Employee And Candidate Uses Are Sensitive

- Automated decision-making in employee and candidate contexts is prohibited.
- AI may assist with note-taking and summaries in approved contexts, but not replace human discretionary judgment.

### 7. Exceptions Must Be Explicit

- Exceptions require documented approval.
- Governance is a real part of the policy, not just optional good practice.

## Implication For The AI Hub

The hub should behave like a safe packaging layer:

- canonical assets should remain low-sensitivity by default
- exports should clearly signal where human review and policy checks are required
- the repo should make it easy to do the right thing before content reaches external tools

The hub should not try to replace enterprise governance. It should reduce policy violations by making approved patterns obvious and lightweight.
