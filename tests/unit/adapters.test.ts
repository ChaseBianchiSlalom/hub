import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadAssets } from "../../src/assets.ts";
import { exportBundle } from "../../src/adapters/index.ts";
import { resolveAssetBundle } from "../../src/resolve.ts";
import { loadScenario } from "../../src/scenarios.ts";
import { isCompatibleWithAdapter } from "../../src/utils.ts";

const repoRoot = process.cwd();

test("runtime compatibility recognizes supported and unsupported adapters", () => {
  const assets = loadAssets(repoRoot);
  const repoOnboarding = assets.find((asset) => asset.manifest.id === "repo-onboarding");
  const playbook = assets.find((asset) => asset.manifest.id === "ai-feature-delivery");

  assert.ok(repoOnboarding);
  assert.ok(playbook);
  assert.equal(isCompatibleWithAdapter(repoOnboarding!, "vscode"), true);
  assert.equal(isCompatibleWithAdapter(repoOnboarding!, "chatgpt"), false);
  assert.equal(isCompatibleWithAdapter(playbook!, "generic"), true);
});

test("adapters generate expected files and stable sections", () => {
  const assets = loadAssets(repoRoot);
  const bundle = resolveAssetBundle(assets, "project-operator");
  const scenario = loadScenario(repoRoot, "project-operator-poc");
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "hub-adapter-test-"));

  const codex = exportBundle("codex", bundle, scenario, path.join(outDir, "codex"));
  const claudeCode = exportBundle("claude-code", bundle, scenario, path.join(outDir, "claude-code"));
  const chatgpt = exportBundle(
    "chatgpt",
    resolveAssetBundle(assets, "solution-architect"),
    loadScenario(repoRoot, "solution-architect-poc"),
    path.join(outDir, "chatgpt"),
  );
  const copilot = exportBundle(
    "github-copilot",
    resolveAssetBundle(assets, "project-operator"),
    loadScenario(repoRoot, "project-operator-poc"),
    path.join(outDir, "github-copilot"),
  );
  const vscode = exportBundle(
    "vscode",
    resolveAssetBundle(assets, "implementation-lead"),
    loadScenario(repoRoot, "implementation-lead-poc"),
    path.join(outDir, "vscode"),
  );

  assert.ok(codex.files.some((file) => file.endsWith("AGENTS.md")));
  assert.ok(claudeCode.files.some((file) => file.endsWith("CLAUDE.md")));
  assert.ok(chatgpt.files.some((file) => file.endsWith("gpt-instructions.md")));
  assert.ok(copilot.files.some((file) => file.endsWith(".github/copilot-instructions.md")));
  assert.ok(vscode.files.some((file) => file.endsWith("workspace-context.md")));

  const agentsMd = fs.readFileSync(path.join(outDir, "codex", "AGENTS.md"), "utf8");
  assert.match(agentsMd, /project-operator/);
  assert.match(agentsMd, /brief-to-backlog/);

  const claudeMd = fs.readFileSync(path.join(outDir, "claude-code", "CLAUDE.md"), "utf8");
  assert.match(claudeMd, /project-operator/);
  assert.match(claudeMd, /@\.\/context\/assets\/skill-brief-to-backlog\.md/);

  const promptStarters = JSON.parse(
    fs.readFileSync(path.join(outDir, "chatgpt", "prompt-starters.json"), "utf8"),
  );
  assert.equal(promptStarters.length, 4);

  const copilotInstructions = fs.readFileSync(
    path.join(outDir, "github-copilot", ".github", "copilot-instructions.md"),
    "utf8",
  );
  assert.match(copilotInstructions, /project-operator/);
  assert.match(copilotInstructions, /brief-to-backlog/);

  const mainPrompt = fs.readFileSync(path.join(outDir, "vscode", "prompts", "main.prompt.md"), "utf8");
  assert.match(mainPrompt, /implementation-lead/);
});
