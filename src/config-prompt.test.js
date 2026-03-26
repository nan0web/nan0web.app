import test, { describe, it } from 'node:test'
import assert from 'node:assert'
import { NaN0WebConfig } from './domain/index.js'
import { Form } from '@nan0web/ui-cli'

describe('Config Prompt (Wizard)', () => {
	it('should correctly initialize Form from NaN0WebConfig schema', () => {
		const form = Form.createFromBodySchema(NaN0WebConfig)
		
		// fields is a public getter in the new Form implementation
		const keys = form.fields.map(f => f.name)
		assert.ok(keys.includes('name'), 'Form should include "name" (aliased from appName)')
		assert.ok(keys.includes('dsn'), 'Form should include "dsn"')
		assert.ok(keys.includes('locale'), 'Form should include "locale"')
		assert.ok(keys.includes('port'), 'Form should include "port"')
	})

	it('should provide default values in the form fields', () => {
		const form = Form.createFromBodySchema(NaN0WebConfig)
		// body is the model instance in Form
		assert.equal(form.body.dsn, 'data/')
		assert.equal(form.body.port, 3000)
		assert.equal(form.body.locale, 'en')
	})
})
