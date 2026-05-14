import type { AssetDocument, ScenarioInput, SensitivityLevel } from "./types.ts";
import { formatList } from "./utils.ts";

function severityOrder(level: SensitivityLevel): number {
  switch (level) {
    case "public":
      return 0;
    case "internal":
      return 1;
    case "confidential":
      return 2;
    case "client-restricted":
      return 3;
  }
}

export function maxSensitivity(
  assets: AssetDocument[],
  scenario?: ScenarioInput,
): SensitivityLevel {
  let highest: SensitivityLevel = "public";

  for (const asset of assets) {
    if (severityOrder(asset.manifest.sensitivity) > severityOrder(highest)) {
      highest = asset.manifest.sensitivity;
    }
  }

  if (scenario && severityOrder(scenario.sensitivity) > severityOrder(highest)) {
    highest = scenario.sensitivity;
  }

  return highest;
}

export function buildSecurityChecklist(assets: AssetDocument[], scenario: ScenarioInput): string[] {
  const needsPeerReview = assets.some((asset) => asset.manifest.peer_review_required);
  const needsSecurityReview = assets.some((asset) => asset.manifest.security_review_required);

  const lines = [
    `Sensitivity: ${maxSensitivity(assets, scenario)}`,
    `Scenario uses synthetic data: ${scenario.synthetic_data ? "yes" : "no"}`,
    `Human review required: ${scenario.human_review_required ? "yes" : "no"}`,
  ];

  if (needsPeerReview) {
    lines.push("Peer review required before relying on generated output.");
  }
  if (needsSecurityReview) {
    lines.push("Security review and SDLC controls required for code-oriented use.");
  }
  if (scenario.contains_client_data) {
    lines.push("Scenario indicates client-style data handling concerns are relevant.");
  }
  if (scenario.contains_personal_data) {
    lines.push("Scenario indicates personal data is present.");
  }

  return lines;
}

export function renderSecurityBanner(assets: AssetDocument[], scenario: ScenarioInput): string {
  return [
    "## Security And Use Policy",
    formatList(buildSecurityChecklist(assets, scenario)),
    "",
    "Use only approved runtimes for sensitive input, review AI output carefully, and do not treat generated content as final without human validation.",
  ].join("\n");
}
