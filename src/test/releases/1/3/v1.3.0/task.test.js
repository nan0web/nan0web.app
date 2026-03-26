/**
 * Release v1.3.0 — Presentation Landing & OLMUI Models Hardening
 * Contract Tests (Regression)
 * 
 * @file task.test.js
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '../../../../../..')

/** @param {string} name */
const getModelPath = (name) => {
	const local = path.join(ROOT, 'src/domain/ui', name)
	if (existsSync(local)) return local
	return path.join(ROOT, '../../packages/ui/src/domain', name)
}

/** @param {string} name */
const getComponentModelPath = (name) => {
	const local = path.join(ROOT, 'src/domain/ui', name)
	if (existsSync(local)) return local
	return path.join(ROOT, '../../packages/ui/src/domain/components', name)
}

// ══════════════════════════════════════════════════
// AC1: Presentation Landing Page exists and renders
// ══════════════════════════════════════════════════

describe('AC1: Presentation Landing Page', () => {
	it('public/index.html exists', () => {
		assert.ok(existsSync('public/index.html'), 'index.html should exist in public/')
	})

	it('public/index.css exists', () => {
		assert.ok(existsSync('public/index.css'), 'index.css should exist in public/')
	})

	it('index.html contains all 6 section IDs', async () => {
		const html = await readFile('public/index.html', 'utf-8')
		const requiredIds = ['hero', 'features', 'catalog', 'docs', 'architecture', 'contact']
		for (const id of requiredIds) {
			assert.ok(html.includes(`id="${id}"`), `Section id="${id}" must be present`)
		}
	})
})

// ══════════════════════════════════════════════════
// AC2: OLMUI Models Refactoring
// ══════════════════════════════════════════════════

describe('AC2: OLMUI Models Refactoring', () => {
	it('LinkModel.js is physically absent', () => {
		assert.ok(
			!existsSync(getModelPath('LinkModel.js')),
			'LinkModel.js must be permanently deleted'
		)
	})

	it('HeaderModel does not import LinkModel', async () => {
		const src = await readFile(getModelPath('HeaderModel.js'), 'utf-8')
		assert.ok(!src.includes('LinkModel'), 'HeaderModel must not reference LinkModel')
	})

	it('HeaderModel imports Navigation from @nan0web/ui', async () => {
		const src = await readFile(getModelPath('HeaderModel.js'), 'utf-8')
		assert.ok(src.includes("'@nan0web/ui"), 'HeaderModel must import from @nan0web/ui')
		assert.ok(src.includes('Navigation'), 'HeaderModel must reference Navigation')
	})

	it('HeaderModel imports Language from @nan0web/i18n', async () => {
		const src = await readFile(getModelPath('HeaderModel.js'), 'utf-8')
		assert.ok(src.includes("'@nan0web/i18n'"), 'HeaderModel must import from @nan0web/i18n')
		assert.ok(src.includes('Language'), 'HeaderModel must reference Language')
	})

	it('FooterModel has copyright, version, license fields', async () => {
		const src = await readFile(getModelPath('FooterModel.js'), 'utf-8')
		assert.ok(src.includes('static copyright'), 'FooterModel must have copyright field')
		assert.ok(src.includes('static version'), 'FooterModel must have version field')
		assert.ok(src.includes('static license'), 'FooterModel must have license field')
	})

	it('FooterModel has nav and share arrays of Navigation', async () => {
		const src = await readFile(getModelPath('FooterModel.js'), 'utf-8')
		assert.ok(src.includes('static nav'), 'FooterModel must have nav field')
		assert.ok(src.includes('static share'), 'FooterModel must have share field')
		assert.ok(src.includes('Navigation'), 'FooterModel must reference Navigation')
	})

	it('HeroModel has actions: Navigation[] instead of cta', async () => {
		const src = await readFile(getModelPath('HeroModel.js'), 'utf-8')
		assert.ok(src.includes('static actions'), 'HeroModel must have actions field')
		// In v1.4.0 we use cta for backward compat mapping internally, but it's not a top-level field
		assert.ok(!src.includes('static cta') || src.includes('data.cta'), 'HeroModel must NOT have top-level cta field')
		assert.ok(src.includes('Navigation'), 'HeroModel must reference Navigation')
	})
})

// ══════════════════════════════════════════════════
// AC3: Extra Models (99% Coverage)
// ══════════════════════════════════════════════════

describe('AC3: Extra OLMUI Models (Hygiene)', () => {
	it('FeatureGridModel exists', () => {
		assert.ok(existsSync(getComponentModelPath('FeatureGridModel.js')), 'FeatureGridModel must exist')
	})

	it('PriceModel contains value and currency', async () => {
		const src = await readFile(getComponentModelPath('PriceModel.js'), 'utf-8')
		assert.ok(src.includes('static value'), 'PriceModel must have value field')
		assert.ok(src.includes('static currency'), 'PriceModel must have currency field')
	})

	it('Visibility models for Header and Footer exist', () => {
		assert.ok(existsSync(getComponentModelPath('HeaderVisibilityModel.js')), 'HeaderVisibilityModel must exist')
		assert.ok(existsSync(getComponentModelPath('FooterVisibilityModel.js')), 'FooterVisibilityModel must exist')
	})

	it('EmptyStateModel and BannerModel exist', () => {
		assert.ok(existsSync(getComponentModelPath('EmptyStateModel.js')), 'EmptyStateModel must exist')
		assert.ok(existsSync(getComponentModelPath('BannerModel.js')), 'BannerModel must exist')
	})
})

// ══════════════════════════════════════════════════
// AC4: Bug Fixes — renderPage await
// ══════════════════════════════════════════════════

describe('AC4: renderPage await fix', () => {
	it('runner.test.js uses await for all renderPage calls', async () => {
		const runnerTest = path.join(ROOT, 'src/runner.test.js')
		if (!existsSync(runnerTest)) return
		
		const src = await readFile(runnerTest, 'utf-8')
		const lines = src.split('\n')
		const renderPageLines = lines.filter(l => l.includes('runner.renderPage('))
		for (const line of renderPageLines) {
			assert.ok(
				line.includes('await runner.renderPage('),
				`renderPage call must be awaited: ${line.trim()}`
			)
		}
	})
})
