import fs from "node:fs";
import path from "node:path";
import { ASSET_DIRECTORIES, REQUIRED_DIRECTORIES } from "./constants.ts";
import { loadScenarios } from "./scenarios.ts";
import { parseSimpleYamlDocument } from "./yaml.ts";
import type {
  AssetDirectoryConfig,
  AssetDocument,
  AssetManifest,
  AssetType,
  DependencyRef,
  ValidationResult,
} from "./types.ts";

const REQUIRED_MANIFEST_FIELDS = [
  "id",
  "type",
  "title",
  "owner",
  "status",
  "version",
  "description",
  "compatible_runtimes",
  "entry_file",
  "inputs",
  "outputs",
  "dependencies",
  "sensitivity",
  "approved_runtimes",
  "restricted_runtimes",
  "human_review_required",
  "peer_review_required",
  "security_review_required",
  "client_data_allowed",
  "client_consent_required",
  "sow_review_required",
  "code_use_requirements",
] as const;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isSensitivity(value: unknown): value is AssetManifest["sensitivity"] {
  return (
    value === "public" ||
    value === "internal" ||
    value === "confidential" ||
    value === "client-restricted"
  );
}

function normalizeManifest(
  raw: Record<string, unknown>,
  config: AssetDirectoryConfig,
  manifestPath: string,
): AssetManifest {
  for (const field of REQUIRED_MANIFEST_FIELDS) {
    if (!(field in raw)) {
      throw new Error(`Missing required manifest field "${field}" in ${manifestPath}`);
    }
  }

  if (raw.type !== config.type) {
    throw new Error(
      `Manifest type mismatch in ${manifestPath}: expected ${config.type}, found ${String(raw.type)}`,
    );
  }

  if (
    typeof raw.id !== "string" ||
    typeof raw.title !== "string" ||
    typeof raw.owner !== "string" ||
    typeof raw.status !== "string" ||
    typeof raw.version !== "string" ||
    typeof raw.description !== "string" ||
    typeof raw.entry_file !== "string"
  ) {
    throw new Error(`Manifest scalar fields are malformed in ${manifestPath}`);
  }

  if (
    !isSensitivity(raw.sensitivity) ||
    !isStringArray(raw.compatible_runtimes) ||
    !isStringArray(raw.approved_runtimes) ||
    !isStringArray(raw.restricted_runtimes) ||
    !isStringArray(raw.inputs) ||
    !isStringArray(raw.outputs) ||
    !isStringArray(raw.dependencies) ||
    !isStringArray(raw.code_use_requirements) ||
    !isBoolean(raw.human_review_required) ||
    !isBoolean(raw.peer_review_required) ||
    !isBoolean(raw.security_review_required) ||
    !isBoolean(raw.client_data_allowed) ||
    !isBoolean(raw.client_consent_required) ||
    !isBoolean(raw.sow_review_required)
  ) {
    throw new Error(`Manifest list fields are malformed in ${manifestPath}`);
  }

  const tags = isStringArray(raw.tags) ? raw.tags : [];

  return {
    id: raw.id,
    type: raw.type as AssetType,
    title: raw.title,
    owner: raw.owner,
    status: raw.status,
    version: raw.version,
    description: raw.description,
    tags,
    compatible_runtimes: raw.compatible_runtimes,
    entry_file: raw.entry_file,
    inputs: raw.inputs,
    outputs: raw.outputs,
    dependencies: raw.dependencies,
    sensitivity: raw.sensitivity,
    approved_runtimes: raw.approved_runtimes,
    restricted_runtimes: raw.restricted_runtimes,
    human_review_required: raw.human_review_required,
    peer_review_required: raw.peer_review_required,
    security_review_required: raw.security_review_required,
    client_data_allowed: raw.client_data_allowed,
    client_consent_required: raw.client_consent_required,
    sow_review_required: raw.sow_review_required,
    code_use_requirements: raw.code_use_requirements,
  };
}

