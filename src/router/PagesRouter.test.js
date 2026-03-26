import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import PagesRouter from './PagesRouter.js'

describe('PagesRouter', () => {
	it('should load pages from state', () => {
		const router = new PagesRouter()
		router.load({
			pages: [
				{ slug: 'home', title: 'Home', layout: 'page' },
				{ slug: 'cases', title: 'Court Cases', layout: 'list', source: 'court.cases' },
			],
		})
		assert.equal(router.size, 2)
	})

	it('should resolve a page by path', () => {
		const router = new PagesRouter()
		router.load({
			pages: [
				{ slug: 'home', title: 'Home' },
				{ slug: 'deposits', title: 'Deposits', layout: 'list', source: 'deposits' },
			],
		})
		const page = router.resolve('/deposits')
		assert.ok(page)
		assert.equal(page.title, 'Deposits')
		assert.equal(page.layout, 'list')
		assert.equal(page.source, 'deposits')
	})

	it('should return null for unknown path', () => {
		const router = new PagesRouter()
		router.load({ pages: [{ slug: 'home', title: 'Home' }] })
		assert.equal(router.resolve('/unknown'), null)
	})

	it('should handle nested routes', () => {
		const router = new PagesRouter()
		router.load({
			pages: [
				{
					slug: 'admin',
					title: 'Admin',
					children: [
						{ slug: 'users', title: 'Users', layout: 'list', source: 'admin.users' },
						{ slug: 'settings', title: 'Settings', layout: 'form', source: 'admin.settings' },
					],
				},
			],
		})
		assert.equal(router.size, 3) // admin + users + settings

		const usersPage = router.resolve('/admin/users')
		assert.ok(usersPage)
		assert.equal(usersPage.title, 'Users')
	})

	it('should match with breadcrumbs', () => {
		const router = new PagesRouter()
		router.load({
			pages: [
				{
					slug: 'admin',
					title: 'Admin Panel',
					children: [{ slug: 'users', title: 'Users Management' }],
				},
			],
		})
		const { page, breadcrumbs } = router.match('/admin/users')
		assert.ok(page)
		assert.equal(page.title, 'Users Management')
		assert.equal(breadcrumbs.length, 2)
		assert.equal(breadcrumbs[0].title, 'Admin Panel')
		assert.equal(breadcrumbs[1].title, 'Users Management')
	})

	it('should generate navigation (hiding hidden pages)', () => {
		const router = new PagesRouter()
		router.load({
			pages: [
				{ slug: 'home', title: 'Home', icon: '🏠' },
				{ slug: 'api', title: 'API', hidden: true },
				{ slug: 'about', title: 'About', icon: 'ℹ️' },
			],
		})
		const nav = router.navigation()
		assert.equal(nav.length, 2)
		assert.equal(nav[0].title, 'Home')
		assert.equal(nav[0].icon, '🏠')
		assert.equal(nav[1].title, 'About')
	})

	it('should handle empty state gracefully', () => {
		const router = new PagesRouter()
		router.load({})
		assert.equal(router.size, 0)
		assert.equal(router.resolve('/anything'), null)
		assert.deepEqual(router.navigation(), [])
	})
})
