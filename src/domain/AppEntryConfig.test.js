import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import AppEntryConfig from './AppEntryConfig.js'

describe('AppEntryConfig', () => {
	it('значення за замовчуванням', () => {
		const entry = new AppEntryConfig()
		assert.equal(entry.name, '')
		assert.equal(entry.src, '')
		assert.equal(entry.dsn, '')
		assert.equal(entry.locale, '')
	})

	it('ініціалізація з повними даними', () => {
		const entry = new AppEntryConfig({
			name: 'deposits',
			src: '@industrialbank/deposits',
			dsn: 'custom-data/',
			locale: 'en',
		})
		assert.equal(entry.name, 'deposits')
		assert.equal(entry.src, '@industrialbank/deposits')
		assert.equal(entry.dsn, 'custom-data/')
		assert.equal(entry.locale, 'en')
	})

	it('порожні dsn та locale означають успадкування від батька', () => {
		const entry = new AppEntryConfig({
			name: 'credits',
			src: '@industrialbank/credits',
		})
		// Порожні значення — сигнал для runner: бери від батька
		assert.equal(entry.dsn, '')
		assert.equal(entry.locale, '')
	})
})
