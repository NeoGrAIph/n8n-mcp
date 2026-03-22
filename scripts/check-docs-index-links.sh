#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "ERROR: $*"
  exit 1
}

check_clickable_index() {
  local f="$1"
  [[ -f "$f" ]] || return 0

  # Require at least one markdown link to avoid "index without navigation".
  grep -qF '](' "$f" || fail "$f: index must contain at least one markdown link ([text](path))"

  # Disallow backticked .md references which look like links but are not clickable.
  if grep -qE '^[-*][[:space:]]+`[^`]+\.md`' "$f"; then
    fail "$f: do not use backticked .md references in lists; use markdown links"
  fi

  # Table rows and backticked links: do a lightweight line-by-line check to avoid grep ERE quirks.
  local re_backticked_md='`[^`]+\.md`'
  local re_backticked_link='`\[[^]]+\]\([^)]+\)`'
  while IFS= read -r line; do
    if [[ "$line" == "|"* && "$line" =~ $re_backticked_md ]]; then
      fail "$f: do not use backticked .md references in tables; use markdown links"
    fi
    if [[ "$line" =~ $re_backticked_link ]]; then
      fail "$f: do not wrap markdown links in backticks; they must be clickable"
    fi
  done < "$f"
}

check_clickable_index "docs/README.md"
check_clickable_index "docs/adr/README.md"

if [[ -f "docs/runbooks/README.md" ]]; then
  check_clickable_index "docs/runbooks/README.md"
  while IFS= read -r f; do
    check_clickable_index "$f"
  done < <(find docs/runbooks -type f -name 'README.md' ! -path 'docs/runbooks/README.md' | sort)
fi

if [[ -f "docs/wiki/README.md" ]]; then
  check_clickable_index "docs/wiki/README.md"
fi

echo "OK: docs index links"
