#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${1:-$ROOT_DIR/.venv-analyzers}"

python3 -m venv "$VENV_DIR"
"$VENV_DIR/bin/pip" install --upgrade pip wheel setuptools
"$VENV_DIR/bin/pip" install --upgrade \
  androguard \
  quark-engine \
  yara-python \
  apkid

if command -v "$VENV_DIR/bin/freshquark" >/dev/null 2>&1; then
  "$VENV_DIR/bin/freshquark" || true
fi

cat <<EOF
Analyzer environment ready.
Set these variables in the backend environment:
APK_ANALYZER_PYTHON=$VENV_DIR/bin/python
QUARK_RULES_DIR=\${QUARK_RULES_DIR:-$HOME/.quark-engine/quark-rules}
APK_ANALYZER_TIMEOUT_MS=120000
EOF
