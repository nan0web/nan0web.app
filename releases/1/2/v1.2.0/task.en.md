[Українська](./task.md) | [English](./task.en.md)

# Release v1.2.0 (Model-as-Schema v2 & @nan0web/core Integration)

## Scope

Migration of `nan0web.app` domain models to the `Model` base class from `@nan0web/core` (Golden Standard v2).
Integration of the IoC (Inversion of Control) pattern into `AppRunner` for improved testability.

### 1. Model Migration

- `NaN0WebConfig`, `AppEntryConfig`, `LogConfig` → `extends Model`
- Removal of instance field declarations (V8 override fix)
- Preservation of hydration constructor for nested models (LogConfig, AppEntryConfig[])

### 2. AppRunner IoC

- Constructor accepts `{ cwd, db }` options object
- IoC: `db` injection skips DBwithFSDriver creation (for tests)
- `#loadConfig` → `NaN0WebConfig.from()` typification
- Backward compat: string arg + no-arg still work

### 3. Contract Tests

- Story 5: `CoreIntegration.story.js` — 8 contract tests
  - Model inheritance (instanceof), validate() contract
  - IoC getters (`this.db`, `this._`), nested hydration
  - AppRunner backward compatibility (string, object, no-args)

## Definition of Done (Acceptance Criteria)

1. `@nan0web/core` added as `workspace:*` dependency.
2. All domain models `extends Model` (no instance field initializers).
3. `AppRunner` constructor accepts `{ db }` for IoC injection.
4. `NaN0WebConfig.from(rawData)` returns a typed Model.
5. Story 5 (`CoreIntegration.story.js`) — 8/8 pass.
6. All existing tests (24 unit + 9 story) continue to pass.
7. Full suite: ≥ 41 tests, 0 fail.

## Architecture Audit Checklist

- [x] V8 Instance Field Override — documented and fixed.
- [x] Golden Standard v2 — static fields only, JSDoc @property for types.
- [x] IoC Pattern — db injection via constructor options.
- [x] Backward compat — string and no-arg constructors still work.
