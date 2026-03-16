# NeuralV Linux shell

NeuralV shell — лёгкий Linux-клиент для общего backend NeuralV. Он даёт полноэкранный TUI, единый вход и простой установочный поток через `nv`.

## Установить `nv`

```sh
curl -fsSL https://sosiskibot.ru/neuralv/install/nv.sh | sh
```

## Установить NeuralV

```sh
nv install neuralv@latest
```

## Открыть TUI

```sh
neuralv
```

Полезные флаги:

```sh
neuralv --low-motion
neuralv --motion
neuralv -v
```

## Что даёт TUI

- единый вход через `/basedata`
- лёгкий полноэкранный интерфейс для Linux-терминалов
- low-motion режим для SSH-сессий и слабых машин
- серверную проверку хоста с живым статусом и отменой
- хранение последнего завершённого результата прямо в потоке сессии

## Основные команды `nv`

```sh
nv install neuralv@latest
nv install neuralv@1.3.1
nv uninstall neuralv
nv -v
```

`nv` ставит `neuralv`, `neuralv-shell` и, когда он опубликован, `neuralvd` в `~/.local/bin`.
