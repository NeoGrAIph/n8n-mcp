# Runbook: Docs Quality Checks

Status: active | Audience: developer | Last reviewed: 2026-02-09

## Goal

Проверить, что документация соответствует стандарту v2 и проходит CI gates (markdownlint/linkcheck/структура/индексы/runbooks метаданные).

## Preconditions

- Bash (Linux/macOS/WSL)
- Docker (для запуска markdownlint/lychee через контейнеры) или локальная установка соответствующих инструментов

## Procedure

1. Проверка структуры и обязательных файлов:
   ```bash
   bash scripts/check-docs-structure.sh
   ```

2. Проверка кликабельности ссылок в индексах:
   ```bash
   bash scripts/check-docs-index-links.sh
   ```

3. Проверка метаданных в runbooks (только для `profile: service/infra`):
   ```bash
   bash scripts/check-runbooks-audience.sh
   ```

4. (Рекомендовано) Сводный отчёт соответствия:
   ```bash
   bash scripts/check-docs-compliance-report.sh
   ```

## Verification

- Все команды выше завершаются статусом 0 и печатают `OK: ...`.

## References

- Стандарт: `/home/neograiph/repo/synestra-standards/docs/standards/documentation/standard.md`
- CI scripts: `scripts/check-docs-*.sh`

