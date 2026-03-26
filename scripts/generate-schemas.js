import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as models from '../src/domain/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../schemas')

/**
 * Schema Generator v2 — Model-as-Schema → JSON Schema (draft-07)
 *
 * Features:
 *   - Alias support (meta.alias → schema property key)
 *   - Recursive generation for nested models (meta.hint)
 *   - File hierarchy preservation (domain/HR/Person.js → schemas/HR/Person.schema.json)
 *   - Array items with $ref to nested model schemas
 *   - Direct $ref for single nested object models
 */

/** @type {Map<string, { ModelClass: Function, relativePath: string }>} */
const queue = new Map()

/** @type {Set<string>} */
const generated = new Set()

/**
 * Enqueue a model for schema generation.
 * @param {string} name
 * @param {Function} ModelClass
 * @param {string} [relativePath] - relative path from domain/ (e.g. 'HR/PersonModel')
 */
function enqueue(name, ModelClass, relativePath = '') {
	if (queue.has(name)) return
	queue.set(name, { ModelClass, relativePath })
}

/**
 * Resolve the schema file path (relative) for a given model name.
 * @param {string} name
 * @returns {string}
 */
function schemaPath(name) {
	const entry = queue.get(name)
	if (!entry) return `${name}.schema.json`

	if (entry.ModelClass && entry.ModelClass.$id) {
		return `${entry.ModelClass.$id}.schema.json`
	}
	if (entry.relativePath) {
		return `${entry.relativePath}.schema.json`
	}
	return `${name}.schema.json`
}

/**
 * Convert a Model-as-Schema class to JSON Schema.
 * Automatically enqueues nested models found via meta.hint.
 *
 * @param {Function} ModelClass
 * @returns {object} JSON Schema
 */
function modelToJsonSchema(ModelClass) {
	const schema = {
		$schema: 'http://json-schema.org/draft-07/schema#',
		title: ModelClass.name,
		type: 'object',
		properties: {},
		additionalProperties: true,
	}

	const requiredFields = []

	for (const key of Object.getOwnPropertyNames(ModelClass)) {
		if (['length', 'name', 'prototype'].includes(key)) continue

		const meta = ModelClass[key]
		if (!meta || typeof meta !== 'object' || meta.hidden) continue

		const propKey = meta.alias || key
		const propSchema = {}

		// 1. Explicit type mapping
		if (meta.type === 'string') {
			propSchema.type = 'string'
		} else if (meta.type === 'number') {
			propSchema.type = 'number'
		} else if (meta.type === 'boolean') {
			propSchema.type = 'boolean'
		} else if (meta.type === 'enum' && meta.options) {
			propSchema.type = 'string'
			propSchema.enum = meta.options
		}
		// 2. Array of models (e.g. type: 'AppEntryConfig[]')
		else if (String(meta.type).endsWith('[]')) {
			propSchema.type = 'array'
			const itemType = meta.type.replace('[]', '')

			// Auto-enqueue nested model via hint
			if (meta.hint && typeof meta.hint === 'function') {
				enqueue(itemType, meta.hint)
				propSchema.items = { $ref: schemaPath(itemType) }
			} else if (models[itemType]) {
				enqueue(itemType, models[itemType])
				propSchema.items = { $ref: schemaPath(itemType) }
			} else {
				propSchema.items = { type: 'string' }
			}
		}
		// 3. Single nested model (e.g. type: 'PersonModel')
		else if (meta.hint && typeof meta.hint === 'function') {
			const nestedName = meta.hint.name || meta.type
			enqueue(nestedName, meta.hint)
			propSchema.$ref = schemaPath(nestedName)
		} else if (meta.type && models[meta.type]) {
			enqueue(meta.type, models[meta.type])
			propSchema.$ref = schemaPath(meta.type)
		}
		// 4. Infer from default
		else if (meta.default !== undefined) {
			propSchema.type = typeof meta.default
		} else {
			propSchema.type = 'string'
		}

		if (meta.help) propSchema.description = meta.help
		if (meta.default !== undefined) propSchema.default = meta.default

		schema.properties[propKey] = propSchema

		if (meta.required) {
			requiredFields.push(propKey)
		}
	}

	if (requiredFields.length > 0) {
		schema.required = requiredFields
	}

	return schema
}

async function main() {
	await fs.mkdir(outDir, { recursive: true })

	// Seed: enqueue all exported models from domain/index.js
	for (const [name, Model] of Object.entries(models)) {
		if (typeof Model !== 'function') continue
		enqueue(name, Model)
	}

	// Process queue (may grow as nested models are discovered)
	let count = 0
	while (generated.size < queue.size) {
		for (const [name, entry] of queue) {
			if (generated.has(name)) continue
			generated.add(name)

			const schema = modelToJsonSchema(entry.ModelClass)
			const finalPath = schemaPath(name)
			const filePath = path.join(outDir, finalPath)

			await fs.mkdir(path.dirname(filePath), { recursive: true })
			await fs.writeFile(filePath, JSON.stringify(schema, null, '\t'))
			console.log(`✅ ${path.relative(process.cwd(), filePath)}`)
			count++
		}
	}

	console.log(`\n🏗 Згенеровано ${count} схем у ${path.relative(process.cwd(), outDir)}/`)
}

main().catch((err) => {
	console.error('❌ Помилка генерації схем:', err)
	process.exit(1)
})
