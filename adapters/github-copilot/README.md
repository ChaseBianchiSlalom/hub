# GitHub Copilot Adapter

## Purpose

Define how canonical team assets should be exposed to GitHub Copilot-oriented workflows using repository instruction files and prompt files.

## Export Shape

- `.github/copilot-instructions.md`
- `.github/instructions/*.instructions.md`
- `.github/prompts/*.prompt.md`
- `.github/ai-hub/*.md` supporting context files

## Global Install Shape

The CLI can install the whole hub into local Copilot instruction surfaces:

- VS Code user instructions: `~/.copilot/instructions/adobe-ai-hub.instructions.md`
- JetBrains global instructions: `~/.config/github-copilot/intellij/global-copilot-instructions.md`
- generated support files: `~/.copilot/ai-hub/current/`

Run:

```bash
ai-hub export github-copilot
```

Use `--out <dir>` for a repository-ready bundle instead of a global install.

## Notes

- keep the canonical repo as the source of truth
- generate Copilot-native files from resolved assets and scenarios
- use repository-wide instructions for persistent guidance, instruction files for VS Code and JetBrains context loading, and prompt files for task entrypoints
