import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import DB from '@nan0web/db'
import { AppRunner } from './runner.js'
import { NaN0WebConfig } from './domain/index.js'

/**
 * AppRunner Integration Tests — Full AC Coverage
 *
 * Uses IoC DB injection (in-memory) for deterministic, fast tests.
 * No filesystem access required.
 */

/** Helper: create in-memory DB with given data map */
function createMockDb(entries = []) {
	return new DB({ data: new Map(entries) })
}

/** Helper: consume async generator into array */
async function collect(gen) {
	const msgs = []
	for await (const msg of gen) msgs.push(msg)
	return msgs
}

describe('AppRunner', () => {

	// ── AC: No Config ──

	it('yields warning when no config file detected', async () => {
		const db = createMockDb()
		const runner = new AppRunner({ db })
		const msgs = await collect(runner.run())

		assert.ok(msgs.some(m => m.includes('Booting')), 'must have boot message')
		assert.ok(msgs.some(m => m.includes('No nan0web.config')), 'must warn about missing config')
		assert.ok(msgs.some(m => m.includes('nan0web config')), 'must suggest config command')
	})

	// ── AC: Config Detection & Loading ──

	it('detects and loads nan0 config format', async () => {
		const db = createMockDb([
			['nan0web.config.nan0', { name: 'Test App', dsn: 'data/', locale: 'en', port: 3000 }],
		])
		const runner = new AppRunner({ db })
		const msgs = await collect(runner.run())

		assert.ok(msgs.some(m => m.includes('Loaded config from: nan0')), 'must detect nan0 format')
		assert.ok(runner.config instanceof NaN0WebConfig, 'config must be NaN0WebConfig instance')
		assert.equal(runner.config.appName, 'Test App')
		assert.equal(runner.config.port, 3000)
	})

	it('detects yaml format with priority over json', async () => {
		const db = createMockDb([
			// No .nan0 → falls through to .yaml
			['nan0web.config.yaml', { name: 'YAML App', locale: 'uk' }],
			['nan0web.config.json', { name: 'JSON App' }],
		])
		const runner = new AppRunner({ db })
		const msgs = await collect(runner.run())

		assert.ok(msgs.some(m => m.includes('Loaded config from: yaml')))
		assert.equal(runner.config.appName, 'YAML App')
	})

	// ── AC: State Building ──

	it('builds global state from index', async () => {
		const db = createMockDb([
			['nan0web.config.nan0', { name: 'State Test', locale: 'en' }],
			['data/index.yaml', { title: 'NaN0Web', version: '1.0' }],
		])
		const runner = new AppRunner({ db })
		await collect(runner.run())

		assert.equal(runner.state.title, 'NaN0Web')
		assert.equal(runner.state.version, '1.0')
	})

	it('loads i18n translations into state', async () => {
		const db = createMockDb([
			['nan0web.config.nan0', { name: 'i18n Test', locale: 'en' }],
			['data/index.yaml', {
				t: { greeting: 'Hello', farewell: 'Goodbye' },
				langs: { en: { id: 'en', icon: '🇬🇧' }, uk: { id: 'uk', icon: '🇺🇦' } },
			}],
			['data/uk/index.yaml', {
				t: { greeting: 'Привіт' }
			}]
		])
		const runner = new AppRunner({ db })
		const msgs = await collect(runner.run())

		assert.ok(msgs.some(m => m.includes('Available languages: en, uk')))
		assert.ok(msgs.some(m => m.includes('Translations loaded: 2 keys')))
		assert.equal(runner.state.t.greeting, 'Hello')
	})

	it('auto-detects locales from directory structure', async () => {
		const db = createMockDb([
			['nan0web.config.nan0', { name: 'Locale Test', locale: 'en' }],
			['data/en/index.yaml', {}],
			['data/uk/index.yaml', {}],
		])
		
		// Mock FS behavior for in-memory DB since it doesn't auto-infer directories
		const origExtract = db.extract.bind(db)
		db.extract = (uri) => {
			const subDb = origExtract(uri)
			if (uri === 'data/') {
				subDb.listDir = async () => ['en', 'uk', 'index.yaml']
				subDb.stat = async (name) => ({ isDirectory: ['en', 'uk'].includes(name) })
			}
			return subDb
		}

		const runner = new AppRunner({ db })
		await collect(runner.run())

		assert.ok(runner.state.langs, 'langs must be populated')
		assert.equal(runner.state.langs.en.title, 'English')
		assert.equal(runner.state.langs.uk.title, 'Українська')
		assert.equal(runner.state.langs.de, undefined)
	})

	// ── AC: Router Integration ──

	it('loads pages into router from state', async () => {
		const db = createMockDb([
			['nan0web.config.nan0', { name: 'Router Test', locale: 'en' }],
			['data/index.yaml', {
				pages: [
					{ slug: '/', title: 'Home', layout: 'page' },
					{ slug: '/about', title: 'About', layout: 'page' },
				],
			}],
		])
		const runner = new AppRunner({ db })
		const msgs = await collect(runner.run())

		assert.ok(msgs.some(m => m.includes('routes registered')))
		assert.equal(runner.router.size, 2)
	})

	it('auto-builds nav tree from directory if no pages given', async () => {
		const db = createMockDb([
			['nan0web.config.nan0', { name: 'Auto Route Test', locale: 'en' }],
			['data/index.yaml', {}], // no pages defined!
		])
		// Mock listDir, stat and fetch on extracted sub-DB
		const origExtract = db.extract.bind(db)
		db.extract = (uri) => {
			const subDb = origExtract(uri)
			if (uri === 'data/') {
				subDb.listDir = async (path) => {
					if (path === '.') return ['docs', 'index.md']
					if (path === 'docs') return ['setup.md', 'index.yaml']
					return []
				}
				subDb.stat = async (path) => ({ isDirectory: ['docs'].includes(path) })
				subDb.fetch = async (uri) => {
					if (uri === 'docs/index') return { title: 'Documentation' }
					if (uri === 'docs/setup') return { title: 'Setup Guide', order: 1 }
					if (uri === 'index') return {}
					return null
				}
			}
			return subDb
		}

		const runner = new AppRunner({ db })
		const msgs = await collect(runner.run())

		assert.ok(msgs.some(m => m.includes('auto-routes registered')))
		assert.equal(runner.router.size, 3)
		assert.ok(runner.router.resolve('/'))
		assert.ok(runner.router.resolve('/docs/setup'))
		assert.ok(runner.router.resolve('/docs'))
		// Verify frontmatter title was used
		const docsPage = runner.router.resolve('/docs')
		assert.equal(docsPage.title, 'Documentation')
	})

	it('supports README.md as directoryIndex for git repos', async () => {
		const db = createMockDb([
			['nan0web.config.nan0', { name: 'Git Docs', locale: 'en', directoryIndex: 'README' }],
			['data/index.yaml', {}],
		])
		const origExtract = db.extract.bind(db)
		db.extract = (uri) => {
			const subDb = origExtract(uri)
			if (uri === 'data/') {
				subDb.listDir = async (path) => {
					if (path === '.') return ['packages', 'README.md']
					if (path === 'packages') return ['core', 'README.md']
					if (path === 'packages/core') return ['README.md', 'CHANGELOG.md']
					return []
				}
				subDb.stat = async (path) => ({
					isDirectory: ['packages', 'packages/core'].includes(path)
				})
				subDb.fetch = async (uri) => {
					if (uri === 'README') return { title: 'Project Root' }
					if (uri === 'packages/README') return { title: 'Packages', order: 1 }
					if (uri === 'packages/core/README') return { title: 'Core Package' }
					if (uri === 'packages/core/CHANGELOG') return { title: 'Changelog', order: 2 }
					return null
				}
			}
			return subDb
		}

		const runner = new AppRunner({ db })
		const msgs = await collect(runner.run())

		assert.ok(msgs.some(m => m.includes('index: README')))
		assert.ok(runner.router.resolve('/'))
		assert.ok(runner.router.resolve('/packages'))
		assert.ok(runner.router.resolve('/packages/core/CHANGELOG'))
		// Verify title from db.fetch()
		const root = runner.router.resolve('/')
		assert.equal(root.title, 'Project Root')
	})

	// ── AC: Renderer Integration ──

	it('initializes OLMUI Renderer', async () => {
		const db = createMockDb([
			['nan0web.config.nan0', { name: 'Renderer Test', locale: 'en' }],
			['data/index.yaml', {}],
		])
		const runner = new AppRunner({ db })
		const msgs = await collect(runner.run())

		assert.ok(msgs.some(m => m.includes('OLMUI Renderer initialized')))
		assert.ok(runner.renderer !== null, 'renderer must be set')
	})

	// ── AC: renderPage ──

	it('renderPage returns 404 for unknown path', async () => {
		const db = createMockDb([
			['nan0web.config.nan0', { name: 'Page Test', locale: 'en' }],
			['data/index.yaml', {
				pages: [{ slug: '/', title: 'Home', layout: 'page' }],
			}],
		])
		const runner = new AppRunner({ db })
		await collect(runner.run())

		const result = await runner.renderPage('/nonexistent')
		assert.equal(result.page, null)
		assert.ok(result.blocks.some(b => b.h1 === '404'))
	})

	it('renderPage returns blocks for valid path', async () => {
		const db = createMockDb([
			['nan0web.config.nan0', { name: 'Page Test', locale: 'en' }],
			['data/index.yaml', {
				pages: [{ slug: 'home', title: 'Home', layout: 'page', source: 'home-data' }],
			}],
			['data/home-data.yaml', [
				{ h1: 'Welcome Home' }
			]],
		])
		const runner = new AppRunner({ db })
		await collect(runner.run())

		const result = await runner.renderPage('/home')
		assert.ok(result.page !== null)
		assert.equal(result.page.title, 'Home')
		assert.ok(Array.isArray(result.blocks))
	})

	// ── AC: Engine Ready ──

	it('renders markdown content into safe HTML blocks', async () => {
		const db = createMockDb([
			['nan0web.config.nan0', { name: 'MD Test' }],
			['data/index.yaml', {
				pages: [{ slug: 'md', title: 'MD Page', layout: 'page', source: 'docs.test' }],
				docs: {
					test: {
						content: '# Hello\n\n<nan0-sandbox src="auth.app" url="signup" ui="cli"></nan0-sandbox>\n\nThis is Markdown'
					}
				}
			}],
		])
		const runner = new AppRunner({ db })
		await collect(runner.run())

		const result = await runner.renderPage('/md')
		assert.ok(result.page !== null)
		assert.equal(result.blocks.length, 3, 'should split into 3 blocks')
		assert.equal(result.blocks[0]['ui-html'], '<h1>Hello</h1>\n\n\n', 'first block should be HTML header')
		assert.equal(result.blocks[1]['nan0-sandbox'], true, 'second block should be nan0-sandbox')
		assert.equal(result.blocks[1].src, 'auth.app')
		assert.equal(result.blocks[1].url, 'signup')
		assert.equal(result.blocks[1].ui, 'cli')
		assert.equal(result.blocks[2]['ui-html'], '\n\n\n<p>This is Markdown</p>', 'third block should be paragraph')
	})

	it('renders markdown with frontmatter stripping', async () => {
		const db = createMockDb([
			['nan0web.config.nan0', { name: 'FM Test' }],
			['data/index.yaml', {
				pages: [{ slug: 'doc', title: 'Doc', layout: 'page', source: 'docs.fm' }],
				docs: {
					fm: {
						content: '---\ntitle: Hello World\norder: 1\n---\n# Actual Content\n\nParagraph here.'
					}
				},
			}],
		])
		const runner = new AppRunner({ db })
		await collect(runner.run())
		const result = await runner.renderPage('/doc')

		// Frontmatter should be stripped, only body rendered
		assert.ok(result.blocks.length > 0)
		const html = result.blocks[0]['ui-html']
		assert.ok(!html.includes('order: 1'), 'frontmatter should be stripped from HTML')
		assert.ok(html.includes('Actual Content'), 'body heading should be present')
	})
	// ── AC: App Registry ──

	it('auto-detects UI adapters from package.json#exports', async () => {
		const { default: AppManifest } = await import('./domain/AppManifest.js')
		const { default: AppRegistry } = await import('./registry/AppRegistry.js')

		const registry = new AppRegistry()

		// Simulate auth.app package.json with ./ui/* exports
		const manifest = registry.registerFromPackage({
			name: '@nan0web/auth.app',
			version: '1.0.0',
			description: 'Auth app',
			exports: {
				'.': './src/index.js',
				'./domain': './src/domain/index.js',
				'./ui/cli': './src/ui/cli/main.js',
				'./ui/api': './src/ui/api/main.js',
				'./ui/chat': './src/ui/chat/main.js',
			},
		})

		assert.equal(registry.size, 1)
		assert.ok(manifest instanceof AppManifest)
		assert.equal(manifest.name, 'auth')  // "@nan0web/auth.app" → "auth"
		assert.equal(manifest.src, '@nan0web/auth.app')
		assert.deepStrictEqual(manifest.adapters, ['cli', 'api', 'chat'])
		assert.ok(manifest.hasAdapter('cli'))
		assert.ok(manifest.hasAdapter('chat'))
		assert.ok(!manifest.hasAdapter('swift'))
		assert.equal(registry.getByAdapter('cli').length, 1)
		assert.equal(registry.getByAdapter('web').length, 0)
	})

	// ── AC: Intent Delegation ──

	it('resolves intents and delegates to sub-app adapters', async () => {
		const { default: IntentResolver } = await import('./registry/IntentResolver.js')
		const { default: AppRegistry } = await import('./registry/AppRegistry.js')

		const registry = new AppRegistry()
		registry.registerFromPackage({
			name: '@nan0web/auth.app',
			version: '1.0.0',
			exports: {
				'./ui/cli': './src/ui/cli/main.js',
				'./ui/api': './src/ui/api/main.js',
			},
		})

		const resolver = new IntentResolver(registry, new Map())

		// Can resolve check
		assert.ok(resolver.canResolve({ src: 'auth.app', ui: 'cli' }))
		assert.ok(resolver.canResolve({ src: '@nan0web/auth.app', ui: 'api' }))
		assert.ok(!resolver.canResolve({ src: 'auth.app', ui: 'swift' }))
		assert.ok(!resolver.canResolve({ src: 'unknown.app', ui: 'cli' }))

		// Resolve missing app → error
		const results = []
		for await (const msg of resolver.resolve({ src: 'unknown.app', ui: 'cli' })) {
			results.push(msg)
		}
		assert.ok(results[0].error.includes('not registered'))

		// Resolve missing adapter → error with available adapters
		const results2 = []
		for await (const msg of resolver.resolve({ src: 'auth.app', ui: 'swift' })) {
			results2.push(msg)
		}
		assert.ok(results2[0].error.includes('no "swift" adapter'))
		assert.ok(results2[0].error.includes('cli, api'))
	})

	it('yields Engine Ready on successful boot', async () => {
		const db = createMockDb([
			['nan0web.config.nan0', { name: 'Boot Test', locale: 'en' }],
			['data/index.yaml', {}],
		])
		const runner = new AppRunner({ db })
		const msgs = await collect(runner.run())

		assert.ok(msgs.some(m => m.includes('Engine Ready')))
	})

	// ── AC: Graceful Shutdown ──

	it('stop() is safe to call even without initialization', () => {
		const runner = new AppRunner()
		assert.doesNotThrow(() => runner.stop())
	})
})
