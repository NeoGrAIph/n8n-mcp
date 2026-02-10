# ADR: Adopt Repository Documentation Standard v2

Status: accepted | Last reviewed: 2026-02-09

## Context

Документация в репозитории развивалась органически и со временем накопила:
- отсутствующие entrypoints (`README.md`, индексы, capabilities);
- битые относительные ссылки/якоря;
- смешение how-to/reference/explanation;
- отсутствие CI guardrails для качества docs.

## Decision

Применяем стандарт документации v2 из `synestra-standards`:
- обязательные entrypoints: `README.md`, `docs/README.md`, `docs/adr/README.md`, `docs/reference/capabilities.md`, `docs/metadata/repo.yaml`;
- per-tool reference: `docs/reference/tools/<tool>.md` + индекс `docs/reference/tools/README.md`;
- how-to сценарии: `docs/how-to/` (композиция нескольких tools);
- runbooks (так как `profile: service`): `docs/runbooks/<area>/...` с обязательной мета-строкой `Status/Audience/Last reviewed`;
- CI gates: markdownlint + linkcheck + проверка структуры/индексов/runbooks метаданных.

## Consequences

- Структура docs становится предсказуемой и проверяемой в CI.
- “Контракт возможностей” фиксируется в `docs/reference/capabilities.md` и обновляется при изменении внешнего поведения.
- Большой объём существующих документов сохраняется; устаревшие материалы помечаются `Status: deprecated` и содержат ссылку на каноничный документ.

