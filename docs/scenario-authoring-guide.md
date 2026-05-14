# Scenario Authoring Guide

Scenario fixtures are part of the AI Hub control surface, not throwaway samples.

## Rules

- Use synthetic but realistic example data only.
- Do not include real client names, personal data, credentials, keys, secrets, or proprietary source snippets.
- Set `synthetic_data: true` for all checked-in test fixtures.
- Set `contains_personal_data: false` for all checked-in test fixtures.
- Only mark `contains_client_data: true` when the fixture is explicitly modeling a client-data workflow, and even then use synthetic placeholders.

## Required Security Fields

Every scenario fixture should include:

- `sensitivity`
- `contains_client_data`
- `contains_personal_data`
- `human_review_required`
- `synthetic_data`

## Recommended Defaults

For most internal examples:

- `sensitivity: "internal"`
- `contains_client_data: false`
- `contains_personal_data: false`
- `human_review_required: true`
- `synthetic_data: true`

These defaults keep the examples realistic while reducing policy and data-handling risk.
