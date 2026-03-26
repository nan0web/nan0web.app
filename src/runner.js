import { EventEmitter } from 'node:events'
import { DBFS, DBwithFSDriver } from '@nan0web/db-fs'
import { NaN0WebConfig, Navigation } from './domain/index.js'
import AppLogger from './utils/AppLogger.js'
import PagesRouter from './router/PagesRouter.js'
import Renderer from './renderer/Renderer.js'
import AppRegistry from './registry/AppRegistry.js'
import IntentResolver from './registry/IntentResolver.js'
import { createT } from '@nan0web/types'

/**
 * Tiny I18n wrapper for AppRunner to support dynamic vocabulary loading.
 */
class I18n {
	constructor({ locale = 'en' } = {}) {
		this.locale = locale
		this.vocabulary = {}
		this.t = createT(this.vocabulary, this.locale)
	}
	/** @param {object} data */
	load(data) {
		Object.assign(this.vocabulary, data)
		this.t = createT(this.vocabulary, this.locale)
	}
}


// Re-export for backward compat (cli.js imports from here)
export { NaN0WebConfig }

/**
 * Universal App Runner — Phase 2
 *
 * Bootstraps the Data-Driven OS based on nan0web.config.*
 * Uses `async function* run()` pattern for CLI compatibility.
 *
 * Phase 2 additions:
 *   - PagesRouter: pages.yaml → automatic routing
 *   - Renderer: OLMUI universal block renderer
 *   - App Attach: db.extract() → micro-app branches
 */
export class AppRunner extends EventEmitter {
	/** @type {import('@nan0web/db-fs').DBFS} */
	db

	/** @type {PagesRouter} */
	router

	/** @type {Renderer} */
	renderer

	/** @type {AppLogger} */
	logger

	/**
	 * @param {string | { cwd?: string, db?: import('@nan0web/db-fs').DBwithFSDriver }} [options]
	 */
	constructor(options = {}) {
		super()
		if (typeof options === 'string') options = { cwd: options }
		this.options = options
		this.cwd = options.cwd || process.cwd()
		/** @type {NaN0WebConfig | null} */
		this.config = null
		/** @type {import('@nan0web/db-fs').DBwithFSDriver | null} */
		this.dataDb = null
		/** @type {object} */
		this.state = {}
		this.i18n = new I18n({ locale: this.config?.locale || 'en' })
		this.router = new PagesRouter()
		this.renderer = null
		this.logger = null
		/** @type {AppRegistry} */
		this.registry = new AppRegistry()
		/** @type {IntentResolver | null} */
		this.intents = null
		/** @type {Map<string, import('@nan0web/db-fs').DBwithFSDriver>} */
		this.apps = new Map()
		// IoC: accept pre-built DB for testability
		if (options.db) this.db = options.db
	}

