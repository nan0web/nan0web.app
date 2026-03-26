import Page from '../domain/Page.js'

/**
 * @file PagesRouter — automatic routing from pages.yaml.
 *
 * Loads `pages.yaml` (or `pages` key from Global State) and builds
 * a navigation tree of Page models. Resolves URLs to pages.
 *
 * Architecture:
 *   pages.yaml → PagesRouter.load(state) → Page[] tree
 *   URL slug   → PagesRouter.resolve('/deposits') → Page { layout: 'list', source: 'deposits' }
 *   Pages      → PagesRouter.navigation() → Navigation-ready tree (for ui-core/Navigation)
 */
export default class PagesRouter {
	/** @type {Page[]} */
	pages = []

	/** @type {Map<string, Page>} */
	#index = new Map()

	/**
	 * Load pages from Global State.
	 *
	 * Expects state.pages to be an array of page descriptors:
	 *   - { slug: 'home', title: 'Home', layout: 'page' }
	 *   - { slug: 'cases', title: 'Court Cases', layout: 'list', source: 'court.cases' }
	 *
	 * @param {object} state - Global State built by AppRunner.
	 * @returns {PagesRouter}
	 */
	load(state) {
		const raw = state?.pages || []
		this.pages = raw.map((p) => Page.from(p))
		this.#buildIndex(this.pages, '')
		return this
	}

	/**
	 * Hot-reload pages from a new state.
	 * @param {object} newState 
	 * @returns {PagesRouter}
	 */
	reload(newState) {
		this.#index.clear()
		return this.load(newState)
	}

	/**
	 * Resolve a URL path to a Page.
	 * Supports nested paths like '/admin/users'.
	 *
	 * @param {string} path - URL path (e.g. '/cases', '/admin/users').
	 * @returns {Page | null}
	 */
	resolve(path) {
		const normalized = path.startsWith('/') ? path.slice(1) : path
		return this.#index.get(normalized) || null
	}

	/**
	 * Get the active page and its breadcrumb chain.
	 *
	 * @param {string} path
	 * @returns {{ page: Page | null, breadcrumbs: Page[] }}
	 */
	match(path) {
		const page = this.resolve(path)
		if (!page) return { page: null, breadcrumbs: [] }

		const segments = (path.startsWith('/') ? path.slice(1) : path).split('/')
		const breadcrumbs = []
		let accumulated = ''
		for (const seg of segments) {
			accumulated = accumulated ? accumulated + '/' + seg : seg
			const crumb = this.#index.get(accumulated)
			if (crumb) breadcrumbs.push(crumb)
		}
		return { page, breadcrumbs }
	}

	/**
	 * Export navigation-ready structure (for ui-core/Navigation).
	 * Filters out hidden pages.
	 *
	 * @returns {Array<{ href: string, title: string, icon: string, children: any[] }>}
	 */
	navigation() {
		return this.#toNav(this.pages)
	}

	/**
	 * Total number of registered routes (flat).
	 * @returns {number}
	 */
	get size() {
		return this.#index.size
	}

	/**
	 * Returns flat list of all registered paths. Useful for Static Export (SSG).
	 * @returns {string[]}
	 */
	paths() {
		return Array.from(this.#index.keys()).map((k) => '/' + k).map((p) => p.replace('//', '/'))
	}

	/**
	 * Build flat index for fast lookup.
	 * @param {Page[]} pages
	 * @param {string} prefix
	 */
	#buildIndex(pages, prefix) {
		for (const page of pages) {
			const fullPath = prefix ? prefix + '/' + page.slug : page.slug
			this.#index.set(fullPath, page)
			if (page.children.length) {
				this.#buildIndex(page.children, fullPath)
			}
		}
	}

	/**
	 * Convert pages to navigation tree, filtering hidden entries.
	 * @param {Page[]} pages
	 * @returns {Array<{ href: string, title: string, icon: string, children: any[] }>}
	 */
	#toNav(pages) {
		return pages
			.filter((p) => !p.hidden)
			.map((p) => ({
				href: p.path,
				title: p.title,
				icon: p.icon,
				children: p.children.length ? this.#toNav(p.children) : [],
			}))
	}
}
