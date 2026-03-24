# meta developer: @OrangeFaHTA
# scope: hikka_only
# scope: hikka_min 1.3.0
# version: 1.0
# neuralv-module = neuralv-module

import logging
import asyncio
import httpx
import re
import io
import time
from .. import loader, utils

logger = logging.getLogger(__name__)

VERDICT_PATTERN = re.compile(
    r'\b(Безопасно|Осторожно|Опасно)\b', re.IGNORECASE
)
VERDICT_ICONS = {
    "безопасно": "✅",
    "осторожно": "⚠️",
    "опасно": "🚫",
}
CACHE_TTL = 3600  # 1 час


@loader.tds
class NeuralVMod(loader.Module):
    """🧠 NeuralV — Антивирус от Fatal Error Team.
    Получить ключ: https://aistudio.google.com/app/apikey"""

    strings = {
        "name": "NeuralV",
        "processing": "<emoji document_id=5386367538735104399>⌛️</emoji> <b>Анализ...</b>",
        "no_file": "<b>⚠️ NeuralV:</b> Ответь на файл или текст.",
        "no_api": "<b>❗️ NeuralV:</b> API ключ не найден.",
        "bad_provider": "<b>❗️ NeuralV:</b> Некорректный провайдер. Доступно: gemini, openai, groq.",
        "bad_model": "<b>❗️ NeuralV:</b> Некорректная модель/endpoint для выбранного провайдера.",
        "bad_json": "<b>❗️ NeuralV:</b> Некорректный ответ API (JSON не распознан).",
        "result_header": "🛡 <b>Отчет ИБ-анализа:</b> <code>{}</code>\n\n",
        "timeout": "<b>⏳ Лимит запросов. Повтор через {} сек...</b>",
        "error": "<b>❗️ Ошибка API:</b>\n<code>{}</code>",
        "bad_endpoint": "<b>❗️ NeuralV:</b> Некорректный endpoint. Укажи полный URL (https://...).",
        "http_error": "<b>❗️ Ошибка HTTP:</b> <code>{}</code>\n<code>{}</code>",
        "bad_endpoint_cfg": "<b>❗️ NeuralV:</b> Endpoint из конфига некорректен: <code>{}</code>",
        "bad_key": "<b>❗️ NeuralV:</b> Укажи API ключ в конфиге.",
        "no_content": "<b>❗️ NeuralV:</b> В ответе не найден текст (content).",
        "file_too_big": "<b>❗️ NeuralV:</b> Файл слишком большой для анализа (>{} MB).",
        "not_in_cache": "<b>❗️ NeuralV:</b> Файл <code>{}</code> не найден в истории.",
        "cache_expired": "<b>⏳ NeuralV:</b> Запись для <code>{}</code> устарела (>{} мин). Перепроверь файл.",
        "retrying": "<emoji document_id=5386367538735104399>⌛️</emoji> <b>Ожидание {} сек. (лимит), повтор...</b>",
        "retry_failed": "<b>❗️ NeuralV:</b> Повтор не помог. Попробуй позже.",
    }

    def __init__(self):
        self.config = loader.ModuleConfig(
            loader.ConfigValue(
                "provider",
                "gemini",
                lambda: "Провайдер ИИ: gemini/openai/groq.",
                validator=loader.validators.Choice(["gemini", "openai", "groq"]),
            ),
            loader.ConfigValue(
                "api_key",
                "",
                lambda: "API ключ выбранного провайдера (Gemini/OpenAI/Groq).",
                validator=loader.validators.Hidden(),
            ),
            loader.ConfigValue(
                "model",
                "gemini-2.0-flash-exp",
                lambda: "Модель анализа (для gemini: gemini-*, для openai: gpt-*, для groq: llama*/mixtral* и т.д.).",
                validator=loader.validators.String(),
            ),
            loader.ConfigValue(
                "endpoint",
                "https://generativelanguage.googleapis.com",
                lambda: "Endpoint ИИ (например: https://generativelanguage.googleapis.com, https://api.openai.com, https://api.groq.com)",
                validator=loader.validators.String(),
            ),
            loader.ConfigValue(
                "ai_endpoint",
                "https://generativelanguage.googleapis.com",
                lambda: "Свой endpoint ИИ (приоритетнее endpoint). Полный URL.",
                validator=loader.validators.String(),
            ),
            loader.ConfigValue(
                "custom_endpoint",
                "",
                lambda: "Свой эндпоинт ИИ (самый высокий приоритет). Если пусто — используется ai_endpoint/endpoint.",
                validator=loader.validators.String(),
            ),
            loader.ConfigValue(
                "max_file_mb",
                10,
                lambda: "Максимальный размер файла для анализа (MB).",
                validator=loader.validators.Integer(minimum=1, maximum=50),
            ),
            loader.ConfigValue(
                "auto_retry",
                True,
                lambda: "Автоматически повторять запрос при 429 (лимит запросов).",
                validator=loader.validators.Boolean(),
            ),
            loader.ConfigValue(
                "max_retry_wait",
                60,
                lambda: "Максимальное время ожидания перед авторетраем (сек).",
                validator=loader.validators.Integer(minimum=5, maximum=120),
            ),
        )
        # Кэш: {filename: {"verdict": str, "icon": str, "word": str, "ts": float}}
        self.v_cache: dict = {}

    # ─── утилиты ────────────────────────────────────────────────────────────────

    @staticmethod
    def _normalize_endpoint(raw: str) -> str:
        value = (raw or "").strip().rstrip("/")
        return value

    @staticmethod
    def _extract_retry_seconds(text: str):
        if not text:
            return None
        for pattern in [
            r"(\d+\.?\d*)\s*s\b",
            r"retry after (\d+)",
            r"(\d+)\s*сек",
        ]:
            m = re.search(pattern, text.lower())
            if m:
                try:
                    return max(1, round(float(m.group(1))))
                except Exception:
                    pass
        return None

    def _get_endpoint(self) -> str:
        raw = (
            self._normalize_endpoint(self.config.get("custom_endpoint") or "")
            or self._normalize_endpoint(self.config.get("ai_endpoint") or "")
            or self._normalize_endpoint(self.config.get("endpoint") or "")
        )
        if not raw:
            return ""
        if not raw.startswith("http://") and not raw.startswith("https://"):
            raise ValueError(self.strings["bad_endpoint_cfg"].format(utils.escape_html(raw)))
        return raw

    # ─── промпт ─────────────────────────────────────────────────────────────────

    def _build_prompt(self, code_content: str) -> str:
        return (
            "Ты — старший эксперт по информационной безопасности (Red Team / DFIR).\n"
            "Выполни СТАТИЧЕСКИЙ анализ кода ниже. Отвечай строго на русском языке.\n\n"
            "ПРАВИЛА ФОРМАТИРОВАНИЯ:\n"
            "- Без Markdown-символов (*, #, _, `, |).\n"
            "- Только обычный текст с нумерованными пунктами.\n"
            "- Не выдумывай факты. Если не хватает контекста — укажи это явно.\n\n"
            "ОБЯЗАТЕЛЬНЫЕ ПРОВЕРКИ:\n"
            "1. Выполнение команд ОС (os, subprocess, exec, eval, shell=True).\n"
            "2. Сетевые запросы (requests, httpx, socket, urllib) — адреса, передаваемые данные.\n"
            "3. Кража токенов / паролей / ключей (env-переменные, hardcode, keylogger).\n"
            "4. Эксфильтрация данных (отправка файлов, скриншотов, буфера обмена).\n"
            "5. Автозапуск / персистентность (реестр, cron, startup-папка).\n"
            "6. Обфускация / упаковка (base64, zlib, marshal, exec(compile(...))).\n"
            "7. Подозрительные импорты (ctypes, winreg, pynput, cv2, PIL, pyautogui).\n"
            "8. Манипуляции с файлами (удаление, шифрование, рекурсивный обход).\n"
            "9. Повышение привилегий / обход UAC.\n"
            "10. Признаки C2 / reverse shell / backdoor.\n\n"
            "СТРУКТУРА ОТВЕТА (строго соблюдай):\n"
            "1) НАЗНАЧЕНИЕ: что делает код (2-4 предложения).\n"
            "2) РИСКИ: список рисков с уровнем (Критично / Высоко / Средне / Низко).\n"
            "3) ПОДОЗРИТЕЛЬНЫЕ ФРАГМЕНТЫ: конкретные строки или функции с пояснением.\n"
            "4) РЕКОМЕНДАЦИИ: конкретные шаги по устранению.\n"
            "5) ИТОГ: одно слово — Безопасно, Осторожно или Опасно.\n\n"
            f"КОД ДЛЯ ПРОВЕРКИ:\n{code_content}"
        )

    # ─── запрос к API ────────────────────────────────────────────────────────────

    def _build_request(self, prompt: str, api_key: str) -> tuple:
        provider = (self.config["provider"] or "").strip().lower()
        endpoint = self._get_endpoint()
        model = (self.config["model"] or "").strip()

        if not endpoint:
            raise ValueError(self.strings["bad_endpoint"])
        if not model:
            raise ValueError(self.strings["bad_model"])

        if provider == "gemini":
            url = f"{endpoint}/v1beta/models/{model}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.1, "maxOutputTokens": 4096},
            }
            return url, payload, {}

        if provider == "openai":
            url = f"{endpoint}/v1/chat/completions"
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": "Ты — эксперт по ИБ. Отвечай строго на русском языке. Без Markdown."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.1,
                "max_tokens": 4096,
            }
            return url, payload, headers

        if provider == "groq":
            url = f"{endpoint}/openai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": "Ты — эксперт по ИБ. Отвечай строго на русском языке. Без Markdown."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.1,
                "max_tokens": 4096,
            }
            return url, payload, headers

        raise ValueError(self.strings["bad_provider"])

    async def _api_post(self, url: str, payload: dict, headers: dict = None) -> tuple:
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(url, json=payload, headers=headers or {})
        except httpx.TimeoutException as e:
            raise RuntimeError(f"Тайм-аут запроса: {e}") from e
        except httpx.HTTPError as e:
            raise RuntimeError(f"Ошибка сети: {e}") from e

        try:
            data = response.json()
        except Exception:
            data = None

        return response, data

    def _parse_verdict(self, provider: str, response: httpx.Response, data) -> str:
        if data is None:
            raise ValueError(self.strings["bad_json"])

        provider = (provider or "").strip().lower()

        if provider == "gemini":
            try:
                parts = data["candidates"][0]["content"]["parts"]
                return parts[0].get("text") or ""
            except (KeyError, IndexError, TypeError):
                return ""

        if provider in {"openai", "groq"}:
            try:
                return data["choices"][0]["message"].get("content") or ""
            except (KeyError, IndexError, TypeError):
                return ""

        return ""

    # ─── определение вердикта ────────────────────────────────────────────────────

    @staticmethod
    def _extract_final_verdict(verdict_text: str) -> str:
        """Надёжное извлечение итогового слова через regex (последнее вхождение)."""
        matches = VERDICT_PATTERN.findall(verdict_text)
        if matches:
            return matches[-1].capitalize()
        return "Не определено"

    # ─── отправка отчёта ─────────────────────────────────────────────────────────

    async def _send_report(self, message, filename: str, verdict: str, m_status=None):
        final_word = self._extract_final_verdict(verdict)
        icon = VERDICT_ICONS.get(final_word.lower(), "❓")

        self.v_cache[filename] = {
            "verdict": verdict,
            "icon": icon,
            "word": final_word,
            "ts": time.time(),
        }

        header = self.strings["result_header"].format(filename)

        if len(verdict) > 3500:
            file = io.BytesIO(verdict.encode())
            file.name = f"Report_{filename}.txt"
            if m_status:
                await m_status.delete()
            return await self.client.send_file(
                message.peer_id,
                file,
                caption=header + f"<b>Итог: {icon} {final_word}</b>",
            )

        res = header
        res += f"<blockquote expandable>{utils.escape_html(verdict)}</blockquote>\n"
        res += f"<b>Итоговая оценка: {icon} {final_word}</b>"
        return await utils.answer(m_status or message, res)

    # ─── команды ────────────────────────────────────────────────────────────────

    @loader.command()
    async def vcheck(self, message):
        """[reply] — Анализ кода/файла."""
        api_key = (self.config.get("api_key") or "").strip()
        if not api_key:
            return await utils.answer(message, self.strings["bad_key"])

        reply = await message.get_reply_message()
        if not reply:
            return await utils.answer(message, self.strings["no_file"])

        m_status = await utils.answer(message, self.strings["processing"])

        max_file_mb = max(1, min(50, int(self.config.get("max_file_mb") or 10)))
        max_bytes = max_file_mb * 1024 * 1024

        # Проверка размера до скачивания
        file_obj = getattr(reply, "file", None)
        file_size = getattr(file_obj, "size", None) if file_obj else None
        if file_size and isinstance(file_size, int) and file_size > max_bytes:
            return await utils.answer(m_status, self.strings["file_too_big"].format(max_file_mb))

        if reply.file:
            try:
                raw = await self.client.download_media(reply, bytes)
            except Exception as e:
                logger.exception("Ошибка скачивания файла: %s", e)
                return await utils.answer(m_status, self.strings["error"].format(f"Не удалось скачать файл: {e}"))
            if not raw:
                return await utils.answer(m_status, self.strings["error"].format("Файл пустой."))
            if len(raw) > max_bytes:
                return await utils.answer(m_status, self.strings["file_too_big"].format(max_file_mb))
            code_content = raw.decode("utf-8", errors="ignore")
        else:
            code_content = reply.text or ""

        if not code_content.strip():
            return await utils.answer(m_status, self.strings["no_file"])

        filename = ""
        try:
            filename = reply.file.name if reply.file else ""
        except Exception:
            filename = ""
        if not filename:
            filename = f"snippet_{message.id}.txt"

        provider = (self.config["provider"] or "").strip().lower()
        prompt = self._build_prompt(code_content)

        try:
            try:
                url, payload, headers = self._build_request(prompt, api_key)
            except ValueError as ve:
                return await utils.answer(m_status, str(ve))

            response, data = await self._api_post(url, payload, headers=headers)

            # Авторетрай при 429
            if response.status_code == 429 and self.config.get("auto_retry"):
                msg_text = ""
                try:
                    msg_text = (data.get("error", {}) or {}).get("message", "") if isinstance(data, dict) else ""
                except Exception:
                    pass
                secs = self._extract_retry_seconds(msg_text) or 15
                max_wait = int(self.config.get("max_retry_wait") or 60)
                if secs <= max_wait:
                    await utils.answer(m_status, self.strings["retrying"].format(secs))
                    await asyncio.sleep(secs)
                    response, data = await self._api_post(url, payload, headers=headers)
                    if response.status_code == 429:
                        return await utils.answer(m_status, self.strings["retry_failed"])
                else:
                    return await utils.answer(m_status, self.strings["timeout"].format(secs))

            if data is None:
                raw_text = ""
                try:
                    raw_text = response.text or ""
                except Exception:
                    pass
                return await utils.answer(
                    m_status,
                    self.strings["http_error"].format(
                        response.status_code,
                        utils.escape_html(raw_text[:1200]),
                    ),
                )

            if isinstance(data, dict) and "error" in data:
                err_msg = ""
                try:
                    err_msg = (data["error"] or {}).get("message", "Неизвестная ошибка API.")
                except Exception:
                    err_msg = "Неизвестная ошибка API."
                return await utils.answer(m_status, self.strings["error"].format(err_msg))

            if response.status_code >= 400:
                raw_text = ""
                try:
                    raw_text = response.text or ""
                except Exception:
                    pass
                return await utils.answer(
                    m_status,
                    self.strings["http_error"].format(
                        response.status_code,
                        utils.escape_html(raw_text[:1200]),
                    ),
                )

            try:
                verdict = self._parse_verdict(provider, response, data)
            except ValueError as ve:
                return await utils.answer(m_status, self.strings["error"].format(str(ve)))
            except Exception as e:
                logger.exception("Ошибка парсинга ответа API: %s", e)
                verdict = ""

            if not verdict:
                return await utils.answer(m_status, self.strings["error"].format(self.strings["no_content"]))

            await self._send_report(message, filename, verdict, m_status)

        except Exception as e:
            logger.exception("Ошибка в vcheck: %s", e)
            await utils.answer(m_status, self.strings["error"].format(str(e)))

    @loader.command()
    async def vlist(self, message):
        """— История последних проверок."""
        if not self.v_cache:
            return await utils.answer(message, "📂 История пуста.")

        now = time.time()
        res = "<b>📊 История анализа NeuralV:</b>\n\n"
        for name, entry in self.v_cache.items():
            icon = entry["icon"]
            word = entry["word"]
            age_min = int((now - entry["ts"]) / 60)
            age_str = f"{age_min} мин. назад" if age_min < 60 else f"{age_min // 60} ч. назад"
            res += f"{icon} <code>{name}</code> — <b>{word}</b> <i>({age_str})</i>\n"

        await utils.answer(message, res)

    @loader.command()
    async def vinfo(self, message):
        """[имя файла] — Показать полный отчёт из кэша."""
        args = utils.get_args_raw(message).strip()
        if not args:
            return await utils.answer(message, "⚠️ Укажи имя файла. Пример: <code>.vinfo bot.py</code>")

        entry = self.v_cache.get(args)
        if not entry:
            return await utils.answer(message, self.strings["not_in_cache"].format(args))

        age_min = int((time.time() - entry["ts"]) / 60)
        if age_min > CACHE_TTL // 60:
            return await utils.answer(
                message, self.strings["cache_expired"].format(args, CACHE_TTL // 60)
            )

        verdict = entry["verdict"]
        icon = entry["icon"]
        word = entry["word"]
        header = self.strings["result_header"].format(args)

        if len(verdict) > 3500:
            file = io.BytesIO(verdict.encode())
            file.name = f"Report_{args}.txt"
            return await self.client.send_file(
                message.peer_id,
                file,
                caption=header + f"<b>Итог: {icon} {word}</b>",
            )

        res = header
        res += f"<blockquote expandable>{utils.escape_html(verdict)}</blockquote>\n"
        res += f"<b>Итоговая оценка: {icon} {word}</b>"
        await utils.answer(message, res)

    @loader.command()
    async def vclear(self, message):
        """— Очистить историю."""
        self.v_cache = {}
        await utils.answer(message, "🧹 История очищена.")