	/**
	 * Main execution generator — yields status messages for CLI rendering.
	 * @yields {string}
	 */
	async *run() {
		yield '🚀 Booting NaN0Web OS Engine...\n'

		// 1. Connect DB (platform-agnostic) — skip if injected via IoC
		if (!this.db) {
			this.db = new DBFS({ cwd: this.cwd })
			await this.db.connect()
		}

		// 2. Detect and load config
		const configMeta = await this.#detectConfig()
		if (configMeta) {
			const rawConfig = await this.#loadConfig(configMeta)
			this.config = NaN0WebConfig.from(rawConfig)
			yield `✅ Loaded config from: ${configMeta.format}`
		} else {
			if (this.options.dsn) {
				this.config = new NaN0WebConfig({ dsn: this.options.dsn })
				yield 'ℹ️ No config file found, using default with provided DSN.'
			} else {
				yield '⚠️ No nan0web.config detected.'
				yield '💡 Run `nan0web config` to initialize.'
				return
			}
		}

		if (this.options.dsn) {
			this.config.dsn = this.options.dsn
		}
		if (this.options.port) {
			this.config.port = Number(this.options.port)
		}
		if (this.options.locale) {
			this.config.locale = this.options.locale
		}
		yield `📂 Data Source: ${this.config.dsn}`

		// DSN Factory: Initialize appropriate DB driver based on URI scheme
		if (this.config.dsn.includes('://')) {
			const protocol = this.config.dsn.split('://')[0]
			switch (protocol) {
				case 'http':
				case 'https': {
					const { BrowserDB } = await import('@nan0web/db-browser')
					this.dataDb = new BrowserDB({ root: this.config.dsn, console: this.db.console })
					if (typeof this.dataDb.connect === 'function') await this.dataDb.connect()
					break
				}
				default:
					throw new Error(`Unsupported DSN protocol: '${protocol}://' (currently only http/https and local fs/ folders are fully implemented)`)
			}
		} else {
			this.dataDb = this.db.extract(this.config.dsn)
		}
		
		if (this.config.aliases && Object.keys(this.config.aliases).length > 0) {
			this.dataDb.aliases = this.config.aliases
			yield `🔀 Virtual Aliases: ${Object.keys(this.config.aliases).length} active`
		}

		// 3. Detect locale from environment
		const locale = this.config.locale || process.env.LANG?.split('.')[0]?.split('_')[0] || 'en'
		yield `🌐 Locale: ${locale}`

		// 4. Load global state (fetch merged index)
		yield '📦 Building Global State...'
		this.state = await this.#buildState(locale)
		yield `📑 State loaded: ${Object.keys(this.state).length} top-level keys`

		// 5. Load i18n translations
		if (this.state.langs) {
			const langList = Array.isArray(this.state.langs.children) 
				? this.state.langs.children.map(l => l.code || l.id)
				: Object.keys(this.state.langs)
			yield `🗣️ Available languages: ${langList.join(', ')}`
		}
		if (this.state.t) {
			this.i18n.locale = locale
			this.i18n.load(this.state.t)
			yield `📖 Translations loaded: ${Object.keys(this.state.t).length} keys`
		}

		// 6. Phase 2: Pages Router
		this.router.load(this.state)
		if (this.router.size > 0) {
			yield `🗺️ Pages router: ${this.router.size} routes registered`
		} else {
			yield '📄 No explicit pages config found — building nav tree from directories...'
			const { buildNavTree } = await import('./utils/buildNavTree.js')
			const dirIndex = this.config?.directoryIndex || 'index'
			this.state.pages = await buildNavTree(this.dataDb, '.', { directoryIndex: dirIndex })
			this.router.load(this.state)
			yield `🗺️ Pages router: ${this.router.size} auto-routes registered (index: ${dirIndex})`
		}

		// 7. Phase 2: Initialize Renderer
		this.renderer = new Renderer(this.state)
		yield '🎨 OLMUI Renderer initialized.'

		// 9. Initialize Logger
		if (this.config.log && this.config.log.enabled) {
			this.logger = new AppLogger(this.config.log, this.cwd)
			await this.logger.init()
			yield `📝 Logger: ${this.config.log.rotation} rotation → ${this.config.log.dir}`
		}

		// 8. Phase 5b: Attach micro-apps via Registry
		if (this.config.apps && Array.isArray(this.config.apps) && this.config.apps.length > 0) {
			yield '\n📦 Loading Micro-Apps...'
			for (const appDef of this.config.apps) {
				yield* this.#attachApp(appDef)
			}
			yield `🔌 App Registry: ${this.registry.list().length} apps loaded [${this.registry.list().join(', ')}]`
			this.intents = new IntentResolver(this.registry, this.apps)
		}

		if (process.isBun) {
			yield '⚡ Running in Bun runtime.'
		}

		// Phase 6: Security Freeze
		if (this.db && typeof this.db.seal === 'function') {
			this.db.seal()
			yield '🛡️ Security Protocol: db.seal()'
		}

		yield '\n🟢 Engine Ready. Sovereign Web is online.'
	}

