import path from "node:path";
import { renderSecurityBanner } from "../security.ts";
import type { ExportResult, ResolvedAssetBundle, ScenarioInput } from "../types.ts";
import { assetRef, formatList, writeJsonFile, writeTextFile } from "../utils.ts";

function buildPromptStarters(bundle: ResolvedAssetBundle, scenario: ScenarioInput): string[] {
  return [
    `Use ${bundle.root.manifest.title} to help me with: ${scenario.goal}`,
    `Walk me through the dependency order for ${bundle.root.manifest.id}.`,
    `Apply ${bundle.root.manifest.id} to this task with the current constraints.`,
    `Summarize the highest-risk decisions in this workflow before I execute it.`,
  ];
}

export function exportChatGptBundle(
  bundle: ResolvedAssetBundle,
  scenario: ScenarioInput,
  outDir: string,
): ExportResult {
  const files: string[] = [];
  const promptStarters = buildPromptStarters(bundle, scenario);

  const instructions = [
    `# ${bundle.root.manifest.title} GPT Instructions`,
    "",
    "## Role",
    `You are operating as ${bundle.root.manifest.title} for the Adobe AI Hub team.`,
    "",
    "## Primary Goal",
    scenario.goal,
    "",
    renderSecurityBanner(bundle.ordered, scenario),
    "",
    "## Root Asset",
    `- ${assetRef(bundle.root)}`,
    `- ${bundle.root.manifest.description}`,
    "",
    "## Dependency Assets",
    formatList(bundle.dependencies.map((asset) => assetRef(asset))),
    "",
    "## Constraints",
    formatList(scenario.constraints),
    "",
    "## Operating Rule",
    "Use the uploaded knowledge files as the canonical source of truth for this workflow.",
  ].join("\n");

  files.push(writeTextFile(path.join(outDir, "gpt-instructions.md"), `${instructions}\n`));
  files.push(writeJsonFile(path.join(outDir, "prompt-starters.json"), promptStarters));

  const readme = [
    "# ChatGPT Custom GPT Bundle",
    "",
    "1. Create or edit a custom GPT.",
    "2. Paste `gpt-instructions.md` into the GPT instructions field.",
    "3. Add the files in `knowledge/` as GPT knowledge/context.",
    "4. Use the prompt starters from `prompt-starters.json` as suggested conversation openers.",
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
        path.join(outDir, "knowledge", `${asset.manifest.type}-${asset.manifest.id}.md`),
        contents,
      ),
    );
  }

  const scenarioMd = [
    "# Scenario Context",
    "",
    `Scenario: ${scenario.scenario_id}`,
    `Goal: ${scenario.goal}`,
    "",
    "Constraints:",
    formatList(scenario.constraints),
  ].join("\n");
  files.push(writeTextFile(path.join(outDir, "knowledge", "scenario-context.md"), `${scenarioMd}\n`));

  return {
    adapter: "chatgpt",
    outDir,
    files,
  };
}
