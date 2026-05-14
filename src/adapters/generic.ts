import path from "node:path";
import { renderSecurityBanner } from "../security.ts";
import type { ExportResult, ResolvedAssetBundle, ScenarioInput } from "../types.ts";
import { assetRef, writeJsonFile, writeTextFile } from "../utils.ts";

export function exportGenericBundle(
  bundle: ResolvedAssetBundle,
  scenario: ScenarioInput,
  outDir: string,
): ExportResult {
  const files: string[] = [];
  const manifest = {
    adapter: "generic",
    root_asset: assetRef(bundle.root),
    scenario_id: scenario.scenario_id,
    goal: scenario.goal,
    sensitivity: scenario.sensitivity,
    dependency_order: bundle.ordered.map((asset) => assetRef(asset)),
    assets: bundle.ordered.map((asset) => ({
      ref: assetRef(asset),
      title: asset.manifest.title,
      body_file: `assets/${asset.manifest.type}-${asset.manifest.id}.md`,
      dependencies: asset.manifest.dependencies,
    })),
  };

  files.push(writeJsonFile(path.join(outDir, "bundle.json"), manifest));
  files.push(writeJsonFile(path.join(outDir, "scenario.json"), scenario));

  const readme = [
    "# Generic Bundle",
    "",
    `Root asset: ${assetRef(bundle.root)}`,
    `Scenario: ${scenario.scenario_id}`,
    "",
    renderSecurityBanner(bundle.ordered, scenario),
    "",
    "This bundle is intentionally simple:",
    "- `bundle.json` is the machine-readable entrypoint.",
    "- `assets/` contains the resolved markdown content.",
    "- `scenario.json` captures the input context used to assemble the bundle.",
  ].join("\n");
  files.push(writeTextFile(path.join(outDir, "README.md"), `${readme}\n`));

  for (const asset of bundle.ordered) {
    const contents = [
      `# ${asset.manifest.title}`,
      "",
      `Ref: ${assetRef(asset)}`,
      `Description: ${asset.manifest.description}`,
      "",
      asset.body,
      "",
    ].join("\n");

    files.push(
      writeTextFile(
        path.join(outDir, "assets", `${asset.manifest.type}-${asset.manifest.id}.md`),
        contents,
      ),
    );
  }

  return {
    adapter: "generic",
    outDir,
    files,
  };
}
