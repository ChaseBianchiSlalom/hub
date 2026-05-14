# Generic Adapter

## Purpose

Provide the minimum contract any future tool can use to discover and consume the repo.

## Requirements For Consumers

- Traverse the top-level asset folders
- Parse YAML manifests
- Load the referenced markdown body
- Resolve `dependencies`
- Filter by `compatible_runtimes` or ignore that field if operating generically

This is the fallback path for any simple MCP-like or internal AI runtime.
