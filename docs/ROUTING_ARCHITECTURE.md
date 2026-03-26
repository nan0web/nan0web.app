# 🗺️ Архітектура Роутингу (Data-to-URL Mapping)

## Принцип: Навіщо це потрібно?

У NaN0Web ми не пишемо маршрути кодом. Ми використовуємо принцип **State Mapping**: URL-адреса — це лише відображення (view) певної частини глобального стану.

### 1. Dot-шлях vs Slash-шлях

- **Slash-шлях (`/court/cases`)** — це **адреса**. Те, що користувач вводить у браузері або бачить у хлібних крихтах.
- **Dot-шлях (`court.cases`)** — це **дані**. Це шлях усередині `Global State` (великого JSON-об'єкта), де лежать реальні дані.

Роутер виконує роль **диспетчера**: він пов'язує адресу з даними.

### 2. Навіщо потрібна модель Page?

Хоча файлова структура `data/` вже задає певну ієрархію, вона не містить метаданих для інтерфейсу:

- **Metadata**: Іконки (`⚖️`), прихованість від меню (`hidden`), переклади заголовків.
- **Virtual Mounting**: Ми можемо підключити віддалену базу (Mesh) до гілки `/mesh-explorer`. Фізичних файлів там немає, але в роутері це має бути сторінкою.
- **Navigation Tree**: Роутер створює «Меню Пуск» вашого застосунку.

---

## Компоненти

### 1. Page (Domain Model)

**Файл:** `src/domain/Page.js`

`Page` — це модель однієї сторінки. Вона розширює `ContainerObject` з `@nan0web/types`, що дає рекурсивні операції над деревом (`flat()`, `map()`, `find()`).

| Поле       | Тип                              | Приклад         | Опис                             |
| ---------- | -------------------------------- | --------------- | -------------------------------- |
| `slug`     | `string`                         | `'cases'`       | URL-сегмент шляху                |
| `title`    | `string`                         | `'Court Cases'` | Заголовок (i18n ключ або рядок)  |
| `source`   | `string`                         | `'court.cases'` | Dot-шлях до даних у Global State |
| `layout`   | `'page'\|'list'\|'form'\|'feed'` | `'list'`        | Стратегія рендерингу             |
| `icon`     | `string`                         | `'⚖️'`          | Іконка для навігації             |
| `hidden`   | `boolean`                        | `false`         | Приховати з меню                 |
| `children` | `Page[]`                         | `[...]`         | Вкладені підсторінки             |

Кожне поле має **статичні метадані** (Model-as-Schema), що дозволяють автоматично будувати форми редагування сторінок через `ui-form`.

### 2. PagesRouter

**Файл:** `src/router/PagesRouter.js`

PagesRouter — це **ядро роутингу**. Він:

1. **Завантажує** масив `pages` з Global State.
2. **Будує плоский індекс** (`Map<string, Page>`) для миттєвого пошуку O(1).
3. **Розв'язує URL** → Page через `resolve(path)`.
4. **Обчислює breadcrumbs** через `match(path)`.
5. **Генерує навігаційне дерево** через `navigation()` (фільтруючи `hidden`).

#### API

```javascript
const router = new PagesRouter()
router.load(state) // Завантажити з Global State

router.resolve('/cases') // → Page { slug: 'cases', layout: 'list', source: 'court.cases' }
router.resolve('/admin/users') // → Page { slug: 'users', layout: 'list', source: 'admin.users' }
router.resolve('/unknown') // → null

router.match('/admin/users')
// → {
//     page: Page { slug: 'users' },
//     breadcrumbs: [
//       Page { slug: 'admin', title: 'Administration' },
//       Page { slug: 'users', title: 'Users' },
//     ]
//   }

router.navigation()
// → [
//     { href: '/home', title: 'Home', icon: '🏠', children: [] },
//     { href: '/cases', title: 'Court Cases', icon: '⚖️', children: [] },
//     ...
//   ]
// (admin прихований — hidden: true)

router.size // → 6 (усі маршрути, включаючи вкладені)
```

#### Вкладені маршрути

Шляхи будуються **автоматично** через конкатенацію `slug`:

```
admin              → /admin
admin/users        → /admin/users
admin/settings     → /admin/settings
```

`#buildIndex()` рекурсивно обходить дерево `Page.children` і додає кожну сторінку до плоского `Map`. Це дає O(1) lookup за будь-яким URL.

### 3. Renderer (OLMUI)

**Файл:** `src/renderer/Renderer.js`

Renderer — це **універсальний рендерер**, який **не знає домен**. Він знає тільки 4 стратегії:

| Layout | Що робить                    | Вхід                     | Вихід           |
| ------ | ---------------------------- | ------------------------ | --------------- |
| `page` | Рендерить `$content` блоки   | `state[source].$content` | `Element[]`     |
| `list` | Рендерить колекцію як картки | `state[source]` (масив)  | `[h1, ui-list]` |
| `form` | Рендерить форму зі схеми     | `state[source]` (об'єкт) | `[h1, ui-form]` |
| `feed` | Рендерить живу стрічку       | `state[source]` (масив)  | `[h1, ui-feed]` |

#### Data Binding (resolveData)

`source: 'court.cases'` → `state.court.cases`

Renderer використовує вбудовану функцію `resolveData(state, 'court.cases')`, яка розбиває рядок по `.` і спускається по дереву стану.

#### Реєстр App-компонентів

Мікро-додатки можуть реєструвати свої рендерери:

```javascript
renderer.register('App.Auth.LogIn', (props, ctx) => ({
  'app-auth-login': true,
  $redirect: props.redirect || '/',
}))

renderer.renderBlock('App.Auth.LogIn', { redirect: '/dashboard' })
```

### 4. AppRunner.renderPage()

**Файл:** `src/runner.js`

Повний конвеєр рендерингу:

```javascript
const runner = new AppRunner()
for await (const msg of runner.run()) {
  console.info(msg)
}

// Після завантаження:
const { page, blocks, breadcrumbs } = runner.renderPage('/cases')
// page       → Page { slug: 'cases', layout: 'list' }
// blocks     → [{ h1: 'Court Cases' }, { 'ui-list': true, $items: [...], $count: 42 }]
// breadcrumbs → [Page { slug: 'cases' }]
```

---

## Стратегія Рендерингу (Layouts)

Ти запитаєш: _"Навіщо нам `layout: list`, якщо в нас є `$content`?"_
**Layout** — це підказка для **крос-платформного рендерингу** (OLMUI):

1.  **`layout: page`** (Default): Рендериться масив `$content`. Це повна свобода.
2.  **`layout: list`**: Ми кажемо системі: «Ці дані — це колекція».
    - `ui-cli` автоматично намалює таблицю.
    - `ui-react` автоматично створить список карток з пошуком.
3.  **`layout: form`**: Кажемо: «Це схема».
    - Система автоматично згенерує інтерфейс редагування.
4.  **`layout: feed`**: Живий потік подій (WebSocket).

Це дозволяє **один раз** написати `pages.yaml` і отримати працюючий інтерфейс і в терміналі, і в браузері без ручного прописування компонентів для кожного екрана.

---

## Потік Даних (Data Flow)

1.  **Boot**: `AppRunner` збирає всі дані з `data/` у `Global State`.
2.  **Route Discovery**: `PagesRouter` зчитує `pages.yaml` (або `state.pages`).
3.  **Indexing**: Роутер будує карту `URL -> Page`.
4.  **Interaction**:
    - Користувач просить `/cases`.
    - Роутер знаходить сторінку `{ source: 'court.cases', layout: 'list' }`.
    - Renderer витягує дані зі стану за дот-шляхом `court.cases`.
    - UI Adapter (CLI або Web) малює список.

---

## Приклад: Як це працює від А до Я

### 1. Дані (`data/`)

```
data/
├── _/
│   ├── t.yaml           ← глобальні переклади
│   └── langs.yaml       ← доступні мови
├── pages.yaml           ← карта маршрутів
├── court/
│   └── cases.jsonl      ← дані справ
└── deposits/
    └── index.yaml       ← дані депозитів
```

### 2. Конфіг (`nan0web.config.yaml`)

```yaml
name: willni
dsn: data/
locale: uk
port: 3000
```

### 3. Завантаження

```
🚀 Booting NaN0Web OS Engine...
✅ Loaded config from: yaml
🌐 Locale: uk
📦 Building Global State...
📑 State loaded: 5 top-level keys
🗣️ Available languages: uk, en
📖 Translations loaded: 42 keys
🗺️ Pages router: 6 routes registered     ← pages.yaml підхопився
🎨 OLMUI Renderer initialized.
🟢 Engine Ready. Sovereign Web is online.
```

### 4. Рендеринг сторінки

Користувач переходить на `/cases`:

```
URL: /cases
  ↓ PagesRouter.resolve('/cases')
Page { slug: 'cases', layout: 'list', source: 'court.cases' }
  ↓ Renderer.render(page)
  ↓ #renderList → resolveData(state, 'court.cases')
  ↓ state.court.cases = [{id: 1, title: 'Alpha'}, ...]
[
  { h1: 'Court Cases', $class: 'list-header' },
  { 'ui-list': true, $items: [...], $count: 42 }
]
  ↓ UI Adapter (ui-lit / ui-react / ui-cli)
  ↓ <h1>Court Cases</h1> <ui-list items=[...]></ui-list>
```

---

## resolveAliases (Model-as-Schema утиліта)

**Файл:** `src/domain/resolveAliases.js`

Спільна утиліта для резолвінгу аліасів у моделях. Сканує статичні поля класу на наявність `alias` й автоматично перетворює вхідні дані:

```javascript
import resolveAliases from './resolveAliases.js'

class NaN0WebConfig {
  static appName = { alias: 'name', help: '...', default: '' }
  //      ↑ target                ↑ source

  static from(input) {
    return new NaN0WebConfig(resolveAliases(this, input))
  }
}

NaN0WebConfig.from({ name: 'my-app' })
// → NaN0WebConfig { appName: 'my-app' }
```

**Правило:** якщо `input` вже має як `appName`, так і `name`, то пряме поле `appName` виграє (аліас ігнорується).

---

## Філософія

> Ми не пишемо UI для "Суду" чи "Банку". Ми пишемо UI для обробки "Тип: Колекція, Дія: Відображення".

Код не знає, що сторінка `/cases` — це суд. Він знає лише:

- **layout: list** → потрібно відрендерити список
- **source: court.cases** → дані лежать у `state.court.cases`

Це дає **тотальну відв'язку від домену** і дозволяє одному рушію обслуговувати нескінченну кількість додатків.

---

_Оновлено: 2026-03-02 | Phase 2 Architecture_
