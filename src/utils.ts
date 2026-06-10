import fs from "node:fs";
import path from "node:path";
import type { AdapterId, AssetDocument, ScenarioContextValue } from "./types.ts";
import { ADAPTER_RUNTIME_LABELS } from "./constants.ts";

export function ensureDirectory(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function writeTextFile(filePath: string, contents: string): string {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, contents, "utf8");
  return filePath;
}

export function writeJsonFile(filePath: string, value: unknown): string {
  return writeTextFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function formatList(items: string[]): string {
  if (items.length === 0) {
    return "- none";
  }

  return items.map((item) => `- ${item}`).join("\n");
}

export function formatContextValue(value: ScenarioContextValue): string {
  if (Array.isArray(value)) {
    return value.join("; ");
  }

  return value;
}

export function assetRef(asset: AssetDocument): string {
  return `${asset.manifest.type}:${asset.manifest.id}`;
}

export function toTitleCase(value: string): string {
  return value
    .split(/[-\s]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function adapterDisplayName(adapter: AdapterId): string {
  switch (adapter) {
    case "generic":
      return "Generic";
    case "codex":
      return "Codex";
    case "claude-code":
      return "Claude Code";
    case "chatgpt":
      return "ChatGPT";
    case "vscode":
      return "VS Code";
    case "github-copilot":
      return "GitHub Copilot";
  }
}

export function isCompatibleWithAdapter(asset: AssetDocument, adapter: AdapterId): boolean {
  if (adapter === "generic") {
    return true;
  }

  const runtimeLabel = ADAPTER_RUNTIME_LABELS[adapter];
  return asset.manifest.compatible_runtimes.includes(runtimeLabel);
}
