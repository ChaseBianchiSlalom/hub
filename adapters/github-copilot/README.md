# GitHub Copilot Adapter

## Purpose

Define how canonical team assets should be exposed to GitHub Copilot-oriented workflows using repository instruction files and prompt files.

## POC Export Shape

- `.github/copilot-instructions.md`
- `.github/prompts/*.prompt.md`
- `.github/ai-hub/*.md` supporting context files

## Notes

- keep the canonical repo as the source of truth
- generate Copilot-native files from resolved assets and scenarios
- use repository-wide instructions for persistent guidance and prompt files for task entrypoints
