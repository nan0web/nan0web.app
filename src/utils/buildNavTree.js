import Page from '../domain/Page.js'

/**
 * Automatically builds an OLMUI navigation tree by traversing the DB.
 * Used for Living Docs Engine to avoid manual pages.yaml configuration.
 * 
 * Supports both standard site format (index.md) and Git format (README.md)
 * via the `directoryIndex` option.
 * 
 * Metadata is extracted automatically by DB.fetch() from .md frontmatter:
 *   ---
 *   title: Getting Started
 *   order: 1
 *   icon: 🚀
 *   hidden: false
 *   layout: page
 *   ---
 * 
 * @param {import('@nan0web/db-fs').DBwithFSDriver} db 
 * @param {string} [rootPath='.'] 
 * @param {{ directoryIndex?: string }} [options={}]
 * @returns {Promise<Page[]>}
 */
export async function buildNavTree(db, rootPath = '.', options = {}) {
	const indexName = options.directoryIndex || 'index'
	const pages = []
	try {
		const entries = await db.listDir(rootPath)
		if (options.verbose) {
			console.debug(`buildNavTree(${rootPath}) found ${entries.length} entries. Meta keys: ${Array.from(db.meta.keys()).join(', ')}`)
		}
		for (const entry of entries) {
			const name = typeof entry === 'string' ? entry : entry.name
			if (name.startsWith('_') || name.startsWith('.')) continue
			// Skip api/ directory — handled by SSRServer API routes
			if (name === 'api' && rootPath === '.') continue

			const absPath = rootPath === '.' ? name : `${rootPath}/${name}`
			let stat
			try {
				stat = await db.stat(absPath)
			} catch {
				continue
			}

			// Parse Directory
			if (stat && stat.isDirectory) {
				const children = await buildNavTree(db, absPath, options)
				if (children.length > 0) {
					// Fetch directory index for metadata (title, icon, order)
					const indexUri = `${absPath}/${indexName}`
					const doc = await db.fetch(indexUri) ?? {}

					const title = doc.title || name.charAt(0).toUpperCase() + name.slice(1)
					
					pages.push(new Page({
						...doc,
						slug: name,
						title,
						source: indexUri,
						children,
						_order: doc.order ?? 999,
					}))
				}
			} 
			// Parse Files
			else {
				const extMatch = name.match(/\.(md|yaml|nan0)$/)
				if (extMatch) {
					const basename = name.slice(0, -extMatch[0].length)
					// Skip directory index files — handled by parent directory
					if ((basename === indexName) && rootPath !== '.') continue

					// Fetch document for metadata
					const docUri = absPath.slice(0, -extMatch[0].length)
					const doc = await db.fetch(docUri) ?? {}

					const title = doc.title 
						|| (basename === indexName
							? 'Home'
							: basename.charAt(0).toUpperCase() + basename.slice(1).replace(/-/g, ' '))
					const slug = basename === indexName ? '' : basename

					pages.push(new Page({
						...doc,
						slug,
						title,
						source: docUri,
						_order: doc.order ?? 999,
					}))
				}
			}
		}
	} catch (e) {
		// Ignore errors like dir not found
	}

	// Sort by order field, then alphabetically by title
	pages.sort((a, b) => {
		const orderA = a._order ?? 999
		const orderB = b._order ?? 999
		if (orderA !== orderB) return orderA - orderB
		return (a.title || '').localeCompare(b.title || '')
	})
	
	return pages
}

export default buildNavTree
