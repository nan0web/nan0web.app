import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { AppRunner } from '../../src/runner.js'

const SNAPSHOT_DIR = path.join(process.cwd(), 'snapshots', 'cli')
const LOCALES = ['en', 'uk']

/**
 * Render blocks to clean CLI text (no ANSI, no HTML).
 * @param {object[]} blocks
 * @returns {string}
 */
function renderBlocks(blocks) {
	const lines = []
	for (const block of blocks) {
		const keys = Object.keys(block)
		for (const key of keys) {
			const val = block[key]
			if (key === 'h1') lines.push(`\n${'═'.repeat(60)}\n  ${val}\n${'═'.repeat(60)}`)
			else if (key === 'h2') lines.push(`\n── ${val} ${'─'.repeat(Math.max(0, 56 - val.length))}`)
			else if (key === 'h3') lines.push(`\n   ${val}`)
			else if (key === 'p') lines.push(`  ${stripHtml(val)}`)
			else if (key === 'code') lines.push(`  $ ${val}`)
			else if (key === 'badge') lines.push(`  [${val}]`)
			else if (key === 'error') lines.push(`  ⚠️ ${val}`)
			else if (key === 'html') lines.push(`  ${stripHtml(val)}`)
			else if (key === 'items' && Array.isArray(val)) {
				for (const item of val) {
					const icon = item.icon || '•'
					lines.push(`  ${icon} ${item.title || item.label || ''}`)
					if (item.description) lines.push(`    ${item.description}`)
				}
			} else if (key === 'cards' && Array.isArray(val)) {
				for (const card of val) {
					lines.push(`  📦 ${card.title || ''}`)
					if (card.description) lines.push(`    ${card.description}`)
					if (card.status) lines.push(`    Status: ${card.status}`)
				}
			} else if (typeof val === 'string') {
				lines.push(`  ${stripHtml(val)}`)
			}
		}
	}
	return lines.join('\n')
}

/** Strip HTML tags from a string */
function stripHtml(str) {
	return str.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim()
}

describe('NaN0Web CLI Page Snapshots', () => {
	/** @type {Map<string, AppRunner>} locale → runner */
	const runners = new Map()

	before(async () => {
		if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR, { recursive: true })

		for (const locale of LOCALES) {
			const runner = new AppRunner({ dsn: 'data/', locale })
			for await (const msg of runner.run()) { /* consume boot messages */ }
			runners.set(locale, runner)
		}
	})

	for (const locale of LOCALES) {
		describe(`Locale: ${locale.toUpperCase()}`, () => {
			it(`should boot runner for ${locale}`, () => {
				const runner = runners.get(locale)
				assert.ok(runner, `Runner for ${locale} must be initialized`)
				assert.ok(runner.router.size > 0, `Router for ${locale} must have routes`)
			})

			it(`should render all pages for ${locale}`, async () => {
				const runner = runners.get(locale)
				const paths = runner.router.paths()
				assert.ok(paths.length > 0, `Must have at least one route for ${locale}`)

				const output = []
				output.push(`NaN0Web CLI — ${locale.toUpperCase()} Pages`)
				output.push(`${'━'.repeat(60)}`)
				output.push(`Routes: ${paths.length}`)
				output.push('')

				for (const urlPath of paths) {
					const result = await runner.renderPage(urlPath)
					output.push(`┌─ ${result.page?.title || urlPath} (${urlPath})`)
					output.push(`│  Layout: ${result.page?.layout || 'unknown'}`)

					if (result.blocks.length > 0) {
						const rendered = renderBlocks(result.blocks)
						const blockLines = rendered.split('\n').filter(l => l.trim())
						for (const line of blockLines) {
							output.push(`│  ${line}`)
						}
					}

					output.push(`└─ Blocks: ${result.blocks.length}`)
					output.push('')
				}

				// Write snapshot
				const filename = `pages_${locale}.txt`
				const filepath = path.join(SNAPSHOT_DIR, filename)
				fs.writeFileSync(filepath, output.join('\n'), 'utf8')

				// Verify snapshot written
				assert.ok(fs.existsSync(filepath), `Snapshot ${filename} must exist`)
				const content = fs.readFileSync(filepath, 'utf8')
				assert.ok(content.includes('NaN0Web CLI'), 'Snapshot must have header')
				assert.ok(content.length > 100, 'Snapshot must have meaningful content')
			})

			it(`should render index page for ${locale}`, async () => {
				const runner = runners.get(locale)
				// Try locale-specific index first, then root
				const result = await runner.renderPage(`/${locale}`)
				assert.ok(result.page || result.blocks.length > 0, `Index page for /${locale} must render`)

				const filename = `index_${locale}.txt`
				const filepath = path.join(SNAPSHOT_DIR, filename)
				const output = []
				output.push(`NaN0Web — ${locale.toUpperCase()} Index`)
				output.push(`${'━'.repeat(60)}`)
				output.push(renderBlocks(result.blocks))
				fs.writeFileSync(filepath, output.join('\n'), 'utf8')
			})
		})
	}

	it('should generate gallery index at snapshots/index.md', () => {
		const lines = []
		lines.push('# NaN0Web CLI Gallery — Snapshot Index')
		lines.push('')
		lines.push('> Auto-generated from `npm run test:play`')
		lines.push('')

		for (const locale of LOCALES) {
			const flag = locale === 'uk' ? '🇺🇦' : '🇬🇧'
			lines.push(`## ${flag} ${locale.toUpperCase()} Language`)
			lines.push('')

			// List all snapshot files for this locale
			const files = fs.readdirSync(SNAPSHOT_DIR)
				.filter(f => f.includes(`_${locale}`) && f.endsWith('.txt'))
				.sort()

			for (const file of files) {
				const content = fs.readFileSync(path.join(SNAPSHOT_DIR, file), 'utf8')
				const lineCount = content.split('\n').length
				lines.push(`- [📄 **${file}**](cli/${file}) — ${lineCount} lines`)
			}
			lines.push('')
		}

		// Also list non-locale files (config_wizard etc.)
		const otherFiles = fs.readdirSync(SNAPSHOT_DIR)
			.filter(f => f.endsWith('.txt') && !LOCALES.some(l => f.includes(`_${l}`)))
			.sort()

		if (otherFiles.length > 0) {
			lines.push('## 🔧 Other Snapshots')
			lines.push('')
			for (const file of otherFiles) {
				lines.push(`- [📄 **${file}**](cli/${file})`)
			}
			lines.push('')
		}

		// Web snapshots
		const webDir = path.join(process.cwd(), 'snapshots', 'web')
		if (fs.existsSync(webDir)) {
			const webFiles = fs.readdirSync(webDir).filter(f => f.endsWith('.png')).sort()
			if (webFiles.length > 0) {
				lines.push('## 🌐 Web Snapshots')
				lines.push('')
				for (const file of webFiles) {
					lines.push(`- [🖼️ **${file}**](web/${file})`)
				}
				lines.push('')
			}
		}

		const indexPath = path.join(process.cwd(), 'snapshots', 'index.md')
		fs.writeFileSync(indexPath, lines.join('\n'), 'utf8')
		assert.ok(fs.existsSync(indexPath), 'snapshots/index.md must be generated')
	})
})
