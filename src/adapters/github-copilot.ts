import path from "node:path";
import { renderSecurityBanner } from "../security.ts";
import type { AssetDocument, ExportResult, ResolvedAssetBundle, ScenarioInput } from "../types.ts";
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

export function renderGitHubCopilotHubInstructions(
  assets: AssetDocument[],
  assetLinkPrefix = ".github/ai-hub",
): string {
  const supportLinks = assets.map(
    (asset) =>
      `- [${assetRef(asset)}](${assetLinkPrefix}/${asset.manifest.type}-${asset.manifest.id}.md)`,
  );

  return [
    "# Adobe AI Hub",
    "",
    "Use these team assets as durable guidance for GitHub Copilot Chat, Copilot coding agent, and Copilot code review.",
    "The canonical source of truth is the AI Hub repo; generated Copilot files should be regenerated rather than hand-edited.",
    "",
    "## Asset Index",
    "",
    groupAssetsByType(assets),
    "",
    "## Working Rules",
    "- Start from the asset that best matches the user's task, then load its declared dependencies before recommending implementation work.",
    "- Separate known facts, assumptions, missing information, and delivery risks when the request is ambiguous.",
    "- Prefer the smallest useful next implementation slice and keep validation tied to the change surface.",
    "- Preserve user-authored project instructions outside generated AI Hub files when conflicts appear.",
    "",
    "## Security And Use Policy",
    "- Use only approved runtimes for sensitive input.",
    "- Review AI output carefully before relying on it.",
    "- Do not treat generated content as final without human validation.",
    "",
    "## Supporting Files",
    supportLinks.join("\n"),
  ].join("\n");
}

function buildHubPromptFile(assets: AssetDocument[]): string {
  return [
    "---",
    "mode: 'agent'",
    "description: 'Use Adobe AI Hub assets to frame, plan, and execute the current task'",
    "---",
    "",
    "Use the Adobe AI Hub workflow assets for this task.",
    "",
    "Start by selecting the most relevant asset from this index:",
    groupAssetsByType(assets),
    "",
    "Before proposing or editing code, summarize:",
    "- the selected root asset and why it fits",
    "- the dependency assets you need to follow",
    "- the smallest useful next action",
    "- the highest delivery or validation risks",
  ].join("\n");
}

function buildWorkspaceInstructionFile(assets: AssetDocument[]): string {
  return [
    "---",
    "applyTo: \"**\"",
    "---",
    "",
    renderGitHubCopilotHubInstructions(assets, "../ai-hub"),
  ].join("\n");
}

function writeSupportingAssets(assets: AssetDocument[], rootDir: string): string[] {
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
        path.join(rootDir, "ai-hub", `${asset.manifest.type}-${asset.manifest.id}.md`),
        contents,
      ),
    );
  }

  return files;
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
      path.join(rootDir, "instructions", `${bundle.root.manifest.id}.instructions.md`),
      [
        "---",
        "applyTo: \"**\"",
        "---",
        "",
        `Use the \`${assetRef(bundle.root)}\` Adobe AI Hub workflow for matching tasks.`,
        "Load these supporting assets in order:",
        formatList(bundle.ordered.map((asset) => assetRef(asset))),
        "",
        "Use the repository-wide `.github/copilot-instructions.md` file for the full scenario context.",
      ].join("\n") + "\n",
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
    `- \`.github/instructions/${bundle.root.manifest.id}.instructions.md\` for workspace-wide path instructions`,
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

  files.push(...writeSupportingAssets(bundle.ordered, rootDir));

  return {
    adapter: "github-copilot",
    outDir,
    files,
  };
}

export function exportGitHubCopilotHubBundle(assets: AssetDocument[], outDir: string): ExportResult {
  const files: string[] = [];
  const rootDir = path.join(outDir, ".github");

  files.push(
    writeTextFile(
      path.join(rootDir, "copilot-instructions.md"),
      `${renderGitHubCopilotHubInstructions(assets)}\n`,
    ),
  );
  files.push(
    writeTextFile(
      path.join(rootDir, "instructions", "adobe-ai-hub.instructions.md"),
      `${buildWorkspaceInstructionFile(assets)}\n`,
    ),
  );
  files.push(
    writeTextFile(path.join(rootDir, "prompts", "adobe-ai-hub.prompt.md"), `${buildHubPromptFile(assets)}\n`),
  );
  files.push(...writeSupportingAssets(assets, rootDir));

  const usage = [
    "# GitHub Copilot Hub Bundle",
    "",
    "This export targets GitHub Copilot in VS Code, JetBrains IDEs, GitHub.com, Copilot coding agent, and Copilot code review.",
    "",
    "Files included:",
    "- `.github/copilot-instructions.md` for repository-wide guidance",
    "- `.github/instructions/adobe-ai-hub.instructions.md` for workspace-wide path instructions",
    "- `.github/prompts/adobe-ai-hub.prompt.md` for a reusable task entrypoint",
    "- `.github/ai-hub/` for canonical supporting context",
    "",
    "Usage:",
    "1. Copy or merge the generated `.github/` folder into the target repository.",
    "2. In VS Code, keep instruction files enabled and enable prompt files if needed.",
    "3. In JetBrains IDEs, keep Copilot custom instructions enabled for the workspace.",
    "4. Confirm `.github/copilot-instructions.md` appears in Copilot response references.",
  ].join("\n");
  files.push(writeTextFile(path.join(outDir, "README.md"), `${usage}\n`));

  return {
    adapter: "github-copilot",
    outDir,
    files,
  };
}
