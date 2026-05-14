import test from "node:test";
import assert from "node:assert/strict";
import { parseSimpleYamlDocument } from "../../src/yaml.ts";

test("parseSimpleYamlDocument parses manifest-style lists and scalars", () => {
  const document = parseSimpleYamlDocument(`
id: sample-skill
type: skill
description: Example description
compatible_runtimes:
  - codex
  - generic
dependencies:
  - sop:repo-kickoff
`);

  assert.equal(document.id, "sample-skill");
  assert.equal(document.type, "skill");
  assert.deepEqual(document.compatible_runtimes, ["codex", "generic"]);
  assert.deepEqual(document.dependencies, ["sop:repo-kickoff"]);
});

test("parseSimpleYamlDocument rejects unsupported nested objects", () => {
  assert.throws(
    () =>
      parseSimpleYamlDocument(`
id: sample
metadata:
  owner: team
`),
    /Unsupported nested YAML/,
  );
});
