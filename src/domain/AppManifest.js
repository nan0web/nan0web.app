import { Model } from '@nan0web/core'

/**
 * AppManifest — Runtime representation of a micro-app's capabilities.
 *
 * NOT a separate file — derived from `package.json#exports`.
 * The engine reads `package.json` to discover what a micro-app provides:
 *
 *   package.json#exports:
 *     ".":          → domain + logic
 *     "./domain":   → domain models
 *     "./ui/cli":   → CLI adapter
 *     "./ui/api":   → API adapter
 *     "./ui/lit":   → Lit Web Components
 *     "./ui/chat":  → AI Chat adapter
 *     "./ui/voice": → Voice adapter
 *     "./ui/swift": → Swift adapter
 *     "./ui/kotlin": → Kotlin adapter
 *     "./ui/robo":  → Robotics adapter
 *
 * Pages/routes are NOT declared here — they are auto-built from
 * the `data/` file structure (Data-Driven Hub Routing).
 *
 * @property {string} appName Unique app identifier (from package.json#name)
 * @property {string} version From package.json#version
 * @property {string} description From package.json#description
 * @property {string} src Package source (npm name or local path)
 * @property {string[]} adapters Available UI adapters (auto-detected from exports)
 */
export default class AppManifest extends Model {
	static appName = {
		alias: 'name',
		help: 'Unique app identifier (from package.json#name)',
		placeholder: 'auth',
		type: 'string',
		required: true,
		default: '',
	}
	static version = {
		help: 'Semantic version (from package.json#version)',
		placeholder: '1.0.0',
		type: 'string',
		default: '1.0.0',
	}
	static description = {
		help: 'Human-readable description',
		type: 'string',
		default: '',
	}
	static src = {
		help: 'Package source (npm name or local path)',
		placeholder: '@nan0web/auth.app',
		type: 'string',
		default: '',
	}
	static adapters = {
		help: 'Available UI adapters (auto-detected from package.json#exports)',
		type: 'string[]',
		default: [],
	}

	/** @returns {string} Alias accessor */
	get name() { return this.appName }

	/**
	 * Check if this app provides a specific UI adapter.
	 * @param {string} adapter - e.g. 'cli', 'api', 'chat', 'lit', 'swift'
	 * @returns {boolean}
	 */
	hasAdapter(adapter) {
		return this.adapters.includes(adapter)
	}

	/**
	 * Parse package.json exports to detect available UI adapters.
	 * Exports matching `./ui/*` pattern are extracted as adapter names.
	 *
	 * @param {object} pkg - package.json content
	 * @returns {AppManifest}
	 */
	static fromPackageJson(pkg) {
		const exports = pkg.exports || {}
		const adapters = []

		for (const key of Object.keys(exports)) {
			// Match: ./ui/cli, ./ui/api, ./ui/chat, ./ui/lit, ./ui/swift, etc.
			const match = key.match(/^\.\/ui\/(.+)$/)
			if (match) {
				adapters.push(match[1])
			}
		}

		// Normalize name: "@nan0web/auth.app" → "auth"
		const rawName = pkg.name || ''
		const appName = rawName
			.replace(/^@[^/]+\//, '')  // strip scope
			.replace(/\.app$/, '')      // strip .app suffix

		return new AppManifest({
			appName,
			version: pkg.version || '1.0.0',
			description: pkg.description || '',
			src: rawName,
			adapters,
		})
	}
}
