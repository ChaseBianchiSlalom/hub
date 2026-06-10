import fs from "node:fs";
import path from "node:path";
import {
  exportClaudeCodeBundle,
  exportClaudeCodeHubBundle,
  renderClaudeCodeHubMemoryDocument,
  renderClaudeCodeMemoryDocument,
} from "./adapters/claude-code.ts";
import type { AssetDocument, ExportResult, ResolvedAssetBundle, ScenarioInput } from "./types.ts";
import { writeTextFile } from "./utils.ts";

const MANAGED_BLOCK_START = "<!-- adobe-ai-hub:start -->";
const MANAGED_BLOCK_END = "<!-- adobe-ai-hub:end -->";

export interface ClaudeCodeGlobalInstallResult extends ExportResult {
  claudeHome: string;
  memoryPath: string;
  supportDir: string;
  preservedUserContent: boolean;
}

export function defaultClaudeHome(): string {
  const claudeHome = process.env.CLAUDE_HOME;
  if (claudeHome && claudeHome.length > 0) {
    return path.resolve(claudeHome);
  }

  const home = process.env.HOME;
  if (!home) {
    throw new Error("HOME is not set; cannot determine Claude Code home.");
  }

  return path.join(home, ".claude");
}

function stripLeadingHeading(markdown: string): string {
  return markdown.replace(/^# CLAUDE\.md\s*\n?/, "").replace(/^\n+/, "");
}

function upsertManagedBlock(existing: string, block: string): string {
  const managed = `${MANAGED_BLOCK_START}\n${block.trim()}\n${MANAGED_BLOCK_END}\n`;
  const trimmedExisting = existing.trimEnd();

  if (trimmedExisting.includes(MANAGED_BLOCK_START) && trimmedExisting.includes(MANAGED_BLOCK_END)) {
    return trimmedExisting.replace(
      new RegExp(`${MANAGED_BLOCK_START}[\\s\\S]*?${MANAGED_BLOCK_END}\\n?`, "m"),
      managed,
    );
  }

  if (trimmedExisting.length === 0) {
    return managed;
  }

  return `${trimmedExisting}\n\n${managed}`;
}

function generatedHeader(): string {
  return [
    "<!-- Generated. Edit the AI Hub repo, not this block. -->",
    "",
  ].join("\n");
}

function toImportPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

export function installClaudeCodeGlobalBundle(
  bundle: ResolvedAssetBundle,
  scenario: ScenarioInput,
  requestedClaudeHome?: string,
): ClaudeCodeGlobalInstallResult {
  const claudeHome = path.resolve(requestedClaudeHome ?? defaultClaudeHome());
  const supportDir = path.join(claudeHome, "ai-hub", "current");
  const assetImportPrefix = toImportPath(path.join(supportDir, "context", "assets"));
  const bundleResult = exportClaudeCodeBundle(bundle, scenario, supportDir);
  const memoryPath = path.join(claudeHome, "CLAUDE.md");
  const existingMemory = fs.existsSync(memoryPath) ? fs.readFileSync(memoryPath, "utf8") : "";
  const generatedBlock = [
    generatedHeader(),
    stripLeadingHeading(
      renderClaudeCodeMemoryDocument(bundle, scenario, {
        heading: "# CLAUDE.md",
        assetImportPrefix,
      }),
    ),
  ].join("\n");

  const nextMemory = upsertManagedBlock(existingMemory, generatedBlock);
  const files = [...bundleResult.files];
  files.push(writeTextFile(memoryPath, nextMemory));

  return {
    adapter: "claude-code",
    outDir: claudeHome,
    files,
    claudeHome,
    memoryPath,
    supportDir,
    preservedUserContent: existingMemory.trim().length > 0,
  };
}

export function installClaudeCodeGlobalHub(
  assets: AssetDocument[],
  requestedClaudeHome?: string,
): ClaudeCodeGlobalInstallResult {
  const claudeHome = path.resolve(requestedClaudeHome ?? defaultClaudeHome());
  const supportDir = path.join(claudeHome, "ai-hub", "current");
  const assetImportPrefix = toImportPath(path.join(supportDir, "context", "assets"));
  const bundleResult = exportClaudeCodeHubBundle(assets, supportDir);
  const memoryPath = path.join(claudeHome, "CLAUDE.md");
  const existingMemory = fs.existsSync(memoryPath) ? fs.readFileSync(memoryPath, "utf8") : "";
  const generatedBlock = [
    generatedHeader(),
    stripLeadingHeading(
      renderClaudeCodeHubMemoryDocument(assets, {
        heading: "# CLAUDE.md",
        assetImportPrefix,
      }),
    ),
  ].join("\n");

  const nextMemory = upsertManagedBlock(existingMemory, generatedBlock);
  const files = [...bundleResult.files];
  files.push(writeTextFile(memoryPath, nextMemory));

  return {
    adapter: "claude-code",
    outDir: claudeHome,
    files,
    claudeHome,
    memoryPath,
    supportDir,
    preservedUserContent: existingMemory.trim().length > 0,
  };
}
