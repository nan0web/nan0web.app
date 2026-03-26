import { LitElement, html, css } from 'lit'
import { FooterModel } from '@nan0web/ui/domain'

export class UIFooter extends LitElement {
	static properties = {
		license: { type: String },
		links: { type: Array },
		year: { type: String },
	}

	static styles = css`
		:host {
			display: block;
			text-align: center;
			padding: 3rem 0 2rem;
			margin-top: 5rem;
			border-top: 1px solid var(--border);
			color: var(--text-secondary);
			font-size: 0.85rem;
		}
		.grid {
			display: grid;
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}
		@media (min-width: 768px) {
			.grid {
				grid-template-columns: repeat(3, 1fr);
				align-items: center;
			}
		}
		.license {
			font-weight: bold;
		}
		.cai {
			opacity: 0.5;
			font-size: 0.8rem;
			margin-top: 1.5rem;
		}
		a {
			color: inherit;
			text-decoration: none;
			transition: color 0.2s;
		}
		a:hover {
			color: var(--text-primary);
		}
	`

	render() {
		const model = new FooterModel({
			license: this.license || 'ISC License',
			links: this.links,
			year: this.year
		})
		
		return html`
			<div class="grid">
				<div class="license">
					${model.license && model.license.href !== '#'
						? html`<a href="${model.license.href}" target="_blank" rel="noopener">${model.license.text}</a>`
						: model.license ? model.license.text : ''}
				</div>
				<div>
					&copy; ${model.year || new Date().getFullYear()} All rights reserved.
				</div>
				<div>
				${model.links && model.links.length > 0 
					? model.links.map(link => {
						return html`<div class="cai"><a href="${link.href}" target="_blank" rel="noopener">${link.text}</a></div>`
					})
					: ''}
				</div>
			</div>
		`
	}
}

customElements.define('ui-footer', UIFooter)
