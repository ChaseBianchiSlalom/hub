export type AssetType = "skill" | "agent" | "sop" | "playbook";

export type AdapterId = "generic" | "codex" | "chatgpt" | "vscode" | "github-copilot";

export type SensitivityLevel = "public" | "internal" | "confidential" | "client-restricted";

export interface AssetManifest {
  id: string;
  type: AssetType;
  title: string;
  owner: string;
  status: string;
  version: string;
  description: string;
  tags: string[];
  compatible_runtimes: string[];
  entry_file: string;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  sensitivity: SensitivityLevel;
  approved_runtimes: string[];
  restricted_runtimes: string[];
  human_review_required: boolean;
  peer_review_required: boolean;
  security_review_required: boolean;
  client_data_allowed: boolean;
  client_consent_required: boolean;
  sow_review_required: boolean;
  code_use_requirements: string[];
}

export interface AssetDocument {
  manifest: AssetManifest;
  body: string;
  dir: string;
  manifestPath: string;
  bodyPath: string;
}

export interface DependencyRef {
  type: AssetType;
  id: string;
  raw: string;
}

export interface ResolvedAssetBundle {
  root: AssetDocument;
  ordered: AssetDocument[];
  dependencies: AssetDocument[];
}

export type ScenarioContextValue = string | string[];

export interface ScenarioInput {
  scenario_id: string;
  asset_id: string;
  goal: string;
  context: Record<string, ScenarioContextValue>;
  constraints: string[];
  sensitivity: SensitivityLevel;
  contains_client_data: boolean;
  contains_personal_data: boolean;
  human_review_required: boolean;
  synthetic_data: boolean;
  repository_summary?: string;
  target_task?: string;
}

export interface AssetDirectoryConfig {
  type: AssetType;
  dir: string;
  manifestFile: string;
  bodyFile: string;
}

export interface ValidationResult {
  errors: string[];
  assetCount: number;
}

export interface ExportResult {
  adapter: AdapterId;
  outDir: string;
  files: string[];
}
