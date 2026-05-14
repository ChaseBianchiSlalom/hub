import path from "node:path";
import { renderSecurityBanner } from "../security.ts";
import type { ExportResult, ResolvedAssetBundle, ScenarioInput } from "../types.ts";
import { assetRef, formatList, writeJsonFile, writeTextFile } from "../utils.ts";

function buildRepositoryInstructions(bundle: ResolvedAssetBundle, scenario: ScenarioInput): string {
  return [
    `# GitHub Copilot Instructions for ${bundle.root.manifest.title}`,
    "",
    "## Canonical Workflow Goal",
    scenario.goal,
    "",
    "## Root Asset",
    `- ${assetRef(bundle.root)}`,
    `- ${bundle.root.manifest.description}`,
    "",
    renderSecurityBanner(bundle.ordered, scenario),
    "",
    "## Dependency Order",
    formatList(bundle.ordered.map((asset) => assetRef(asset))),
    "",
    "## Working Rules",
    "- Treat the referenced markdown files in `.github/ai-hub/` as the canonical workflow context for this task.",
    "- Use the dependency order when deciding what to load first.",
    "- Keep recommendations aligned to the scenario constraints and the selected asset intent.",
    "- Prefer the smallest useful next step rather than broad speculative plans.",
    "",
    "## Scenario Constraints",
    formatList(scenario.constraints),
  ].join("\n");
}

function buildPromptFile(bundle: ResolvedAssetBundle, scenario: ScenarioInput): string {
  return [
    "---",
    "mode: 'agent'",
    `description: 'Run the ${bundle.root.manifest.id} workflow with the current scenario context'`,
    "---",
    "",
    `Use the \`${bundle.root.manifest.id}\` workflow for this task:`,
    "",
    `${scenario.goal}`,
    "",
    "Load and follow these workflow assets in order:",
    formatList(bundle.ordered.map((asset) => assetRef(asset))),
    "",
    "Constraints to honor:",
    formatList(scenario.constraints),
    "",
    "Before proposing changes, summarize:",
    "- the likely first step",
    "- the main risks or missing information",
    "- the next concrete action to take",
  ].join("\n");
}

export function exportGitHubCopilotBundle(
  bundle: ResolvedAssetBundle,
  scenario: ScenarioInput,
  outDir: string,
): ExportResult {
  const files: string[] = [];
  const rootDir = path.join(outDir, ".github");

  files.push(
    writeTextFile(
      path.join(rootDir, "copilot-instructions.md"),
      `${buildRepositoryInstructions(bundle, scenario)}\n`,
    ),
  );

  files.push(
    writeTextFile(
      path.join(rootDir, "prompts", `${bundle.root.manifest.id}.prompt.md`),
      `${buildPromptFile(bundle, scenario)}\n`,
    ),
  );

  const usage = [
    "# GitHub Copilot Bundle",
    "",
    "This export targets GitHub Copilot repository custom instructions and prompt files.",
    "",
    "Files included:",
    "- `.github/copilot-instructions.md` for repository-wide guidance",
    `- \`.github/prompts/${bundle.root.manifest.id}.prompt.md\` for a reusable task entrypoint`,
    "- `.github/ai-hub/` for canonical supporting context",
    "",
    "Usage in VS Code or JetBrains with Copilot:",
    `1. Copy or merge the generated \`.github/\` folder into the target repository.`,
    "2. Ensure Copilot instruction files are enabled in the IDE.",
    `3. Open Copilot Chat and run \`/${bundle.root.manifest.id}\` if prompt files are available, or reference the prompt file manually.`,
    "4. Confirm `.github/copilot-instructions.md` appears in the response references list.",
  ].join("\n");
  files.push(writeTextFile(path.join(outDir, "README.md"), `${usage}\n`));

  files.push(writeJsonFile(path.join(outDir, "scenario.json"), scenario));

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
        path.join(rootDir, "ai-hub", `${asset.manifest.type}-${asset.manifest.id}.md`),
        contents,
      ),
    );
  }

  return {
    adapter: "github-copilot",
    outDir,
    files,
  };
}
