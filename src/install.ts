import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export interface InstallResult {
  binaryPath: string;
  sourcePath: string;
  binDir: string;
  replaced: boolean;
  installMode: "wrapper";
}

export interface ShellSetupResult {
  shellRcPath: string;
  pathLine: string;
  updated: boolean;
}

function resolveHomeDir(): string {
  const home = process.env.HOME;
  if (!home) {
    throw new Error("HOME is not set; cannot determine local install location.");
  }
  return home;
}

export function defaultBinDir(): string {
  return path.join(resolveHomeDir(), "bin");
}

export function defaultShellRcPath(): string {
  const shell = process.env.SHELL ?? "";
  if (shell.includes("zsh")) {
    const zdotdir = process.env.ZDOTDIR;
    return path.join(zdotdir && zdotdir.length > 0 ? zdotdir : resolveHomeDir(), ".zshrc");
  }

  return path.join(resolveHomeDir(), ".bashrc");
}

function toShellPathLiteral(binDir: string): string {
  const home = resolveHomeDir();
  if (binDir === path.join(home, "bin")) {
    return "$HOME/bin";
  }

  if (binDir.startsWith(`${home}/`)) {
    return `$HOME/${binDir.slice(home.length + 1)}`;
  }

  return binDir;
}

export function installLocalHub(
  repoRoot: string,
  requestedBinDir: string,
  force = false,
): InstallResult {
  const sourcePath = path.join(repoRoot, "bin", "hub");
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Hub entrypoint not found at ${sourcePath}`);
  }

  const binDir = path.resolve(repoRoot, requestedBinDir);
  const binaryPath = path.join(binDir, "hub");

  fs.mkdirSync(binDir, { recursive: true });

  const existingEntry = fs.lstatSync(binaryPath, { throwIfNoEntry: false });
  let replaced = false;
  if (existingEntry) {
    if (existingEntry.isFile()) {
      const currentContents = fs.readFileSync(binaryPath, "utf8");
      if (currentContents.includes(sourcePath)) {
        return { binaryPath, sourcePath, binDir, replaced: false, installMode: "wrapper" };
      }
    }

    if (!force) {
      throw new Error(`Target already exists at ${binaryPath}. Re-run with --force to replace it.`);
    }

    fs.rmSync(binaryPath, { recursive: true, force: true });
    replaced = true;
  }

  const wrapper = [
    "#!/usr/bin/env bash",
    "",
    "set -euo pipefail",
    `repo_root="${repoRoot}"`,
    `exec env ADOBE_AI_HUB_ROOT="$repo_root" "${sourcePath}" "$@"`,
    "",
  ].join("\n");
  fs.writeFileSync(binaryPath, wrapper, { encoding: "utf8", mode: 0o755 });

  return {
    binaryPath,
    sourcePath,
    binDir,
    replaced,
    installMode: "wrapper",
  };
}

export function ensureShellPathConfigured(
  requestedBinDir: string,
  requestedShellRcPath?: string,
): ShellSetupResult {
  const binDir = path.resolve(requestedBinDir);
  const shellRcPath = path.resolve(requestedShellRcPath ?? defaultShellRcPath());
  const pathLine = `export PATH="${toShellPathLiteral(binDir)}:$PATH"`;

  fs.mkdirSync(path.dirname(shellRcPath), { recursive: true });
  const existing = fs.existsSync(shellRcPath) ? fs.readFileSync(shellRcPath, "utf8") : "";

  if (existing.includes(pathLine)) {
    return {
      shellRcPath,
      pathLine,
      updated: false,
    };
  }

  const prefix = existing.length > 0 && !existing.endsWith("\n") ? "\n" : "";
  const block = `${prefix}# Added by adobe-ai-hub installer\n${pathLine}\n`;
  fs.appendFileSync(shellRcPath, block, "utf8");

  return {
    shellRcPath,
    pathLine,
    updated: true,
  };
}

export function verifyInstalledHub(binaryPath: string): void {
  execFileSync(binaryPath, ["list"], {
    encoding: "utf8",
    stdio: "ignore",
  });
}
