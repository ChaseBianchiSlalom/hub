import path from "node:path";
import { loadAssets, validateRepo } from "./assets.ts";
import { exportCodexHubBundle } from "./adapters/codex.ts";
import { exportBundle } from "./adapters/index.ts";
import { renderAssetList, renderDemo, renderResolvedBundle } from "./render.ts";
import { resolveAssetBundle } from "./resolve.ts";
import { loadScenario } from "./scenarios.ts";
import {
  defaultBinDir,
  defaultShellRcPath,
  ensureShellPathConfigured,
  installLocalHub,
  verifyInstalledHub,
} from "./install.ts";
import { installCodexGlobalBundle, installCodexGlobalHub } from "./codex-global.ts";
import type { AdapterId } from "./types.ts";
import { isCompatibleWithAdapter } from "./utils.ts";

const SUPPORTED_ADAPTERS: AdapterId[] = ["generic", "codex", "chatgpt", "vscode", "github-copilot"];

function usage(): string {
  return [
    "Usage:",
    "  hub validate",
    "  hub list",
    "  hub resolve <asset-id>",
    "  hub demo <asset-id> --scenario <scenario-id>",
    "  hub export <adapter> <asset-id> --scenario <scenario-id> --out <dir>",
    "  hub export codex",
    "  hub export codex --out <dir>",
    "  hub export codex <asset-id> --scenario <scenario-id>",
    "  hub export codex <asset-id> --scenario <scenario-id> --out <dir>",
    "  hub export codex <asset-id> --scenario <scenario-id> --global [--codex-home <dir>]",
    "  hub install-local [--bin-dir <dir>] [--shell-setup] [--shell-rc <path>] [--force]",
    "",
    "Supported adapters: generic, codex, chatgpt, vscode, github-copilot",
    "Notes:",
    "  - codex with no asset id exports the whole hub to global AGENTS.md",
    "  - codex with an asset id and no --out exports that focused asset to global AGENTS.md",
    "  - other adapters require --out",
  ].join("\n");
}

