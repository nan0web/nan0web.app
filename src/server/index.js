import path from 'node:path'
import { readFileSync } from 'node:fs'
import { createServer } from '@nan0web/http-node'
import { WebSocketBridge } from '../bridge/WebSocketBridge.js'

/**
 * @file Server-Side Rendering (SSR) & HTTP/HTTPS Server for NaN0Web App Engine.
 * Built on top of @nan0web/http-node. Supports TLS via config.ssl.
 */
export class SSRServer {
	/**
	 * @param {import('../runner.js').AppRunner} runner 
	 */
	constructor(runner) {
		this.runner = runner
		this.bridge = new WebSocketBridge(runner)
		
		// Resolve SSL options if configured
		const sslConfig = runner.config?.ssl || null
		/** @type {object | undefined} */
		this.sslOptions = undefined
		
		if (sslConfig && sslConfig.cert && sslConfig.key) {
			this.sslOptions = {
				cert: readFileSync(sslConfig.cert),
				key: readFileSync(sslConfig.key),
			}
		}

		this.app = createServer(this.sslOptions ? { ssl: this.sslOptions } : {})

		// API Routes: /api/* -> data/api/*.js
		this.app.use(async (req, res, next) => {
			const rawPath = req.pathname || req.url.split('?')[0]
			if (!rawPath.startsWith('/api')) {
				return next()
			}
			
			const apiPath = rawPath.replace('/api', '')
			const safePath = apiPath === '' || apiPath === '/' ? '/index' : apiPath
			
			// Phase 6: Move API from content (data/) to code (src/server/api)
			const fullPath = path.resolve(import.meta.dirname, 'api', `.${safePath}.js`)

			try {
				// Dynamically import the endpoint module
				const endpoint = await import(fullPath)
				const method = req.method.toUpperCase()
				
				// Priority: export const GET = ... -> export default function
				const handler = endpoint[method] || endpoint.default || endpoint[req.method.toLowerCase()]
				
				if (typeof handler === 'function') {
					await handler(req, res)
					return
				}
				
				res.statusCode = 405
				res.json({ error: `Method ${method} Not Allowed on this endpoint.` })
			} catch (e) {
				if (e.code === 'ERR_MODULE_NOT_FOUND') {
					res.statusCode = 404
					res.json({ error: 'API Endpoint not found.' })
				} else {
					console.error('[API Error]', e)
					res.statusCode = 500
					res.json({ error: 'Internal Server Error' })
				}
			}
		})

		// Catch-all route for SSR pages
		this.app.get('/*', async (req, res) => {
			const path = req.pathname || req.url.split('?')[0]
			const { page, blocks, breadcrumbs } = await this.runner.renderPage(path)

			const title = page ? page.title : '404 - Not Found'
			const html = this.#renderHTML(title, blocks, breadcrumbs)

			if (!page) res.statusCode = 404
			
			res.setHeader('Content-Type', 'text/html; charset=utf-8')
			res.end(html)
		})
	}

	/**
	 * Start the HTTP/HTTPS server.
	 * @param {number} [port=3000] 
	 * @returns {Promise<{ port: number, protocol: string }>}
	 */
	async listen(port = 3000) {
		this.app.port = port
		await this.app.listen()
		
		// Attach real-time bridge (Phase 4)
		if (this.app.server) {
			this.bridge.attach(this.app.server)
		}

		const protocol = this.sslOptions ? 'https' : 'http'
		return { port: this.app.port, protocol }
	}

	/**
	 * Export all registered paths as static HTML files to outDir (SSG).
	 * @param {string} outDir 
	 */
	async exportStatic(outDir = 'dist') {
		const fs = await import('node:fs/promises')
		const paths = this.runner.router.paths()

		await fs.mkdir(outDir, { recursive: true })

		let count = 0
		for (const p of paths) {
			const { page, blocks, breadcrumbs } = await this.runner.renderPage(p)
			if (!page) continue // skip 404s in static export

			const title = page.title || 'Untitled'
			const html = this.#renderHTML(title, blocks, breadcrumbs)

			const filePath = p === '/' ? '/index.html' : `${p}.html`
			const fullDest = path.join(outDir, filePath)

			await fs.mkdir(path.dirname(fullDest), { recursive: true })
			await fs.writeFile(fullDest, html, 'utf-8')
			count++
		}
		
		return { count, total: paths.length }
	}

	/**
	 * Render OLMUI blocks into an HTML document shell.
	 * @param {string} title 
	 * @param {Array<object>} blocks 
	 * @param {Array<object>} breadcrumbs
	 * @returns {string}
	 */
	#renderHTML(title, blocks, breadcrumbs) {
		const lang = this.runner.config?.locale || 'en'
		const siteName = this.runner.state?.title || 'NaN0Web'
		const t = (key) => this.runner.i18n?.t(key) || key
		const documentTitle = title ? `${t(title)} — ${t(siteName)}` : t(siteName)

