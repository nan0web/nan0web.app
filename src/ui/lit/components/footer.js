import { LitElement, html } from 'lit'

export class UIFooter extends LitElement {
	static properties = {
		brand: { type: String },
		deployedWith: { type: String },
	}

	createRenderRoot() {
		return this
	}

	render() {
		return html`
			<footer class="footer">
				<div class="footer-content">
					<div class="footer-brand">${this.brand || ''}</div>
					<p class="footer-deploy">${this.deployedWith || ''}</p>
					<p class="footer-copy">© ${new Date().getFullYear()} <code>ISC License</code></p>
				</div>
			</footer>
		`
	}
}

if (!customElements.get('ui-footer')) {
	customElements.define('ui-footer', UIFooter)
}
