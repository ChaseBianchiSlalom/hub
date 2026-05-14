import fs from "node:fs";
import path from "node:path";
import { exportCodexBundle, renderCodexAgentsDocument } from "./adapters/codex.ts";
import type { ExportResult, ResolvedAssetBundle, ScenarioInput } from "./types.ts";
import { writeTextFile } from "./utils.ts";

const MANAGED_BLOCK_START = "<!-- adobe-ai-hub:start -->";
const MANAGED_BLOCK_END = "<!-- adobe-ai-hub:end -->";

export interface CodexGlobalInstallResult extends ExportResult {
  codexHome: string;
  agentsPath: string;
  supportDir: string;
  preservedUserContent: boolean;
}

export function defaultCodexHome(): string {
  const codexHome = process.env.CODEX_HOME;
  if (codexHome && codexHome.length > 0) {
    return path.resolve(codexHome);
  }

  const home = process.env.HOME;
  if (!home) {
    throw new Error("HOME is not set; cannot determine Codex home.");
  }

  return path.join(home, ".codex");
}

function stripLeadingHeading(markdown: string): string {
  return markdown.replace(/^# AGENTS\.md\s*\n?/, "").replace(/^\n+/, "");
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

export function installCodexGlobalBundle(
  bundle: ResolvedAssetBundle,
  scenario: ScenarioInput,
  requestedCodexHome?: string,
): CodexGlobalInstallResult {
  const codexHome = path.resolve(requestedCodexHome ?? defaultCodexHome());
  const supportDir = path.join(codexHome, "ai-hub", "current");
  const bundleResult = exportCodexBundle(bundle, scenario, supportDir);
  const agentsPath = path.join(codexHome, "AGENTS.md");
  const existingAgents = fs.existsSync(agentsPath) ? fs.readFileSync(agentsPath, "utf8") : "";
  const generatedBlock = [
    "## Adobe AI Hub",
    "",
    "<!-- Generated. Edit the AI Hub repo, not this block. -->",
    "",
    stripLeadingHeading(
      renderCodexAgentsDocument(bundle, scenario, {
        heading: "# AI Hub Bundle",
        assetLinkPrefix: "./ai-hub/current/context/assets",
      }),
    ),
  ].join("\n");

  const nextAgents = upsertManagedBlock(existingAgents, generatedBlock);
  const files = [...bundleResult.files];
  files.push(writeTextFile(agentsPath, nextAgents));

  return {
    adapter: "codex",
    outDir: codexHome,
    files,
    codexHome,
    agentsPath,
    supportDir,
    preservedUserContent: existingAgents.trim().length > 0,
  };
}
