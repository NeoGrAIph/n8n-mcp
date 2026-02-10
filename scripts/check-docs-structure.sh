#!/usr/bin/env bash
set -euo pipefail

repo_yaml="docs/metadata/repo.yaml"
profile=""
if [[ -f "$repo_yaml" ]]; then
  # Accept a simple single-line YAML like: profile: service (optional quotes, optional inline comment).
  line="$(grep -E '^profile:' "$repo_yaml" | head -n 1 || true)"
  line="${line%%#*}"
  profile="$(printf '%s\n' "$line" | sed -nE 's/^profile:[[:space:]]*"?([a-z]+)"?[[:space:]]*$/\1/p')"
fi

if [[ -z "$profile" ]]; then
  echo "ERROR: missing or empty docs/metadata/repo.yaml profile"
  exit 1
fi

case "$profile" in
  library|service|infra) ;;
  *)
    echo "ERROR: unsupported profile: $profile"
    exit 1
    ;;
esac

required_files=(
  "README.md"
  "docs/README.md"
  "docs/adr/README.md"
  "docs/reference/capabilities.md"
  "docs/metadata/repo.yaml"
)

for f in "${required_files[@]}"; do
  [[ -f "$f" ]] || { echo "ERROR: missing $f"; exit 1; }
done

if ! grep -qiE '^##[[:space:]]+([0-9]+[.)][[:space:]]+)?(Structure|Структура)\b' "README.md"; then
  echo "ERROR: README.md must contain a '## Structure' / '## Структура' section"
  exit 1
fi

if [[ ! -f "CONTRIBUTING.md" ]]; then
  if ! grep -qiE '^##[[:space:]]+([0-9]+[.)][[:space:]]+)?(Contributing|Вклад|Контрибьютинг)\b' "README.md"; then
    echo "ERROR: missing CONTRIBUTING.md (or add a '## Contributing' section in README.md)"
    exit 1
  fi
fi

if ! grep -qE '^\| ID \| Capability \| Description \| Verification \|' "docs/reference/capabilities.md"; then
  echo "ERROR: docs/reference/capabilities.md must contain the table header: | ID | Capability | Description | Verification |"
  exit 1
fi

if ! grep -qE '^\| CAP-[a-z0-9-]+' "docs/reference/capabilities.md"; then
  echo "ERROR: docs/reference/capabilities.md must contain at least one CAP- row"
  exit 1
fi

if [[ "$profile" == "service" || "$profile" == "infra" ]]; then
  [[ -f "docs/runbooks/README.md" ]] || { echo "ERROR: missing docs/runbooks/README.md for $profile"; exit 1; }

  # Enforce non-flat runbooks: only README.md is allowed at docs/runbooks/*.md root.
  shopt -s nullglob

  root_runbooks=(docs/runbooks/*.md)
  for f in "${root_runbooks[@]}"; do
    if [[ "$f" != "docs/runbooks/README.md" ]]; then
      echo "ERROR: flat runbooks are not allowed: move $f under docs/runbooks/<area>/"
      exit 1
    fi
  done

  mapfile -t area_readmes < <(find docs/runbooks -type f -name 'README.md' ! -path 'docs/runbooks/README.md' | sort)
  if [[ ${#area_readmes[@]} -eq 0 ]]; then
    echo "ERROR: expected at least one runbooks area index under docs/runbooks/<area>/README.md (any depth)"
    exit 1
  fi

  # Require at least one concrete runbook somewhere (README.md files are indices).
  if ! find docs/runbooks -type f -name '*.md' ! -name 'README.md' -print -quit | grep -q .; then
    echo "ERROR: expected at least one runbook file under docs/runbooks/** (excluding README.md indices)"
    exit 1
  fi

  shopt -u nullglob
fi

if [[ "$profile" == "infra" ]]; then
  [[ -f "docs/reference/gitops-inventory.md" ]] || { echo "ERROR: missing docs/reference/gitops-inventory.md for infra profile"; exit 1; }
  if ! grep -qE '^\| App \| Purpose \| AppProject \| Sources \(chart/path, \\$values\) \| Destination \(cluster/ns\) \| Sync policy \| Safety / Notes \|' "docs/reference/gitops-inventory.md"; then
    echo "ERROR: docs/reference/gitops-inventory.md must contain the Applications table header from the standard template"
    exit 1
  fi
  if ! grep -qE '^\| <app> \|' "docs/reference/gitops-inventory.md"; then
    # Template placeholder is allowed initially, but require at least one non-header row marker.
    if ! grep -qE '^\| [^|]+ \| [^|]+' "docs/reference/gitops-inventory.md"; then
      echo "ERROR: docs/reference/gitops-inventory.md must contain at least one row in the Applications table"
      exit 1
    fi
  fi
fi

echo "OK: docs structure"
