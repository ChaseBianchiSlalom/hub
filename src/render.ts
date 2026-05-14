import path from "node:path";
import { renderSecurityBanner } from "./security.ts";
import type { AssetDocument, ResolvedAssetBundle, ScenarioInput } from "./types.ts";
import { assetRef, formatContextValue, formatList } from "./utils.ts";

function renderAssetSection(asset: AssetDocument): string {
  return [
    `## ${asset.manifest.title}`,
    `Type: ${asset.manifest.type}`,
    `ID: ${asset.manifest.id}`,
    `Owner: ${asset.manifest.owner}`,
    `Description: ${asset.manifest.description}`,
    `Sensitivity: ${asset.manifest.sensitivity}`,
    `Source: ${path.relative(process.cwd(), asset.dir)}`,
    "",
    asset.body,
  ].join("\n");
}

export function renderAssetList(assets: AssetDocument[]): string {
  const grouped = new Map<string, AssetDocument[]>();

  for (const asset of assets) {
    const items = grouped.get(asset.manifest.type) ?? [];
    items.push(asset);
    grouped.set(asset.manifest.type, items);
  }

  const sections: string[] = [];
  for (const [type, items] of grouped.entries()) {
    sections.push(`${type}s`);
    sections.push(...items.map((asset) => `- ${asset.manifest.id}: ${asset.manifest.title}`));
    sections.push("");
  }

  return sections.join("\n").trim();
}

export function renderResolvedBundle(bundle: ResolvedAssetBundle): string {
  return [
    `Root Asset: ${assetRef(bundle.root)}`,
    `Title: ${bundle.root.manifest.title}`,
    `Description: ${bundle.root.manifest.description}`,
    "",
    "Dependency Order:",
    formatList(bundle.ordered.map((asset) => assetRef(asset))),
  ].join("\n");
}

export function renderScenarioSummary(scenario: ScenarioInput): string {
  const contextLines = Object.entries(scenario.context).map(
    ([key, value]) => `- ${key}: ${formatContextValue(value)}`,
  );

  return [
    `Scenario: ${scenario.scenario_id}`,
    `Asset: ${scenario.asset_id}`,
    `Goal: ${scenario.goal}`,
    `Sensitivity: ${scenario.sensitivity}`,
    scenario.target_task ? `Target Task: ${scenario.target_task}` : "",
    scenario.repository_summary ? `Repository Summary: ${scenario.repository_summary}` : "",
    "",
    "Context:",
    contextLines.length > 0 ? contextLines.join("\n") : "- none",
    "",
    "Constraints:",
    formatList(scenario.constraints),
  ]
    .filter(Boolean)
    .join("\n");
}

export function renderDemo(bundle: ResolvedAssetBundle, scenario: ScenarioInput): string {
  return [
    `# Demo: ${bundle.root.manifest.title}`,
    "",
    renderScenarioSummary(scenario),
    "",
    renderSecurityBanner(bundle.ordered, scenario),
    "",
    "Resolved Assets:",
    formatList(bundle.ordered.map((asset) => assetRef(asset))),
    "",
    "Assembled Instructions:",
    "",
    ...bundle.ordered.map((asset) => renderAssetSection(asset)),
  ].join("\n");
}
