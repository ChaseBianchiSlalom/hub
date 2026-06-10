import fs from "node:fs";
import path from "node:path";
import {
  exportGitHubCopilotHubBundle,
  renderGitHubCopilotHubInstructions,
} from "./adapters/github-copilot.ts";
import type { AssetDocument, ExportResult } from "./types.ts";
import { writeTextFile } from "./utils.ts";

const MANAGED_BLOCK_START = "<!-- adobe-ai-hub:start -->";
const MANAGED_BLOCK_END = "<!-- adobe-ai-hub:end -->";

export interface GitHubCopilotGlobalInstallResult extends ExportResult {
  copilotHome: string;
  jetbrainsConfigDir: string;
  vscodeInstructionsPath: string;
  jetbrainsInstructionsPath: string;
  supportDir: string;
}

export function defaultCopilotHome(): string {
  const copilotHome = process.env.COPILOT_HOME;
  if (copilotHome && copilotHome.length > 0) {
    return path.resolve(copilotHome);
  }

  const home = process.env.HOME;
  if (!home) {
    throw new Error("HOME is not set; cannot determine GitHub Copilot home.");
  }

  return path.join(home, ".copilot");
}

export function defaultJetBrainsCopilotConfigDir(): string {
  const home = process.env.HOME;
  if (!home) {
    throw new Error("HOME is not set; cannot determine JetBrains Copilot config location.");
  }

  return path.join(home, ".config", "github-copilot", "intellij");
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

function buildGlobalInstructionBlock(assets: AssetDocument[], supportDir: string): string {
  const assetLinkPrefix = path
    .join(supportDir, ".github", "ai-hub")
    .split(path.sep)
    .join("/");

  return [
    "<!-- Generated. Edit the AI Hub repo, not this block. -->",
    "",
    renderGitHubCopilotHubInstructions(assets, assetLinkPrefix),
  ].join("\n");
}

function buildVsCodeUserInstructions(assets: AssetDocument[], supportDir: string): string {
  return [
    "---",
    "name: 'Adobe AI Hub'",
    "description: 'Team AI Hub operating assets for GitHub Copilot'",
    "applyTo: '**'",
    "---",
    "",
    buildGlobalInstructionBlock(assets, supportDir),
  ].join("\n");
}

export function installGitHubCopilotGlobalHub(
  assets: AssetDocument[],
  requestedCopilotHome?: string,
  requestedJetBrainsConfigDir?: string,
): GitHubCopilotGlobalInstallResult {
  const copilotHome = path.resolve(requestedCopilotHome ?? defaultCopilotHome());
  const jetbrainsConfigDir = path.resolve(
    requestedJetBrainsConfigDir ?? defaultJetBrainsCopilotConfigDir(),
  );
  const supportDir = path.join(copilotHome, "ai-hub", "current");
  const bundleResult = exportGitHubCopilotHubBundle(assets, supportDir);

  const vscodeInstructionsPath = path.join(
    copilotHome,
    "instructions",
    "adobe-ai-hub.instructions.md",
  );
  const jetbrainsInstructionsPath = path.join(jetbrainsConfigDir, "global-copilot-instructions.md");

  const files = [...bundleResult.files];
  files.push(
    writeTextFile(vscodeInstructionsPath, `${buildVsCodeUserInstructions(assets, supportDir)}\n`),
  );

  const existingJetBrains = fs.existsSync(jetbrainsInstructionsPath)
    ? fs.readFileSync(jetbrainsInstructionsPath, "utf8")
    : "";
  files.push(
    writeTextFile(
      jetbrainsInstructionsPath,
      upsertManagedBlock(existingJetBrains, buildGlobalInstructionBlock(assets, supportDir)),
    ),
  );

  return {
    adapter: "github-copilot",
    outDir: copilotHome,
    files,
    copilotHome,
    jetbrainsConfigDir,
    vscodeInstructionsPath,
    jetbrainsInstructionsPath,
    supportDir,
  };
}
