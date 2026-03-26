[English](./task.en.md) | [Українська](./task.md)

# Release v1.2.0 (Model-as-Schema v2 & @nan0web/core Integration)

## Scope

Міграція доменних моделей `nan0web.app` на базовий клас `Model` з `@nan0web/core` (Golden Standard v2).
Інтеграція IoC (Inversion of Control) паттерну в `AppRunner` для тестабельності.

### 1. Model Migration

- `NaN0WebConfig`, `AppEntryConfig`, `LogConfig` → `extends Model`
- Видалення instance field declarations (V8 override fix)
- Збереження hydration constructor для nested models (LogConfig, AppEntryConfig[])

### 2. AppRunner IoC

- Constructor приймає `{ cwd, db }` options object
- IoC: `db` injection пропускає створення DBwithFSDriver (для тестів)
- `#loadConfig` → `NaN0WebConfig.from()` typification
- Backward compat: string arg + no-arg продовжують працювати

### 3. Contract Tests

- Story 5: `CoreIntegration.story.js` — 8 контрактних тестів
  - Model inheritance (instanceof), validate() contract
  - IoC getters (`this.db`, `this._`), nested hydration
  - AppRunner backward compatibility (string, object, no-args)

## Definition of Done (Acceptance Criteria)

1. `@nan0web/core` додано як `workspace:*` залежність.
2. Всі доменні моделі `extends Model` (не мають власних instance field initializers).
3. `AppRunner` constructor приймає `{ db }` для IoC injection.
4. `NaN0WebConfig.from(rawData)` повертає типізований Model.
5. Story 5 (`CoreIntegration.story.js`) — 8/8 pass.
6. Усі існуючі тести (24 unit + 9 story) продовжують проходити.
7. Повний набір: ≥ 41 тест, 0 fail.

## Architecture Audit (Чекліст)

- [x] V8 Instance Field Override — задокументовано та виправлено.
- [x] Golden Standard v2 — static fields only, JSDoc @property для типів.
- [x] IoC Pattern — db інжекція через constructor options.
- [x] Backward compat — string і no-arg конструктори працюють.
