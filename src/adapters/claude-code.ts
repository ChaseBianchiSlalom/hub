import path from "node:path";
import { renderSecurityBanner } from "../security.ts";
import type { AssetDocument, ExportResult, ResolvedAssetBundle, ScenarioInput } from "../types.ts";
import { assetRef, formatList, writeTextFile } from "../utils.ts";

interface ClaudeMemoryRenderOptions {
  heading?: string;
  assetImportPrefix?: string;
}

function groupAssetsByType(assets: AssetDocument[]): string {
  const groups = new Map<string, AssetDocument[]>();
  for (const asset of assets) {
    const items = groups.get(asset.manifest.type) ?? [];
    items.push(asset);
    groups.set(asset.manifest.type, items);
  }

  return [...groups.entries()]
    .map(([type, items]) =>
      [`### ${type}s`, "", ...items.map((asset) => `- ${assetRef(asset)}: ${asset.manifest.title}`)].join(
        "\n",
      ),
    )
    .join("\n\n");
}

function assetImportPath(prefix: string, asset: AssetDocument): string {
  return `${prefix}/${asset.manifest.type}-${asset.manifest.id}.md`;
}

function renderAssetImportList(assets: AssetDocument[], prefix: string): string {
  return assets.map((asset) => `- ${assetRef(asset)}: @${assetImportPath(prefix, asset)}`).join("\n");
}

export function renderClaudeCodeMemoryDocument(
  bundle: ResolvedAssetBundle,
  scenario: ScenarioInput,
  options: ClaudeMemoryRenderOptions = {},
): string {
  const heading = options.heading ?? "# CLAUDE.md";
  const assetImportPrefix = options.assetImportPrefix ?? "./context/assets";

  return [
    heading,
    "",
    "## Adobe AI Hub",
    "",
    "Use these team assets as Claude Code memory for this task. The canonical source of truth is the AI Hub repo; generated Claude Code files should be regenerated rather than hand-edited.",
    "",
    "## Root Asset",
    `- ${assetRef(bundle.root)}`,
    `- ${bundle.root.manifest.title}`,
    "",
    "## Scenario",
    `- ${scenario.scenario_id}`,
    `- Goal: ${scenario.goal}`,
    scenario.target_task ? `- Target task: ${scenario.target_task}` : "",
    "",
    renderSecurityBanner(bundle.ordered, scenario),
    "",
    "## Dependency Order",
    formatList(bundle.ordered.map((asset) => assetRef(asset))),
    "",
    "## Supporting Memory Imports",
    renderAssetImportList(bundle.ordered, assetImportPrefix),
    "",
    "## Working Rules",
    "- Start from the root asset, then use the dependency order when loading supporting context.",
    "- Separate facts, assumptions, missing information, and risks when the request is ambiguous.",
    "- Prefer the smallest useful next implementation slice and keep validation tied to the change surface.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function renderClaudeCodeHubMemoryDocument(
  assets: AssetDocument[],
  options: ClaudeMemoryRenderOptions = {},
): string {
  const heading = options.heading ?? "# CLAUDE.md";
  const assetImportPrefix = options.assetImportPrefix ?? "./context/assets";

  return [
    heading,
    "",
    "## Adobe AI Hub",
    "",
    "Use these team assets as durable guidance for Claude Code work. The canonical source of truth is the AI Hub repo; generated Claude Code memory should be regenerated rather than hand-edited.",
    "",
    "## Asset Index",
    "",
    groupAssetsByType(assets),
    "",
    "## Supporting Memory Imports",
    renderAssetImportList(assets, assetImportPrefix),
    "",
    "## Security And Use Policy",
    "- Use only approved runtimes for sensitive input.",
    "- Review AI output carefully before relying on it.",
    "- Do not treat generated content as final without human validation.",
    "",
    "## Working Rules",
    "- Select the AI Hub asset that best matches the user's request before planning or editing.",
    "- Load declared dependencies before recommending implementation work.",
    "- Keep recommendations aligned to asset intent, sensitivity, and review requirements.",
  ].join("\n");
}

function writeScenarioFile(scenario: ScenarioInput, outDir: string): string {
  const scenarioMd = [
    "# Scenario",
    "",
    `Scenario: ${scenario.scenario_id}`,
    `Asset: ${scenario.asset_id}`,
    `Goal: ${scenario.goal}`,
    scenario.target_task ? `Target task: ${scenario.target_task}` : "",
    scenario.repository_summary ? `Repository summary: ${scenario.repository_summary}` : "",
    "",
    "Constraints:",
    formatList(scenario.constraints),
  ]
    .filter(Boolean)
    .join("\n");

  return writeTextFile(path.join(outDir, "context", "scenario.md"), `${scenarioMd}\n`);
}

function writeSupportingAssets(assets: AssetDocument[], outDir: string): string[] {
  const files: string[] = [];

  for (const asset of assets) {
    const contents = [
      `# ${asset.manifest.title}`,
      "",
      `Ref: ${assetRef(asset)}`,
      `Description: ${asset.manifest.description}`,
      `Sensitivity: ${asset.manifest.sensitivity}`,
      asset.manifest.dependencies.length > 0
        ? ["Dependencies:", formatList(asset.manifest.dependencies)].join("\n")
        : "Dependencies: none",
      "",
      asset.body,
      "",
    ].join("\n");

    files.push(
      writeTextFile(
        path.join(outDir, "context", "assets", `${asset.manifest.type}-${asset.manifest.id}.md`),
        contents,
      ),
    );
  }

  return files;
}

export function exportClaudeCodeBundle(
  bundle: ResolvedAssetBundle,
  scenario: ScenarioInput,
  outDir: string,
): ExportResult {
  const files: string[] = [];

  files.push(writeTextFile(path.join(outDir, "CLAUDE.md"), `${renderClaudeCodeMemoryDocument(bundle, scenario)}\n`));
  files.push(writeScenarioFile(scenario, outDir));
  files.push(...writeSupportingAssets(bundle.ordered, outDir));

  return {
    adapter: "claude-code",
    outDir,
    files,
  };
}

export function exportClaudeCodeHubBundle(assets: AssetDocument[], outDir: string): ExportResult {
  const files: string[] = [];

  files.push(writeTextFile(path.join(outDir, "CLAUDE.md"), `${renderClaudeCodeHubMemoryDocument(assets)}\n`));
  files.push(...writeSupportingAssets(assets, outDir));

  return {
    adapter: "claude-code",
    outDir,
    files,
  };
}
