import { LitElement, html, css } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { markdownInline } from '../utils.js'

export class UIHero extends LitElement {
	static properties = {
		badge: { type: String },
		title: { type: String },
		subtitle: { type: String },
		install: { type: String },
		cta: { type: String },
		ctaHref: { type: String },
		data: { type: Object },
	}

	createRenderRoot() {
		return this // disables shadow DOM so global css like .hero works exactly like before
	}

	render() {
		const badgeHtml = html`<div class="hero-badge-cli">
			<ui-badge label="${this.badge || ''}" variant="success"></ui-badge>
		</div>`

		return html`
			<header class="hero">
				<div class="hero-glow"></div>
				<div class="hero-content">
					${badgeHtml}
					<h1 class="hero-title">${this.title || ''}<span class="hero-at"></span></h1>
					<p class="hero-subtitle">${unsafeHTML(markdownInline(this.subtitle))}</p>

					<div class="hero-actions">
						<button
							class="hero-install"
							@click=${() => navigator.clipboard.writeText(this.install)}
						>
							$ ${this.install}
							<span style="margin-left:8px; opacity:0.5">📋</span>
						</button>
						<a class="btn btn-primary" href="${this.ctaHref}">${this.cta}</a>
					</div>

					<div class="hero-stats">
						${(this.data?.stats || []).map(
							(stat) => html`
								<div class="stat">
									<span class="stat-value">${stat.value}</span>
									<span class="stat-label">${stat.label}</span>
								</div>
							`,
						)}
					</div>
					<div class="hero-note">${this.data?.note || ''}</div>
				</div>
			</header>
		`
	}
}

if (!customElements.get('ui-hero')) {
	customElements.define('ui-hero', UIHero)
}
