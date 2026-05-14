import fs from "node:fs";
import path from "node:path";
import type { ScenarioInput } from "./types.ts";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isContextRecord(value: unknown): value is Record<string, string | string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(
    (entry) => typeof entry === "string" || isStringArray(entry),
  );
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isSensitivity(value: unknown): value is ScenarioInput["sensitivity"] {
  return (
    value === "public" ||
    value === "internal" ||
    value === "confidential" ||
    value === "client-restricted"
  );
}

function normalizeScenario(raw: unknown, filePath: string): ScenarioInput {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`Scenario ${filePath} must be a JSON object`);
  }

  const candidate = raw as Record<string, unknown>;

  if (
    typeof candidate.scenario_id !== "string" ||
    typeof candidate.asset_id !== "string" ||
    typeof candidate.goal !== "string" ||
    !isContextRecord(candidate.context) ||
    !isStringArray(candidate.constraints) ||
    !isSensitivity(candidate.sensitivity) ||
    !isBoolean(candidate.contains_client_data) ||
    !isBoolean(candidate.contains_personal_data) ||
    !isBoolean(candidate.human_review_required) ||
    !isBoolean(candidate.synthetic_data)
  ) {
    throw new Error(`Scenario ${filePath} is missing required fields`);
  }

  return {
    scenario_id: candidate.scenario_id,
    asset_id: candidate.asset_id,
    goal: candidate.goal,
    context: candidate.context,
    constraints: candidate.constraints,
    sensitivity: candidate.sensitivity,
    contains_client_data: candidate.contains_client_data,
    contains_personal_data: candidate.contains_personal_data,
    human_review_required: candidate.human_review_required,
    synthetic_data: candidate.synthetic_data,
    repository_summary:
      typeof candidate.repository_summary === "string" ? candidate.repository_summary : undefined,
    target_task: typeof candidate.target_task === "string" ? candidate.target_task : undefined,
  };
}

export function loadScenarios(repoRoot: string): ScenarioInput[] {
  const scenarioDir = path.join(repoRoot, "tests", "fixtures", "scenarios");
  const entries = fs
    .readdirSync(scenarioDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .sort((a, b) => a.name.localeCompare(b.name));

  return entries.map((entry) => {
    const filePath = path.join(scenarioDir, entry.name);
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return normalizeScenario(raw, filePath);
  });
}

export function loadScenario(repoRoot: string, scenarioName: string): ScenarioInput {
  const scenarios = loadScenarios(repoRoot);
  const match = scenarios.find((scenario) => scenario.scenario_id === scenarioName);

  if (!match) {
    throw new Error(`Unknown scenario "${scenarioName}"`);
  }

  return match;
}
