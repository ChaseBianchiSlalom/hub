import type { AdapterId, ExportResult, ResolvedAssetBundle, ScenarioInput } from "../types.ts";
import { exportChatGptBundle } from "./chatgpt.ts";
import { exportCodexBundle } from "./codex.ts";
import { exportGenericBundle } from "./generic.ts";
import { exportGitHubCopilotBundle } from "./github-copilot.ts";
import { exportVsCodeBundle } from "./vscode.ts";

export function exportBundle(
  adapter: AdapterId,
  bundle: ResolvedAssetBundle,
  scenario: ScenarioInput,
  outDir: string,
): ExportResult {
  switch (adapter) {
    case "generic":
      return exportGenericBundle(bundle, scenario, outDir);
    case "codex":
      return exportCodexBundle(bundle, scenario, outDir);
    case "chatgpt":
      return exportChatGptBundle(bundle, scenario, outDir);
    case "vscode":
      return exportVsCodeBundle(bundle, scenario, outDir);
    case "github-copilot":
      return exportGitHubCopilotBundle(bundle, scenario, outDir);
  }
}
