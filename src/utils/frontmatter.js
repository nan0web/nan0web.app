/**
 * @file frontmatter.js — Universal Frontmatter Extractor.
 *
 * Extracts `---` delimited frontmatter from Markdown files.
 * Tries NaN0 parse first (faster, supports both formats),
 * then falls back to YAML parse.
 *
 * Standard format:
 *   ---
 *   title: Getting Started
 *   order: 1
 *   icon: 🚀
 *   ---
 *   # Content here...
 */

const FRONTMATTER_RE = /^---\n([\s\S]+?)\n---\n?([\s\S]*)$/

/**
 * Extract frontmatter and body from a markdown string.
 * Tries NaN0 parse first, then YAML fallback.
 *
 * @param {string} raw - Raw file content (markdown with optional frontmatter).
 * @returns {{ meta: object, body: string }}
 */
export async function extractFrontmatter(raw) {
	if (!raw || typeof raw !== 'string') {
		return { meta: {}, body: raw || '' }
	}

	const match = raw.match(FRONTMATTER_RE)
	if (!match) {
		return { meta: {}, body: raw }
	}

	const [, fmBlock, body] = match
	let meta = {}

	// Strategy: try NaN0 first (fast, universal), fallback to YAML
	try {
		// Dynamic import to avoid hard dependency
		const { default: NaN0 } = await importNaN0()
		meta = NaN0.parse(fmBlock)
	} catch {
		try {
			const yaml = await importYaml()
			meta = yaml.parse(fmBlock)
		} catch {
			// If both fail, treat entire content as body
			return { meta: {}, body: raw }
		}
	}

	return { meta: meta || {}, body: body || '' }
}

/**
 * Synchronous version using simple YAML-like key:value parser.
 * Does NOT require external dependencies — perfect for buildNavTree.
 *
 * Handles:
 *   title: Some Title
 *   order: 3
 *   icon: 🔧
 *   hidden: true
 *   layout: list
 *
 * @param {string} raw
 * @returns {{ meta: object, body: string }}
 */
export function extractFrontmatterSync(raw) {
	if (!raw || typeof raw !== 'string') {
		return { meta: {}, body: raw || '' }
	}

	const match = raw.match(FRONTMATTER_RE)
	if (!match) {
		return { meta: {}, body: raw }
	}

	const [, fmBlock, body] = match
	const meta = {}

	// Simple line-by-line key:value parser (covers 95% of use cases)
	for (const line of fmBlock.split('\n')) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith('#')) continue

		const colonIdx = trimmed.indexOf(':')
		if (colonIdx === -1) continue

		const key = trimmed.slice(0, colonIdx).trim()
		let value = trimmed.slice(colonIdx + 1).trim()

		// Type inference
		if (value === 'true') value = true
		else if (value === 'false') value = false
		else if (value === 'null') value = null
		else if (/^\d+$/.test(value)) value = parseInt(value, 10)
		else if (/^\d+\.\d+$/.test(value)) value = parseFloat(value)
		// Strip quotes
		else if ((value.startsWith('"') && value.endsWith('"')) ||
				 (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1)
		}

		meta[key] = value
	}

	return { meta, body: body || '' }
}

/** @returns {Promise<any>} */
async function importNaN0() {
	return import('@nan0web/types')
}

/** @returns {Promise<any>} */
async function importYaml() {
	return import('yaml')
}

export default extractFrontmatter
