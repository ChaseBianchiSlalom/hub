import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const repoRoot = process.cwd();

function runCli(args: string[], envOverrides: Record<string, string> = {}): string {
  return execFileSync("node", ["--experimental-strip-types", "./src/cli.ts", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...envOverrides,
    },
  });
}

test("hub validate passes against the repo", () => {
  const output = runCli(["validate"]);
  assert.match(output, /hub structure looks valid/);
});

test("hub list returns the current assets by category", () => {
  const output = runCli(["list"]);
  assert.match(output, /skills/);
  assert.match(output, /brief-to-backlog/);
  assert.match(output, /agents/);
  assert.match(output, /ai-feature-delivery/);
});

test("hub resolve returns the dependency view for the playbook", () => {
  const output = runCli(["resolve", "ai-feature-delivery"]);
  assert.match(output, /Root Asset: playbook:ai-feature-delivery/);
  assert.match(output, /sop:engagment-intake/);
  assert.match(output, /agent:solution-architect/);
  assert.match(output, /skill:repo-onboarding/);
});

test("hub demo works for every current asset scenario", () => {
  const cases: Array<[string, string]> = [
    ["brief-to-backlog", "brief-to-backlog-poc"],
    ["delivery-risk-scan", "delivery-risk-scan-poc"],
    ["repo-onboarding", "repo-onboarding-poc"],
    ["project-operator", "project-operator-poc"],
    ["solution-architect", "solution-architect-poc"],
    ["implementation-lead", "implementation-lead-poc"],
    ["engagment-intake", "engagment-intake-poc"],
    ["repo-kickoff", "repo-kickoff-poc"],
    ["ai-feature-delivery", "ai-feature-delivery-poc"],
  ];

  for (const [assetId, scenarioId] of cases) {
    const output = runCli(["demo", assetId, "--scenario", scenarioId]);
    assert.match(output, new RegExp(`Scenario: ${scenarioId}`));
    assert.match(output, new RegExp(`Asset: ${assetId}`));
    assert.match(output, /Assembled Instructions:/);
  }
});

test("hub export generic creates a generic bundle", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "hub-generic-"));
  const output = runCli([
    "export",
    "generic",
    "ai-feature-delivery",
    "--scenario",
    "ai-feature-delivery-poc",
    "--out",
    outDir,
  ]);

  assert.match(output, /Exported generic bundle/);
  assert.ok(fs.existsSync(path.join(outDir, "bundle.json")));
  const bundle = JSON.parse(fs.readFileSync(path.join(outDir, "bundle.json"), "utf8"));
  assert.equal(bundle.root_asset, "playbook:ai-feature-delivery");
  assert.equal(bundle.assets.length, 8);
});

test("hub export codex creates AGENTS.md with resolved dependencies", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "hub-codex-"));
  runCli([
    "export",
    "codex",
    "project-operator",
    "--scenario",
    "project-operator-poc",
    "--out",
    outDir,
  ]);

  const agentsMd = fs.readFileSync(path.join(outDir, "AGENTS.md"), "utf8");
  assert.match(agentsMd, /project-operator/);
  assert.match(agentsMd, /brief-to-backlog/);
  assert.match(agentsMd, /delivery-risk-scan/);
});

test("hub export codex defaults to global AGENTS.md when --out is omitted", () => {
  const codexHome = fs.mkdtempSync(path.join(os.tmpdir(), "hub-codex-default-home-"));
  const output = runCli(
    [
      "export",
      "codex",
      "project-operator",
      "--scenario",
      "project-operator-poc",
    ],
    { CODEX_HOME: codexHome },
  );

  assert.match(output, /Installed codex bundle into Codex global context/);
  assert.ok(fs.existsSync(path.join(codexHome, "AGENTS.md")));
  assert.ok(fs.existsSync(path.join(codexHome, "ai-hub", "current", "AGENTS.md")));
});

test("hub export codex --global preserves user AGENTS.md content and updates a managed block", () => {
  const codexHome = fs.mkdtempSync(path.join(os.tmpdir(), "hub-codex-home-"));
  const agentsPath = path.join(codexHome, "AGENTS.md");
  fs.writeFileSync(agentsPath, "# My Global Instructions\n\nKeep responses tight.\n", "utf8");

  runCli(
    [
      "export",
      "codex",
      "project-operator",
      "--scenario",
      "project-operator-poc",
      "--global",
      "--codex-home",
      codexHome,
    ],
    { CODEX_HOME: codexHome },
  );

  runCli(
    [
      "export",
      "codex",
      "implementation-lead",
      "--scenario",
      "implementation-lead-poc",
      "--global",
      "--codex-home",
      codexHome,
    ],
    { CODEX_HOME: codexHome },
  );

  const agentsMd = fs.readFileSync(agentsPath, "utf8");
  assert.match(agentsMd, /My Global Instructions/);
  assert.match(agentsMd, /Keep responses tight/);
  assert.match(agentsMd, /<!-- adobe-ai-hub:start -->/);
  assert.match(agentsMd, /## Adobe AI Hub/);
  assert.match(agentsMd, /implementation-lead/);
  assert.doesNotMatch(agentsMd, /project-operator/);
  assert.equal((agentsMd.match(/<!-- adobe-ai-hub:start -->/g) ?? []).length, 1);

  assert.ok(fs.existsSync(path.join(codexHome, "ai-hub", "current", "context", "scenario.md")));
  assert.ok(
    fs.existsSync(
      path.join(codexHome, "ai-hub", "current", "context", "assets", "agent-implementation-lead.md"),
    ),
  );
});

test("hub export codex rejects combining --global and --out", () => {
  const codexHome = fs.mkdtempSync(path.join(os.tmpdir(), "hub-codex-conflict-home-"));
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "hub-codex-conflict-out-"));

  assert.throws(
    () =>
      runCli(
        [
          "export",
          "codex",
          "project-operator",
          "--scenario",
          "project-operator-poc",
          "--global",
          "--out",
          outDir,
        ],
        { CODEX_HOME: codexHome },
      ),
    /Codex export cannot use both --global and --out/,
  );
});

