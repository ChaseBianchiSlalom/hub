#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec node --experimental-strip-types "$repo_root/src/cli.ts" install-local --shell-setup "$@"
