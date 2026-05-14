import path from "node:path";
import { renderSecurityBanner } from "../security.ts";
import type { ExportResult, ResolvedAssetBundle, ScenarioInput } from "../types.ts";
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
