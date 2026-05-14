import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildAssetIndex, loadAssets, parseDependencyRef, validateRepo } from "../../src/assets.ts";

const repoRoot = process.cwd();

test("loadAssets discovers the current canonical assets", () => {
  const assets = loadAssets(repoRoot);
  assert.equal(assets.length, 9);
  assert.ok(assets.some((asset) => asset.manifest.id === "project-operator"));
  assert.ok(assets.some((asset) => asset.manifest.id === "ai-feature-delivery"));
});

test("buildAssetIndex provides unique asset lookup", () => {
  const assets = loadAssets(repoRoot);
  const index = buildAssetIndex(assets);
  assert.equal(index.get("brief-to-backlog")?.manifest.title, "Brief To Backlog");
});

test("parseDependencyRef parses canonical dependency refs", () => {
  assert.deepEqual(parseDependencyRef("skill:repo-onboarding"), {
    type: "skill",
    id: "repo-onboarding",
    raw: "skill:repo-onboarding",
  });
});

test("validateRepo passes for the repo root", () => {
  const result = validateRepo(repoRoot);
  assert.deepEqual(result.errors, []);
  assert.equal(result.assetCount, 9);
  assert.ok(path.isAbsolute(repoRoot));
});