	/**
	 * Attach a micro-app as a data branch.
	 * Inherits dsn and locale from parent config when not specified.
	 *
	 * Config example:
	 *   apps:
	 *     - name: deposits
	 *       src: "@industrialbank/deposits"
	 *     - name: credits
	 *       src: "@industrialbank/credits"
	 *       locale: en
	 *
	 * @param {import('./domain/AppEntryConfig.js').default} appDef
	 * @yields {string}
	 */
	async *#attachApp(appDef) {
		const name = appDef.name
		if (!name) {
			yield `⚠️ Invalid app definition: ${JSON.stringify(appDef)}`
			return
		}

		// Успадкування від батьківського конфігу
		const dsn = appDef.dsn || this.config.dsn
		const locale = appDef.locale || this.config.locale

		try {
			const appDb = new DBwithFSDriver({ cwd: dsn })
			await appDb.connect()

			// Read package.json to discover UI adapters from exports
			const pkg = await appDb.fetch('package.json') ?? {}
			if (pkg.name || pkg.exports) {
				const manifest = this.registry.registerFromPackage(pkg)
				const adapters = manifest.adapters
				yield `  📋 ${name}: ${adapters.length ? adapters.join(', ') : 'no ui adapters'}`
			} else {
				// Fallback: register minimal manifest from entry config
				this.registry.register({ appName: name, src: appDef.src })
				yield `  📋 ${name}: no package.json, registered from config`
			}

			// Load app's index into state under its namespace
			const appIndex = await appDb.fetch('index')
			
			if (appDef.isolation) {
				// App Isolation (Phase 5): Hide from global scope if isolated
				this.state[name] = appIndex
				yield `  🔒 ${name}: Isolated state (Phase 5)`
			} else {
				this.state[name] = appIndex
			}

			this.apps.set(name, appDb)
			yield `  ✅ ${name} attached (dsn: ${dsn}, locale: ${locale})`
			this.emit('change', this.state)
		} catch (err) {
			yield `  ⚠️ Failed to attach ${name}: ${err.message}`
		}
	}

	/**
	 * Render a page by URL path.
	 * Combines Router + Renderer for full data-bound rendering.
	 *
	 * @param {string} urlPath - URL path (e.g. '/cases')
	 * @returns {Promise<{ page: import('./domain/Page.js').default | null, blocks: object[], breadcrumbs: import('./domain/Page.js').default[] }>}
	 */
	async renderPage(urlPath) {
		const start = performance.now()
		const { page, breadcrumbs } = this.router.match(urlPath)

		if (!page) {
			const ms = (performance.now() - start).toFixed(1)
			if (this.logger) {
				this.logger.access({ method: 'GET', path: urlPath, status: 404, ms })
			}
			return {
				page: null,
				blocks: [{ h1: '404' }, { p: `Page not found: ${urlPath}` }],
				breadcrumbs: [],
			}
		}

		// Phase 5: Dynamic Source Data Fetching
		// If page has a source but its not in state, load it from DB
		if (page.source) {
			const segments = page.source.split('.')
			let current = this.state
			let missing = false
			for (const seg of segments) {
				if (current == null || typeof current !== 'object' || current[seg] === undefined) {
					missing = true
					break
				}
				current = current[seg]
			}

			if (missing) {
				try {
					const doc = await this.dataDb.fetch(page.source.replace(/\./g, '/'))
					if (doc) {
						// Inject into state under its path
						let target = this.state
						for (let i = 0; i < segments.length - 1; i++) {
							const seg = segments[i]
							if (!target[seg]) target[seg] = {}
							target = target[seg]
						}
						target[segments[segments.length - 1]] = doc
					}
				} catch (err) {
					console.warn(`⚠️ Failed to fetch page source (${page.source}): ${err.message}`)
				}
			}
		}

		const blocks = this.renderer.render(page)
		const ms = (performance.now() - start).toFixed(1)

		if (this.logger) {
			this.logger.access({ method: 'GET', path: urlPath, status: 200, ms })
		}

		return { page, blocks, breadcrumbs }
	}

	/**
	 * Resolve a `<nan0-sandbox>` intent — delegate control to a sub-app.
	 *
	 * @param {{ src: string, url?: string, ui?: string }} intent
	 * @returns {Promise<object[]>} - Array of output messages/blocks from the sub-app
	 */
	async resolveIntent(intent) {
		if (!this.intents) {
			return [{ error: 'No apps registered (IntentResolver not initialized)' }]
		}
		const results = []
		for await (const output of this.intents.resolve(intent)) {
			results.push(output)
		}
		return results
	}

	/**
	 * Detect which config file exists.
	 * Priority: .nan0 > .yaml > .json > .js
	 * @returns {Promise<{uri: string, format: string} | null>}
	 */
	async #detectConfig() {
		const formats = ['nan0', 'yaml', 'json', 'js']
		for (const format of formats) {
			const uri = `nan0web.config.${format}`
			try {
				const stat = await this.db.stat(uri)
				if (stat.exists) {
					return { uri, format }
				}
			} catch {
				// FSDriver throws on access() for non-existent files — skip
			}
		}
		return null
	}

	/**
	 * Load raw config data using the appropriate method.
	 * Data formats (nan0, yaml, json) → db.loadDocument()
	 * Code formats (js) → dynamic import()
	 * @param {{uri: string, format: string}} meta
	 * @returns {Promise<object>} Raw config data (not yet typified)
	 */
	async #loadConfig(meta) {
		if (meta.format === 'js') {
			const absPath = this.db.location(meta.uri)
			const mod = await import(absPath)
			return mod.default || mod
		}
		return await this.db.loadDocument(meta.uri, {})
	}

	/**
	 * Build the holistic Global State.
	 *
	 * Pattern:
	 *   const globalIndex = await db.fetch("index")       → global data + _/t.yaml (en)
	 *   const localeDb    = await db.extract(locale)       → data/uk/
	 *   const localeIndex = await localeDb.fetch("index")  → locale-specific data + t
	 *
	 * @param {string} locale
	 * @returns {Promise<object>}
	 */
	async #buildState(locale) {
		const state = {}

		// 1. Load global index (data/_/t.yaml, data/_/langs.yaml, etc.)
		try {
			const globalIndex = await this.dataDb.fetch('index')
			if (globalIndex) {
				Object.assign(state, globalIndex)
				
				// Feature: Auto-load translations from 't' key if present
				if (state.t) {
					this.i18n.load(state.t)
				}
			}
		} catch (e) {
			// Skip if global index is missing
		}

		// 1b. Auto-detect locales if missing
		if (!state.langs) {
			const { detectLocales } = await import('./utils/locales.js')
			const autoLangs = await detectLocales(this.dataDb)
			if (Object.keys(autoLangs).length > 0) {
				state.langs = autoLangs
			}
		}

		// 2. Load locale-specific data
		if (locale && locale !== 'en') {
			try {
				const localeDb = this.dataDb.extract(locale)
				const localeIndex = await localeDb.fetch('index')
				// Merge locale translations over global
				if (localeIndex.t) {
					state.t = { ...(state.t || {}), ...localeIndex.t }
				}
				// Merge other locale-specific data
				for (const [key, val] of Object.entries(localeIndex)) {
					if (key !== 't') state[key] = val
				}
			} catch {
				console.debug(`No locale data found for: ${locale}`)
			}
		}

		// 3. Typify Domain Models in State
		if (state.nav && Array.isArray(state.nav)) {
			state.nav = state.nav.map((n) => new Navigation(n))
		}

		return state
	}

	/**
	 * Update app state and notify observers.
	 * @param {string} key 
	 * @param {any} value 
	 */
	updateState(key, value) {
		this.state[key] = value
		this.emit('change', this.state)
	}

	/**
	 * Simple start() for non-generator usage.
	 * Consumes run() and prints to console.info.
	 */
	async start() {
		for await (const msg of this.run()) {
			console.info(msg)
		}
	}

	/**
	 * Graceful shutdown — close logger streams and DB connections.
	 */
	stop() {
		if (this.logger) {
			this.logger.close()
			this.logger = null
		}
		for (const [, appDb] of this.apps) {
			if (typeof appDb.disconnect === 'function') appDb.disconnect()
		}
		this.apps.clear()
	}
}

// Auto-start if executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
	const runner = new AppRunner()
	runner.start()
}
