# NaN0Web App Engine (Data-Driven UX)

## 🎯 Основна Ідея (The Core Idea)

Поточні Frontend-застосунки часто мають жорстку прив'язку UI-компонентів до конкретних даних (наприклад, ручне створення `<ui-court>` з конкретним HTML).  
**NaN0Web App Engine** (nan0web.app) змінює цю парадигму:  
Він є **універсальним рендером (Data-Driven Runner)**.  
Весь інтерфейс, сторінки, форми, та блоки автоматично будуються із директорії `data/` та YAML/NAN0/MD/CSV0/JSON/JSONL словників або будь-якого іншого джерела даних (DSN: redis, mongo, sql, mesh, тощо).

## 🏗️ Архітектура Системи

### 1. Джерело Істини (Data Layer)

- Додаток (`willni`, `bank` тощо) надає лише директорії `data/` (публічні дані), `private/data` (приватні дані), `public` (публічні файли), `private/files` (приватні файли).
- Там лежать `pages.yaml`, `cases.jsonl`, `manifest.md`, а також **моделі та схеми** (`models.yaml`, `schemas.js`).
- Це **'Model-as-Schema'** підхід: структура полів, валідація та плейсхолдери описані декларативно в самих даних.
- Цей шар позбавлений будь-якого JavaScript (або React/Lit логіки).

### 2. State Controller (App Node)

- Серце `nan0web.app`. Node.js (або Vite) процес, який:
  1. Прокидається з конфігурацією `nan0web.config.nan0`, `nan0web.config.json`, `nan0web.config.yaml`, `nan0web.config.js`, `nan0web.config.ts`, або ініціалізує черз `ui-cli` із запитаннями для користувача, або за запитом користувача `% nan0web config`.
  2. Парсить всю папку `data/` або інший dsn (база даних) використовуючи `@nan0web/db-fs` або інший адаптер. Для db-browser можна в режимі редактора одразу завантажувати `index.full.jsonl`
  3. Будує цілісний **`Global State`** (JSON дерево), яке агрегує дані та метадані (схеми) для автоматичного рендерингу UI.
  4. Підключається до WebSocket Bridge (наприклад, для отримання живого потоку Mesh з `willni`).
  5. Оновлює `State` при надходженні нових подій, підтримуючи "Zero Latency" UX.

### 3. Universal Renderer (OLMUI Pattern)

- Набір універсальних компонентів (`ui-page`, `ui-form`, `ui-list`, `ui-feed`).
- Вони взагалі не знають, що відображають (суди, сільгосп. культури, банки).
- Роутер отримує з `State` масив `pages` і автоматично рендерить потрібну сторінку.
- Наприклад, якщо `state.willni.court.cases` змінюється, рендерер автоматично оновлює `ui-list` передаючи йому нові картки.

## 📝 Наступний Крок (План Дій):

1. **Створення `AppRunner`:** Написати стартовий скрипт `src/runner.js` всередині `nan0web.app`.
2. **Інтеграція Data Factory:** Підключити `@nan0web/db-fs`, щоб він читав `willni/data` та перетворював на стан.
3. **Data-Bound HTML:** Створити механізм, який перетворює об'єкти типу `type: 'List', source: 'cases'` на реальний DOM.
4. **Видалення Hardcode UI:** Повністю очистити `willni` від захардкоджених `ui-mesh-feed.js` та `ui-court.js`.

> **Філософія:** Наш код має бути меншим, гнучкішим і тотально відв'язаним від домену. Ми пишемо не UI для "Суду", ми пишемо UI для обробки "Типу: Колекція, Дія: Голосування".

## Команди

```bash
# Збірка даного проєкту (cwd) — має конвертувати data/**/*.{md|yaml|nan0} -> dist/data/**/*.json
nan0web build
# Запуск проєкту у режимі розробки з hot-reload
nan0web dev
# Запуск проєкту у режимі api
nan0web api
# Запуск тестів unit
nan0web test:unit
# Запуск тестів cli
nan0web test:cli
# Запуск cli проєкту і збірка галереї md
nan0web cli:gallery
# Запуск тестів ssg проєкту
nan0web test:ssg
# Запуск ssg проєкту і збірка галереї md
nan0web ssg:gallery
# Запуск тестів web проєкту
nan0web test:web
# Запуск web проєкту і збірка галереї md
nan0web web:gallery
# Запуск тестів e2e
nan0web test:e2e
# Запуск додатку
nan0web start --api --web
# або без start
nan0web --api --web
# Вхід у CLI режим
nan0web cli
# Вхід у CLI режим з api
nan0web cli --api
# Вхід у CLI режим з api та конкретним URL
nan0web cli uk/projects/willni
```

## 📚 Архітектурна Документація

- [Routing Architecture](docs/ROUTING_ARCHITECTURE.md) — Data-Driven Routing, PagesRouter, OLMUI Renderer, resolveAliases.
