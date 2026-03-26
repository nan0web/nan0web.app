import { ContainerObject, resolveDefaults } from '@nan0web/types'

/**
 * @file Page Model — describes a page in the pages.yaml router.
 *
 * A Page captures the declarative description of a route.
 * Extends ContainerObject for recursive tree operations.
 */
export default class Page extends ContainerObject {
	/** @type {string} */

	static slug = {
		help: 'URL path segment',
		placeholder: 'cases',
		type: 'string',
		required: true,
		default: '',
	}
	static title = {
		help: 'Display title (i18n key or raw string)',
		placeholder: 'Court Cases',
		type: 'string',
		default: '',
	}
	static source = {
		help: 'Data binding key in Global State (e.g. "court.cases")',
		placeholder: 'court.cases',
		type: 'string',
		default: '',
	}
	static layout = {
		help: 'Rendering strategy',
		placeholder: 'page',
		type: 'enum',
		options: ['page', 'list', 'form', 'feed'],
		default: 'page',
	}
	static icon = {
		help: 'Optional icon identifier',
		placeholder: '⚖️',
		type: 'string',
		default: '',
	}
	static hidden = {
		help: 'Excluded from navigation',
		type: 'boolean',
		default: false,
	}
	static content = {
		help: 'Raw or Markdown content of the page',
		type: 'string',
		default: '',
	}
	static $content = {
		help: 'Parsed OLMUI renderable blocks',
		type: 'Array<any>',
		default: null,
		hidden: true,
	}

	/**
	 * @param {object} [input]
	 */
	constructor(input = {}) {
		super(input)
		resolveDefaults(Page, this)
		Object.assign(this, input)
	}

	/**
	 * Full path from root (recursively built by Router).
	 * @type {string}
	 */
	get path() {
		return '/' + this.slug
	}

	/**
	 * @param {object} input
	 * @returns {Page}
	 */
	static from(input) {
		if (input instanceof Page) return input
		if (typeof input !== 'object' || input === null) return new Page()

		// If input has children, ensure they are Page instances
		if (input.children && Array.isArray(input.children)) {
			input.children = input.children.map((c) => Page.from(c))
		}

		return new Page(input)
	}
}
