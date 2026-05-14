import { buildAssetIndex, parseDependencyRef } from "./assets.ts";
import type { AssetDocument, ResolvedAssetBundle } from "./types.ts";

export function resolveAssetBundle(assets: AssetDocument[], assetId: string): ResolvedAssetBundle {
  const index = buildAssetIndex(assets);
  const root = index.get(assetId);

  if (!root) {
    throw new Error(`Unknown asset id "${assetId}"`);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const ordered: AssetDocument[] = [];

  const visit = (currentId: string) => {
    if (visited.has(currentId)) {
      return;
    }

    if (visiting.has(currentId)) {
      throw new Error(`Dependency cycle detected at "${currentId}"`);
    }

    const asset = index.get(currentId);
    if (!asset) {
      throw new Error(`Unknown asset id "${currentId}"`);
    }

    visiting.add(currentId);
    for (const rawDependency of asset.manifest.dependencies) {
      const dependency = parseDependencyRef(rawDependency);
      visit(dependency.id);
    }
    visiting.delete(currentId);
    visited.add(currentId);
    ordered.push(asset);
  };

  visit(assetId);

  return {
    root,
    ordered,
    dependencies: ordered.filter((asset) => asset.manifest.id !== assetId),
  };
}
