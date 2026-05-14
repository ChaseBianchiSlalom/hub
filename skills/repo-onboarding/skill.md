# Repo Onboarding

## Purpose

Help an engineer or agent get oriented in an unfamiliar repository quickly enough to act, without skipping the structural read that prevents bad edits.

## Process

1. Identify the top-level application shape, build system, and key entry points.
2. Trace the area most relevant to the requested task.
3. Highlight risky zones such as cross-cutting utilities, shared contracts, and deployment-sensitive paths.
4. Recommend the safest first read path and likely first edits.

## Output Contract

Return:

- a codebase map
- likely change locations
- important unknowns
- risk notes before implementation
