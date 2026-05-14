import test from "node:test";
import assert from "node:assert/strict";
import { loadAssets } from "../../src/assets.ts";
import { resolveAssetBundle } from "../../src/resolve.ts";

const repoRoot = process.cwd();

test("resolveAssetBundle returns dependencies before the root asset", () => {
  const assets = loadAssets(repoRoot);
  const bundle = resolveAssetBundle(assets, "implementation-lead");
  const refs = bundle.ordered.map((asset) => `${asset.manifest.type}:${asset.manifest.id}`);

  assert.deepEqual(refs, [
    "sop:repo-kickoff",
    "skill:repo-onboarding",
    "agent:implementation-lead",
  ]);
});

test("resolveAssetBundle resolves the full playbook dependency chain", () => {
  const assets = loadAssets(repoRoot);
  const bundle = resolveAssetBundle(assets, "ai-feature-delivery");
  const refs = bundle.ordered.map((asset) => asset.manifest.id);

  assert.deepEqual(refs, [
    "engagment-intake",
    "brief-to-backlog",
    "delivery-risk-scan",
    "solution-architect",
    "repo-kickoff",
    "repo-onboarding",
    "implementation-lead",
    "ai-feature-delivery",
  ]);
});
