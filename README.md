# NaN•Web App (v0.1.0)

<!-- %PACKAGE_STATUS% -->

[🇺🇦 Українська](docs/uk/README.md)

One algorithm — many interfaces. The core engine for the NaN•Web ecosystem.

### Key Features
- **Security Hardening**: Standardizes `db.seal()` boot protocol to freeze mount registries.
- **Clean API Separation**: Code is isolated in `src/server/api/`.
- **Model-as-Schema**: Universal domain models from `@nan0web/ui`.
- **SSR-First**: Server-Side Rendering capabilities out of the box.

## Installation

How to install and run the engine?
```bash
npm install nan0web.app
npm run start -- --dsn data/
```

## Usage
### Booting the Engine

How to boot the AppRunner programmatically?
```js
import { AppRunner } from 'nan0web.app'
const runner = new AppRunner({ dsn: 'data/', locale: 'uk' })
const iterator = runner.run()
const firstStep = await iterator.next()
```
### Security Protocol (db.seal)
Once the engine completes its boot phase, the registry is sealed.

How does db.seal protect the registry?
```js
import { AppRunner } from 'nan0web.app'
const runner = new AppRunner({ dsn: 'data/' })
const it = runner.run()
for (let i = 0; i < 5; i++) await it.next()
```
## Contributing

How to participate? – [see CONTRIBUTING.md]($pkgURL/blob/main/CONTRIBUTING.md)

## License

ISC LICENSE – [see full text]($pkgURL/blob/main/LICENSE)
