import path from "node:path";
import { renderSecurityBanner } from "../security.ts";
import type { AssetDocument, ExportResult, ResolvedAssetBundle, ScenarioInput } from "../types.ts";
import { assetRef, formatList, writeTextFile } from "../utils.ts";

interface CodexAgentsRenderOptions {
  heading?: string;
  assetLinkPrefix?: string;
}

export function renderCodexAgentsDocument(
  bundle: ResolvedAssetBundle,
  scenario: ScenarioInput,
  options: CodexAgentsRenderOptions = {},
): string {
  const heading = options.heading ?? "# AGENTS.md";
  const assetLinkPrefix = options.assetLinkPrefix ?? "./context/assets";

  const assetLinks = bundle.ordered.map(
    (asset) =>
      `- [${assetRef(asset)}](${assetLinkPrefix}/${asset.manifest.type}-${asset.manifest.id}.md)`,
  );

  return [
    heading,
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
    "## Supporting Files",
    assetLinks.join("\n"),
    "",
    "## How To Use",
    "Start from the root asset, then pull in the referenced dependency files as needed.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function exportCodexBundle(
  bundle: ResolvedAssetBundle,
  scenario: ScenarioInput,
  outDir: string,
): ExportResult {
  const files: string[] = [];
  const agentsMd = renderCodexAgentsDocument(bundle, scenario);

  files.push(writeTextFile(path.join(outDir, "AGENTS.md"), `${agentsMd}\n`));

  const scenarioMd = [
    "# Scenario",
    "",
    `Scenario: ${scenario.scenario_id}`,
    `Asset: ${scenario.asset_id}`,
    `Goal: ${scenario.goal}`,
    "",
    "Constraints:",
    formatList(scenario.constraints),
  ].join("\n");
  files.push(writeTextFile(path.join(outDir, "context", "scenario.md"), `${scenarioMd}\n`));

  for (const asset of bundle.ordered) {
    const contents = [
      `# ${asset.manifest.title}`,
      "",
      `Ref: ${assetRef(asset)}`,
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

  return {
    adapter: "codex",
    outDir,
    files,
  };
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

export function renderCodexHubAgentsDocument(assets: AssetDocument[]): string {
  const supportLinks = assets.map(
    (asset) =>
      `- [${assetRef(asset)}](./context/assets/${asset.manifest.type}-${asset.manifest.id}.md)`,
  );

  const inlineAssetSections = assets.map((asset) =>
    [
      `## ${asset.manifest.title}`,
      "",
      `Ref: ${assetRef(asset)}`,
      `Description: ${asset.manifest.description}`,
      `Sensitivity: ${asset.manifest.sensitivity}`,
      asset.manifest.dependencies.length > 0
        ? ["Dependencies:", formatList(asset.manifest.dependencies)].join("\n")
        : "Dependencies: none",
      "",
      asset.body,
    ].join("\n"),
  );

  return [
    "# AGENTS.md",
    "",
    "## Adobe AI Hub",
    "",
    "Use these team assets as global guidance for Codex work. User-authored instructions outside the managed AI Hub block remain authoritative when conflicts arise.",
    "",
    "## Asset Index",
    "",
    groupAssetsByType(assets),
    "",
    "## Supporting Files",
    supportLinks.join("\n"),
    "",
    "## Security And Use Policy",
    "- Use only approved runtimes for sensitive input.",
    "- Review AI output carefully before relying on it.",
    "- Do not treat generated content as final without human validation.",
    "",
    "## Canonical Assets",
    "",
    ...inlineAssetSections,
  ].join("\n");
}

export function exportCodexHubBundle(assets: AssetDocument[], outDir: string): ExportResult {
  const files: string[] = [];

  files.push(writeTextFile(path.join(outDir, "AGENTS.md"), `${renderCodexHubAgentsDocument(assets)}\n`));

  for (const asset of assets) {
    const contents = [
      `# ${asset.manifest.title}`,
      "",
      `Ref: ${assetRef(asset)}`,
      `Description: ${asset.manifest.description}`,
      `Sensitivity: ${asset.manifest.sensitivity}`,
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

  return {
    adapter: "codex",
    outDir,
    files,
  };
}
