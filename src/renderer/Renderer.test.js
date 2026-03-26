import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Renderer from './Renderer.js'
import Page from '../domain/Page.js'

describe('Renderer', () => {
	const mockState = {
		court: {
			cases: [
				{ id: 1, title: 'Case Alpha', status: 'open' },
				{ id: 2, title: 'Case Beta', status: 'closed' },
			],
		},
		home: {
			$content: [{ h1: 'Welcome to NaN0Web' }, { p: 'Sovereign Web Engine.' }],
		},
		profile: {
			schema: { name: { type: 'string' }, email: { type: 'string' } },
		},
		events: [
			{ type: 'mesh', data: 'hello' },
			{ type: 'system', data: 'world' },
		],
	}

	it('should render page layout with $content', () => {
		const renderer = new Renderer(mockState)
		const page = Page.from({ slug: 'home', title: 'Home', layout: 'page', source: 'home' })
		const blocks = renderer.render(page)
		assert.equal(blocks.length, 2)
		assert.deepEqual(blocks[0], { h1: 'Welcome to NaN0Web' })
	})

	it('should render page layout with title-only fallback', () => {
		const renderer = new Renderer(mockState)
		const page = Page.from({ slug: 'about', title: 'About Us', layout: 'page' })
		const blocks = renderer.render(page)
		assert.equal(blocks.length, 1)
		assert.deepEqual(blocks[0], { h1: 'About Us' })
	})

	it('should render list layout', () => {
		const renderer = new Renderer(mockState)
		const page = Page.from({
			slug: 'cases',
			title: 'Court Cases',
			layout: 'list',
			source: 'court.cases',
		})
		const blocks = renderer.render(page)
		assert.equal(blocks.length, 2)
		assert.equal(blocks[0].h1, 'Court Cases')
		assert.ok(blocks[1]['ui-list'])
		assert.equal(blocks[1].$count, 2)
	})

	it('should render form layout', () => {
		const renderer = new Renderer(mockState)
		const page = Page.from({
			slug: 'profile',
			title: 'Edit Profile',
			layout: 'form',
			source: 'profile.schema',
		})
		const blocks = renderer.render(page)
		assert.equal(blocks.length, 2)
		assert.equal(blocks[0].h1, 'Edit Profile')
		assert.ok(blocks[1]['ui-form'])
	})

	it('should render feed layout', () => {
		const renderer = new Renderer(mockState)
		const page = Page.from({
			slug: 'feed',
			title: 'Live Feed',
			layout: 'feed',
			source: 'events',
		})
		const blocks = renderer.render(page)
		assert.equal(blocks.length, 2)
		assert.equal(blocks[0].h1, 'Live Feed')
		assert.ok(blocks[1]['ui-feed'])
		assert.equal(blocks[1].$live, true)
		assert.equal(blocks[1].$entries.length, 2)
	})

	it('should handle list with no source', () => {
		const renderer = new Renderer(mockState)
		const page = Page.from({ slug: 'empty', title: 'Empty List', layout: 'list' })
		const blocks = renderer.render(page)
		assert.equal(blocks[1].$count, 0)
	})

	it('should support custom block registry', () => {
		const renderer = new Renderer(mockState)
		renderer.register('App.Auth.LogIn', (props) => ({
			'app-auth-login': true,
			$redirect: props.redirect || '/',
		}))

		const result = renderer.renderBlock('App.Auth.LogIn', { redirect: '/dashboard' })
		assert.ok(result)
		assert.equal(result.$redirect, '/dashboard')
	})

	it('should return null for unregistered block', () => {
		const renderer = new Renderer(mockState)
		assert.equal(renderer.renderBlock('App.Unknown.Component'), null)
	})
})
