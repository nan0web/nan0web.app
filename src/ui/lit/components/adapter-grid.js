import { LitElement, html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { markdownInline } from '../utils.js'

export class UIAdapterGrid extends LitElement {
	static properties = {
		id: { type: String },
		title: { type: String },
		data: { type: Object },
	}

	createRenderRoot() {
		return this
	}

	render() {
		if (!this.data?.adapters)
			return html`<section class="section section-dark" id="${this.id || 'adapters'}"></section>`

		return html`
			<section class="section section-dark" id="${this.id || 'adapters'}">
				<h2 class="section-title">${this.title || ''}</h2>
				<div class="adapters-grid">
					${this.data.adapters.map(
						(adapter) => html`
							<div class="adapter-card adapter-${adapter.status} visible">
								<div
									class="adapter-status"
									style="color: ${adapter.status === 'stable' ? 'var(--green)' : 'var(--amber)'}"
								>
									${adapter.status === 'stable' ? '● Stable' : '○ Planned'}
								</div>
								<h3>${adapter.name}</h3>
								<p>${unsafeHTML(markdownInline(adapter.text))}</p>
								${adapter.import ? html`<code class="adapter-import">${adapter.import}</code>` : ''}
							</div>
						`,
					)}
				</div>
			</section>
		`
	}
}

if (!customElements.get('ui-adapter-grid')) {
	customElements.define('ui-adapter-grid', UIAdapterGrid)
}
