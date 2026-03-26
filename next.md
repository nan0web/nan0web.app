# 🚀 NaN0Web.app — Next Steps

## 📖 Live Documentation Engine (March 2026)

**Поточний стан (11.03.2026):**
Відбувається трансформація `nan0web.app` у рушій живої документації (заміна Vitepress та статичних сайтів).

- [x] **Aliases Protocol (Протокол):** У `@nan0web/db` реалізовано `resolveAlias(uri)` з наскрізною інтеграцією в `resolve()`.
- [x] **Aliases Protocol (FS Драйвер):** У `@nan0web/db-fs` впроваджено sandbox bypass для алиасованих файлів, створено надійні тести.

**Наступні кроки після перезавантаження:**

- [x] **Locale Auto-Detection (`@nan0web/db-fs`):** Реалізовано в `src/utils/locales.js`. Сканує структуру (en, uk) та зіставляє з вбудованим реєстром.
- [x] **CLI Інтеграція (`nan0web.app`):** `--dsn docs/` реалізовано в `cli.js` (parseArgs) + `runner.js` (options.dsn → config override). Конфігурація з `nan0web.config.nan0`.
- [x] **Template-as-Data:** Реалізовано через `$content`/`content` pattern — будь-який документ може створити свою зміну і використовуватись як шаблон.

## ✅ Фаза 1: Universal Runner (Виконано)

- [x] **AppRunner**: `async function* run()` генератор — ui-cli стандарт.
- [x] **Config Detection**: `db.stat()` для `nan0web.config.(nan0|yaml|json|js)`.
- [x] **Config Loading**: `db.loadDocument()` для даних, `import()` для `.js`.
- [x] **Global State Builder**: `db.fetch('index')` → глобальні дані + `_/t.yaml`.
- [x] **i18n**: `db.extract(locale)` + `localeDb.fetch('index')` → `state.t`, `state.langs`.
- [x] **Config Prompt**: `NaN0WebConfig` як Model-as-Schema + `Form.createFromBodySchema()`.
- [x] **CLI Entry**: `src/cli.js` — `nan0web` (boot) / `nan0web config` (wizard).
- [x] **Залежності**: `@nan0web/db-fs`, `@nan0web/ui-cli`, `@nan0web/i18n`.

## ✅ Фаза 2: Domain & Rendering (Виконано)

- [x] **src/domain/NaN0WebConfig.js**: Модель конфігурації з `from()` + поле `theme`.
- [x] **src/domain/Page.js**: Модель сторінки — `slug`, `title`, `source`, `layout`, `icon`, `hidden`, `children`.
- [x] **src/domain/index.js**: Barrel-експорт усіх моделей.
- [x] **src/router/PagesRouter.js**: `pages.yaml` → автоматичний роутинг.
  - `load(state)` → побудова плоского індексу для O(1) розв'язання URL→Page.
  - `resolve('/cases')` → Page.
  - `match('/admin/users')` → `{ page, breadcrumbs }`.
  - `navigation()` → дерево для `ui-core/Navigation` (фільтрує `hidden`).
- [x] **src/renderer/Renderer.js**: OLMUI Universal Renderer.
  - `page` → `$content` блоки (Document pattern).
  - `list` → data-bound `ui-list` з `$items`, `$count`.
  - `form` → schema-driven `ui-form` з `$schema`.
  - `feed` → live `ui-feed` з `$entries`, `$live: true`.
  - `register()` → реєстр App-компонентів (`App.Auth.LogIn`).
  - `renderBlock()` → рендеринг зареєстрованих блоків.
- [x] **App Attach**: `config.apps[]` → `DBwithFSDriver` гілки + `state[name]`.
- [x] **runner.js**: Інтеграція Router + Renderer + `renderPage(path)`.
- [x] **Тести**: 15/15 pass (PagesRouter: 7, Renderer: 8).

## ✅ Фаза 2.5: Model-as-Schema v2 & Data-Driven Runner (2026-03-25)

### Доменні Моделі

- [x] **Navigation** → перенесено до `@nan0web/ui` (суверенна модель)
  - Рекурсивна ієрархія (`children: Navigation[]`)
  - `$id = '@nan0web/ui/Navigation'` для коректних схем у монорепо
  - Імпорт через `import { Navigation } from '@nan0web/ui/domain'` (subpath export з v1.8.0)
- [x] **LogConfig**: Модель логування (rotation: daily|hourly|size, dir, maxSizeMb, logBodies)
  - CLI `short` алиаси (-e, -d, -r, -s, -b)
  - Агрегація у `NaN0WebConfig.log` (auto-instantiation)
- [x] **AppEntryConfig**: `resolveDefaults` + `resolveAliases` + `get name()` accessor
- [x] **NaN0WebConfig.apps hydration**: plain objects → `new AppEntryConfig(a)` з alias resolution
- [x] **Emancipation of `name`**: `static appName` з `alias: 'name'` у всіх моделях

