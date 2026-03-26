# NaN•Web App (v0.1.0)

<!-- %PACKAGE_STATUS% -->

[🇺🇸 English](../../README.md)

Один алгоритм — багато інтерфейсів. Основне ядро екосистеми NaN•Web.

### Основні можливості
- **Зміцнення безпеки**: Стандартизований протокол завантаження `db.seal()` заморожує всі точки монтування реєстру відразу після ініціалізації.
- **Чиста сегрегація API**: Програмна логіка безпечно ізольована в `src/server/api/`.
- **Модель як Схема**: Використання універсальних доменних моделей з пакета `@nan0web/ui`.
- **SSR-First**: Швидкий серверний рендеринг (Server-Side Rendering) доступний прямо з коробки.

## Встановлення

Як встановити та запустити рушій?
```bash
npm install nan0web.app
npm run start -- --dsn data/
```

## Використання
### Завантаження рушія

Як завантажити AppRunner програмно?
```js
import { AppRunner } from 'nan0web.app'
const runner = new AppRunner({ dsn: 'data/', locale: 'uk' })
const iterator = runner.run()
const firstStep = await iterator.next()
```
### Протокол безпеки (db.seal)
Після того, як рушій завершить фазу завантаження, реєстр бази даних повністю фіксується.

Як db.seal захищає реєстр?
```js
import { AppRunner } from 'nan0web.app'
const runner = new AppRunner({ dsn: 'data/' })
const it = runner.run()
for (let i = 0; i < 5; i++) await it.next()
```
## Участь у проекті

Як зробити свій внесок? – [див. CONTRIBUTING.md]($pkgURL/blob/main/CONTRIBUTING.md)

## Ліцензія

Ліцензія ISC – [див. повний текст]($pkgURL/blob/main/LICENSE)
