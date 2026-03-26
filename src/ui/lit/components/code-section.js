import { LitElement, html } from 'lit'

export class UICodeSection extends LitElement {
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
			<section class="section section-dark" id="${this.id || 'code'}">
				<h2 class="section-title">${this.title || ''}</h2>
				<div class="code-blocks">
					${(this.data?.blocks || []).map((block) => {
						const codeText = (block.code || '').replace(/\n$/, '')
						return html`
							<ui-code-block
								class="visible"
								title="${block.title}"
								code="${codeText}"
							></ui-code-block>
						`
					})}
				</div>
			</section>
		`
	}
}

if (!customElements.get('ui-code-section')) {
	customElements.define('ui-code-section', UICodeSection)
}
