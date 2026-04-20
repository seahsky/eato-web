#!/usr/bin/env bash
# Regenerate Swift types from the committed docs/openapi.json spec.
# Run from the ios/ directory (or anywhere — the script cd's itself).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_DIR="$(cd "$IOS_DIR/.." && pwd)"

SPEC="$REPO_DIR/docs/openapi.json"
OUT="$IOS_DIR/Eato/Core/Networking/Generated"
CONFIG="$IOS_DIR/Codegen/openapi-generator-config.yaml"

if [ ! -f "$SPEC" ]; then
  echo "Spec not found: $SPEC"
  echo "Emit it first with: (cd $REPO_DIR && npm run openapi:emit)"
  exit 1
fi

mkdir -p "$OUT"

cd "$IOS_DIR/Codegen"
swift run swift-openapi-generator generate \
  --config "$CONFIG" \
  --output-directory "$OUT" \
  "$SPEC"

echo "Regenerated $(ls "$OUT" | grep -c '\.swift$' || true) Swift files into $OUT"
