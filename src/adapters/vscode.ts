import path from "node:path";
import { renderSecurityBanner } from "../security.ts";
import type { ExportResult, ResolvedAssetBundle, ScenarioInput } from "../types.ts";
import { assetRef, formatList, writeTextFile } from "../utils.ts";

export function exportVsCodeBundle(
  bundle: ResolvedAssetBundle,
  scenario: ScenarioInput,
  outDir: string,
): ExportResult {
  const files: string[] = [];

  const workspaceContext = [
    "# Workspace Context",
    "",
    `Root asset: ${assetRef(bundle.root)}`,
    `Scenario: ${scenario.scenario_id}`,
    `Goal: ${scenario.goal}`,
    scenario.repository_summary ? `Repository summary: ${scenario.repository_summary}` : "",
    "",
    renderSecurityBanner(bundle.ordered, scenario),
    "",
    "Resolved asset order:",
    formatList(bundle.ordered.map((asset) => assetRef(asset))),
  ]
    .filter(Boolean)
    .join("\n");
  files.push(writeTextFile(path.join(outDir, "workspace-context.md"), `${workspaceContext}\n`));

  const mainPrompt = [
    "# Main Prompt",
    "",
    `Use the ${bundle.root.manifest.title} workflow to help with this goal:`,
    scenario.goal,
    "",
    "Load these supporting assets in order:",
    formatList(bundle.ordered.map((asset) => assetRef(asset))),
    "",
    "Respect these constraints:",
    formatList(scenario.constraints),
  ].join("\n");
  files.push(writeTextFile(path.join(outDir, "prompts", "main.prompt.md"), `${mainPrompt}\n`));

  const followUpPrompt = [
    "# Follow-up Prompt",
    "",
    "Based on the resolved workflow assets, tell me:",
    "- what I should do first",
    "- what dependencies or risks I should resolve next",
    "- what information is still missing before I execute",
  ].join("\n");
  files.push(
    writeTextFile(path.join(outDir, "prompts", "follow-up.prompt.md"), `${followUpPrompt}\n`),
  );

  const readme = [
    "# VS Code Prompt Pack",
    "",
    "Use this bundle in a VS Code chat workflow by opening `workspace-context.md` and the files in `prompts/` alongside the canonical repo assets.",
    "",
    "Recommended sequence:",
    "1. Start with `workspace-context.md`.",
    "2. Paste or reference `prompts/main.prompt.md` in chat.",
    "3. Use `prompts/follow-up.prompt.md` for a tighter next-step pass.",
  ].join("\n");
  files.push(writeTextFile(path.join(outDir, "README.md"), `${readme}\n`));

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
        path.join(outDir, "assets", `${asset.manifest.type}-${asset.manifest.id}.md`),
        contents,
      ),
    );
  }

  return {
    adapter: "vscode",
    outDir,
    files,
  };
}
