#!/usr/bin/env bash
set -euo pipefail

# Compliance report: collects all results, does not fail on first error.
# Outputs [PASS]/[FAIL]/[SKIP] per check + percentage.
# Exit 1 only if any required check fails.

total=0
passed=0
failed=0
skipped=0
required_failed=0

results=()

check() {
  local name="$1"
  local required="$2"  # "required" or "recommended"
  local condition="$3" # shell expression to eval

  total=$((total + 1))

  if eval "$condition" 2>/dev/null; then
    results+=("[PASS] ($required) $name")
    passed=$((passed + 1))
  else
    if [[ "$required" == "required" ]]; then
      results+=("[FAIL] ($required) $name")
      failed=$((failed + 1))
      required_failed=$((required_failed + 1))
    else
      results+=("[FAIL] ($required) $name")
      failed=$((failed + 1))
    fi
  fi
}

skip() {
  local name="$1"
  local reason="$2"

  total=$((total + 1))
  skipped=$((skipped + 1))
  results+=("[SKIP] $name — $reason")
}

# --- Read profile ---

repo_yaml="docs/metadata/repo.yaml"
profile=""
if [[ -f "$repo_yaml" ]]; then
  line="$(grep -E '^profile:' "$repo_yaml" | head -n 1 || true)"
  line="${line%%#*}"
  profile="$(printf '%s\n' "$line" | sed -nE 's/^profile:[[:space:]]*"?([a-z]+)"?[[:space:]]*$/\1/p')"
fi

if [[ -z "$profile" ]]; then
  echo "[FAIL] (required) docs/metadata/repo.yaml — missing or empty profile"
  echo ""
  echo "Compliance: 0% (0/1 passed)"
  exit 1
fi

echo "Profile: $profile"
echo "---"

# --- Required files (all profiles) ---

check "README.md exists" "required" "[[ -f README.md ]]"
check "docs/README.md exists" "required" "[[ -f docs/README.md ]]"
check "docs/adr/README.md exists" "required" "[[ -f docs/adr/README.md ]]"
check "docs/reference/capabilities.md exists" "required" "[[ -f docs/reference/capabilities.md ]]"
check "docs/metadata/repo.yaml exists" "required" "[[ -f docs/metadata/repo.yaml ]]"

# --- README.md structure ---

check "README.md has Structure section" "required" \
  "grep -qiE '^##[[:space:]]+([0-9]+[.)][[:space:]]+)?(Structure|Структура)\b' README.md"

check "CONTRIBUTING.md or Contributing section" "required" \
  "[[ -f CONTRIBUTING.md ]] || grep -qiE '^##[[:space:]]+([0-9]+[.)][[:space:]]+)?(Contributing|Вклад|Контрибьютинг)\b' README.md"

# --- Capabilities ---

if [[ -f "docs/reference/capabilities.md" ]]; then
  check "Capabilities table header" "required" \
    "grep -qE '^\| ID \| Capability \| Description \| Verification \|' docs/reference/capabilities.md"
  check "At least one CAP- row" "required" \
    "grep -qE '^\| CAP-[a-z0-9-]+' docs/reference/capabilities.md"
fi

# --- Runbooks (service/infra) ---

