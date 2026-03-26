# 📋 REQUESTS (nan0web.app — Documentation Engine)

## 📌 Мета

Перетворити `nan0web.app` на рушій **Живої Документації** (Zero-Build SSG-заміна Vitepress).
Філософія: **Markdown — це Дані. Шаблон — це теж Дані. UI лише рендерить.**

---

## Request #2026-03-10-01: Підтримка `--dsn` для документації

- **Статус:** 🟡 TODO
- **Пріоритет:** 🔴 Critical

### Опис

Додати в CLI `nan0web.app` можливість стартувати базу даних зі вказаного джерела:

```bash
nan0web serve --dsn docs/ --port 8080
nan0web build --dsn docs/
```

Ініціалізація `@nan0web/db-fs` з `root: 'docs/'` відносно робочої директорії.

### Конфігурація `nan0web.yaml`

```yaml
# nan0web.yaml — єдине джерело конфігурації додатку
serve:
  dsn: docs/
  port: 8080
  aliases:
    docs/en/README.md: ./README.md
    docs/en/project.md: ./project.md
```

**Aliases** — механізм віртуальної проекції. Роутер `db-fs` при запиті `docs/en/README.md` повертає вміст `./README.md` (відносно кореня проєкту). Жодного фізичного копіювання. Єдине джерело правди.

### Задачі

- [ ] Парсити `nan0web.yaml` з `process.cwd()` при старті CLI.
- [ ] Передати `dsn` та `aliases` у `DBFS.from({ root: dsn })`.
- [ ] У `DBFS.loadDocument` — перевіряти `aliases` map перед зверненням до файлової системи.

---

## Request #2026-03-10-02: Авто-визначення локалей

- **Статус:** 🟡 TODO
- **Пріоритет:** 🟠 High
- **Залежність:** Request #2026-03-10-01

### Опис

При ініціалізації `dsn: docs/` рушій сканує підтеки першого рівня та зіставляє їх із вбудованим словником мов (ISO 639-1 / BCP 47). Результат доступний через `db.langs` або `db.getDocument('_/langs')`.

### Словник мов (вбудований, data/langs.yaml)

```yaml
# data/langs.yaml — вбудований реєстр мов, що розпізнаються рушієм
- locale: en
  title: English
  dir: ltr
- locale: en_GB
  title: English (British)
  dir: ltr
- locale: uk
  title: Українська
  dir: ltr
- locale: de
  title: Deutsch
  dir: ltr
- locale: fr
  title: Français
  dir: ltr
- locale: es
  title: Español
  dir: ltr
- locale: pl
  title: Polski
  dir: ltr
- locale: da
  title: Dansk
  dir: ltr
- locale: no
  title: Norsk
  dir: ltr
- locale: sv
  title: Svenska
  dir: ltr
- locale: nl
  title: Nederlands
  dir: ltr
- locale: fi
  title: Suomi
  dir: ltr
- locale: is
  title: Íslenska
  dir: ltr
- locale: ja
  title: 日本語
  dir: ltr
- locale: zh
  title: 中文
  dir: ltr
- locale: ar
  title: العربية
  dir: rtl
- locale: he
  title: עברית
  dir: rtl
```

### Алгоритм

1. `db.listDir('docs/', { depth: 0 })` → отримуємо список тек.
2. Для кожної теки перевіряємо `name` у словнику `data/langs.yaml`.
3. Збіг → додаємо до масиву `availableLocales`.
4. Результат зберігається як віртуальний документ `_/langs.yaml`:

```yaml
# Автогенерований — docs/en/ та docs/uk/ знайдені
- locale: en
  title: English
  dir: ltr
- locale: uk
  title: Українська
  dir: ltr
```

### Задачі

- [ ] Створити `data/langs.yaml` з повним реєстром мов у пакеті `nan0web.app`.
- [ ] Реалізувати `detectLocales(db, dsn)` → `LocaleEntry[]`.
- [ ] Зберігати результат у `db.meta.langs` або як віртуальний документ.

---

## Request #2026-03-10-03: Шаблони як Data (Template-as-Data)

- **Статус:** 🟡 TODO
- **Пріоритет:** 🟠 High
- **Залежність:** Request #2026-03-10-01

### Опис

Шаблон — це **не** зашитий код. Шаблон — це словник (YAML), який описує які блоки відображати та в якому порядку. Теми стають альтернативними словниками для тих самих даних.

### Формат шаблону

```yaml
# templates/docs.yaml — шаблон документації
name: docs
$content:
  - Header: true
  - Sidebar: true
  - Content: true
  - Footer: true
```

### Механіка

1. Frontmatter кожного `.md` файлу може вказувати `template: docs`.
2. Роутер `nan0web.app` шукає відповідний шаблон у теці `templates/`.
3. Шаблон визначає **які блоки існують** та передає їх рендереру.
4. Рендерер для кожного блоку шукає реалізацію (UI-компонент) у зареєстрованих залежностях (темі).

### Теми як залежності

```yaml
# nan0web.yaml
serve:
  dsn: docs/
  template: docs
  theme: '@nan0web/theme-default'
```

Тема — це пакет, що експортує маппінг блоків на UI-компоненти:

```js
// @nan0web/theme-default/index.js
export default {
  Header: HeaderComponent,
  Sidebar: SidebarComponent,
  Content: ContentComponent,
  Footer: FooterComponent,
}
```

### Задачі

- [ ] Визначити формат `templates/*.yaml`.
- [ ] Реалізувати `resolveTemplate(db, templateName)` у роутері.
- [ ] Створити стандартний шаблон `templates/docs.yaml`.
- [ ] Реалізувати маппінг блоків на компоненти через тему.

---

## Request #2026-03-10-04: Рендеринг Markdown та UI-Layout

- **Статус:** 🟡 TODO
- **Пріоритет:** 🟡 Medium
- **Залежність:** Requests #01, #02, #03

### Опис

Фінальний етап — збирання всього до купи.

### UI-Layout

- **Sidebar** — автоматично генерується зі структури `docs/` (навігаційне дерево).
- **Header** — перемикач мов (з `_/langs`), пошук, темна/світла тема.
- **Content** — відрендерений `.md` через `@nan0web/markdown`.
- **Footer** — статичний або з Frontmatter.

### Генерація API зі `.d.ts`

- Утиліта для парсингу `types/*.d.ts` → віртуальні сторінки API.
- Використання RegEx/JSDoc-парсера (не повний TypeScript AST).

### Кастомні компоненти

- `<nan0-cli-sandbox src="play/code.js" />` → інтерактивний xterm.js в браузері.

### Задачі

- [ ] Sidebar: `buildNavTree(db, dsn)` → навігаційне дерево.
- [ ] Header: компонент з перемикачем мов.
- [ ] Content: інтеграція `@nan0web/markdown` → безпечний HTML.
- [ ] Кастомний тег `<nan0-cli-sandbox>`.

---

> ✅ Послідовність реалізації:
>
> 1. **Request #01** — CLI + конфігурація `nan0web.yaml` + aliases
> 2. **Request #02** — авто-визначення мов
> 3. **Request #03** — шаблони як Data
> 4. **Request #04** — UI та рендеринг