### Schema Generator v2 (`scripts/generate-schemas.js`)

- [x] **Alias Mapping**: `meta.alias` → JSON Schema property key
- [x] **Recursive Generation**: `meta.hint` → auto-enqueue nested models
- [x] **Hierarchy Preservation**: `domain/HR/Person.js` → `schemas/HR/Person.schema.json`
- [x] **`$id` Support**: `static $id` → namespaced schema paths для зовнішніх моделей
- [x] **IDE Integration**: `# yaml-language-server: $schema=...` у кожному `.nan0` файлі

### AppLogger (`src/utils/AppLogger.js`)

- [x] Файловий логер з 3 стратегіями ротації (daily, hourly, size)
- [x] `access()` — логування запитів (method, path, status, ms, locale)
- [x] `error()` — логування помилок (code, message, stack)
- [x] Інтеграція з `AppRunner.renderPage()` (auto-timing через `performance.now()`)
- [x] Graceful shutdown через `runner.stop()`

### Data Layer (`data/`)

- [x] Локалізована структура: `data/_/`, `data/en/`, `data/uk/`
- [x] `nav.nan0` — навігація (окремо від конфігу, завантажується динамічно)
- [x] `t.nan0` — переклади
- [x] `index.nan0` — глобальний стан
- [x] `nan0web.config.nan0` — конфігурація раннера з секцією `log`

### Тестування

- [x] **test/stories/Runner.story.js**: 4 канонічних сценарії, 9/9 pass ✅
  - Story 1: Config + LogConfig Aggregation
  - Story 2: Navigation Hierarchy (recursive children)
  - Story 3: AppLogger File Rotation (daily logs)
  - Story 4: JSON Schema Generation ($ref, alias, recursion)

### Залежності

- [x] `@nan0web/ui@1.8.0: workspace:*` — Navigation через `/domain` subpath export
- [x] `@nan0web/types@1.4.1` — ESM fix (JSDoc-касти замість TS `as`)

## 🛠 Фаза 3: Living Docs Engine (Docs-as-Data)

- [x] **CLI Configuration**: Підтримка `npx nan0web.app serve --dsn docs/` та конфігурування `nan0web.yaml` (dsn, aliases).
- [x] **Auto-Locales**: Модуль `detectLocales` та вбудований реєстр мов `data/langs.yaml`.
- [x] **Data Inheritance Layout**: Відмова від `templates/` на користь успадкування `$content` через `$ref` або `_/index.nan0` (поліморфний компоновщик UI).
- [x] **Markdown Renderer**: Інтеграція `@nan0web/markdown` та безпечного HTML.
- [x] **Docs Layout Engine**: `buildNavTree` з `db.fetch()` для автоматичного витягування frontmatter (title, order, icon, hidden). Сортування по `order`. Підтримка `directoryIndex: 'README'`.

## 📡 Фаза 4: WebSocket & Live State (Відкладено)

- [x] **WebSocket Bridge**: `src/bridge/WebSocketBridge.js` — реалізовано міст для Mesh-подій.
- [x] **State Sync**: Автоматичне оновлення `state` через `EventEmitter` + `updateState`.
- [ ] **Offline First**: `BrowserStore` кешування для роботи без мережі (Client-side).
- [x] **Hot Pages**: `PagesRouter.reload(newState)` — реалізовано підтримку hot-reload навігації.

## 🌐 Фаза 5: HTTP Server & SSR

- [x] **src/server/index.js**: HTTP/HTTPS сервер на `@nan0web/http-node` з TLS підтримкою (`config.ssl: { cert, key }`).
- [x] **SSR Pipeline**: `renderPage(path)` → HTML (server-side rendering).
- [x] **Static Export**: `nan0web build` → генерація статичних HTML файлів.
- [x] **API Routes**: `data/api/*.js` → серверні ендпойнти.
- [x] **directoryIndex**: `README` мод для GitHub/GitLab репозиторіїв (`config.directoryIndex: 'README'`).

## 📱 Фаза 5: Micro-App Ecosystem

- [x] **App Discovery**: `package.json#exports` → авто-детекція UI адаптерів (`./ui/cli`, `./ui/api`, `./ui/chat`, `./ui/lit`, `./ui/voice`, `./ui/swift`, `./ui/kotlin`, `./ui/robo`).
- [x] **Scoped Registry**: `AppRegistry` з `registerFromPackage(pkg)`, `hasAdapter()`, `getByAdapter()`.
- [x] **Intent Delegation**: `IntentResolver` — `canResolve()`, `resolve()` через `yield*`. Динамічний `import(src/ui/adapter)` з `package.json#exports`.
- [x] **App Isolation**: Реалізовано через `isolation: true` у `AppEntryConfig` + ізоляція у `AppRunner.state`.

