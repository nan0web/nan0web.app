import { describe, it, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fsNode from 'node:fs'
import { fileURLToPath } from 'node:url'
import FS from '@nan0web/db-fs'
import { NoConsole } from '@nan0web/log'
import { DatasetParser, DocsParser } from '@nan0web/test'
import { AppRunner } from './runner.js'

const fs = new FS()
let pkg

before(async () => {
	const doc = await fs.loadDocument('package.json', {})
	pkg = doc || {}
})

let console = new NoConsole()
beforeEach(() => {
	console = new NoConsole()
})

function testRender() {
	/**
	 * @docs
	 * # NaN•Web App (v0.1.0)
	 *
	 * <!-- %PACKAGE_STATUS% -->
	 *
	 * [🇺🇦 Українська](docs/uk/README.md)
	 *
	 * One algorithm — many interfaces. The core engine for the NaN•Web ecosystem.
	 *
	 * ### Key Features
	 * - **Security Hardening**: Standardizes `db.seal()` boot protocol to freeze mount registries.
	 * - **Clean API Separation**: Code is isolated in `src/server/api/`.
	 * - **Model-as-Schema**: Universal domain models from `@nan0web/ui`.
	 * - **SSR-First**: Server-Side Rendering capabilities out of the box.
	 *
	 * ## Installation
	 */
	it('How to install and run the engine?', () => {
		/**
		 * ```bash
		 * npm install nan0web.app
		 * npm run start -- --dsn data/
		 * ```
		 */
		assert.equal(pkg.name, 'nan0web.app')
	})

	/**
	 * @docs
	 * ## Usage
	 * ### Booting the Engine
	 */
	it('How to boot the AppRunner programmatically?', async () => {
		//import { AppRunner } from 'nan0web.app'
		
		const runner = new AppRunner({ dsn: 'data/', locale: 'uk' })
		const iterator = runner.run()
		const firstStep = await iterator.next()

		assert.ok(firstStep.value)
	})

	/**
	 * @docs
	 * ### Security Protocol (db.seal)
	 * Once the engine completes its boot phase, the registry is sealed.
	 */
	it('How does db.seal protect the registry?', async () => {
		//import { AppRunner } from 'nan0web.app'
		
		const runner = new AppRunner({ dsn: 'data/' })
		const it = runner.run()
		for (let i = 0; i < 5; i++) await it.next() 
		
		assert.equal(typeof runner.db.seal, 'function')
	})

	/**
	 * @docs
	 * ## Contributing
	 */
	it('How to participate? – [see CONTRIBUTING.md]($pkgURL/blob/main/CONTRIBUTING.md)', async () => {
		/** @docs */
		let text = await fs.loadDocument('CONTRIBUTING.md')
		if (text && typeof text === 'object' && text.content) text = text.content
		assert.ok(String(text).includes('# Contributing'))
	})

	/**
	 * @docs
	 * ## License
	 */
	it('ISC LICENSE – [see full text]($pkgURL/blob/main/LICENSE)', async () => {
		/** @docs */
		const text = await fs.loadDocument('LICENSE')
		assert.ok(String(text).includes('ISC'))
	})
}

describe('nan0web.app README.md generation suite', testRender)

describe('Rendering README.md', async () => {
	let text = ''
	const format = new Intl.NumberFormat('en-US').format
	const parser = new DocsParser()
	const sourceCode = fsNode.readFileSync(fileURLToPath(import.meta.url), 'utf-8')
	text = String(parser.decode(sourceCode))
	await fs.saveDocument('README.md', text)
	const dataset = DatasetParser.parse(text, pkg.name)
	await fs.saveDocument('.datasets/README.dataset.jsonl', dataset)

	it(`Document is rendered in README.md [${format(Buffer.byteLength(text))} bytes]`, async () => {
		let text = await fs.loadDocument('README.md')
		if (text && typeof text === 'object' && text.content) text = text.content
		assert.ok(String(text).includes('Sovereign OLMUI Runner') || String(text).includes('NaN•Web ecosystem'))
		assert.ok(String(text).includes('## License'))
	})
})
