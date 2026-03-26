import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { NaN0WebConfig, AppEntryConfig } from './index.js'

describe('NaN0WebConfig', () => {
	it('should use default values', () => {
		const config = new NaN0WebConfig()
		assert.equal(config.appName, '')
		assert.equal(config.dsn, 'data/')
		assert.equal(config.port, 3000)
		assert.deepEqual(config.apps, [])
	})

	it('should support alias: appName (target) <- name (source)', () => {
		const config = NaN0WebConfig.from({ name: 'my-custom-app', port: 8080 })
		assert.equal(config.appName, 'my-custom-app')
		assert.equal(config.port, 8080)
	})

	it('should support direct property name', () => {
		const config = NaN0WebConfig.from({ appName: 'direct-name' })
		assert.equal(config.appName, 'direct-name')
	})

	it('should preserve other properties', () => {
		const config = NaN0WebConfig.from({ name: 'test', theme: 'dark' })
		assert.equal(config.appName, 'test')
		assert.equal(config.theme, 'dark')
	})

	it('apps — масив підключених додатків', () => {
		const config = new NaN0WebConfig({
			appName: 'industrialbank',
			locale: 'uk',
			apps: [
				{ name: 'deposits', src: '@industrialbank/deposits' },
				{ name: 'credits', src: '@industrialbank/credits', locale: 'en' },
			],
		})
		assert.equal(config.apps.length, 2)
		assert.equal(config.apps[0].name, 'deposits')
		assert.equal(config.apps[0].src, '@industrialbank/deposits')
		assert.equal(config.apps[1].locale, 'en')
	})

	it('apps — порожній dsn/locale означає успадкування від батька', () => {
		const config = new NaN0WebConfig({
			dsn: 'data/',
			locale: 'uk',
			apps: [{ name: 'deposits', src: '@industrialbank/deposits' }],
		})
		const app = config.apps[0]
		// Порожні поля — runner підставить від батька
		assert.equal(app.dsn || config.dsn, 'data/')
		assert.equal(app.locale || config.locale, 'uk')
	})
})
