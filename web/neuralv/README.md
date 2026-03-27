# NeuralV Website

Vite + React + Material Web scaffold для публикации под `https://neuralvv.org/`.

## Что уже реализовано

- SPA с роутами:
  - `/`
  - `/android`
  - `/windows`
  - `/linux`
- MD3-inspired responsive UI на Material Web кнопках и кастомных expressive tokens.
- Чтение release manifest из backend:
  - по умолчанию `GET /basedata/api/releases/manifest`
  - можно переопределить через `VITE_RELEASE_MANIFEST_URL`
- Fallback manifest, если backend ещё не публикует артефакты.

## Предполагаемый deploy под nginx

Собранный `dist/` должен обслуживаться из корня домена.

Пример location:

```nginx
location / {
    root /var/www/neuralvv;
    try_files $uri $uri/ /index.html;
}
```

## Переменные окружения

- `VITE_RELEASE_MANIFEST_URL` — override для URL release manifest.

## Контракт manifest

Ожидаемый JSON:

```json
{
  "generatedAt": "2026-03-15T12:00:00Z",
  "releaseChannel": "main",
  "artifacts": [
    {
      "platform": "android",
      "version": "1.4.0",
      "downloadUrl": "https://.../neuralv-android.apk",
      "sha256": "..."
    },
    {
      "platform": "shell",
      "installCommand": "curl -fsSL https://neuralvv.org/install/linux.sh | bash"
    }
  ]
}
```

## Замечания

- Проект специально не запускает локальные билды в рамках этой задачи.
- Для деплоя нужен CI job, который публикует `dist/` и синхронизирует `release manifest` с backend.
