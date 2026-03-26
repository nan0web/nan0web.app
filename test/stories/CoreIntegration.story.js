import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Model, NaN0WebConfig, AppEntryConfig, LogConfig, Navigation } from '../../src/domain/index.js'
import { AppRunner } from '../../src/runner.js'

/**
 * Story 5: @nan0web/core Integration — Model-as-Schema v2
 *
 * As the nan0web engine,
 * I want all domain models to extend @nan0web/core Model,
 * so that they get unified resolveDefaults, resolveAliases, validate(),
 * and IoC (db, options) out of the box.
 */
describe('Story 5: @nan0web/core Integration', () => {

	it('all domain models extend Model (Golden Standard v2)', () => {
		const config = new NaN0WebConfig()
		const appEntry = new AppEntryConfig()
		const logConfig = new LogConfig()

		assert.ok(config instanceof Model, 'NaN0WebConfig must extend Model')
		assert.ok(appEntry instanceof Model, 'AppEntryConfig must extend Model')
		assert.ok(logConfig instanceof Model, 'LogConfig must extend Model')
	})

	it('Model provides validate() contract', () => {
		const config = new NaN0WebConfig()
		// validate() should exist and return boolean
		assert.equal(typeof config.validate, 'function', 'validate() must be a function')
	})

	it('Model IoC: options accessible via this._ getter', () => {
		const mockDb = { fetch: () => {} }
		const entry = new AppEntryConfig({ name: 'test' }, { db: mockDb })

		assert.equal(entry._.db, mockDb, 'raw options must be accessible via this._')
	})

	it('NaN0WebConfig.from() produces typed Model with nested hydration', () => {
		const config = NaN0WebConfig.from({
			name: 'My Engine',
			dsn: 'data/',
			locale: 'uk',
			port: 8080,
			theme: 'dark',
			log: { enabled: true, rotation: 'hourly', dir: '/var/logs' },
			apps: [
				{ name: 'auth', src: '@nan0web/auth' },
				{ name: 'pay', src: '@nan0web/pay', locale: 'en' },
			],
		})

		// Root is Model
		assert.ok(config instanceof Model, 'config must be Model')
		assert.ok(config instanceof NaN0WebConfig, 'config must be NaN0WebConfig')

		// Nested log is Model
		assert.ok(config.log instanceof Model, 'log must be Model')
		assert.ok(config.log instanceof LogConfig, 'log must be LogConfig')
		assert.equal(config.log.rotation, 'hourly')

		// Nested apps are Models
		assert.equal(config.apps.length, 2)
		assert.ok(config.apps[0] instanceof Model, 'app[0] must be Model')
		assert.ok(config.apps[0] instanceof AppEntryConfig, 'app[0] must be AppEntryConfig')
		assert.equal(config.apps[0].appName, 'auth')
		assert.equal(config.apps[0].name, 'auth', 'alias accessor must work')
		assert.equal(config.apps[1].locale, 'en')
	})

	it('AppRunner accepts IoC { db } injection', () => {
		const mockDb = { fetch: () => {}, stat: () => ({ exists: false }) }
		const runner = new AppRunner({ db: mockDb })

		assert.equal(runner.db, mockDb, 'injected db must be stored')
		assert.equal(runner.cwd, process.cwd(), 'cwd defaults to process.cwd()')
	})

	it('AppRunner backward compat: string argument = cwd', () => {
		const runner = new AppRunner('/my/project')
		assert.equal(runner.cwd, '/my/project')
		assert.equal(runner.db, undefined, 'db not injected')
	})

	it('AppRunner backward compat: no arguments', () => {
		const runner = new AppRunner()
		assert.equal(runner.cwd, process.cwd())
		assert.equal(runner.config, null)
	})

	it('config is NaN0WebConfig instance after run() typification', () => {
		// Simulate what run() does internally: NaN0WebConfig.from(rawConfig)
		const rawConfig = { name: 'test', dsn: 'data/', port: 3000 }
		const config = NaN0WebConfig.from(rawConfig)

		assert.ok(config instanceof NaN0WebConfig, 'from() must return NaN0WebConfig')
		assert.equal(config.appName, 'test')
		assert.equal(config.port, 3000)
		assert.equal(typeof config.validate, 'function')
	})
})
