/**
 * Built-in locale registry.
 * Provides metadata for supported languages.
 * @type {Record<string, { id: string, title: string, dir: 'ltr' | 'rtl' }>}
 */
export const LOCALE_REGISTRY = {
	en: { id: 'en', title: 'English', dir: 'ltr' },
	uk: { id: 'uk', title: 'Українська', dir: 'ltr' },
	es: { id: 'es', title: 'Español', dir: 'ltr' },
	fr: { id: 'fr', title: 'Français', dir: 'ltr' },
	de: { id: 'de', title: 'Deutsch', dir: 'ltr' },
	it: { id: 'it', title: 'Italiano', dir: 'ltr' },
	pl: { id: 'pl', title: 'Polski', dir: 'ltr' },
	nl: { id: 'nl', title: 'Nederlands', dir: 'ltr' },
	pt: { id: 'pt', title: 'Português', dir: 'ltr' },
	ar: { id: 'ar', title: 'العربية', dir: 'rtl' },
	he: { id: 'he', title: 'עברית', dir: 'rtl' },
	ja: { id: 'ja', title: '日本語', dir: 'ltr' },
	zh: { id: 'zh', title: '中文', dir: 'ltr' },
}

/**
 * Detects available structured locales from the DB by scanning the root directory for ISO format folders.
 * 
 * @param {import('@nan0web/db').default} db
 * @returns {Promise<Record<string, any>>} detected locales object map
 */
export async function detectLocales(db) {
	const result = {}
	
	try {
		const entries = await db.listDir('.')
		for (const name of entries) {
			if (name.length === 2 && LOCALE_REGISTRY[name]) {
				const stat = await db.stat(name)
				if (stat && stat.isDirectory) {
					result[name] = { ...LOCALE_REGISTRY[name] }
				}
			}
		}
	} catch (err) {
		// If DB doesn't support listDir or is empty, return empty map
	}
	
	return result
}
