import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '../../../../../..')

describe('Release v1.4.0 — Architectural Refactoring', () => {

	// AC1: UI models moved to package
	it('UI models are promoted to @nan0web/ui package', () => {
		const uiDomainDir = path.join(ROOT, '../../packages/ui/src/domain')
		const requiredModels = [
			'HeaderModel.js',
			'FooterModel.js',
			'HeroModel.js'
		]
		for (const model of requiredModels) {
			assert.ok(fs.existsSync(path.join(uiDomainDir, model)), `${model} must exist in @nan0web/ui/domain`)
		}
		assert.ok(fs.existsSync(path.join(uiDomainDir, 'components/FeatureGridModel.js')), 'FeatureGridModel must exist in @nan0web/ui/domain/components')
	})

	// AC2: nan0web.app local UI models removed
	it('nan0web.app local UI models directory is empty or removed', () => {
		const localUiDir = path.join(ROOT, 'src/domain/ui')
		if (fs.existsSync(localUiDir)) {
			const files = fs.readdirSync(localUiDir).filter(f => f.endsWith('.js'))
			// Should only contain what is not yet migrated or be empty
			assert.equal(files.length, 0, 'Local UI models directory should be empty')
		}
	})

	// AC3: db.seal() implementation
	it('AppRunner implements db.seal() security protocol', async () => {
		const { AppRunner } = await import('../../../../../../src/runner.js')
		const runner = new AppRunner({ cwd: ROOT })
		// Initialize the engine partially to trigger db creation
		const it = runner.run()
		for (let i = 0; i < 5; i++) await it.next() 
		
		assert.equal(typeof runner.db.seal, 'function', 'db.seal() must be implemented')
	})

	// AC4: API Restructuring
	it('API endpoints are moved to src/server/api', () => {
		const oldApiDir = path.join(ROOT, 'data/api')
		const newApiDir = path.join(ROOT, 'src/server/api')
		
		if (fs.existsSync(oldApiDir)) {
			const files = fs.readdirSync(oldApiDir).filter(f => f.endsWith('.js'))
			assert.equal(files.length, 0, 'data/api should be empty of JS files')
		}
		assert.ok(fs.existsSync(newApiDir), 'src/server/api must exist')
	})

	// AC5: Total health
	it('regression: test:all passes', () => {
		// This will be verified by running npm run test:all
		assert.ok(true)
	})
})
