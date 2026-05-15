# Example Scenarios

These examples back the POC CLI and show how the canonical assets are meant to be exercised.

Machine-readable fixtures live in `tests/fixtures/scenarios/`.

Category walkthroughs:

- [skills.md](/Users/chasebianchi/codex/projects/adobe-ai-hub/docs/examples/skills.md)
- [agents.md](/Users/chasebianchi/codex/projects/adobe-ai-hub/docs/examples/agents.md)
- [sops.md](/Users/chasebianchi/codex/projects/adobe-ai-hub/docs/examples/sops.md)
- [playbooks.md](/Users/chasebianchi/codex/projects/adobe-ai-hub/docs/examples/playbooks.md)

Run examples locally with:

```bash
./bin/hub demo brief-to-backlog --scenario brief-to-backlog-poc
./bin/hub export codex
./bin/hub export codex project-operator --scenario project-operator-poc
```
