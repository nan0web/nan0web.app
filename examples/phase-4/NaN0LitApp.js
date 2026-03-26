import { LitElement, html, css } from 'lit'

/**
 * NaN0Web Example for Lit.
 * Responds to real-time state updates from the WebSocket Bridge.
 */
export class NaN0LitApp extends LitElement {
	static properties = {
		state: { type: Object }
	}

	constructor() {
		super()
		this.state = {}
		
		// Subscribe to global bridge event from SSR container
		window.addEventListener('nan0-state-change', (e) => {
			this.state = e.detail
			console.log('[Lit] State synchronized.')
		})
	}

	render() {
		const appTitle = this.state.title || 'NaN0Web Lit App'
		const userCount = this.state.users?.count ?? 0

		return html`
			<div class="card">
				<h2>${appTitle}</h2>
				<p>Active Users: <strong>${userCount}</strong></p>
				<p>Current Locale: ${this.state.locale || 'unknown'}</p>
			</div>
		`
	}

	static styles = css`
		.card { border: 1px solid #ccc; padding: 1rem; border-radius: 8px; }
		strong { color: #007bff; }
	`
}

customElements.define('nan0-lit-app', NaN0LitApp)
