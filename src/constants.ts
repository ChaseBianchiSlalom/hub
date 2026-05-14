import type { AdapterId, AssetDirectoryConfig } from "./types.ts";

export const REQUIRED_DIRECTORIES = [
  "docs",
  "adapters",
  "adapters/codex",
  "adapters/claude-code",
  "adapters/github-copilot",
  "adapters/chat-gpt",
  "adapters/ide",
  "adapters/ide/vscode",
  "adapters/ide/intellij",
  "adapters/generic",
  "agents",
  "contexts",
  "playbooks",
  "skills",
  "sops",
  "scripts",
];

export const ASSET_DIRECTORIES: AssetDirectoryConfig[] = [
  { type: "skill", dir: "skills", manifestFile: "skill.yaml", bodyFile: "skill.md" },
  { type: "agent", dir: "agents", manifestFile: "agent.yaml", bodyFile: "agent.md" },
  { type: "sop", dir: "sops", manifestFile: "sop.yaml", bodyFile: "sop.md" },
  {
    type: "playbook",
    dir: "playbooks",
    manifestFile: "playbook.yaml",
    bodyFile: "playbook.md",
  },
];

export const ADAPTER_RUNTIME_LABELS: Record<AdapterId, string> = {
  generic: "generic",
  codex: "codex",
  chatgpt: "chat-gpt",
  vscode: "vscode",
  "github-copilot": "github-copilot",
};
