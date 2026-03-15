# NeuralV shell

Linux shell/TUI client and resident daemon scaffold for NeuralV.

Install:

```bash
curl -fsSL https://sosiskibot.ru/neuralv/install/linux.sh | bash
```

Commands:
- `bash ~/.local/bin/neuralv-shell` or direct binary launch after install
- `curl -fsSL https://sosiskibot.ru/neuralv/install/linux.sh | bash -s -- update`
- `curl -fsSL https://sosiskibot.ru/neuralv/install/linux.sh | bash -s -- uninstall`
- `curl -fsSL https://sosiskibot.ru/neuralv/install/linux.sh | bash -s -- start`
- `curl -fsSL https://sosiskibot.ru/neuralv/install/linux.sh | bash -s -- stop`
- `curl -fsSL https://sosiskibot.ru/neuralv/install/linux.sh | bash -s -- status`

Resident mode is provided by `neuralvd` as a systemd user service.
