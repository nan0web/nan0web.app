# Release v1.3.0 — Presentation Landing & OLMUI Models Hardening

[🇺🇦 Українська версія](./task.md)

## Scope

This release finalizes the NaN0Web presentation web application and hardens the domain UI models layer.

## What's Included

### 1. Presentation Landing Page (`public/index.html`)
- Static HTML landing with full content from `data/**`
- Two-locale support (EN/UK) with language switcher
- Sections: Hero, Features, Catalog, Docs, Architecture, Contact, Footer
- Premium design: Dark theme, glassmorphism, gradients, scroll animations
- Data sources: `data/en/index.nan0`, `data/uk/index.nan0`, `data/_.nan0`

### 2. OLMUI Models Refactoring
- `HeaderModel` — `Navigation[]` + `Language` instead of `LinkModel`
- `FooterModel` — `copyright`, `version`, `license`, `nav: Navigation[]`
- `HeroModel` — `actions: Navigation[]` instead of `cta: LinkModel`
- `LinkModel.js` — permanently removed
- `extra.js` — new models: `PriceModel`, `PricingModel`, `CommentModel`, `TestimonialModel`, `AccordionModel`, `HeaderVisibilityModel`, `FooterVisibilityModel`, `EmptyStateModel`, `BannerModel`

### 3. Bug Fixes
- `runner.test.js` — fixed 3 missing `await` in `renderPage()` tests (46/46 green)

## Acceptance Criteria (Definition of Done)

- [ ] `public/index.html` renders all 7 sections
- [ ] Language switcher EN/UK works (all texts translate)
- [ ] `HeaderModel` does not import `LinkModel`
- [ ] `FooterModel` has 3 string + 2 array fields (`nav`, `share`)
- [ ] `HeroModel` has `actions: Navigation[]`
- [ ] `LinkModel.js` is physically absent
- [ ] `extra.js` contains at least 10 Model classes
- [ ] `npm test` passes 46/46 (0 fail)
- [ ] Playwright test verifies visual rendering of the landing page
