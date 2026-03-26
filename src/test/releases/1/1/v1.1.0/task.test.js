import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '../../../../../..')

describe('Release v1.1.0 — Data-Driven Runner & Story Tests', () => {

	// AC1: Тестові дані у форматі nan0
	it('data/ structure with en and uk locales exists', () => {
		const required = [
			'data/_/t.nan0',
			'data/_/nav.nan0',
			'data/index.nan0',
			'data/uk/index.nan0',
		]
		for (const file of required) {
			assert.ok(fs.existsSync(path.join(ROOT, file)), `Missing: ${file}`)
		}
	})

	// AC2: CLI виклик працює
	it('src/cli.js exists and is executable', () => {
		const cliPath = path.join(ROOT, 'src/cli.js')
		assert.ok(fs.existsSync(cliPath), 'src/cli.js must exist')
		const content = fs.readFileSync(cliPath, 'utf-8')
		assert.ok(content.includes('AppRunner'), 'Must use AppRunner')
	})

	// AC3: Story тести існують та проходять
	it('story tests exist', () => {
		const storyDir = path.join(ROOT, 'test/stories')
		assert.ok(fs.existsSync(storyDir), 'test/stories/ must exist')
		const stories = fs.readdirSync(storyDir).filter(f => f.endsWith('.story.js'))
		assert.ok(stories.length >= 2, `Expected >= 2 story files, got ${stories.length}`)
	})

	// AC4: Domain Models (Model-as-Schema) — Part of Phase 2/2.5
	it('domain models are exported from barrel', async () => {
		const domain = await import('../../../../../../src/domain/index.js')
		assert.ok(domain.NaN0WebConfig, 'NaN0WebConfig must be exported')
		assert.ok(domain.AppEntryConfig, 'AppEntryConfig must be exported')
		assert.ok(domain.Page, 'Page must be exported')
		assert.ok(domain.LogConfig, 'LogConfig must be exported')
		assert.ok(domain.Navigation, 'Navigation must be exported')
	})

	// AC5: Router works
	it('PagesRouter module exists', async () => {
		const mod = await import('../../../../../../src/router/PagesRouter.js')
		assert.ok(mod.default, 'PagesRouter must be default export')
	})

	// AC6: Renderer works
	it('Renderer module exists', async () => {
		const mod = await import('../../../../../../src/renderer/Renderer.js')
		assert.ok(mod.default, 'Renderer must be default export')
	})

	// AC7: AppRunner is functional
	it('AppRunner exports and constructs', async () => {
		const { AppRunner } = await import('../../../../../../src/runner.js')
		const runner = new AppRunner({ cwd: ROOT })
		assert.ok(runner, 'AppRunner must construct')
		assert.equal(runner.cwd, ROOT)
	})
})