function getOption(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function requireOption(args: string[], flag: string): string {
  const value = getOption(args, flag);
  if (!value) {
    throw new Error(`Missing required option ${flag}`);
  }

  return value;
}

function commandValidate(repoRoot: string): number {
  const result = validateRepo(repoRoot);
  if (result.errors.length > 0) {
    console.error(result.errors.join("\n"));
    return 1;
  }

  console.log(`hub structure looks valid (${result.assetCount} assets)`);
  return 0;
}

function commandList(repoRoot: string): number {
  const assets = loadAssets(repoRoot);
  console.log(renderAssetList(assets));
  return 0;
}

function commandResolve(repoRoot: string, assetId: string): number {
  const assets = loadAssets(repoRoot);
  const bundle = resolveAssetBundle(assets, assetId);
  console.log(renderResolvedBundle(bundle));
  return 0;
}

function commandDemo(repoRoot: string, assetId: string, scenarioId: string): number {
  const assets = loadAssets(repoRoot);
  const bundle = resolveAssetBundle(assets, assetId);
  const scenario = loadScenario(repoRoot, scenarioId);

  if (scenario.asset_id !== assetId) {
    throw new Error(
      `Scenario "${scenario.scenario_id}" targets asset "${scenario.asset_id}", not "${assetId}"`,
    );
  }

  console.log(renderDemo(bundle, scenario));
  return 0;
}

function commandExport(
  repoRoot: string,
  adapter: AdapterId,
  assetId: string | undefined,
  scenarioId: string | undefined,
  outDir: string | undefined,
  args: string[],
): number {
  if (!SUPPORTED_ADAPTERS.includes(adapter)) {
    throw new Error(`Unsupported adapter "${adapter}"`);
  }

  const assets = loadAssets(repoRoot);
  if (adapter === "codex" && !assetId) {
    const incompatible = assets.filter((asset) => !isCompatibleWithAdapter(asset, adapter));
    if (incompatible.length > 0) {
      const refs = incompatible.map((asset) => `${asset.manifest.type}:${asset.manifest.id}`).join(", ");
      throw new Error(`Assets are not compatible with adapter "${adapter}": ${refs}`);
    }

    if (args.includes("--global") && outDir) {
      throw new Error("Codex export cannot use both --global and --out. Omit --out for global export.");
    }

    if (outDir) {
      const result = exportCodexHubBundle(assets, path.resolve(repoRoot, outDir));
      console.log(`Exported ${result.adapter} hub bundle to ${result.outDir}`);
      console.log(result.files.map((file) => `- ${path.relative(repoRoot, file)}`).join("\n"));
      return 0;
    }

    const result = installCodexGlobalHub(assets, getOption(args, "--codex-home"));
    console.log(`Installed ${result.adapter} hub into Codex global context at ${result.codexHome}`);
    console.log(`Global AGENTS file: ${result.agentsPath}`);
    console.log(`Support directory: ${result.supportDir}`);
    console.log("Updated files:");
    console.log(result.files.map((file) => `- ${file}`).join("\n"));
    return 0;
  }

  if (!assetId) {
    throw new Error("Missing required asset id for export");
  }

  if (!scenarioId) {
    throw new Error("Missing required option --scenario");
  }

  const bundle = resolveAssetBundle(assets, assetId);
  const scenario = loadScenario(repoRoot, scenarioId);

  if (scenario.asset_id !== assetId) {
    throw new Error(
      `Scenario "${scenario.scenario_id}" targets asset "${scenario.asset_id}", not "${assetId}"`,
    );
  }

  const incompatible = bundle.ordered.filter((asset) => !isCompatibleWithAdapter(asset, adapter));
  if (adapter !== "generic" && incompatible.length > 0) {
    const refs = incompatible.map((asset) => `${asset.manifest.type}:${asset.manifest.id}`).join(", ");
    throw new Error(`Assets are not compatible with adapter "${adapter}": ${refs}`);
  }

  const wantsCodexGlobal = adapter === "codex" && (!outDir || args.includes("--global"));
  if (adapter === "codex" && args.includes("--global") && outDir) {
    throw new Error('Codex export cannot use both --global and --out. Omit --out for global export.');
  }

  if (wantsCodexGlobal) {
    const result = installCodexGlobalBundle(bundle, scenario, getOption(args, "--codex-home"));
    console.log(`Installed ${result.adapter} bundle into Codex global context at ${result.codexHome}`);
    console.log(`Global AGENTS file: ${result.agentsPath}`);
    console.log(`Support directory: ${result.supportDir}`);
    console.log("Updated files:");
    console.log(result.files.map((file) => `- ${file}`).join("\n"));
    return 0;
  }

  if (!outDir) {
    throw new Error("Missing required option --out");
  }

  const result = exportBundle(adapter, bundle, scenario, path.resolve(repoRoot, outDir));
  console.log(`Exported ${result.adapter} bundle to ${result.outDir}`);
  console.log(result.files.map((file) => `- ${path.relative(repoRoot, file)}`).join("\n"));
  return 0;
}

function commandInstallLocal(repoRoot: string, args: string[]): number {
  const binDir = getOption(args, "--bin-dir") ?? defaultBinDir();
  const shellSetup = args.includes("--shell-setup");
  const shellRc = getOption(args, "--shell-rc");
  const force = args.includes("--force");
  const result = installLocalHub(repoRoot, binDir, force);
  verifyInstalledHub(result.binaryPath);

  console.log(`Installed hub command at ${result.binaryPath}`);
  console.log(`Source: ${result.sourcePath}`);
  console.log(`Bin directory: ${result.binDir}`);
  console.log(`Install mode: ${result.installMode}`);
  if (result.replaced) {
    console.log("Existing target was replaced.");
  }

  if (shellSetup) {
    const shellResult = ensureShellPathConfigured(result.binDir, shellRc);
    console.log(`Shell rc file: ${shellResult.shellRcPath}`);
    if (shellResult.updated) {
      console.log("Added PATH entry to shell rc.");
    } else {
      console.log("PATH entry already present in shell rc.");
    }
    console.log(`PATH line: ${shellResult.pathLine}`);
    console.log(`Run this once in your current shell if needed: source ${shellResult.shellRcPath}`);
  } else {
    console.log(`Add this directory to PATH if needed: ${result.binDir}`);
    console.log(`Recommended shell rc: ${shellRc ?? defaultShellRcPath()}`);
  }

  return 0;
}

function main(argv: string[]): number {
  const repoRoot = process.env.ADOBE_AI_HUB_ROOT
    ? path.resolve(process.env.ADOBE_AI_HUB_ROOT)
    : process.cwd();
  const [command, ...args] = argv;

  if (!command || command === "--help" || command === "-h") {
    console.log(usage());
    return 0;
  }

  switch (command) {
    case "validate":
      return commandValidate(repoRoot);
    case "list":
      return commandList(repoRoot);
    case "resolve":
      if (!args[0]) {
        throw new Error("Missing required asset id for resolve");
      }
      return commandResolve(repoRoot, args[0]);
    case "demo":
      if (!args[0]) {
        throw new Error("Missing required asset id for demo");
      }
      return commandDemo(repoRoot, args[0], requireOption(args, "--scenario"));
    case "export":
      if (!args[0]) {
        throw new Error("Usage: hub export <adapter> [asset-id] [--scenario <scenario-id>] [--out <dir>]");
      }
      return commandExport(
        repoRoot,
        args[0] as AdapterId,
        args[1] && !args[1].startsWith("--") ? args[1] : undefined,
        getOption(args, "--scenario"),
        getOption(args, "--out"),
        args,
      );
    case "install-local":
      return commandInstallLocal(repoRoot, args);
    default:
      throw new Error(`Unknown command "${command}"`);
  }
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error((error as Error).message);
  console.error("");
  console.error(usage());
  process.exitCode = 1;
}