if [[ "$profile" == "service" || "$profile" == "infra" ]]; then
  check "docs/runbooks/README.md exists" "required" "[[ -f docs/runbooks/README.md ]]"

  if [[ -f "docs/runbooks/README.md" ]]; then
    shopt -s nullglob

    flat_runbooks=()
    for f in docs/runbooks/*.md; do
      [[ "$f" != "docs/runbooks/README.md" ]] && flat_runbooks+=("$f")
    done
    check "No flat runbooks" "required" "[[ ${#flat_runbooks[@]} -eq 0 ]]"

    mapfile -t area_readmes < <(find docs/runbooks -type f -name 'README.md' ! -path 'docs/runbooks/README.md' | sort)
    check "At least one area index" "required" "[[ ${#area_readmes[@]} -gt 0 ]]"

    check "At least one runbook file exists" "required" \
      "find docs/runbooks -type f -name '*.md' ! -name 'README.md' -print -quit | grep -q ."

    shopt -u nullglob
  fi
else
  skip "Runbooks checks" "profile is $profile (not service/infra)"
fi

# --- Audience roles (runbooks) ---

runbooks_meta_ok() {
  local allowed_roles_re='(gitops|developer|support|user)'
  local allowed_status_re='(active|draft|deprecated)'
  local f

  [[ -d docs/runbooks ]] || return 0

  while IFS= read -r f; do
    grep -qE "Audience:[[:space:]]*${allowed_roles_re}\\b" "$f" || return 1
    grep -qE "Status:[[:space:]]*${allowed_status_re}\\b" "$f" || return 1
    grep -qE "Last reviewed:[[:space:]]*[0-9]{4}-[0-9]{2}-[0-9]{2}\\b" "$f" || return 1
  done < <(find docs/runbooks -type f -name 'README.md' ! -path 'docs/runbooks/README.md' | sort)

  while IFS= read -r f; do
    grep -qE "Audience:[[:space:]]*${allowed_roles_re}\\b" "$f" || return 1
    grep -qE "Status:[[:space:]]*${allowed_status_re}\\b" "$f" || return 1
    grep -qE "Last reviewed:[[:space:]]*[0-9]{4}-[0-9]{2}-[0-9]{2}\\b" "$f" || return 1
  done < <(find docs/runbooks -type f -name '*.md' ! -name 'README.md' | sort)

  return 0
}

if [[ "$profile" == "service" || "$profile" == "infra" ]]; then
  check "Runbooks/meta: Audience/Status/Last reviewed present" "required" "runbooks_meta_ok"
else
  skip "Runbooks/meta checks" "profile is $profile (not service/infra)"
fi

# --- GitOps inventory (infra) ---

if [[ "$profile" == "infra" ]]; then
  check "docs/reference/gitops-inventory.md exists" "required" \
    "[[ -f docs/reference/gitops-inventory.md ]]"

  if [[ -f "docs/reference/gitops-inventory.md" ]]; then
    check "GitOps inventory Applications table header" "required" \
      "grep -qE '^\| App \| Purpose \|' docs/reference/gitops-inventory.md"
    check "GitOps inventory has at least one row" "required" \
      "grep -cE '^\| [^|]+ \| [^|]+' docs/reference/gitops-inventory.md | grep -qvE '^[01]$'"
  fi
else
  skip "GitOps inventory checks" "profile is $profile (not infra)"
fi

# --- Recommended: Backlog ---

check "docs/backlog.md exists" "recommended" "[[ -f docs/backlog.md ]]"

# --- Recommended: Onboarding ---

check "docs/onboarding.md exists" "recommended" "[[ -f docs/onboarding.md ]]"

# --- Recommended: Security Posture ---

check "docs/security-posture.md exists" "recommended" "[[ -f docs/security-posture.md ]]"

# --- Recommended: Incident Response ---

if [[ "$profile" == "service" || "$profile" == "infra" ]]; then
  check "Incident Response area" "recommended" \
    "[[ -f docs/runbooks/incident-response/README.md ]]"
else
  skip "Incident Response checks" "profile is $profile (not service/infra)"
fi

# --- Recommended: Disaster Recovery ---

if [[ "$profile" == "infra" ]]; then
  check "Disaster Recovery area" "recommended" \
    "[[ -f docs/runbooks/disaster-recovery/README.md ]]"
else
  skip "Disaster Recovery checks" "profile is $profile (not infra)"
fi

# --- Index links (clickable) ---

check "docs/README.md has clickable links" "required" \
  "[[ -f docs/README.md ]] && grep -qE '\\]\\([^)]+' docs/README.md"

check "docs/adr/README.md has clickable links" "required" \
  "[[ -f docs/adr/README.md ]] && grep -qE '\\]\\([^)]+' docs/adr/README.md"

# --- Output ---

echo ""
for r in "${results[@]}"; do
  echo "$r"
done

echo ""
echo "---"
pct=0
if [[ $total -gt 0 ]]; then
  pct=$(( (passed * 100) / total ))
fi
echo "Compliance: ${pct}% (${passed}/${total} passed, ${failed} failed, ${skipped} skipped)"

if [[ $required_failed -gt 0 ]]; then
  echo "RESULT: FAIL ($required_failed required check(s) failed)"
  exit 1
else
  echo "RESULT: PASS (all required checks passed)"
  exit 0
fi
