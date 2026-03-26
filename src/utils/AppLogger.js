import fs from 'node:fs'
import path from 'node:path'

/**
 * AppLogger — File-based Access & Error Logger with rotation.
 *
 * Driven entirely by LogConfig (Model-as-Schema).
 * Supports daily, hourly, and size-based rotation strategies.
 *
 * Usage:
 *   const logger = new AppLogger(logConfig, cwd)
 *   logger.access({ method: 'GET', path: '/uk/catalog', status: 200, ms: 12 })
 *   logger.error({ message: 'DB timeout', stack: '...' })
 */
export default class AppLogger {
	/** @type {import('../domain/LogConfig.js').default} */
	config

	/** @type {string} */
	baseDir

	/** @type {fs.WriteStream | null} */
	_accessStream = null

	/** @type {fs.WriteStream | null} */
	_errorStream = null

	/** @type {string} Current access log file path */
	#accessPath = ''

	/** @type {string} Current error log file path */
	#errorPath = ''

	/**
	 * @param {import('../domain/LogConfig.js').default} config
	 * @param {string} cwd
	 */
	constructor(config, cwd = process.cwd()) {
		this.config = config
		this.baseDir = path.resolve(cwd, config.dir || 'logs/')
	}

	/**
	 * Initialize log directory and open streams.
	 * @returns {Promise<void>}
	 */
	async init() {
		if (!this.config.enabled) return

		fs.mkdirSync(this.baseDir, { recursive: true })

		this.#rotateIfNeeded('access')
		this.#rotateIfNeeded('error')
	}

	/**
	 * Log an access event (request/response).
	 * @param {{ method?: string, path?: string, status?: number, ms?: number, locale?: string }} entry
	 */
	access(entry) {
		if (!this.config.enabled) return

		this.#rotateIfNeeded('access')

		const line = this.#formatAccess(entry)
		if (this._accessStream) {
			this._accessStream.write(line + '\n')
		}
	}

	/**
	 * Log an error event.
	 * @param {{ message?: string, stack?: string, code?: string, path?: string }} entry
	 */
	error(entry) {
		if (!this.config.enabled) return

		this.#rotateIfNeeded('error')

		const line = this.#formatError(entry)
		if (this._errorStream) {
			this._errorStream.write(line + '\n')
		}
	}

	/**
	 * Close all streams gracefully.
	 */
	close() {
		if (this._accessStream) {
			this._accessStream.end()
			this._accessStream = null
		}
		if (this._errorStream) {
			this._errorStream.end()
			this._errorStream = null
		}
	}

	/**
	 * Check if rotation is needed and rotate streams.
	 * @param {'access'|'error'} type
	 */
	#rotateIfNeeded(type) {
		const expectedPath = this.#buildFilePath(type)

		if (type === 'access') {
			if (this.#accessPath === expectedPath && this._accessStream) {
				// Size-based rotation check
				if (this.config.rotation === 'size') {
					try {
						const stat = fs.statSync(expectedPath)
						if (stat.size >= this.config.maxSizeMb * 1024 * 1024) {
							this._accessStream.end()
							const archived = expectedPath.replace('.log', `.${Date.now()}.log`)
							fs.renameSync(expectedPath, archived)
							this._accessStream = fs.createWriteStream(expectedPath, { flags: 'a' })
						}
					} catch { /* file doesn't exist yet, that's fine */ }
				}
				return
			}
			if (this._accessStream) this._accessStream.end()
			this.#accessPath = expectedPath
			this._accessStream = fs.createWriteStream(expectedPath, { flags: 'a' })
		} else {
			if (this.#errorPath === expectedPath && this._errorStream) {
				if (this.config.rotation === 'size') {
					try {
						const stat = fs.statSync(expectedPath)
						if (stat.size >= this.config.maxSizeMb * 1024 * 1024) {
							this._errorStream.end()
							const archived = expectedPath.replace('.log', `.${Date.now()}.log`)
							fs.renameSync(expectedPath, archived)
							this._errorStream = fs.createWriteStream(expectedPath, { flags: 'a' })
						}
					} catch { /* file doesn't exist yet */ }
				}
				return
			}
			if (this._errorStream) this._errorStream.end()
			this.#errorPath = expectedPath
			this._errorStream = fs.createWriteStream(expectedPath, { flags: 'a' })
		}
	}

	/**
	 * Build the file path based on rotation strategy.
	 * @param {'access'|'error'} type
	 * @returns {string}
	 */
	#buildFilePath(type) {
		const now = new Date()

		if (this.config.rotation === 'hourly') {
			const stamp = `${now.toISOString().slice(0, 13).replace('T', '_')}`
			return path.join(this.baseDir, `${type}.${stamp}.log`)
		}

		if (this.config.rotation === 'size') {
			// Size-based: single file, rotated by #rotateIfNeeded
			return path.join(this.baseDir, `${type}.log`)
		}

		// Default: daily
		const stamp = now.toISOString().slice(0, 10)
		return path.join(this.baseDir, `${type}.${stamp}.log`)
	}

	/**
	 * Format an access log line (Common Log Format inspired).
	 * @param {object} entry
	 * @returns {string}
	 */
	#formatAccess(entry) {
		const ts = new Date().toISOString()
		const method = entry.method || 'GET'
		const p = entry.path || '/'
		const status = entry.status || 200
		const ms = entry.ms ?? '-'
		const locale = entry.locale || '-'
		const body = this.config.logBodies && entry.body ? ` ${JSON.stringify(entry.body)}` : ''
		return `[${ts}] ${method} ${p} ${status} ${ms}ms locale=${locale}${body}`
	}

	/**
	 * Format an error log line.
	 * @param {object} entry
	 * @returns {string}
	 */
	#formatError(entry) {
		const ts = new Date().toISOString()
		const code = entry.code || 'ERR'
		const msg = entry.message || 'Unknown error'
		const p = entry.path || '-'
		const stack = entry.stack ? `\n${entry.stack}` : ''
		return `[${ts}] ${code} ${p} ${msg}${stack}`
	}
}
