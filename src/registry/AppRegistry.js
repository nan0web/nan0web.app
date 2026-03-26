import AppManifest from '../domain/AppManifest.js'

/**
 * @file AppRegistry — Scoped Registry for Micro-Apps.
 *
 * Discovers app capabilities from `package.json#exports`.
 * Routes are NOT declared in manifests — they come from
 * the `data/` file structure (Data-Driven Hub Routing).
 *
 * Lifecycle:
 *   1. AppRunner calls `registry.register(pkg)` for each app
 *   2. Registry reads `package.json#exports` to detect `./ui/*` adapters
 *   3. Manifest is hydrated into AppManifest model
 *   4. Engine queries: `registry.getByAdapter('cli')` → all cli-capable apps
 */
export default class AppRegistry {
	/** @type {Map<string, AppManifest>} */
	#apps = new Map()

	/** @returns {number} */
	get size() {
		return this.#apps.size
	}

	/**
	 * Register an app from its package.json.
	 * Auto-detects UI adapters from `exports` map.
	 *
	 * @param {object} pkg - package.json content
	 * @returns {AppManifest}
	 */
	registerFromPackage(pkg) {
		const manifest = AppManifest.fromPackageJson(pkg)
		this.#apps.set(manifest.appName, manifest)
		return manifest
	}

	/**
	 * Register a manifest directly (for testing or manual config).
	 * @param {AppManifest | object} input
	 * @returns {AppManifest}
	 */
	register(input) {
		const m = input instanceof AppManifest ? input : new AppManifest(input)
		if (!m.appName) throw new Error('AppManifest requires a name')
		this.#apps.set(m.appName, m)
		return m
	}

	/**
	 * Get manifest by app name.
	 * @param {string} name
	 * @returns {AppManifest | undefined}
	 */
	get(name) {
		return this.#apps.get(name)
	}

	/**
	 * Check if an app has a specific adapter.
	 * @param {string} appName
	 * @param {string} adapter - e.g. 'cli', 'api', 'chat', 'lit'
	 * @returns {boolean}
	 */
	hasAdapter(appName, adapter) {
		const m = this.#apps.get(appName)
		return m ? m.hasAdapter(adapter) : false
	}

	/**
	 * Get all apps that provide a specific UI adapter.
	 * @param {string} adapter - e.g. 'cli', 'api', 'chat', 'lit', 'swift', 'kotlin', 'robo'
	 * @returns {AppManifest[]}
	 */
	getByAdapter(adapter) {
		return [...this.#apps.values()].filter(m => m.hasAdapter(adapter))
	}

	/**
	 * List all registered app names.
	 * @returns {string[]}
	 */
	list() {
		return [...this.#apps.keys()]
	}
}