## 📋 Тестування

- [x] **test/stories/Runner.story.js**: Story-тести для моделей та логування (9/9 pass).
- [x] **runner.test.js**: Тести за AC (config, state, i18n, router, renderer) — 11/11 in-memory DB tests.
- [ ] **config-prompt.test.js**: Тест інтерактивного конфіг-візарда.
- [x] **bridge.test.js**: Тести WebSocket Bridge + State Sync (src/bridge/WebSocketBridge.test.js ✅).

---

## 🏗️ Фаза 1: Архітектурний Реліз v0.1.0 (2026-04-04)

### Виконано (Pipeline №2 — Model-as-Schema)

- [x] **User Stories**: 33 канонічних сценарії в [docs/user-stories.md](./docs/user-stories.md)
- [x] **DBConfig** → делеговано до `@nan0web/db/src/domain/` (url, protocol, credentials, auto-detect, safeDsn)
- [x] **RevisionInfo** → делеговано до `@nan0web/db/src/domain/` (sha, key, author, timestamp — адаптер-агностичний)
- [x] **EditorConfig** → делеговано до `editor.app/src/domain/` (bundled, publicWrite, resolveAccessMode → host/sandbox/wiki/authenticated)
- [x] **AuthPolicy** → делеговано до `auth.app/src/domain/` (protectedPaths, publicPaths, isProtected + glob matching)
- [x] **NaN0WebConfig**: Залишається чистим раннером (без вбудованих конфігів мікрододатків)
- [x] **Тести**: 45 pass, 0 регресій

### Очікує реалізації в пакетах (Pipeline №3 — Contract)

- [ ] **@nan0web/db**: Експорт `DBConfig` + `RevisionInfo`, контрактні тести, абстрактний `db.history(key)`
- [ ] **editor.app**: Експорт `EditorConfig`, контрактні тести (4 access modes), інтеграція з `AppRegistry`
- [ ] **auth.app**: Експорт `AuthPolicy`, контрактні тести (glob matching, public overrides), middleware через `register.js`

### Очікує реалізації в nan0web.app

- [x] **UI-модель Міграція** (Stories #1-5): Перенесення `src/domain/ui/*` до `@nan0web/ui/domain`
- [x] **API Restructuring** (Stories #6-9): Виведення `data/api/` → `src/server/api/`, shebang лише в `bin/nan0web`
- [ ] **PagesRouter Docs** (Stories #10-12): Документація O(1) routing, 404 handling
- [x] **db.seal()** (Stories #13-17): Інтеграція в `AppRunner.run()` після фази Boot
- [ ] **Рантаймова інтеграція** (Stories #22-33): `AppRegistry` динамічно збирає конфіги мікрододатків

---

## Next — Release Infrastructure

- [x] **AGRP Release Protocol**: `releases/` структура з v1.1.0 + v1.2.0, `task.spec.js`, npm scripts

> **Health check 2026-03-25**: Unit 42, Story 17, Release Specs 14 ✅ (total 73)
> **@nan0web/core Migration 2026-03-25**: `extends Model` + IoC + Story 5 (Golden Standard v2)

---

## 🔧 Інфраструктура AI (nan0ai & MCP)

- [x] **hnswlib-node rebuild**: Нативний модуль перебудовано для Node.js v25.2.1 (ABI v141)
- [x] **nan0ai search**: Працює, 64 індекси завантажено
- [x] **mcp-install.js**: Додано підтримку Gemini CLI (Antigravity) — `~/.gemini/settings.json`
- [x] **MCP server installed**: `nan0web-knowledge` → Gemini CLI + Claude Desktop
- [x] **MCP verification**: `search_knowledge_base` ✅ (IDE), `nan0ai search` ✅ (64 індекси), `list_resources` — порожній (tools-only сервер, by design)

---

## ✅ Інтеграція @nan0web/core (2026-03-25)

- [x] Підключити `@nan0web/core` як залежність (`workspace:*`)
- [x] Мігрувати `NaN0WebConfig`, `AppEntryConfig`, `LogConfig` → `extends Model`
  - Видалено instance field declarations (V8 override fix)
  - JSDoc `@property` для типізації
  - Hydration constructor збережено для nested models
- [x] Інтегрувати `AppCore` pattern в `AppRunner` (IoC для `db`, `t`)
  - Constructor accepts `{ cwd, db }` options object
  - IoC: `db` injection skips DBwithFSDriver creation
  - `#loadConfig` → `NaN0WebConfig.from()` typification
  - Backward compat: string arg + no-arg still work
- [x] Story 5: Contract test для @nan0web/core інтеграції (8 tests)
  - Model inheritance, validate(), IoC getters, nested hydration, AppRunner compat

---

_Оновлено: 2026-04-07T13:20_ (v0.1.0 Architecture Release Complete)
