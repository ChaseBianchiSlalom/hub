#!/usr/bin/env bash

set -euo pipefail

status=0

required_dirs=(
  "docs"
  "adapters"
  "adapters/codex"
  "adapters/claude-code"
  "adapters/github-copilot"
  "adapters/chat-gpt"
  "adapters/ide"
  "adapters/ide/vscode"
  "adapters/ide/intellij"
  "adapters/generic"
  "agents"
  "contexts"
  "playbooks"
  "skills"
  "sops"
  "scripts"
)

for dir in "${required_dirs[@]}"; do
  if [[ ! -d "$dir" ]]; then
    echo "missing directory: $dir"
    status=1
  fi
done

check_component() {
  local component_dir="$1"
  local manifest_name="$2"
  local body_name="$3"

  if [[ ! -f "$component_dir/$manifest_name" ]]; then
    echo "missing $manifest_name in $component_dir"
    status=1
  fi

  if [[ ! -f "$component_dir/$body_name" ]]; then
    echo "missing $body_name in $component_dir"
    status=1
  fi
}

while IFS= read -r dir; do
  check_component "$dir" "skill.yaml" "skill.md"
done < <(find skills -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort)

while IFS= read -r dir; do
  check_component "$dir" "agent.yaml" "agent.md"
done < <(find agents -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort)

while IFS= read -r dir; do
  check_component "$dir" "sop.yaml" "sop.md"
done < <(find sops -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort)

while IFS= read -r dir; do
  check_component "$dir" "playbook.yaml" "playbook.md"
done < <(find playbooks -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort)

if [[ "$status" -eq 0 ]]; then
  echo "hub structure looks valid"
fi

exit "$status"
