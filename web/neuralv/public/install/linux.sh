#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${NEURALV_BASE_URL:-https://sosiskibot.ru}"
MANIFEST_URL="${NEURALV_MANIFEST_URL:-${BASE_URL}/basedata/api/releases/manifest}"
INSTALL_ROOT="${HOME}/.local/bin"
SYSTEMD_USER_DIR="${HOME}/.config/systemd/user"
TMP_DIR="$(mktemp -d)"
COMMAND="${1:-install}"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing command: $1" >&2
    exit 1
  }
}

read_manifest_field() {
  local manifest_json="$1"
  local platform="$2"
  local field="$3"
  python3 -c 'import json,sys
manifest=json.loads(sys.argv[1])
platform=sys.argv[2].lower(); field=sys.argv[3]
for item in manifest.get("artifacts", []):
    key=str(item.get("platform", "")).lower()
    if key == platform or (platform == "shell" and key == "linux_shell"):
        value=item.get(field)
        if value is None:
            value=item.get(field.replace("_", ""))
        if isinstance(value, (dict, list)):
            print(json.dumps(value))
        else:
            print(value or "")
        break' "$manifest_json" "$platform" "$field"
}

fetch_manifest() {
  require_cmd curl
  require_cmd python3
  curl -fsSL "$MANIFEST_URL"
}

install_bins() {
  mkdir -p "$INSTALL_ROOT"
  local manifest shell_url daemon_url
  manifest="$(fetch_manifest)"
  shell_url="$(read_manifest_field "$manifest" shell download_url)"
  daemon_url="$(read_manifest_field "$manifest" shell metadata | python3 -c 'import json,sys; data=json.load(sys.stdin) if not sys.stdin.isatty() else {}; print(data.get("daemonUrl", ""))' 2>/dev/null || true)"
  if [[ -z "$shell_url" ]]; then
    echo "Shell artifact URL missing in manifest" >&2
    exit 1
  fi
  curl -fsSL "$shell_url" -o "$TMP_DIR/neuralv-shell.tar.gz"
  tar -xzf "$TMP_DIR/neuralv-shell.tar.gz" -C "$TMP_DIR"
  install -m 0755 "$TMP_DIR/neuralv-shell" "$INSTALL_ROOT/neuralv-shell"

  if [[ -n "$daemon_url" ]]; then
    curl -fsSL "$daemon_url" -o "$TMP_DIR/neuralvd.tar.gz"
    tar -xzf "$TMP_DIR/neuralvd.tar.gz" -C "$TMP_DIR"
    install -m 0755 "$TMP_DIR/neuralvd" "$INSTALL_ROOT/neuralvd"
  fi
}

install_service() {
  mkdir -p "$SYSTEMD_USER_DIR"
  cat > "$SYSTEMD_USER_DIR/neuralvd.service" <<EOF2
[Unit]
Description=NeuralV resident Linux daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=${INSTALL_ROOT}/neuralvd
Restart=always
RestartSec=5
Environment=NEURALV_BASE_URL=${BASE_URL}/basedata

[Install]
WantedBy=default.target
EOF2
  systemctl --user daemon-reload
  systemctl --user enable --now neuralvd.service
}

case "$COMMAND" in
  install)
    install_bins
    install_service
    echo "Installed NeuralV shell into $INSTALL_ROOT"
    echo "Run: ${INSTALL_ROOT}/neuralv-shell"
    ;;
  update)
    install_bins
    systemctl --user restart neuralvd.service || true
    echo "Updated NeuralV shell"
    ;;
  uninstall)
    systemctl --user disable --now neuralvd.service >/dev/null 2>&1 || true
    rm -f "$SYSTEMD_USER_DIR/neuralvd.service" "$INSTALL_ROOT/neuralv-shell" "$INSTALL_ROOT/neuralvd"
    systemctl --user daemon-reload >/dev/null 2>&1 || true
    echo "NeuralV shell removed"
    ;;
  start)
    systemctl --user start neuralvd.service
    ;;
  stop)
    systemctl --user stop neuralvd.service
    ;;
  status)
    systemctl --user status neuralvd.service --no-pager
    ;;
  *)
    echo "Usage: $0 [install|update|uninstall|start|stop|status]" >&2
    exit 1
    ;;
esac