export function loadAssets(repoRoot: string): AssetDocument[] {
  const assets: AssetDocument[] = [];

  for (const config of ASSET_DIRECTORIES) {
    const parentDir = path.join(repoRoot, config.dir);
    if (!fs.existsSync(parentDir)) {
      continue;
    }

    const entries = fs
      .readdirSync(parentDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const assetDir = path.join(parentDir, entry.name);
      const manifestPath = path.join(assetDir, config.manifestFile);
      const bodyPath = path.join(assetDir, config.bodyFile);

      if (!fs.existsSync(manifestPath)) {
        throw new Error(`Missing ${config.manifestFile} in ${assetDir}`);
      }

      if (!fs.existsSync(bodyPath)) {
        throw new Error(`Missing ${config.bodyFile} in ${assetDir}`);
      }

      const rawManifest = parseSimpleYamlDocument(fs.readFileSync(manifestPath, "utf8"));
      const manifest = normalizeManifest(rawManifest, config, manifestPath);
      const body = fs.readFileSync(bodyPath, "utf8").trim();

      assets.push({
        manifest,
        body,
        dir: assetDir,
        manifestPath,
        bodyPath,
      });
    }
  }

  return assets;
}

export function buildAssetIndex(assets: AssetDocument[]): Map<string, AssetDocument> {
  const index = new Map<string, AssetDocument>();

  for (const asset of assets) {
    const existing = index.get(asset.manifest.id);
    if (existing) {
      throw new Error(
        `Duplicate asset id "${asset.manifest.id}" found in ${existing.manifestPath} and ${asset.manifestPath}`,
      );
    }

    index.set(asset.manifest.id, asset);
  }

  return index;
}

export function parseDependencyRef(raw: string): DependencyRef {
  const match = raw.match(/^(skill|agent|sop|playbook):([a-z0-9-]+)$/);
  if (!match) {
    throw new Error(`Invalid dependency reference "${raw}"`);
  }

  return {
    type: match[1] as AssetType,
    id: match[2],
    raw,
  };
}

export function validateRepo(repoRoot: string): ValidationResult {
  const errors: string[] = [];

  for (const requiredDir of REQUIRED_DIRECTORIES) {
    if (!fs.existsSync(path.join(repoRoot, requiredDir))) {
      errors.push(`Missing directory: ${requiredDir}`);
    }
  }

  let assets: AssetDocument[] = [];
  try {
    assets = loadAssets(repoRoot);
  } catch (error) {
    errors.push((error as Error).message);
    return { errors, assetCount: 0 };
  }

  const index = buildAssetIndex(assets);
  for (const asset of assets) {
    for (const restricted of asset.manifest.restricted_runtimes) {
      if (asset.manifest.approved_runtimes.includes(restricted)) {
        errors.push(
          `Runtime "${restricted}" cannot be both approved and restricted in ${asset.manifestPath}`,
        );
      }
    }

    for (const dependency of asset.manifest.dependencies) {
      try {
        const ref = parseDependencyRef(dependency);
        const target = index.get(ref.id);
        if (!target) {
          errors.push(`Unknown dependency "${dependency}" in ${asset.manifestPath}`);
          continue;
        }

        if (target.manifest.type !== ref.type) {
          errors.push(
            `Dependency type mismatch for "${dependency}" in ${asset.manifestPath}: ` +
              `resolved ${target.manifest.type}:${target.manifest.id}`,
          );
        }
      } catch (error) {
        errors.push(`${(error as Error).message} in ${asset.manifestPath}`);
      }
    }
  }

  try {
    const scenarios = loadScenarios(repoRoot);
    for (const scenario of scenarios) {
      const asset = index.get(scenario.asset_id);
      if (!asset) {
        errors.push(`Scenario "${scenario.scenario_id}" references unknown asset "${scenario.asset_id}"`);
        continue;
      }

      if (!scenario.synthetic_data) {
        errors.push(`Scenario "${scenario.scenario_id}" must use synthetic data in tests/fixtures.`);
      }

      if (scenario.contains_personal_data) {
        errors.push(
          `Scenario "${scenario.scenario_id}" should not contain personal data in test fixtures.`,
        );
      }
    }
  } catch (error) {
    errors.push((error as Error).message);
  }

  return {
    errors,
    assetCount: assets.length,
  };
}
