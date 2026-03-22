#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "ERROR: $*"
  exit 1
}

allowed_roles_re='(gitops|developer|support|user)'
allowed_status_re='(active|draft|deprecated)'

check_meta() {
  local f="$1"

  grep -qE "Audience:[[:space:]]*${allowed_roles_re}\\b" "$f" || fail "$f: missing Audience (allowed: gitops/developer/support/user)"
  grep -qE "Status:[[:space:]]*${allowed_status_re}\\b" "$f" || fail "$f: missing Status (allowed: active/draft/deprecated)"
  grep -qE "Last reviewed:[[:space:]]*[0-9]{4}-[0-9]{2}-[0-9]{2}\\b" "$f" || fail "$f: missing Last reviewed YYYY-MM-DD"
}

[[ -d "docs/runbooks" ]] || { echo "OK: runbooks audience (no docs/runbooks)"; exit 0; }

# Area indices: every README.md under docs/runbooks/** except the root index.
while IFS= read -r f; do
  check_meta "$f"
done < <(find docs/runbooks -type f -name 'README.md' ! -path 'docs/runbooks/README.md' | sort)

# Runbooks: any .md under docs/runbooks/** excluding all README.md indices.
while IFS= read -r f; do
  check_meta "$f"
done < <(find docs/runbooks -type f -name '*.md' ! -name 'README.md' | sort)

echo "OK: runbooks audience"