test("hub export chatgpt creates GPT-oriented files", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "hub-chatgpt-"));
  runCli([
    "export",
    "chatgpt",
    "solution-architect",
    "--scenario",
    "solution-architect-poc",
    "--out",
    outDir,
  ]);

  assert.ok(fs.existsSync(path.join(outDir, "gpt-instructions.md")));
  assert.ok(fs.existsSync(path.join(outDir, "prompt-starters.json")));
  assert.ok(fs.existsSync(path.join(outDir, "knowledge", "agent-solution-architect.md")));
});

test("hub export github-copilot creates native repository instruction files", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "hub-copilot-"));
  runCli([
    "export",
    "github-copilot",
    "project-operator",
    "--scenario",
    "project-operator-poc",
    "--out",
    outDir,
  ]);

  assert.ok(fs.existsSync(path.join(outDir, ".github", "copilot-instructions.md")));
  assert.ok(
    fs.existsSync(path.join(outDir, ".github", "prompts", "project-operator.prompt.md")),
  );
  assert.ok(fs.existsSync(path.join(outDir, ".github", "ai-hub", "agent-project-operator.md")));
});

test("hub export vscode creates a prompt pack and usage guide", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "hub-vscode-"));
  runCli([
    "export",
    "vscode",
    "implementation-lead",
    "--scenario",
    "implementation-lead-poc",
    "--out",
    outDir,
  ]);

  assert.ok(fs.existsSync(path.join(outDir, "README.md")));
  assert.ok(fs.existsSync(path.join(outDir, "workspace-context.md")));
  assert.ok(fs.existsSync(path.join(outDir, "prompts", "main.prompt.md")));
});

test("hub install-local creates a runnable wrapper in a target bin directory", () => {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "hub-install-"));
  const binDir = path.join(baseDir, "bin");
  const output = runCli(["install-local", "--bin-dir", binDir]);

  assert.match(output, /Installed hub command/);
  const binaryPath = path.join(binDir, "hub");
  assert.ok(fs.existsSync(binaryPath));
  const stat = fs.statSync(binaryPath);
  assert.equal(stat.isFile(), true);
  const wrapper = fs.readFileSync(binaryPath, "utf8");
  assert.match(wrapper, /ADOBE_AI_HUB_ROOT=/);
  assert.match(wrapper, /exec env ADOBE_AI_HUB_ROOT=.*".*\/bin\/hub" "\$@"/);
  const listOutput = execFileSync(binaryPath, ["list"], { cwd: repoRoot, encoding: "utf8" });
  assert.match(listOutput, /skills/);
});

test("hub install-local --shell-setup bootstraps ~/bin and .zshrc in one command", () => {
  const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), "hub-home-"));
  const output = runCli(["install-local", "--shell-setup"], {
    HOME: homeDir,
    SHELL: "/bin/zsh",
    ZDOTDIR: homeDir,
  });

  assert.match(output, /Installed hub command/);
  assert.match(output, /Added PATH entry to shell rc|PATH entry already present in shell rc/);

  const binaryPath = path.join(homeDir, "bin", "hub");
  assert.ok(fs.existsSync(binaryPath));
  assert.equal(fs.statSync(binaryPath).isFile(), true);

  const zshrcPath = path.join(homeDir, ".zshrc");
  assert.ok(fs.existsSync(zshrcPath));
  const zshrc = fs.readFileSync(zshrcPath, "utf8");
  assert.match(zshrc, /export PATH="\$HOME\/bin:\$PATH"/);
});

test("installed hub works from outside the repo root", () => {
  const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), "hub-anywhere-home-"));
  const otherDir = fs.mkdtempSync(path.join(os.tmpdir(), "hub-anywhere-cwd-"));

  runCli(["install-local", "--shell-setup"], {
    HOME: homeDir,
    SHELL: "/bin/zsh",
    ZDOTDIR: homeDir,
  });

  const output = execFileSync(path.join(homeDir, "bin", "hub"), ["list"], {
    cwd: otherDir,
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: homeDir,
      SHELL: "/bin/zsh",
      ZDOTDIR: homeDir,
    },
  });

  assert.match(output, /skills/);
  assert.match(output, /brief-to-backlog/);
});
