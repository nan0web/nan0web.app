import { LitElement, html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { markdownInline } from '../utils.js'
import { getIcon } from '../icons.js'

export class UIFeatureGrid extends LitElement {
	static properties = {
		id: { type: String },
		title: { type: String },
		data: { type: Object },
	}

	createRenderRoot() {
		return this
	}

	render() {
		return html`
			<section class="section" id="${this.id || 'features'}">
				<div class="section-title">${this.title || ''}</div>
				<div class="features-grid">
					${(this.data?.items || []).map(
						(item) => html`
							<div class="feature-card visible">
								<div class="feature-icon">${unsafeHTML(getIcon(item.icon))}</div>
								<h3>${item.title}</h3>
								<p>${unsafeHTML(markdownInline(item.text))}</p>
							</div>
						`,
					)}
				</div>
			</section>
		`
	}
}

if (!customElements.get('ui-feature-grid')) {
	customElements.define('ui-feature-grid', UIFeatureGrid)
}
