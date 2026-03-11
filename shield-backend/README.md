# Shield Antivirus — Backend API

## Deploy

```bash
ssh fatalerror@91.233.168.135
cd /home/fatalerror/shield-backend
cp .env.example .env
nano .env
npm install
npm run check
npm run pm2:restart
pm2 save
mysql -u root shield_auth < scripts/schema.sql
```

## Required mail env
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM`
- `APP_RESET_URL`

For Gmail SMTP use:
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `SMTP_PASS=<Google app password, not the normal account password>`
- `APP_RESET_URL=shieldsecurity://auth/reset-password`

## Auth API

### Two-step register
- `POST /api/auth/register/start`
- body:
```json
{
  "name": "Fatal Error",
  "email": "user@example.com",
  "password": "secret123",
  "device_id": "android-device-id"
}
```

- `POST /api/auth/register/verify`
- body:
```json
{
  "challenge_id": "...",
  "code": "123456",
  "device_id": "android-device-id"
}
```

### Two-step login
- `POST /api/auth/login/start`
- `POST /api/auth/login/verify`

### Password reset
- `POST /api/auth/password-reset/request`
- body:
```json
{ "email": "user@example.com" }
```

- `POST /api/auth/password-reset/confirm`
- body:
```json
{
  "token": "raw-reset-token",
  "email": "user@example.com",
  "password": "newSecret123"
}
```

## Other API
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/scans`
- `GET /api/scans`
- `DELETE /api/scans`
- `POST /api/purchases`
- `GET /api/purchases/active`
- `GET /healths`

## Health checks
```bash
curl http://91.233.168.135:5001/healths
curl https://sosiskibot.ru/basedata
curl https://sosiskibot.ru/basedata/health
```

## Schema additions
- `email_auth_challenges` — one-time mail codes for login and registration
- `password_reset_tokens` — one-time reset links

## Logs
```bash
pm2 logs shield-api
```
