/**
 * @file IntentResolver — Resolves `nan0-sandbox` intents to sub-app flows.
 *
 * When the Renderer encounters a `<nan0-sandbox>` block, the IntentResolver:
 *   1. Looks up the app in AppRegistry
 *   2. Verifies the requested UI adapter is available
 *   3. Dynamically imports the adapter module via package.json#exports
 *   4. Delegates control via `yield*` to the sub-app's async generator
 *
 * Contract:
 *   intent = { src: 'auth.app', url: 'signup', ui: 'cli' }
 *   resolve(intent) → AsyncGenerator<OutputMessage>
 *
 * The sub-app's `./ui/{adapter}` export must provide either:
 *   - A default export that is an App instance with `run()` method
 *   - A default export that is a function returning an AsyncGenerator
 */

/**
 * @typedef {object} Intent
 * @property {string} src - App source identifier (e.g. 'auth.app', '@nan0web/auth.app')
 * @property {string} [url] - Target URL/action within the app (e.g. 'signup', 'login')
 * @property {string} [ui] - Preferred UI adapter (e.g. 'cli', 'api', 'chat', 'lit')
 */

export default class IntentResolver {
	/** @type {import('../registry/AppRegistry.js').default} */
	#registry

	/** @type {Map<string, object>} */
	#appDbs

	/**
	 * @param {import('../registry/AppRegistry.js').default} registry
	 * @param {Map<string, object>} appDbs - Map of app name → DB instance
	 */
	constructor(registry, appDbs) {
		this.#registry = registry
		this.#appDbs = appDbs
	}

	/**
	 * Resolve an intent to a sub-app flow.
	 *
	 * @param {Intent} intent
	 * @returns {AsyncGenerator<any>}
	 */
	async *resolve(intent) {
		const appName = this.#normalizeAppName(intent.src)
		const manifest = this.#registry.get(appName)

		if (!manifest) {
			yield { error: `App "${appName}" is not registered` }
			return
		}

		const adapter = intent.ui || 'cli'
		if (!manifest.hasAdapter(adapter)) {
			yield { error: `App "${appName}" has no "${adapter}" adapter. Available: ${manifest.adapters.join(', ')}` }
			return
		}

		// Resolve the import path for the adapter
		const importPath = `${manifest.src}/ui/${adapter}`

		try {
			const mod = await import(importPath)
			const entry = mod.default || mod

			// Case 1: App instance with run() method
			if (entry && typeof entry.run === 'function') {
				yield* entry.run({ url: intent.url, db: this.#appDbs.get(appName) })
				return
			}

			// Case 2: Function that returns an AsyncGenerator
			if (typeof entry === 'function') {
				const result = entry({
					url: intent.url,
					db: this.#appDbs.get(appName),
				})
				// Check if it's an async generator
				if (result && typeof result[Symbol.asyncIterator] === 'function') {
					yield* result
					return
				}
				// Regular function — wrap result
				yield { result }
				return
			}

			// Case 3: Static module export (e.g. component registry)
			yield { module: entry, adapter, app: appName }
		} catch (err) {
			yield { error: `Failed to load "${importPath}": ${err.message}` }
		}
	}

	/**
	 * Check if an intent can be resolved.
	 * @param {Intent} intent
	 * @returns {boolean}
	 */
	canResolve(intent) {
		const appName = this.#normalizeAppName(intent.src)
		const manifest = this.#registry.get(appName)
		if (!manifest) return false
		return manifest.hasAdapter(intent.ui || 'cli')
	}

	/**
	 * Normalize app name: "@nan0web/auth.app" → "auth", "auth.app" → "auth"
	 * @param {string} src
	 * @returns {string}
	 */
	#normalizeAppName(src) {
		if (!src) return ''
		return src
			.replace(/^@[^/]+\//, '')  // strip scope
			.replace(/\.app$/, '')      // strip .app suffix
	}
}
