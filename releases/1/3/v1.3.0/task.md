# Release v1.3.0 — Presentation Landing & OLMUI Models Hardening

[🇬🇧 English version](./task.en.md)

## Scope

Цей реліз фіналізує презентаційний веб-додаток NaN0Web та проводить хардкорне зміцнення доменних моделей UI-шару.

## Що входить

### 1. Презентаційний Landing Page (`public/index.html`)
- Статичний HTML лендінг із повним контентом з `data/**`
- Підтримка двох локалей (EN/UK) з перемикачем мов
- Секції: Hero, Features, Catalog, Docs, Architecture, Contact, Footer
- Преміальний дизайн: Dark theme, glassmorphism, градієнти, scroll-анімації
- Дані з `data/en/index.nan0`, `data/uk/index.nan0`, `data/_.nan0`

### 2. OLMUI Models Refactoring
- `HeaderModel` — `Navigation[]` + `Language` замість `LinkModel`
- `FooterModel` — `copyright`, `version`, `license`, `nav: Navigation[]`
- `HeroModel` — `actions: Navigation[]` замість `cta: LinkModel`
- `LinkModel.js` — видалено назавжди
- `extra.js` — нові моделі: `PriceModel`, `PricingModel`, `CommentModel`, `TestimonialModel`, `AccordionModel`, `HeaderVisibilityModel`, `FooterVisibilityModel`, `EmptyStateModel`, `BannerModel`

### 3. Bug Fixes
- `runner.test.js` — виправлено 3 missing `await` у `renderPage()` тестах (46/46 зелені)

## Acceptance Criteria (Definition of Done)

- [ ] `public/index.html` рендерить усі 7 секцій
- [ ] Перемикач мов EN/UK працює (всі тексти перекладаються)
- [ ] `HeaderModel` не імпортує `LinkModel`
- [ ] `FooterModel` має 3 текстових + 2 масивних поля (`nav`, `share`)
- [ ] `HeroModel` має `actions: Navigation[]`
- [ ] `LinkModel.js` фізично відсутній
- [ ] `extra.js` містить мінімум 10 Model-класів
- [ ] `npm test` проходить 46/46 (0 fail)
- [ ] Playwright-тест перевіряє візуальний рендеринг лендінгу

## Architecture Audit

- [x] Прочитано індекси екосистеми
- [x] Аналоги перевірені (LinkModel видалено, Navigation з @nan0web/ui)
- [x] Джерела даних: `.nan0` (YAML), `.md` (Markdown)
- [x] UI-стандарт: Deep Linking відповідає OLMUI
