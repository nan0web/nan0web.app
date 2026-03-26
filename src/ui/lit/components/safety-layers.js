import { LitElement, html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { markdownInline } from '../utils.js'
import { getIcon } from '../icons.js'

export class UISafetyLayers extends LitElement {
	static properties = {
		id: { type: String },
		title: { type: String },
		subtitle: { type: String },
		data: { type: Object },
	}

	createRenderRoot() {
		return this
	}

	render() {
		return html`
			<section class="section section-dark" id="${this.id || 'safety'}">
				<h2 class="section-title">${this.title || ''}</h2>
				<p class="section-desc">${this.subtitle || ''}</p>
				<div class="safety-layers">
					${(this.data?.layers || []).map(
						(layer) => html`
							<div class="safety-row">
								<div class="safety-card visible">
									<div class="safety-number">${String(layer.number)}</div>
									<div class="safety-content">
										<h3>
											<span class="safety-icon-small">${unsafeHTML(getIcon(layer.icon))}</span>
											${layer.title}
										</h3>
										<p>${unsafeHTML(markdownInline(layer.text))}</p>
										<div class="safety-detail"><code>${layer.code}</code></div>
									</div>
								</div>
							</div>
						`,
					)}
					${this.data?.bonus
						? html`
								<div class="safety-bonus">
									<span class="safety-bonus-icon"
										>${unsafeHTML(getIcon(this.data.bonus.icon))}</span
									>
									<div>
										<strong>${this.data.bonus.title}</strong>
										<p>${unsafeHTML(markdownInline(this.data.bonus.text))}</p>
									</div>
								</div>
							`
						: ''}
				</div>
			</section>
		`
	}
}

if (!customElements.get('ui-safety-layers')) {
	customElements.define('ui-safety-layers', UISafetyLayers)
}
