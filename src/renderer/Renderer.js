/**
 * @file Renderer — Universal OLMUI block renderer.
 *
 * Takes a Page (with layout + source) and the Global State,
 * resolves data bindings, and yields renderable blocks.
 *
 * This renderer is DOMAIN-AGNOSTIC — it does not know what
 * "court cases" or "deposits" are. It only knows layout types:
 *   - page   → render $content blocks (Document pattern)
 *   - list   → resolve source → yield items as cards
 *   - form   → resolve source schema → yield form fields
 *   - feed   → resolve source → yield live feed entries
 *
 * Architecture:
 *   Page { layout: 'list', source: 'court.cases' }
 *     + State { court: { cases: [...] } }
 *     = Renderable[] (array of blocks for any UI adapter)
 */

import { Markdown } from '@nan0web/markdown'

/**
 * Resolve a dot-separated path in the data object.
 * Example: resolveData({ court: { cases: [...] } }, 'court.cases') → [...]
 *
 * @param {object} data
 * @param {string} path
 * @returns {any}
 */
function resolveData(data, path) {
	if (!path || !data) return undefined
	const segments = path.split('.')
	let current = data
	for (const seg of segments) {
		if (current == null || typeof current !== 'object') return undefined
		current = current[seg]
	}
	return current
}
export default class Renderer {
	/** @type {object} */
	state = {}
	/** @type {Map<string, Function>} */
	#registry = new Map()

	/**
	 * @param {object} state - Global State from AppRunner.
	 */
	constructor(state = {}) {
		this.state = state
	}

	/**
	 * Register a custom App-component renderer.
	 * Used by micro-apps: renderer.register('App.Auth.LogIn', renderLoginFn)
	 *
	 * @param {string} type - Block type identifier.
	 * @param {Function} handler - Render function (props, ctx) => Renderable.
	 */
	register(type, handler) {
		this.#registry.set(type, handler)
	}

	/**
	 * Render a page given its layout and source binding.
	 *
	 * @param {import('../domain/Page.js').default} page
	 * @returns {Array<object>} - Renderable blocks for UI adapters.
	 */
	render(page) {
		const ctx = {
			data: this.state,
			actions: this.state._actions || {},
			functions: this.state._functions || {},
		}

		switch (page.layout) {
			case 'page':
				return this.#renderPage(page, ctx)
			case 'list':
				return this.#renderList(page, ctx)
			case 'form':
				return this.#renderForm(page, ctx)
			case 'feed':
				return this.#renderFeed(page, ctx)
			default:
				return this.#renderPage(page, ctx)
		}
	}

	/**
	 * Render a custom block type via registry.
	 *
	 * @param {string} type - e.g. 'App.Auth.LogIn'
	 * @param {object} props
	 * @returns {object | null}
	 */
	renderBlock(type, props = {}) {
		const handler = this.#registry.get(type)
		if (!handler) return null
		const ctx = {
			data: this.state,
			actions: this.state._actions || {},
			functions: this.state._functions || {},
		}
		return handler(props, ctx)
	}

	/**
	 * Renders raw markdown string to an OLMUI HTML block using built-in markdown parser.
	 * Extracts `<nan0-sandbox>` tags into structured blocks for true Cross-UI support.
	 *
	 * @param {string} text
	 * @returns {Array<object>}
	 */
	#renderMarkdown(text) {
		const blocks = []
		const md = new Markdown()

		// Strip frontmatter if present (---\n...\n---)
		let content = text
		const fmMatch = text.match(/^---\n[\s\S]+?\n---\n?([\s\S]*)$/)
		if (fmMatch) {
			content = fmMatch[1]
		}
		
		// Split markdown text around <nan0-sandbox> tags
		const parts = content.split(/(<nan0-sandbox[^>]*>.*?<\/nan0-sandbox>|<nan0-sandbox[^>]*\/>)/si)
		
		for (const part of parts) {
			if (!part || !part.trim()) continue
			
			if (part.startsWith('<nan0-sandbox')) {
				const src = part.match(/src="([^"]+)"/)?.[1]
				const url = part.match(/url="([^"]+)"/)?.[1]
				const ui = part.match(/ui="([^"]+)"/)?.[1]
				
				blocks.push({
					'nan0-sandbox': true,
					src,
					url,
					ui,
				})
			} else {
				md.parse(part)
				blocks.push({ 'ui-html': md.stringify() })
			}
		}
		
		return blocks
	}

	/**
	 * Page layout — renders $content blocks from the state or inline content.
	 * Maps to ui-core/Document pattern.
	 *
	 * @param {import('../domain/Page.js').default} page
	 * @param {object} ctx
	 * @returns {Array<object>}
	 */
	#renderPage(page, ctx) {
		// 1. Inline parsed blocks from page settings
		if (Array.isArray(page.$content)) return page.$content
		if (Array.isArray(page.content)) return page.content
		if (typeof page.content === 'string' && page.content.trim()) return this.#renderMarkdown(page.content)

		// 2. Fetch from external Document source
		if (page.source) {
			const doc = resolveData(this.state, page.source)
			if (doc && Array.isArray(doc.$content)) return doc.$content
			if (doc && typeof doc.content === 'string' && doc.content.trim()) return this.#renderMarkdown(doc.content)

			if (doc && typeof doc === 'object') {
				return [{ section: true, data: doc }]
			}
		}

		// 3. Fallback
		return [{ h1: page.title }]
	}

	/**
	 * List layout — resolves source to an array, yields as item cards.
	 *
	 * @param {import('../domain/Page.js').default} page
	 * @param {object} ctx
	 * @returns {Array<object>}
	 */
	#renderList(page, ctx) {
		const items = page.source ? resolveData(this.state, page.source) : []

		if (!Array.isArray(items)) {
			return [{ h1: page.title }, { p: 'No items found.' }]
		}

		return [
			{ h1: page.title, $class: 'list-header' },
			{
				'ui-list': true,
				$source: page.source,
				$items: items,
				$count: items.length,
			},
		]
	}

	/**
	 * Form layout — resolves source schema and yields form fields.
	 *
	 * @param {import('../domain/Page.js').default} page
	 * @param {object} ctx
	 * @returns {Array<object>}
	 */
	#renderForm(page, ctx) {
		const schema = page.source ? resolveData(this.state, page.source) : {}

		return [
			{ h1: page.title, $class: 'form-header' },
			{
				'ui-form': true,
				$source: page.source,
				$schema: schema || {},
			},
		]
	}

	/**
	 * Feed layout — resolves source to a live-update stream feed.
	 *
	 * @param {import('../domain/Page.js').default} page
	 * @param {object} ctx
	 * @returns {Array<object>}
	 */
	#renderFeed(page, ctx) {
		const entries = page.source ? resolveData(this.state, page.source) : []

		return [
			{ h1: page.title, $class: 'feed-header' },
			{
				'ui-feed': true,
				$source: page.source,
				$entries: Array.isArray(entries) ? entries : [],
				$live: true,
			},
		]
	}
}
