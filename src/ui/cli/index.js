import { AppRunner } from '../../runner.js'

/**
 * NaN0Web CLI Page Renderer — renders all pages from data/ as text output.
 *
 * Boots the AppRunner, resolves all routes, and renders each page
 * as structured text blocks suitable for CLI display and snapshot capture.
 *
 * Usage:
 *   node src/ui/cli/index.js [--locale en|uk] [--page /path]
 *
 * If --page is specified, renders only that page.
 * Otherwise renders all pages for the given locale.
 */

/**
 * Render a single page's blocks as readable CLI text.
 * @param {object[]} blocks
 * @returns {string}
 */
function renderBlocks(blocks) {
	const lines = []
	for (const block of blocks) {
		if (block.h1) lines.push(`\n${'═'.repeat(60)}\n  ${block.h1}\n${'═'.repeat(60)}`)
		else if (block.h2) lines.push(`\n── ${block.h2} ${'─'.repeat(Math.max(0, 56 - block.h2.length))}`)
		else if (block.h3) lines.push(`\n   ${block.h3}`)
		else if (block.p) lines.push(`  ${block.p}`)
		else if (block.code) lines.push(`  $ ${block.code}`)
		else if (block.badge) lines.push(`  [${block.badge}]`)
		else if (block.error) lines.push(`  ⚠️ ${block.error}`)
		else if (block.items && Array.isArray(block.items)) {
			for (const item of block.items) {
				const icon = item.icon || '•'
				lines.push(`  ${icon} ${item.title || item.label || ''}`)
				if (item.description) lines.push(`    ${item.description}`)
			}
		} else if (block.cards && Array.isArray(block.cards)) {
			for (const card of block.cards) {
				lines.push(`  📦 ${card.title || ''}`)
				if (card.description) lines.push(`    ${card.description}`)
				if (card.status) lines.push(`    Status: ${card.status}`)
			}
		} else if (block.form) {
			lines.push(`  📝 Form: ${block.form.schema || 'unknown'}`)
			if (block.form.target) lines.push(`    → ${block.form.target}`)
		} else if (block.header) {
			lines.push(`  🏷️ ${block.header.brand || block.header.title || ''}`)
		} else if (block.hero) {
			if (block.hero.badge) lines.push(`  [${block.hero.badge}]`)
			lines.push(`  ${block.hero.title || ''}`)
			if (block.hero.subtitle) lines.push(`  ${block.hero.subtitle}`)
			if (block.hero.code || block.hero.install) lines.push(`  $ ${block.hero.code || block.hero.install}`)
		} else if (block.footer) {
			lines.push(`\n${'─'.repeat(60)}`)
			if (block.footer.license) lines.push(`  📜 ${block.footer.license}`)
		} else if (block.nav && Array.isArray(block.nav)) {
			lines.push('  Navigation:')
			for (const n of block.nav) {
				lines.push(`    → ${n.title || n.label}: ${n.href || ''}`)
			}
		} else {
			// Generic: render first string value
			const key = Object.keys(block)[0]
			if (key && typeof block[key] === 'string') {
				lines.push(`  ${block[key]}`)
			}
		}
	}
	return lines.join('\n')
}

/**
 * Boot the AppRunner and render pages.
 * @param {{ locale?: string, page?: string }} options
 * @returns {AsyncGenerator<string>}
 */
export async function *renderCli({ locale = 'en', page } = {}) {
	const runner = new AppRunner({ dsn: 'data/', locale })

	// Consume boot messages
	const bootLines = []
	for await (const msg of runner.run()) {
		bootLines.push(msg)
	}

	yield `NaN0Web CLI Renderer [${locale.toUpperCase()}]`
	yield `Routes: ${runner.router.size}`
	yield ''

	const paths = page ? [page] : runner.router.paths()

	for (const urlPath of paths) {
		const result = await runner.renderPage(urlPath)
		if (!result.page) {
			yield `404: ${urlPath}`
			continue
		}

		yield `━━━ ${result.page.title || urlPath} (${urlPath}) ━━━`
		yield renderBlocks(result.blocks)
		yield ''
	}
}

// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
	const args = process.argv.slice(2)
	const locale = args.includes('--locale') ? args[args.indexOf('--locale') + 1] : 'en'
	const page = args.includes('--page') ? args[args.indexOf('--page') + 1] : undefined

	const run = async () => {
		for await (const line of renderCli({ locale, page })) {
			console.log(line)
		}
	}
	run().catch(err => {
		console.error(err)
		process.exit(1)
	})
}