		// Convert structured blocks into simple static HTML string for SSR.
		const bodyContent = blocks.map(block => {
			if (block['ui-html']) return block['ui-html']
			if (block.h1) return `<h1>${t(block.h1)}</h1>`
			if (block.h2) return `<h2 id="${t(block.h2).toLowerCase().replace(/[^a-z0-9]+/g, '-')}">${t(block.h2)}</h2>`
			if (block.p) return `<p>${t(block.p)}</p>`
			if (block['nan0-sandbox']) {
				return `<nan0-sandbox src="${block.src || ''}" url="${block.url || ''}" ui="${block.ui || ''}"></nan0-sandbox>`
			}
			
			// Render specialized blocks
			if (block.type === 'Hero') {
				const action = block.action || {}
				return `
					<section class="hero">
						<h1>${t(block.title)}</h1>
						<p class="subtitle">${t(block.subtitle)}</p>
						${action.href ? `<a href="${action.href}" class="btn">${t(action.label)}</a>` : ''}
					</section>
				`
			}
			
			// Auto serialize dot-notation keys (UI.Hero) into Web Component tags (ui-hero)
			const keys = Object.keys(block)
			if (keys.length === 1 && (keys[0].startsWith('ui-') || /^([A-Z][a-zA-Z0-9]*\.)+[A-Za-z0-9]+$/.test(keys[0]))) {
				const tag = keys[0].replace(/\./g, '-').toLowerCase()
				const props = block[keys[0]] || {}
				
				let attrs = ''
				for (const [k, v] of Object.entries(props)) {
					const val = typeof v === 'string' ? t(v) : v
					if (typeof val === 'string') {
						attrs += ` ${k}="${val.replace(/"/g, '&quot;')}"`
					} else if (val !== null && v !== undefined) {
						attrs += ` ${k}='${JSON.stringify(val).replace(/'/g, '&apos;')}'`
					}
				}
				return `<${tag}${attrs}></${tag}>`
			}
			
			// Fallback placeholder for complex blocks (lists, forms)
			return `<div class="nan0-block">${JSON.stringify(block, null, 2)}</div>`
		}).join('\n')

		return `<!DOCTYPE html>
<html lang="${lang}">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${documentTitle}</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&family=JetBrains+Mono&display=swap" rel="stylesheet">
	<style>
		:root {
			--bg: #09090b;
			--fg: #fafafa;
			--accent: #3b82f6;
			--accent-hover: #2563eb;
			--glass: rgba(255, 255, 255, 0.03);
			--border: rgba(255, 255, 255, 0.1);
		}
		* { box-sizing: border-box; }
		body { 
			background: var(--bg); 
			color: var(--fg); 
			font-family: 'Outfit', sans-serif; 
			max-width: 1000px; 
			margin: 0 auto; 
			padding: 0;
			line-height: 1.6;
			background-image: 
				radial-gradient(circle at 50% -20%, #1e3a8a 0%, transparent 50%),
				radial-gradient(circle at 0% 100%, #1e1b4b 0%, transparent 30%);
			background-attachment: fixed;
		}
		main { padding: 4rem 2rem; }
		h1 { font-weight: 600; font-size: clamp(2.5rem, 8vw, 4rem); margin-bottom: 1.5rem; letter-spacing: -0.04em; line-height: 1.1; }
		.subtitle { font-weight: 300; font-size: 1.4rem; opacity: 0.7; margin-bottom: 3rem; max-width: 600px; }
		
		.hero {
			padding: 4rem 0;
			display: flex;
			flex-direction: column;
			align-items: flex-start;
		}
		
		.btn {
			display: inline-block;
			background: var(--accent);
			color: white;
			padding: 0.8rem 2rem;
			border-radius: 50px;
			text-decoration: none;
			font-weight: 600;
			transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.5);
		}
		.btn:hover {
			background: var(--accent-hover);
			transform: translateY(-2px);
			box-shadow: 0 15px 25px -5px rgba(59, 130, 246, 0.6);
		}
		
		.nan0-block { 
			background: var(--glass); 
			backdrop-filter: blur(12px);
			padding: 2rem; 
			margin: 3rem 0; 
			border-radius: 20px; 
			border: 1px solid var(--border);
			font-family: 'JetBrains Mono', monospace; 
			font-size: 0.85rem;
			white-space: pre-wrap;
			box-shadow: 0 20px 40px -20px rgba(0,0,0,0.7);
			position: relative;
			overflow: hidden;
		}
		.nan0-block::before {
			content: 'DATA';
			position: absolute;
			top: 1rem;
			right: 1.5rem;
			font-size: 0.6rem;
			opacity: 0.3;
			letter-spacing: 0.2em;
		}
		
		#nan0-bridge-status {
			position: fixed;
			top: 1.5rem;
			right: 2rem;
			padding: 0.6rem 1.2rem;
			border-radius: 50px;
			font-size: 0.75rem;
			background: var(--glass);
			backdrop-filter: blur(8px);
			border: 1px solid var(--border);
			display: flex;
			align-items: center;
			gap: 0.6rem;
			z-index: 100;
			font-weight: 500;
			box-shadow: 0 4px 12px rgba(0,0,0,0.3);
		}
		.status-dot { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; transition: all 0.5s ease; }
		.status-dot.online { background: #22c55e; box-shadow: 0 0 12px #22c55e; }
	</style>
</head>
<body>
	<div id="nan0-bridge-status"><div class="status-dot"></div> NaN0 Bridge Offline</div>
	<main>
		${bodyContent}
	</main>
	<script type="module">
		const statusEl = document.getElementById('nan0-bridge-status');
		const dotEl = statusEl.querySelector('.status-dot');
		
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const ws = new WebSocket(protocol + '//' + window.location.host);
		
		ws.onopen = () => {
			dotEl.classList.add('online');
			statusEl.lastChild.textContent = ' NaN0 Bridge Online';
		};
		
		ws.onmessage = (event) => {
			const { type, payload } = JSON.parse(event.data);
			if (type === 'STATE_SYNC' || type === 'STATE_UPDATED') {
				window.dispatchEvent(new CustomEvent('nan0-state-change', { detail: payload }));
			}
		};
	</script>
</body>
</html>`
	}
}

export default SSRServer
