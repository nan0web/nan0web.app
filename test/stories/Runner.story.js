import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { NaN0WebConfig, Navigation, LogConfig } from '../../src/domain/index.js'
import AppLogger from '../../src/utils/AppLogger.js'

/**
 * Story 1: Config loads from nan0 format with nested LogConfig
 *
 * As a developer,
 * I want NaN0WebConfig to correctly parse a config with nested `log` section,
 * so that the runner initializes logging with the right strategy.
 */
describe('Story 1: Config + LogConfig Aggregation', () => {
	it('should create NaN0WebConfig with nested LogConfig from raw data', () => {
		const config = NaN0WebConfig.from({
			name: 'NaN0Web Runner',
			dsn: 'data/',
			locale: 'en',
			port: 3000,
			theme: 'auto',
			log: {
				enabled: true,
				dir: 'logs/',
				rotation: 'daily',
			},
		})

		assert.equal(config.appName, 'NaN0Web Runner')
		assert.equal(config.dsn, 'data/')
		assert.equal(config.port, 3000)
		assert.ok(config.log instanceof LogConfig, 'log must be LogConfig instance')
		assert.equal(config.log.enabled, true)
		assert.equal(config.log.rotation, 'daily')
		assert.equal(config.log.dir, 'logs/')
		assert.equal(config.log.logBodies, false, 'logBodies defaults to false')
	})

	it('should use default LogConfig when log is not specified', () => {
		const config = NaN0WebConfig.from({ name: 'bare' })
		assert.ok(config.log, 'log should exist with defaults')
		assert.equal(config.log.enabled, true, 'logging enabled by default')
		assert.equal(config.log.rotation, 'daily', 'daily rotation by default')
	})
})

/**
 * Story 2: Navigation Model supports hierarchy (children)
 *
 * As a content author,
 * I want to define multi-level navigation in nav.nan0,
 * so that the runner builds a menu tree for any UI adapter.
 */
describe('Story 2: Navigation Hierarchy', () => {
	it('should create flat navigation from raw data', () => {
		const items = [
			{ title: 'Home', href: '/', icon: 'home' },
			{ title: 'Catalog', href: '/catalog', icon: 'list' },
		].map((n) => new Navigation(n))

		assert.equal(items.length, 2)
		assert.equal(items[0].title, 'Home')
		assert.equal(items[0].href, '/')
		assert.deepEqual(items[0].children, [])
	})

	it('should support nested children (recursive)', () => {
		const nav = new Navigation({
			title: 'Products',
			href: '/products',
			children: [
				{ title: 'Deposits', href: '/products/deposits' },
				{
					title: 'Credits',
					href: '/products/credits',
					children: [
						{ title: 'Mortgage', href: '/products/credits/mortgage' },
					],
				},
			],
		})

		assert.equal(nav.children.length, 2)
		assert.ok(nav.children[0] instanceof Navigation, 'child must be Navigation')
		assert.equal(nav.children[1].children.length, 1)
		assert.ok(nav.children[1].children[0] instanceof Navigation, 'grandchild must be Navigation')
		assert.equal(nav.children[1].children[0].title, 'Mortgage')
	})
})

/**
 * Story 3: AppLogger writes access and error logs with daily rotation
 *
 * As an operator,
 * I want every page render to be logged to a daily file,
 * so I can audit traffic and debug errors.
 */
describe('Story 3: AppLogger File Rotation', () => {
	const tmpDir = path.join(import.meta.dirname, '../../.test-logs')

	before(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true })
	})

	after(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true })
	})

	it('should create daily log files on access()', async () => {
		const logConfig = new LogConfig({
			enabled: true,
			dir: tmpDir,
			rotation: 'daily',
		})

		const logger = new AppLogger(logConfig, process.cwd())
		await logger.init()

		logger.access({ method: 'GET', path: '/uk/catalog', status: 200, ms: 12, locale: 'uk' })
		logger.access({ method: 'GET', path: '/unknown', status: 404, ms: 1 })
		logger.error({ message: 'DB timeout', code: 'ETIMEOUT', path: '/api/data' })

		// Wait for streams to flush
		await new Promise(resolve => {
			let closed = 0
			const done = () => { if (++closed === 2) resolve() }
			if (logger._accessStream) logger._accessStream.on('finish', done)
			if (logger._errorStream) logger._errorStream.on('finish', done)
			logger.close()
			if (!logger._accessStream && !logger._errorStream) resolve()
		})

		// Give OS time to sync
		await new Promise(r => setTimeout(r, 100))

		// Verify files exist
		const files = fs.readdirSync(tmpDir)
		const today = new Date().toISOString().slice(0, 10)

		const accessFile = files.find((f) => f.startsWith('access.') && f.includes(today))
		const errorFile = files.find((f) => f.startsWith('error.') && f.includes(today))

		assert.ok(accessFile, `Expected access log for ${today}, got: ${files}`)
		assert.ok(errorFile, `Expected error log for ${today}, got: ${files}`)

		// Verify content
		const accessContent = fs.readFileSync(path.join(tmpDir, accessFile), 'utf-8')
		assert.ok(accessContent.includes('GET /uk/catalog 200'), 'access log must contain catalog entry')

		const errorContent = fs.readFileSync(path.join(tmpDir, errorFile), 'utf-8')
		assert.ok(errorContent.includes('ETIMEOUT'), 'error log must contain timeout entry')
	})
})

/**
 * Story 4: Schema Generator produces valid JSON Schemas
 */
describe('Story 4: JSON Schema Generation', () => {
	const schemasDir = path.join(import.meta.dirname, '../../schemas')

	it('should have generated all expected schema files', () => {
		const expected = [
			'NaN0WebConfig.schema.json',
			'AppEntryConfig.schema.json',
			'Page.schema.json',
			'Navigation.schema.json',
			'LogConfig.schema.json',
		]

		for (const file of expected) {
			const filePath = path.join(schemasDir, file)
			assert.ok(fs.existsSync(filePath), `Missing schema: ${file} at ${filePath}`)
		}
	})

	it('NaN0WebConfig schema should reference LogConfig via $ref', () => {
		const schema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'NaN0WebConfig.schema.json'), 'utf-8'))

		assert.ok(schema.properties.log, 'log property must exist')
		assert.ok(schema.properties.log.$ref, 'log must use $ref')
		assert.ok(schema.properties.log.$ref.includes('LogConfig'), 'log.$ref must point to LogConfig')
	})

	it('Navigation schema should have recursive children $ref', () => {
		const schema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'Navigation.schema.json'), 'utf-8'))

		assert.ok(schema.properties.children, 'children property must exist')
		assert.equal(schema.properties.children.type, 'array')
		assert.ok(schema.properties.children.items.$ref.includes('Navigation'),
			'children items must reference Navigation itself')
	})

	it('NaN0WebConfig schema should use alias "name" instead of "appName"', () => {
		const schema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'NaN0WebConfig.schema.json'), 'utf-8'))

		assert.ok(schema.properties.name, 'alias "name" must appear in schema')
		assert.equal(schema.properties.appName, undefined, 'raw "appName" must NOT appear')
	})
})
